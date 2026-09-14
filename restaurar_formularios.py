#!/usr/bin/env python3
"""
Restaurar / limpiar campos AcroForm de tarjetas S-21 (sin interfaz).

Por defecto:
  - BORRA el cuerpo del registro mensual (participación, cursos, horas, etc.).
  - CONSERVA identificación (nombre, fechas, bautismo), sexo, esperanza y privilegios.
  - NO borra el archivo PDF.

Ejemplos:
  python restaurar_formularios.py --dry-run "C:\\ruta\\Publicadores"
  python restaurar_formularios.py --out-dir ".\\s21_limpios" "C:\\ruta\\Publicadores"
  python restaurar_formularios.py --in-place --backup --replace-year 2027 "C:\\ruta\\Grupo1"
  python restaurar_formularios.py --clear identidad,privilegios --in-place "C:\\ruta"

La UI usa el mismo motor vía POST /api/restaurar.
"""

from __future__ import annotations

import argparse
import base64
import io
import re
import shutil
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

try:
    from pypdf import PdfReader, PdfWriter
    from pypdf.generic import (
        BooleanObject,
        DictionaryObject,
        NameObject,
        TextStringObject,
    )
except ImportError:  # pragma: no cover
    from PyPDF2 import PdfReader, PdfWriter
    from PyPDF2.generic import (
        BooleanObject,
        DictionaryObject,
        NameObject,
        TextStringObject,
    )


# --- Catálogo de campos S-21 (alineado con test1.py + tarjetas locales 900_13) ---

IDENTITY_TEXT = {
    "nombre": ("900_1_Text_SanSerif",),
    "fecha_nacimiento": ("900_2_Text_SanSerif",),
    "fecha_bautismo": ("900_5_Text_SanSerif",),
}

IDENTITY_CHECKS = {
    "sexo": ("900_3_CheckBox", "900_4_CheckBox"),
    "esperanza": ("900_6_CheckBox", "900_7_CheckBox"),
    "privilegios": (
        "900_8_CheckBox",
        "900_9_CheckBox",
        "900_10_CheckBox",
        "900_11_CheckBox",
        "900_12_CheckBox",
    ),
}

YEAR_FIELDS = (
    "898_1_Text_SanSerif",
    "899_1_Text_SanSerif",
    "900_0_Text_SanSerif",
    "900_13_Text_C_SanSerif",
    "ServiceYear",
    "serviceYear",
    "AñoDeServicio",
    "AnoDeServicio",
)

# Prefijos del cuerpo de tabla (columna 1 = 901–905, columna 2 = 906–910).
REGISTRO_PREFIXES = tuple(range(901, 911))
REGISTRO_ROW_MONTHS = range(20, 32)  # septiembre … agosto
REGISTRO_ROW_TOTALS = (32,)

# Grupos que la futura modal podrá marcar como “borrar” o “reemplazar”.
GROUPS = (
    "registro",
    "totales",
    "identidad",
    "sexo",
    "esperanza",
    "privilegios",
    "año",
)

DEFAULT_CLEAR = frozenset({"registro", "totales"})
CHECKBOX_OFF = "/Off"


@dataclass
class FieldPlan:
    """Qué hacer con cada campo del PDF."""

    clear_names: set[str] = field(default_factory=set)
    replace: dict[str, str] = field(default_factory=dict)

    def actions_for(self, field_name: str) -> str | None:
        if field_name in self.replace:
            return "replace"
        if field_name in self.clear_names:
            return "clear"
        return None


@dataclass
class PdfResult:
    path: Path
    ok: bool
    message: str
    cleared: int = 0
    replaced: int = 0
    skipped_readonly: int = 0
    out_path: Path | None = None


def _is_checkbox_name(name: str) -> bool:
    return "CheckBox" in name or name.endswith("_CheckBox")


def _empty_value_for(name: str) -> str:
    return CHECKBOX_OFF if _is_checkbox_name(name) else ""


def _registro_name_matches(name: str, rows: Iterable[int]) -> bool:
    m = re.match(r"^(90[1-9]|910)_(\d+)_", name)
    if not m:
        return False
    prefix = int(m.group(1))
    row = int(m.group(2))
    return prefix in REGISTRO_PREFIXES and row in rows


