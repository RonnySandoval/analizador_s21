from PyPDF2 import PdfReader
from pathlib import Path
import re
import json
import csv
import io
import base64
from datetime import datetime, timezone

MAPEO_S21 = {
    # Datos personales
    "900_1_Text_SanSerif": "nombre",
    "900_2_Text_SanSerif": "fecha_nacimiento",
    "900_5_Text_SanSerif": "fecha_bautismo",

    # Sexo
    "900_3_CheckBox": ("sexo", "Hombre"),
    "900_4_CheckBox": ("sexo", "Mujer"),

    # Bautismo
    "900_6_CheckBox": ("bautismo", "Otras ovejas"),
    "900_7_CheckBox": ("bautismo", "Ungido"),

    # Responsabilidades
    "900_8_CheckBox": "anciano",
    "900_9_CheckBox": "siervo_ministerial",
    "900_10_CheckBox": "precursor_regular",
    "900_11_CheckBox": "precursor_especial",
    "900_12_CheckBox": "misionero"
}

MESES = {
    20: "septiembre",
    21: "octubre",
    22: "noviembre",
    23: "diciembre",
    24: "enero",
    25: "febrero",
    26: "marzo",
    27: "abril",
    28: "mayo",
    29: "junio",
    30: "julio",
    31: "agosto",
}

# Segunda columna de año en algunas S-21 (mismas claves 901-905, filas +12).
MESES_COLUMNA_DERECHA = {fila + 12: mes for fila, mes in MESES.items()}

MESES_LIST = [
    "septiembre", "octubre", "noviembre", "diciembre",
    "enero", "febrero", "marzo", "abril",
    "mayo", "junio", "julio", "agosto"
]

# Columna izquierda (año 1, campo 898) y derecha (año 2, campo 899).
COLUMNAS_REGISTRO = {
    1: {
        "año_campo": "898_1_Text_SanSerif",
        "mapa": {
            901: "participacion",
            902: "cursos_biblicos",
            903: "precursor_auxiliar",
            904: "horas",
            905: "notas",
        },
    },
    2: {
        "año_campo": "899_1_Text_SanSerif",
        "mapa": {
            906: "participacion",
            907: "cursos_biblicos",
            908: "precursor_auxiliar",
            909: "horas",
            910: "notas",
        },
    },
}

CSV_ENCODING = "utf-8-sig"


def normalizar_texto(valor):
    """Normaliza texto leído del PDF para conservar tildes y caracteres especiales."""
    if valor in (None, "/Off", ""):
        return ""
    texto = str(valor).strip()
    if texto.startswith("(") and texto.endswith(")"):
        try:
            texto = texto[1:-1].encode("latin-1").decode("utf-8")
        except (UnicodeDecodeError, UnicodeEncodeError):
            pass
    return texto


def parse_numero(texto):
    """Convierte un valor de campo PDF a entero (horas, cursos, etc.)."""
    if texto in (None, "/Off", ""):
        return 0
    texto = normalizar_texto(texto)
    if not texto:
        return 0
    if texto.isdigit():
        return int(texto)
    match = re.match(r"^(\d+)", texto)
    return int(match.group(1)) if match else 0


CAMPOS_AÑO_SERVICIO = (
    "898_1_Text_SanSerif",
    "899_1_Text_SanSerif",
    "900_0_Text_SanSerif",
    "ServiceYear",
    "serviceYear",
    "AñoDeServicio",
    "AnoDeServicio",
)

RANGO_AÑO_SERVICIO = range(2010, 2041)


def parse_año_servicio(valor):
    """Convierte un valor de campo PDF a año de servicio (entero) o None."""
    if valor in (None, "/Off", ""):
        return None
    texto = normalizar_texto(valor)
    if not texto:
        return None
    if texto.isdigit() and len(texto) == 4:
        año = int(texto)
        return año if año in RANGO_AÑO_SERVICIO else None
    match = re.search(r"(20\d{2})", texto)
    if match:
        año = int(match.group(1))
        return año if año in RANGO_AÑO_SERVICIO else None
    return None


def año_servicio_actual(fecha=None):
    """
    Año de servicio vigente según la fecha calendario.
    Ej.: sept 2025 – ago 2026 → 2026.
    """
    fecha = fecha or datetime.now().date()
    return fecha.year + 1 if fecha.month >= 9 else fecha.year


