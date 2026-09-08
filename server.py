import http.server
import json
import os
import sys
import threading
import webbrowser
from pathlib import Path
from urllib.parse import parse_qs, urlparse

BASE_DIR = Path(__file__).parent.resolve()
WORKSPACE_DIR = BASE_DIR.parent.resolve()
WEB_DIR = BASE_DIR / "web"
DEFAULT_DASHBOARD_DIR = BASE_DIR / "resultados"

sys.path.insert(0, str(BASE_DIR))
import test1

DEFAULT_PORT = 8000


def _resolver_ruta_json(ruta):
    """Resuelve una ruta JSON de forma segura dentro del proyecto."""
    base = BASE_DIR.resolve()
    candidato = Path(ruta)
    if candidato.is_absolute():
        path = candidato.resolve()
    else:
        path = (BASE_DIR / candidato).resolve()

    if path.suffix.lower() != ".json":
        raise ValueError("Solo se permiten archivos JSON")

    try:
        path.relative_to(base)
    except ValueError as exc:
        raise ValueError("Ruta fuera del proyecto") from exc

    if not path.is_file():
        raise ValueError(f"Archivo no encontrado: {path.name}")

    return path


def _es_json_s21(path):
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        return isinstance(data.get("registros"), list)
    except (OSError, json.JSONDecodeError, TypeError):
        return False


def _meta_json(path):
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    registros = data.get("registros", [])
    return {
        "ruta": path.relative_to(BASE_DIR).as_posix(),
        "nombre": path.name,
        "titulo": data.get("titulo") or data.get("origen") or path.stem,
        "origen": data.get("origen") or path.stem,
        "cantidad": data.get("cantidad", len(registros)),
        "schema_version": data.get("schema_version", "0"),
        "año_servicio": data.get("año_servicio"),
    }


def listar_json_dashboard(carpeta=None):
    base = Path(carpeta).resolve() if carpeta else DEFAULT_DASHBOARD_DIR.resolve()
    if not base.is_dir():
        return []

    archivos = []
    for path in sorted(base.rglob("*.json")):
        if not _es_json_s21(path):
            continue
        item = _meta_json(path)
        item["modificado"] = path.stat().st_mtime
        archivos.append(item)

    archivos.sort(key=lambda x: x["modificado"], reverse=True)
    return archivos


def cargar_json_dashboard(rutas=None):
    if rutas:
        paths = [_resolver_ruta_json(r) for r in rutas]
    else:
        paths = [
            _resolver_ruta_json(item["ruta"])
            for item in listar_json_dashboard()
        ]

    if not paths:
        raise ValueError("No hay archivos JSON válidos para el dashboard")

    paquetes = []
    for path in paths:
        with open(path, encoding="utf-8") as f:
            contenido = json.load(f)
        meta = _meta_json(path)
        paquetes.append({
            "fileName": meta["nombre"],
            "ruta": meta["ruta"],
            "titulo": meta["titulo"],
            "origen": meta["origen"],
            "cantidad": meta["cantidad"],
            "contenido": contenido,
        })

    return paquetes


def rutas_json_desde_resultado(res, base_dir=None):
    base = Path(base_dir or BASE_DIR).resolve()
    rutas = []
    for path_str in res.get("archivos_generados", []):
        if not str(path_str).lower().endswith(".json"):
            continue
        path = Path(path_str).resolve()
        try:
            rutas.append(path.relative_to(base).as_posix())
        except ValueError:
            rutas.append(str(path))
    return rutas


def enriquecer_resultado_dashboard(res):
    res = dict(res)
    res["json_dashboard"] = rutas_json_desde_resultado(res)
    return res