def build_plan(
    clear_groups: Iterable[str],
    replace_year: int | None = None,
    known_field_names: Iterable[str] | None = None,
) -> FieldPlan:
    groups = {g.strip().lower() for g in clear_groups if g and g.strip()}
    unknown = groups - set(GROUPS)
    if unknown:
        raise ValueError(f"Grupos desconocidos: {', '.join(sorted(unknown))}. Válidos: {', '.join(GROUPS)}")

    plan = FieldPlan()
    names = list(known_field_names or [])

    def add_clear(*candidates: str) -> None:
        for n in candidates:
            plan.clear_names.add(n)

    if "registro" in groups:
        rows = set(REGISTRO_ROW_MONTHS)
        if names:
            for n in names:
                if _registro_name_matches(n, rows):
                    plan.clear_names.add(n)
        else:
            # Nombres típicos aunque el PDF aún no se haya abierto.
            for prefix in REGISTRO_PREFIXES:
                for row in rows:
                    for suffix in (
                        "CheckBox",
                        "Text_C_SanSerif",
                        "Text_SanSerif",
                        "S21_Value",
                    ):
                        plan.clear_names.add(f"{prefix}_{row}_{suffix}")

    if "totales" in groups:
        rows = set(REGISTRO_ROW_TOTALS)
        if names:
            for n in names:
                if _registro_name_matches(n, rows):
                    plan.clear_names.add(n)
        else:
            for prefix in (904, 905, 909, 910):
                for row in rows:
                    for suffix in ("S21_Value", "Text_SanSerif", "Text_C_SanSerif"):
                        plan.clear_names.add(f"{prefix}_{row}_{suffix}")

    if "identidad" in groups:
        for fields in IDENTITY_TEXT.values():
            add_clear(*fields)

    if "sexo" in groups:
        add_clear(*IDENTITY_CHECKS["sexo"])

    if "esperanza" in groups:
        add_clear(*IDENTITY_CHECKS["esperanza"])

    if "privilegios" in groups:
        add_clear(*IDENTITY_CHECKS["privilegios"])

    if "año" in groups and replace_year is None:
        add_clear(*YEAR_FIELDS)
        if names:
            for n in names:
                if n in YEAR_FIELDS or re.match(r"^900_13_", n):
                    plan.clear_names.add(n)

    if replace_year is not None:
        year_str = str(int(replace_year))
        targets = set(YEAR_FIELDS)
        if names:
            for n in names:
                if n in YEAR_FIELDS or re.match(r"^900_13_", n) or n in ("898_1_Text_SanSerif", "899_1_Text_SanSerif"):
                    targets.add(n)
        for n in targets:
            # Solo reemplazar si el campo existe en el PDF (si known names); si no, se prueba al aplicar.
            if not names or n in names or n.startswith("900_13"):
                plan.replace[n] = year_str
            plan.clear_names.discard(n)

    return plan


def list_field_names(reader: PdfReader) -> list[str]:
    """Nombres AcroForm; si /Fields está vacío, usa anotaciones de página."""
    names: list[str] = []
    fields = reader.get_fields() or {}
    names.extend(fields.keys())
    if names:
        return sorted(set(names))

    for page in reader.pages:
        annots = page.get("/Annots") or []
        for annot in annots:
            try:
                obj = annot.get_object()
            except Exception:
                continue
            subtype = obj.get("/Subtype")
            if subtype is not None and "Widget" not in str(subtype):
                continue
            title = obj.get("/T")
            if title:
                names.append(str(title))
    return sorted(set(names))


def _iter_widget_annotations(writer: PdfWriter):
    for page in writer.pages:
        annots = page.get("/Annots")
        if not annots:
            continue
        for annot_ref in annots:
            try:
                annot = annot_ref.get_object()
            except Exception:
                continue
            subtype = annot.get("/Subtype")
            if subtype is not None and "Widget" not in str(subtype):
                continue
            yield annot


def _set_need_appearances(writer: PdfWriter) -> None:
    try:
        if "/AcroForm" not in writer._root_object:  # noqa: SLF001
            writer._root_object[NameObject("/AcroForm")] = DictionaryObject()  # noqa: SLF001
        acro = writer._root_object["/AcroForm"].get_object()  # noqa: SLF001
        acro[NameObject("/NeedAppearances")] = BooleanObject(True)
    except Exception:
        pass


def _field_is_readonly(annot: DictionaryObject) -> bool:
    flags = annot.get("/Ff", 0)
    try:
        flags = int(flags)
    except Exception:
        return False
    return bool(flags & 1)  # bit 1 = ReadOnly