def periodo_año_servicio(valor):
    """Metadatos del periodo sept (año-1) – ago (año)."""
    valor = int(valor)
    inicio = valor - 1
    return {
        "valor": valor,
        "etiqueta": str(valor),
        "inicio_calendario": inicio,
        "fin_calendario": valor,
        "periodo_inicio": f"{inicio}-09",
        "periodo_fin": f"{valor}-08",
        "periodo_texto": f"Septiembre {inicio} — Agosto {valor}",
    }


def campo_activo(valor):
    """Interpreta casillas AcroForm (/Yes, /On, Yes, true, 1)."""
    if valor in (None, False, "/Off", "/No", "Off", "No", ""):
        return False
    texto = str(valor).strip().lstrip("/").lower()
    return texto in ("yes", "on", "true", "1", "si", "sí")


def mes_vacio():
    return {
        "participacion": False,
        "cursos_biblicos": 0,
        "precursor_auxiliar": False,
        "horas": 0,
        "notas": "",
        "comentarios": "",
    }


def mes_tiene_datos(celda):
    if not celda:
        return False
    return bool(
        celda.get("participacion")
        or celda.get("precursor_auxiliar")
        or celda.get("horas")
        or celda.get("cursos_biblicos")
        or str(celda.get("notas") or "").strip()
    )


def contar_meses_con_datos(registro):
    return sum(1 for mes in MESES_LIST if mes_tiene_datos((registro or {}).get(mes)))


def extraer_años_columnas(campos):
    """Años escritos encima de cada columna de la S-21 (898 izquierda, 899 derecha)."""
    años = {}
    if not campos:
        return años
    for col, spec in COLUMNAS_REGISTRO.items():
        obj = campos.get(spec["año_campo"])
        if not obj:
            continue
        año = parse_año_servicio(obj.get("/V"))
        if año is not None:
            años[col] = año
    return años


def aplicar_campo_mes(registro, mes, tipo, activo, texto):
    celda = registro.setdefault(mes, mes_vacio())
    if tipo == "participacion":
        celda["participacion"] = activo
    elif tipo == "cursos_biblicos":
        celda["cursos_biblicos"] = parse_numero(texto)
    elif tipo == "precursor_auxiliar":
        celda["precursor_auxiliar"] = activo
    elif tipo == "horas":
        celda["horas"] = parse_numero(texto)
    elif tipo == "notas":
        notas = normalizar_texto(texto)
        celda["notas"] = notas
        celda["comentarios"] = notas


def resolver_columna_registro(años_col, target_year, registros_col, campos):
    """Elige la columna de la tarjeta que corresponde al año de servicio pedido."""
    has_right_prefix = False
    has_right_rows = False
    for nombre in campos or {}:
        texto = str(nombre)
        if re.match(r"^(90[6-9]|910)_", texto):
            has_right_prefix = True
            break
        m = re.match(r"^90[1-5]_(\d+)_", texto)
        if m and int(m.group(1)) >= 32:
            has_right_rows = True
    has_right = has_right_prefix or has_right_rows
    y1, y2 = años_col.get(1), años_col.get(2)
    scores = {col: contar_meses_con_datos(registros_col.get(col)) for col in (1, 2)}

    if target_year:
        if y2 == target_year:
            return 2
        if y1 == target_year:
            return 1
        if y1 == target_year - 1 and (has_right or scores[2] or y2 == target_year):
            return 2
        if y2 == target_year + 1 and scores[1]:
            return 1

    if has_right and y1 and target_year and y1 != target_year:
        return 2
    if scores[2] and not scores[1]:
        return 2
    if scores[1] and not scores[2]:
        return 1
    if has_right:
        return 2
    return 1


def extraer_año_servicio_campos(campos):
    """Intenta leer el año de servicio de los campos AcroForm del PDF."""
    if not campos:
        return None

    candidatos = []

    for nombre in CAMPOS_AÑO_SERVICIO:
        obj = campos.get(nombre)
        if not obj:
            continue
        año = parse_año_servicio(obj.get("/V"))
        if año is not None:
            candidatos.append(año)

    for nombre, obj in campos.items():
        nombre_lower = str(nombre).lower()
        if re.match(r"89[0-9]_", str(nombre)):
            año = parse_año_servicio(obj.get("/V"))
            if año is not None:
                candidatos.append(año)
            continue
        if any(clave in nombre_lower for clave in ("servicio", "service", "year", "año", "ano")):
            año = parse_año_servicio(obj.get("/V"))
            if año is not None:
                candidatos.append(año)

    if not candidatos:
        return None

    return max(set(candidatos), key=candidatos.count)