class S21Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **getattr(http.server.SimpleHTTPRequestHandler, 'extensions_map', {}),
        '.webmanifest': 'application/manifest+json',
        '.json': 'application/json',
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_DIR), **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def _send_json(self, payload, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path in ('/', '/index.html'):
            self.send_response(302)
            self.send_header('Location', '/dashboard.html')
            self.end_headers()
            return

        if parsed.path == '/api/info':
            info = {
                "default_output_dir": str(DEFAULT_DASHBOARD_DIR),
                "default_dashboard_dir": str(DEFAULT_DASHBOARD_DIR),
                "file_system_access": True,
            }
            self._send_json(info)
            return

        if parsed.path == '/api/dashboard/fuentes':
            try:
                archivos = listar_json_dashboard()
                self._send_json({
                    "success": True,
                    "carpeta_default": str(DEFAULT_DASHBOARD_DIR),
                    "archivos": archivos,
                })
            except Exception as e:
                self._send_json({"success": False, "error": str(e)}, 400)
            return

        if parsed.path == '/api/dashboard/cargar':
            try:
                params = parse_qs(parsed.query)
                modo = (params.get("modo") or ["default"])[0]
                rutas = params.get("ruta")
                if rutas:
                    paquetes = cargar_json_dashboard(rutas)
                    fuente = "seleccion"
                elif modo == "default":
                    paquetes = cargar_json_dashboard()
                    fuente = "carpeta_default"
                else:
                    raise ValueError("Modo de carga no reconocido")

                self._send_json({
                    "success": True,
                    "fuente": fuente,
                    "carpeta_default": str(DEFAULT_DASHBOARD_DIR),
                    "paquetes": paquetes,
                })
            except Exception as e:
                self._send_json({"success": False, "error": str(e)}, 400)
            return

        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)

        if parsed.path == '/api/dashboard/cargar':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            try:
                data = json.loads(body.decode('utf-8')) if body else {}
                rutas = data.get('rutas')
                if rutas:
                    paquetes = cargar_json_dashboard(rutas)
                    fuente = data.get('fuente', 'ultima_ejecucion')
                else:
                    paquetes = cargar_json_dashboard()
                    fuente = 'carpeta_default'

                self._send_json({
                    "success": True,
                    "fuente": fuente,
                    "carpeta_default": str(DEFAULT_DASHBOARD_DIR),
                    "paquetes": paquetes,
                })
            except Exception as e:
                self._send_json({"success": False, "error": str(e)}, 400)
            return

        if parsed.path == '/api/ejecutar':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)

            try:
                data = json.loads(body.decode('utf-8'))

                grupos = data.get('grupos', [])
                formatos = data.get('formatos', ['json', 'csv'])
                nombre_base = data.get('nombre_base', 'registros').strip() or 'registros'
                carpeta_destino = data.get('carpeta_destino', '').strip()
                en_carpeta_aparte = bool(data.get('en_carpeta_aparte', True))
                modo_agrupacion = data.get('modo_agrupacion', 'por_carpeta')
                modo_csv = data.get('modo_csv', 'unificado')
                año_servicio = data.get('año_servicio')
                if año_servicio is not None and str(año_servicio).strip() != '':
                    año_servicio = int(año_servicio)
                else:
                    año_servicio = None

                if not grupos:
                    raise ValueError("No se recibieron carpetas con archivos PDF")

                total_pdfs = sum(len(g.get('archivos', [])) for g in grupos)
                if total_pdfs == 0:
                    raise ValueError("Las carpetas seleccionadas no contienen PDFs")

                res = test1.procesar_grupos_subidos(
                    grupos=grupos,
                    formatos=formatos,
                    nombre_base=nombre_base,
                    carpeta_destino=carpeta_destino if carpeta_destino else None,
                    en_carpeta_aparte=en_carpeta_aparte,
                    modo_agrupacion=modo_agrupacion,
                    modo_csv=modo_csv,
                    año_servicio=año_servicio,
                )

                res = enriquecer_resultado_dashboard(res)
                response_payload = {"success": True, "result": res}
                status_code = 200

            except Exception as e:
                response_payload = {"success": False, "error": str(e)}
                status_code = 400

            self._send_json(response_payload, status_code)
            return

        self.send_error(404, "Endpoint no encontrado")


def run_server():
    os.chdir(str(BASE_DIR))
    DEFAULT_DASHBOARD_DIR.mkdir(parents=True, exist_ok=True)
    port = DEFAULT_PORT

    for p in range(8000, 8010):
        try:
            httpd = http.server.ThreadingHTTPServer(("", p), S21Handler)
            port = p
            break
        except OSError:
            continue
    else:
        print("Error: No se pudo encontrar un puerto libre entre 8000 y 8009.")
        sys.exit(1)

    url = f"http://localhost:{port}"
    print("==========================================")
    print("  Servidor Analizador S21 ejecutándose")
    print(f"  Dirección web: {url}")
    print(f"  JSON dashboard: {DEFAULT_DASHBOARD_DIR}")
    print("  (Selección de carpetas: navegador | Análisis: Python)")
    print("==========================================")

    def open_browser():
        webbrowser.open(f"{url}/dashboard.html")

    threading.Timer(0.5, open_browser).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido correctamente.")


if __name__ == "__main__":
    run_server()