def apply_plan_to_writer(writer: PdfWriter, plan: FieldPlan) -> tuple[int, int, int]:
    """Aplica clear/replace sobre widgets. Devuelve (cleared, replaced, skipped_readonly)."""
    cleared = replaced = skipped = 0
    for annot in _iter_widget_annotations(writer):
        title = annot.get("/T")
        if not title:
            continue
        name = str(title)
        action = plan.actions_for(name)
        if not action:
            continue
        if _field_is_readonly(annot):
            skipped += 1
            continue

        if action == "replace":
            value = plan.replace[name]
            annot[NameObject("/V")] = TextStringObject(value)
            # Quitar apariencia vieja para forzar redibujo.
            if "/AP" in annot:
                try:
                    del annot["/AP"]
                except Exception:
                    pass
            replaced += 1
        else:
            value = _empty_value_for(name)
            if _is_checkbox_name(name):
                annot[NameObject("/V")] = NameObject(value)
                # Estado visual del widget.
                if "/AS" in annot:
                    annot[NameObject("/AS")] = NameObject(value)
            else:
                annot[NameObject("/V")] = TextStringObject(value)
            if "/AP" in annot:
                try:
                    del annot["/AP"]
                except Exception:
                    pass
            cleared += 1

    _set_need_appearances(writer)
    return cleared, replaced, skipped


def _prepare_reader(reader: PdfReader) -> None:
    if getattr(reader, "is_encrypted", False):
        try:
            reader.decrypt("")
        except Exception as exc:
            raise ValueError(f"PDF cifrado o protegido: {exc}") from exc


def process_reader(
    reader: PdfReader,
    plan_factory,
    *,
    dry_run: bool,
    label: str = "pdf",
) -> tuple[PdfResult, bytes | None]:
    """Aplica el plan a un PdfReader. Devuelve (resultado, bytes_salida|None)."""
    try:
        _prepare_reader(reader)
    except ValueError as exc:
        return PdfResult(Path(label), False, str(exc)), None

    names = list_field_names(reader)
    if not names:
        return PdfResult(Path(label), False, "Sin campos AcroForm ni widgets detectados"), None

    plan: FieldPlan = plan_factory(names)
    will_clear = sum(1 for n in names if plan.actions_for(n) == "clear")
    will_replace = sum(1 for n in names if plan.actions_for(n) == "replace")
    if will_clear == 0 and will_replace == 0:
        return (
            PdfResult(Path(label), True, "Nada que cambiar (campos del plan no presentes)", 0, 0),
            None,
        )

    if dry_run:
        return (
            PdfResult(
                Path(label),
                True,
                f"dry-run: borraría {will_clear}, reemplazaría {will_replace}",
                will_clear,
                will_replace,
            ),
            None,
        )

    writer = PdfWriter()
    writer.append(reader)
    cleared, replaced, skipped = apply_plan_to_writer(writer, plan)
    buf = io.BytesIO()
    try:
        writer.write(buf)
    except Exception as exc:
        return PdfResult(Path(label), False, f"Error al generar PDF: {exc}", cleared, replaced, skipped), None

    msg = f"OK (borrados {cleared}, reemplazados {replaced}"
    if skipped:
        msg += f", solo-lectura {skipped}"
    msg += ")"
    return PdfResult(Path(label), True, msg, cleared, replaced, skipped), buf.getvalue()


def process_pdf(
    src: Path,
    plan_factory,
    *,
    dry_run: bool,
    out_path: Path | None,
) -> PdfResult:
    try:
        reader = PdfReader(str(src))
    except Exception as exc:
        return PdfResult(src, False, f"No se pudo abrir: {exc}")

    result, payload = process_reader(reader, plan_factory, dry_run=dry_run, label=src.name)
    result.path = src
    if not result.ok or dry_run or payload is None:
        return result

    dest = out_path or src
    dest.parent.mkdir(parents=True, exist_ok=True)
    try:
        dest.write_bytes(payload)
    except PermissionError as exc:
        return PdfResult(src, False, f"Sin permiso de escritura: {exc}", result.cleared, result.replaced, result.skipped_readonly)
    except Exception as exc:
        return PdfResult(src, False, f"Error al guardar: {exc}", result.cleared, result.replaced, result.skipped_readonly)

    result.out_path = dest
    return result