def extraer_año_servicio_nombre(nombre_archivo):
    """Respaldo: busca un año de 4 dígitos en el nombre del archivo."""
    for match in re.finditer(r"(20\d{2})", str(nombre_archivo or "")):
        año = int(match.group(1))
        if año in RANGO_AÑO_SERVICIO:
            return año
    return None


def resolver_año_servicio_lote(registros, año_param=None):
    """
    Determina el año de servicio de un lote de tarjetas.
    Prioridad: parámetro explícito → consenso PDF → inferencia por fecha.
    """
    años_pdf = []
    for reg in registros or []:
        meta = reg.get("metadata") or {}
        año = meta.get("año_servicio")
        if año is not None:
            años_pdf.append(int(año))

    unicos_pdf = sorted(set(años_pdf))
    conflictos_pdf = None

    if año_param is not None:
        valor = int(año_param)
        if unicos_pdf and (len(unicos_pdf) > 1 or unicos_pdf[0] != valor):
            conflictos_pdf = unicos_pdf
        meta = periodo_año_servicio(valor)
        meta["fuente"] = "parametro"
        if conflictos_pdf:
            meta["conflictos_pdf"] = conflictos_pdf
            meta["advertencia"] = (
                f"El año indicado ({valor}) no coincide con el detectado en algunos PDF: "
                f"{', '.join(str(a) for a in conflictos_pdf)}."
            )
        return meta

    if len(unicos_pdf) > 1:
        raise ValueError(
            "Las tarjetas mezclan años de servicio distintos "
            f"({', '.join(str(a) for a in unicos_pdf)}). "
            "Procese un solo año de servicio por ejecución."
        )

    if len(unicos_pdf) == 1:
        meta = periodo_año_servicio(unicos_pdf[0])
        meta["fuente"] = "pdf"
        return meta

    valor = año_servicio_actual()
    meta = periodo_año_servicio(valor)
    meta["fuente"] = "inferido"
    meta["advertencia"] = (
        f"No se detectó el año en los PDF; se usó el año de servicio vigente ({valor}). "
        "Verifique y corríjalo en el formulario si no es correcto."
    )
    return meta


def aplicar_año_servicio_registros(registros, año_meta):
    valor = int(año_meta["valor"])
    for reg in registros or []:
        meta = reg.setdefault("metadata", {})
        meta["año_servicio"] = valor


def leer_s21_to_dict(ruta_pdf):
    reader = PdfReader(ruta_pdf)
    return _parse_s21_reader(reader, Path(ruta_pdf).name)


def leer_s21_from_bytes(contenido, nombre_archivo="archivo.pdf"):
    reader = PdfReader(io.BytesIO(contenido))
    return _parse_s21_reader(reader, nombre_archivo)


def _parse_s21_reader(reader, nombre_archivo):
    campos = reader.get_fields()
    años_col = extraer_años_columnas(campos)
    año_pdf = extraer_año_servicio_campos(campos)
    if años_col:
        año_pdf = max(años_col.values())
    if año_pdf is None:
        año_pdf = extraer_año_servicio_nombre(nombre_archivo)

    data = {
        "identificacion": {
            "nombre": "",
            "fecha_nacimiento": "",
            "sexo": "",
            "fecha_bautismo": "",
            "esperanza": ""
        },
        "privilegios": {
            "anciano": False,
            "siervo_ministerial": False,
            "precursor_regular": False,
            "precursor_especial": False,
            "misionero": False
        },
        "registro": {},
        "totales": {"horas": 0, "cursos_biblicos": 0},
        "metadata": {"archivo": nombre_archivo}
    }

    if not campos:
        return data

    registros_col = {1: {}, 2: {}}

    for campo, obj in campos.items():
        v = obj.get("/V")
        activo = campo_activo(v)
        texto = "" if v in (None, "/Off") else str(v)

        # ---------- IDENTIFICACIÓN ----------
        if campo == "900_1_Text_SanSerif":
            data["identificacion"]["nombre"] = normalizar_texto(texto)
        elif campo == "900_2_Text_SanSerif":
            data["identificacion"]["fecha_nacimiento"] = normalizar_texto(texto)
        elif campo == "900_5_Text_SanSerif":
            data["identificacion"]["fecha_bautismo"] = normalizar_texto(texto)
        elif campo == "900_3_CheckBox" and activo:
            data["identificacion"]["sexo"] = "Hombre"
        elif campo == "900_4_CheckBox" and activo:
            data["identificacion"]["sexo"] = "Mujer"
        elif campo == "900_6_CheckBox" and activo:
            data["identificacion"]["esperanza"] = "Otras ovejas"
        elif campo == "900_7_CheckBox" and activo:
            data["identificacion"]["esperanza"] = "Ungido"

        # ---------- PRIVILEGIOS ----------
        elif campo == "900_8_CheckBox" and activo:
            data["privilegios"]["anciano"] = True
        elif campo == "900_9_CheckBox" and activo:
            data["privilegios"]["siervo_ministerial"] = True
        elif campo == "900_10_CheckBox" and activo:
            data["privilegios"]["precursor_regular"] = True
        elif campo == "900_11_CheckBox" and activo:
            data["privilegios"]["precursor_especial"] = True
        elif campo == "900_12_CheckBox" and activo:
            data["privilegios"]["misionero"] = True

        m = re.match(r"(90[1-9]|910)_(\d+)_", str(campo))
        if not m:
            continue
        col, fila = int(m.group(1)), int(m.group(2))
        bloque = None
        mes = MESES.get(fila)
        if mes and col in COLUMNAS_REGISTRO[1]["mapa"]:
            bloque = 1
            tipo = COLUMNAS_REGISTRO[1]["mapa"][col]
        elif mes and col in COLUMNAS_REGISTRO[2]["mapa"]:
            bloque = 2
            tipo = COLUMNAS_REGISTRO[2]["mapa"][col]
        elif fila in MESES_COLUMNA_DERECHA and col in COLUMNAS_REGISTRO[1]["mapa"]:
            mes = MESES_COLUMNA_DERECHA[fila]
            bloque = 2
            tipo = COLUMNAS_REGISTRO[1]["mapa"][col]
        else:
            continue
        aplicar_campo_mes(registros_col[bloque], mes, tipo, activo, texto)

    columna = resolver_columna_registro(años_col, año_pdf, registros_col, campos)
    data["registro"] = registros_col.get(columna) or {}
    data["totales"] = {
        "horas": sum(int((data["registro"].get(mes) or {}).get("horas") or 0) for mes in MESES_LIST),
        "cursos_biblicos": sum(int((data["registro"].get(mes) or {}).get("cursos_biblicos") or 0) for mes in MESES_LIST),
    }
    data["metadata"]["columna_s21"] = "derecha" if columna == 2 else "izquierda"
    if años_col:
        data["metadata"]["años_en_tarjeta"] = años_col
    if año_pdf is not None:
        data["metadata"]["año_servicio"] = año_pdf

    return data


def save_json(datos, ruta_salida):
    """Guarda un diccionario en formato JSON."""
    ruta = Path(ruta_salida)

    with open(ruta, "w", encoding="utf-8") as f:
        json.dump(datos, f, indent=4, ensure_ascii=False)


def leer_carpeta_s21(ruta_carpeta):
    ruta_carpeta = Path(ruta_carpeta)

    todos = []

    for pdf in ruta_carpeta.glob("*.pdf"):
        print("Leyendo:", pdf.name)

        try:
            datos = leer_s21_to_dict(pdf)
            todos.append(datos)

        except Exception as e:
            print("Error con", pdf.name, e)

    return todos


def save_json_total(lista_datos, ruta_salida, origen=None, titulo=None, año_servicio=None):
    origen = origen or Path(ruta_salida).stem
    titulo = titulo or origen
    data_final = {
        "schema_version": "1.1",
        "app": "analizador-s21",
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "titulo": titulo,
        "origen": origen,
        "registros": lista_datos,
        "cantidad": len(lista_datos),
    }
    if año_servicio:
        data_final["año_servicio"] = año_servicio

    with open(ruta_salida, "w", encoding="utf-8") as f:
        json.dump(data_final, f, indent=4, ensure_ascii=False)


def normalizar_lista_carpetas(carpetas):
    """Acepta lista, string con rutas separadas por ; o saltos de línea."""
    if isinstance(carpetas, str):
        partes = re.split(r"[;\n\r]+", carpetas)
        return [c.strip() for c in partes if c.strip()]
    if isinstance(carpetas, (list, tuple)):
        resultado = []
        for item in carpetas:
            resultado.extend(normalizar_lista_carpetas(item))
        return resultado
    return []