def process_pdf_bytes(
    datos: bytes,
    nombre: str,
    plan_factory,
    *,
    dry_run: bool = False,
) -> dict:
    """Procesa un PDF en memoria (API web)."""
    try:
        reader = PdfReader(io.BytesIO(datos))
    except Exception as exc:
        return {
            "ok": False,
            "nombre": nombre,
            "message": f"No se pudo abrir: {exc}",
            "cleared": 0,
            "replaced": 0,
            "skipped_readonly": 0,
        }

    result, payload = process_reader(reader, plan_factory, dry_run=dry_run, label=nombre)
    out = {
        "ok": result.ok,
        "nombre": nombre,
        "message": result.message,
        "cleared": result.cleared,
        "replaced": result.replaced,
        "skipped_readonly": result.skipped_readonly,
    }
    if result.ok and payload is not None and not dry_run:
        out["datos"] = base64.b64encode(payload).decode("ascii")
    return out


def _decode_upload_bytes(datos) -> bytes:
    if isinstance(datos, (bytes, bytearray)):
        return bytes(datos)
    if isinstance(datos, str):
        return base64.b64decode(datos)
    raise TypeError("datos debe ser bytes o base64 str")


def procesar_grupos_subidos(
    grupos: list,
    *,
    clear_groups: Iterable[str] | None = None,
    replace_year: int | None = None,
    dry_run: bool = False,
) -> dict:
    """
    grupos: [{"nombre": "carpeta", "archivos": [{"nombre": "x.pdf", "datos": bytes|base64}]}, ...]
    """
    groups = set(clear_groups) if clear_groups is not None else set(DEFAULT_CLEAR)
    # Validar plan vacío de nombres conocidos.
    build_plan(groups, replace_year, known_field_names=[])

    def plan_factory(names: list[str]) -> FieldPlan:
        return build_plan(groups, replace_year, known_field_names=names)

    detalles = []
    archivos_contenido = []
    ok_n = fail_n = 0
    total_clear = total_replace = total_skip = 0

    for grupo in grupos or []:
        carpeta = str(grupo.get("nombre") or "Carpeta").strip() or "Carpeta"
        for archivo in grupo.get("archivos") or []:
            nombre = str(archivo.get("nombre") or "archivo.pdf")
            try:
                raw = _decode_upload_bytes(archivo.get("datos"))
            except Exception as exc:
                fail_n += 1
                detalles.append({
                    "ok": False,
                    "carpeta": carpeta,
                    "nombre": nombre,
                    "message": f"Datos inválidos: {exc}",
                })
                continue

            item = process_pdf_bytes(raw, nombre, plan_factory, dry_run=dry_run)
            item["carpeta"] = carpeta
            detalles.append(item)
            if item["ok"]:
                ok_n += 1
                total_clear += item["cleared"]
                total_replace += item["replaced"]
                total_skip += item.get("skipped_readonly") or 0
                if item.get("datos"):
                    archivos_contenido.append({
                        "nombre": nombre,
                        "subcarpeta": carpeta,
                        "datos": item["datos"],
                    })
            else:
                fail_n += 1

    return {
        "success": fail_n == 0,
        "dry_run": dry_run,
        "clear_groups": sorted(groups),
        "replace_year": replace_year,
        "total_pdfs": ok_n + fail_n,
        "ok": ok_n,
        "failed": fail_n,
        "campos_borrados": total_clear,
        "campos_reemplazados": total_replace,
        "campos_solo_lectura": total_skip,
        "detalles": detalles,
        "archivos_contenido": archivos_contenido,
    }