def _columnas_base(incluir_carpeta=False):
    columnas = []
    if incluir_carpeta:
        columnas.append("carpeta_origen")
    columnas.extend([
        "nombre",
        "fecha_nacimiento",
        "fecha_bautismo",
        "sexo",
        "esperanza",
        "anciano",
        "siervo_ministerial",
        "precursor_regular",
        "precursor_especial",
        "misionero",
    ])
    return columnas


def _columnas_metricas(prefijo, meses):
    return [f"total_{prefijo}"] + [f"{prefijo}_{m}" for m in meses]


def _fila_base(persona, incluir_carpeta=False):
    idd = persona["identificacion"]
    priv = persona["privilegios"]
    fila = {}

    if incluir_carpeta:
        fila["carpeta_origen"] = persona.get("metadata", {}).get("carpeta_origen", "")

    fila["nombre"] = idd["nombre"]
    fila["fecha_nacimiento"] = idd["fecha_nacimiento"]
    fila["fecha_bautismo"] = idd["fecha_bautismo"]
    fila["sexo"] = idd["sexo"]
    fila["esperanza"] = idd["esperanza"]
    fila["anciano"] = priv["anciano"]
    fila["siervo_ministerial"] = priv["siervo_ministerial"]
    fila["precursor_regular"] = priv["precursor_regular"]
    fila["precursor_especial"] = priv["precursor_especial"]
    fila["misionero"] = priv["misionero"]
    return fila


def _valor_metrica_mes(registro, mes, campo):
    if mes in registro:
        valor = registro[mes].get(campo, 0)
        if campo == "cursos_biblicos" and isinstance(valor, str):
            return parse_numero(valor)
        return valor if valor not in (None, "") else 0
    return 0


def _escribir_csv(ruta_csv, columnas, filas):
    with open(ruta_csv, "w", newline="", encoding=CSV_ENCODING) as f:
        writer = csv.DictWriter(f, fieldnames=columnas)
        writer.writeheader()
        for fila in filas:
            writer.writerow(fila)


def _generar_filas_horas(lista_datos, incluir_carpeta=False):
    filas = []
    for persona in lista_datos:
        fila = _fila_base(persona, incluir_carpeta)
        reg = persona["registro"]
        fila["total_horas"] = persona["totales"]["horas"]
        for mes in MESES_LIST:
            fila[f"horas_{mes}"] = _valor_metrica_mes(reg, mes, "horas")
        filas.append(fila)
    return filas


def _generar_filas_cursos(lista_datos, incluir_carpeta=False):
    filas = []
    for persona in lista_datos:
        fila = _fila_base(persona, incluir_carpeta)
        reg = persona["registro"]
        fila["total_cursos"] = persona["totales"].get("cursos_biblicos", 0)
        for mes in MESES_LIST:
            fila[f"cursos_{mes}"] = _valor_metrica_mes(reg, mes, "cursos_biblicos")
        filas.append(fila)
    return filas


def save_csv_horas(lista_datos, ruta_csv, incluir_carpeta=False):
    columnas = _columnas_base(incluir_carpeta) + _columnas_metricas("horas", MESES_LIST)
    filas = _generar_filas_horas(lista_datos, incluir_carpeta)
    _escribir_csv(ruta_csv, columnas, filas)


def save_csv_cursos(lista_datos, ruta_csv, incluir_carpeta=False):
    columnas = _columnas_base(incluir_carpeta) + _columnas_metricas("cursos", MESES_LIST)
    filas = _generar_filas_cursos(lista_datos, incluir_carpeta)
    _escribir_csv(ruta_csv, columnas, filas)


def save_csv_unificado(lista_datos, ruta_csv, incluir_carpeta=False):
    columnas = (
        _columnas_base(incluir_carpeta)
        + _columnas_metricas("horas", MESES_LIST)
        + _columnas_metricas("cursos", MESES_LIST)
    )

    filas = []
    for persona in lista_datos:
        fila = _fila_base(persona, incluir_carpeta)
        reg = persona["registro"]
        fila["total_horas"] = persona["totales"]["horas"]
        for mes in MESES_LIST:
            fila[f"horas_{mes}"] = _valor_metrica_mes(reg, mes, "horas")
        fila["total_cursos"] = persona["totales"].get("cursos_biblicos", 0)
        for mes in MESES_LIST:
            fila[f"cursos_{mes}"] = _valor_metrica_mes(reg, mes, "cursos_biblicos")
        filas.append(fila)

    _escribir_csv(ruta_csv, columnas, filas)


def save_csv(lista_datos, ruta_csv, incluir_carpeta=False, modo_csv="unificado"):
    """Compatibilidad: exporta CSV según modo_csv."""
    if modo_csv == "separado":
        base = Path(ruta_csv)
        save_csv_horas(lista_datos, str(base.with_name(f"{base.stem}_horas{base.suffix}")), incluir_carpeta)
        save_csv_cursos(lista_datos, str(base.with_name(f"{base.stem}_cursos{base.suffix}")), incluir_carpeta)
    else:
        save_csv_unificado(lista_datos, ruta_csv, incluir_carpeta)


def _resolver_destino(carpeta_destino, nombre_base, en_carpeta_aparte):
    if carpeta_destino and str(carpeta_destino).strip():
        base_dest = Path(carpeta_destino)
    else:
        base_dest = Path(__file__).parent / "resultados"

    if en_carpeta_aparte:
        base_dest = base_dest / nombre_base

    base_dest.mkdir(parents=True, exist_ok=True)
    return base_dest


def _guardar_resultados(
    datos,
    nombre_base,
    formatos,
    carpeta_destino,
    en_carpeta_aparte,
    modo_csv="unificado",
    incluir_carpeta=False,
    año_servicio=None,
):
    año_meta = resolver_año_servicio_lote(datos, año_servicio)
    aplicar_año_servicio_registros(datos, año_meta)

    base_dest = _resolver_destino(carpeta_destino, nombre_base, en_carpeta_aparte)
    archivos_generados = []

    if "json" in formatos:
        ruta_json = base_dest / f"{nombre_base}.json"
        save_json_total(
            datos,
            str(ruta_json),
            origen=nombre_base,
            titulo=nombre_base,
            año_servicio=año_meta,
        )
        archivos_generados.append(str(ruta_json))
        print(f"Guardado JSON en: {ruta_json}")
        if año_meta.get("advertencia"):
            print(f"  Aviso año de servicio: {año_meta['advertencia']}")
        print(
            f"  Año de servicio: {año_meta['valor']} "
            f"({año_meta['periodo_texto']}) · fuente: {año_meta['fuente']}"
        )

    if "csv" in formatos:
        if modo_csv == "separado":
            ruta_horas = base_dest / f"{nombre_base}_horas.csv"
            ruta_cursos = base_dest / f"{nombre_base}_cursos.csv"
            save_csv_horas(datos, str(ruta_horas), incluir_carpeta)
            save_csv_cursos(datos, str(ruta_cursos), incluir_carpeta)
            archivos_generados.extend([str(ruta_horas), str(ruta_cursos)])
            print(f"Guardado CSV horas en: {ruta_horas}")
            print(f"Guardado CSV cursos en: {ruta_cursos}")
        else:
            ruta_csv = base_dest / f"{nombre_base}.csv"
            save_csv_unificado(datos, str(ruta_csv), incluir_carpeta)
            archivos_generados.append(str(ruta_csv))
            print(f"Guardado CSV en: {ruta_csv}")

    return {
        "total_procesados": len(datos),
        "archivos_generados": archivos_generados,
        "archivos_contenido": _archivos_a_contenido(archivos_generados, base_dest),
        "carpeta_salida": str(base_dest),
        "nombre_base": nombre_base,
        "año_servicio": año_meta,
    }


def _archivos_a_contenido(rutas, base_dest):
    """Lee archivos generados y los prepara para envío al navegador."""
    contenidos = []
    base = Path(base_dest)
    for path_str in rutas:
        p = Path(path_str)
        with open(p, "rb") as f:
            data = f.read()
        try:
            sub = p.parent.relative_to(base)
            subcarpeta = "" if sub == Path(".") else str(sub).replace("\\", "/")
        except ValueError:
            subcarpeta = p.parent.name
        contenidos.append({
            "nombre": p.name,
            "subcarpeta": subcarpeta,
            "datos": base64.b64encode(data).decode("ascii"),
        })
    return contenidos