def collect_pdfs(paths: list[Path], recursive: bool) -> list[Path]:
    found: list[Path] = []
    for p in paths:
        if p.is_file() and p.suffix.lower() == ".pdf":
            found.append(p)
        elif p.is_dir():
            pattern = "**/*.pdf" if recursive else "*.pdf"
            found.extend(sorted(p.glob(pattern)))
    # Únicos preservando orden
    seen = set()
    out = []
    for f in found:
        key = f.resolve()
        if key not in seen:
            seen.add(key)
            out.append(f)
    return out


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Limpia / restaura campos de formularios S-21 (CLI, sin UI).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Grupos --clear / --keep:\n"
            "  registro     celdas mensuales (901–910, filas 20–31)\n"
            "  totales      fila de totales (p. ej. 904_32, 905_32)\n"
            "  identidad    nombre, fecha nacimiento, fecha bautismo\n"
            "  sexo         casillas hombre/mujer\n"
            "  esperanza    otras ovejas / ungido\n"
            "  privilegios  anciano, siervo, precursor, misionero\n"
            "  año          campos de año de servicio (si no usa --replace-year)\n"
            "\n"
            "Por defecto solo se limpian: registro,totales.\n"
        ),
    )
    parser.add_argument(
        "rutas",
        nargs="+",
        type=Path,
        help="Carpetas o archivos PDF S-21",
    )
    parser.add_argument(
        "--clear",
        default=",".join(sorted(DEFAULT_CLEAR)),
        help=f"Grupos a borrar (coma). Por defecto: {','.join(sorted(DEFAULT_CLEAR))}",
    )
    parser.add_argument(
        "--keep",
        default="",
        help="Grupos a conservar aunque estén en --clear (coma)",
    )
    parser.add_argument(
        "--replace-year",
        type=int,
        default=None,
        metavar="AAAA",
        help="Escribe este año de servicio en los campos de año (p. ej. 2027)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Solo informa qué haría; no escribe PDFs",
    )
    parser.add_argument(
        "--in-place",
        action="store_true",
        help="Sobrescribe los PDF originales (use con cuidado)",
    )
    parser.add_argument(
        "--backup",
        action="store_true",
        help="Con --in-place, copia cada PDF a *.bak.pdf antes de escribir",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=None,
        help="Carpeta de salida (recomendado). Se recrea la estructura relativa si hay una sola raíz",
    )
    parser.add_argument(
        "--no-recursive",
        action="store_true",
        help="No buscar PDF en subcarpetas",
    )
    return parser.parse_args(argv)


def resolve_clear_groups(clear_arg: str, keep_arg: str) -> set[str]:
    clear = {p.strip().lower() for p in clear_arg.split(",") if p.strip()}
    keep = {p.strip().lower() for p in keep_arg.split(",") if p.strip()}
    return clear - keep


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    try:
        groups = resolve_clear_groups(args.clear, args.keep)
        # Validar grupos temprano.
        build_plan(groups, args.replace_year, known_field_names=[])
    except ValueError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2

    if not args.dry_run and not args.in_place and args.out_dir is None:
        print(
            "Error: indique --out-dir (recomendado) o --in-place. "
            "Use --dry-run para probar sin escribir.",
            file=sys.stderr,
        )
        return 2

    if args.in_place and args.out_dir is not None:
        print("Error: no combine --in-place con --out-dir.", file=sys.stderr)
        return 2

    pdfs = collect_pdfs(args.rutas, recursive=not args.no_recursive)
    if not pdfs:
        print("No se encontraron PDF.", file=sys.stderr)
        return 1

    common_root = None
    if args.out_dir is not None and len(args.rutas) == 1 and args.rutas[0].is_dir():
        common_root = args.rutas[0].resolve()

    def plan_factory(names: list[str]) -> FieldPlan:
        return build_plan(groups, args.replace_year, known_field_names=names)

    print(f"PDFs: {len(pdfs)}")
    print(f"Borrar grupos: {', '.join(sorted(groups)) or '(ninguno)'}")
    if args.replace_year is not None:
        print(f"Reemplazar año: {args.replace_year}")
    if args.dry_run:
        print("Modo: dry-run (no escribe)")
    elif args.in_place:
        print("Modo: in-place" + (" + backup .bak.pdf" if args.backup else ""))
    else:
        print(f"Modo: salida en {args.out_dir}")

    ok_n = fail_n = 0
    total_clear = total_replace = 0

    for src in pdfs:
        out_path = None
        if args.dry_run:
            out_path = None
        elif args.in_place:
            if args.backup:
                bak = src.with_suffix(src.suffix + ".bak.pdf")
                if not bak.exists():
                    shutil.copy2(src, bak)
            out_path = src
        else:
            assert args.out_dir is not None
            if common_root is not None:
                try:
                    rel = src.resolve().relative_to(common_root)
                except ValueError:
                    rel = Path(src.name)
            else:
                rel = Path(src.name)
            out_path = args.out_dir / rel

        result = process_pdf(src, plan_factory, dry_run=args.dry_run, out_path=out_path)
        mark = "OK" if result.ok else "FAIL"
        print(f"[{mark}] {src.name}: {result.message}")
        if result.ok:
            ok_n += 1
            total_clear += result.cleared
            total_replace += result.replaced
        else:
            fail_n += 1

    print(
        f"Resumen: {ok_n} ok, {fail_n} fallidos, "
        f"campos borrados={total_clear}, reemplazados={total_replace}"
    )
    return 0 if fail_n == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