def leer_grupo_pdfs(archivos):
    """archivos: lista de dicts con 'nombre' y 'datos' (bytes o base64 str)."""
    todos = []
    for item in archivos:
        nombre = item.get("nombre", "archivo.pdf")
        datos = item.get("datos", b"")
        if isinstance(datos, str):
            datos = base64.b64decode(datos)
        print("Leyendo:", nombre)
        try:
            todos.append(leer_s21_from_bytes(datos, nombre))
        except Exception as e:
            print("Error con", nombre, e)
    return todos


def procesar_grupos_subidos(
    grupos,
    formatos=None,
    nombre_base="registros",
    carpeta_destino=None,
    en_carpeta_aparte=True,
    modo_agrupacion="por_carpeta",
    modo_csv="unificado",
    año_servicio=None,
):
    """
    Procesa PDFs enviados desde el navegador.
    grupos: [{"nombre": "carpeta", "archivos": [{"nombre": "x.pdf", "datos": bytes|base64}]}, ...]
    """
    if formatos is None:
        formatos = ["json", "csv"]
    if not grupos:
        raise ValueError("No se recibieron carpetas con PDFs")

    if modo_agrupacion == "integrado":
        todos = []
        for grupo in grupos:
            nombre_carpeta = grupo.get("nombre", "carpeta")
            print(f"Analizando PDFs de: {nombre_carpeta}")
            datos = leer_grupo_pdfs(grupo.get("archivos", []))
            for registro in datos:
                registro.setdefault("metadata", {})["carpeta_origen"] = nombre_carpeta
            todos.extend(datos)

        print(f"Total procesados (integrado): {len(todos)} registros de {len(grupos)} carpetas.")
        res = _guardar_resultados(
            todos, nombre_base, formatos, carpeta_destino,
            en_carpeta_aparte, modo_csv, incluir_carpeta=True,
            año_servicio=año_servicio,
        )
        return {
            "total_procesados": len(todos),
            "total_carpetas": len(grupos),
            "procesadas_ok": len(grupos),
            "archivos_generados": res["archivos_generados"],
            "archivos_contenido": res["archivos_contenido"],
            "carpeta_salida": res["carpeta_salida"],
            "año_servicio": res.get("año_servicio"),
            "resultados": [res],
            "errores": [],
        }

    resultados = []
    errores = []
    total_registros = 0
    todas_las_rutas = []
    todos_contenidos = []

    for grupo in grupos:
        try:
            nb = grupo.get("nombre", "registros")
            if len(grupos) == 1 and nombre_base != "registros":
                nb = nombre_base
            print(f"Analizando PDFs de: {nb}")
            datos = leer_grupo_pdfs(grupo.get("archivos", []))
            print(f"  -> {len(datos)} registros.")
            res = _guardar_resultados(
                datos, nb, formatos, carpeta_destino,
                en_carpeta_aparte, modo_csv, incluir_carpeta=False,
                año_servicio=año_servicio,
            )
            res["carpeta_origen"] = nb
            res["total_procesados"] = len(datos)
            resultados.append(res)
            total_registros += len(datos)
            todas_las_rutas.extend(res["archivos_generados"])
            todos_contenidos.extend(res["archivos_contenido"])
        except Exception as e:
            nb = grupo.get("nombre", "?")
            print(f"Error procesando {nb}: {e}")
            errores.append({"carpeta": nb, "error": str(e)})

    carpeta_salida = (
        resultados[0]["carpeta_salida"] if len(resultados) == 1
        else str(_resolver_destino(carpeta_destino, "", en_carpeta_aparte=False)
                 if carpeta_destino else Path(__file__).parent / "resultados")
    )

    return {
        "total_procesados": total_registros,
        "total_carpetas": len(grupos),
        "procesadas_ok": len(resultados),
        "archivos_generados": todas_las_rutas,
        "archivos_contenido": todos_contenidos,
        "carpeta_salida": carpeta_salida,
        "año_servicio": resultados[0].get("año_servicio") if len(resultados) == 1 else None,
        "resultados": resultados,
        "errores": errores,
    }


def procesar_carpetas(
    carpetas,
    formatos=None,
    nombre_base="registros",
    carpeta_destino=None,
    en_carpeta_aparte=True,
    modo_agrupacion="por_carpeta",
    modo_csv="unificado",
    año_servicio=None,
):
    """
    Procesa una o varias carpetas con PDFs S-21.

    modo_agrupacion: 'integrado' (un solo archivo) o 'por_carpeta' (uno por carpeta)
    modo_csv: 'unificado' (horas+cursos en un CSV) o 'separado' (CSV distintos)
    """
    if formatos is None:
        formatos = ["json", "csv"]

    lista_carpetas = normalizar_lista_carpetas(carpetas)
    if not lista_carpetas:
        raise ValueError("No se especificaron carpetas para analizar")

    for carpeta in lista_carpetas:
        if not Path(carpeta).exists():
            raise FileNotFoundError(f"La carpeta especificada no existe: {carpeta}")

    if modo_agrupacion == "integrado":
        todos = []
        for carpeta in lista_carpetas:
            print(f"Analizando PDFs en: {carpeta}")
            datos = leer_carpeta_s21(carpeta)
            nombre_carpeta = Path(carpeta).name
            for registro in datos:
                registro.setdefault("metadata", {})["carpeta_origen"] = nombre_carpeta
            todos.extend(datos)

        print(f"Total procesados (integrado): {len(todos)} registros de {len(lista_carpetas)} carpetas.")
        res = _guardar_resultados(
            todos,
            nombre_base,
            formatos,
            carpeta_destino,
            en_carpeta_aparte,
            modo_csv,
            incluir_carpeta=True,
            año_servicio=año_servicio,
        )
        res["carpeta_origen"] = None
        return {
            "total_procesados": len(todos),
            "total_carpetas": len(lista_carpetas),
            "procesadas_ok": len(lista_carpetas),
            "archivos_generados": res["archivos_generados"],
            "carpeta_salida": res["carpeta_salida"],
            "año_servicio": res.get("año_servicio"),
            "resultados": [res],
            "errores": [],
        }

    resultados = []
    errores = []
    total_registros = 0
    todas_las_rutas = []

    for carpeta in lista_carpetas:
        try:
            if len(lista_carpetas) == 1 and nombre_base != "registros":
                nb = nombre_base
            else:
                nb = Path(carpeta).name
            print(f"Analizando PDFs en: {carpeta}")
            datos = leer_carpeta_s21(carpeta)
            print(f"  -> {len(datos)} registros.")
            res = _guardar_resultados(
                datos,
                nb,
                formatos,
                carpeta_destino,
                en_carpeta_aparte,
                modo_csv,
                incluir_carpeta=False,
                año_servicio=año_servicio,
            )
            res["carpeta_origen"] = str(carpeta)
            res["total_procesados"] = len(datos)
            resultados.append(res)
            total_registros += len(datos)
            todas_las_rutas.extend(res["archivos_generados"])
        except Exception as e:
            print(f"Error procesando {carpeta}: {e}")
            errores.append({"carpeta": carpeta, "error": str(e)})

    carpeta_salida = resultados[0]["carpeta_salida"] if len(resultados) == 1 else str(
        _resolver_destino(carpeta_destino, "", en_carpeta_aparte=False)
        if carpeta_destino
        else Path(__file__).parent / "resultados"
    )

    return {
        "total_procesados": total_registros,
        "total_carpetas": len(lista_carpetas),
        "procesadas_ok": len(resultados),
        "archivos_generados": todas_las_rutas,
        "carpeta_salida": carpeta_salida,
        "resultados": resultados,
        "errores": errores,
    }


def procesar_carpeta(
    carpeta_origen,
    formatos=None,
    nombre_base="registros",
    carpeta_destino=None,
    en_carpeta_aparte=True,
    modo_csv="unificado",
):
    """
    Lee todos los PDFs S21 de la carpeta_origen y guarda los resultados en los formatos especificados.
    Mantiene compatibilidad con la API anterior (una sola carpeta).
    """
    nb = nombre_base
    if nombre_base == "registros":
        nb = Path(carpeta_origen).name

    resultado = procesar_carpetas(
        [carpeta_origen],
        formatos=formatos,
        nombre_base=nb,
        carpeta_destino=carpeta_destino,
        en_carpeta_aparte=en_carpeta_aparte,
        modo_agrupacion="por_carpeta",
        modo_csv=modo_csv,
    )

    if resultado["resultados"]:
        res = resultado["resultados"][0]
        return {
            "total_procesados": res["total_procesados"],
            "archivos_generados": res["archivos_generados"],
            "carpeta_salida": res["carpeta_salida"],
        }

    raise RuntimeError("No se pudo procesar la carpeta")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        procesar_carpetas(sys.argv[1:])
    else:
        carpeta_defecto = Path(__file__).parent.parent
        if carpeta_defecto.exists():
            procesar_carpeta(carpeta_defecto)
