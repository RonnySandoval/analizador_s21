# Analizador S-21 · Análisis de Servicio

Aplicación web para analizar tarjetas PDF S-21 de publicadores y visualizar horas, cursos, participación e indicadores por perfil.

**Versión:** 1.0.0

## Requisitos

- Python 3.10+
- Navegador Chromium (Chrome / Edge) para selector de carpetas PDF

```bash
pip install -r requirements.txt
```

## Uso local

```bash
python server.py
```

O en Windows: `iniciar_interfaz.bat`

Abre `http://localhost:8000/dashboard.html`

## Acceso desde móvil (GitHub Pages)

La interfaz web se publica en GitHub Pages al hacer push a `main`:

**https://ronnysandoval.github.io/analizador_s21/dashboard.html**

En el móvil:

1. Abra ese enlace en Chrome o Safari.
2. Elija **Cargar JSON existentes** → **Abrir archivos** y seleccione los JSON generados en el PC (puede enviarlos por WhatsApp, Drive, etc.).
3. Opcional: **Añadir a pantalla de inicio** para usarla como app.

> El análisis de PDFs requiere el servidor Python en su PC. GitHub Pages solo sirve la interfaz para consultar JSON ya exportados.

## Instalar como app (PWA)

1. Ejecute el servidor en su red local (HTTPS recomendado para producción).
2. Abra el dashboard en Chrome o Edge.
3. Use **Instalar app** (barra inferior) o el menú del navegador → *Instalar aplicación* / *Añadir a pantalla de inicio*.

La interfaz funciona offline para assets estáticos; el análisis PDF requiere el servidor Python activo.

## Estructura

| Ruta | Descripción |
|------|-------------|
| `server.py` | Servidor HTTP + API |
| `test1.py` | Motor de análisis PDF → JSON/CSV |
| `restaurar_formularios.py` | CLI: limpia registro mensual de S-21 (sin UI) |
| `web/dashboard.html` | Dashboard principal |
| `web/dashboard-wizard.js` | Asistente de carga y analizador |
| `resultados/` | Salida JSON (local, no versionada) |

### Restaurar formularios S-21 (CLI)

Limpia el **cuerpo del registro** (horas, cursos, participación, etc.) y conserva por defecto nombre, fechas, bautismo y privilegios. No borra los archivos.

```bash
# Ver qué haría (recomendado primero)
python restaurar_formularios.py --dry-run "C:\ruta\Publicadores"

# Escribir copias limpias en otra carpeta
python restaurar_formularios.py --out-dir ".\s21_limpios" "C:\ruta\Publicadores"

# Sobrescribir originales (con copia .bak.pdf) y poner año 2027
python restaurar_formularios.py --in-place --backup --replace-year 2027 "C:\ruta\Grupo1"
```

Grupos: `registro`, `totales`, `identidad`, `sexo`, `esperanza`, `privilegios`, `año`.  
Algunos PDF tienen permisos o campos de solo lectura; el script lo indica en el resumen.

En la app (servidor local): Ajustes → **Restaurar formularios** (también en Nueva carga). Marque qué borrar o reemplazar, elija carpetas y ejecute.

## Publicar en GitHub

```powershell
# Tras instalar GitHub CLI: https://cli.github.com/
gh auth login
gh repo create analizador-s21 --public --source=. --remote=origin --push
```

O manualmente: cree un repo vacío en GitHub y ejecute:

```bash
git remote add origin https://github.com/USUARIO/analizador-s21.git
git push -u origin main
```

## Privacidad

No suba a repos públicos carpetas con datos de congregación (`resultados/`, CSV/JSON locales). El `.gitignore` las excluye por defecto.

## Licencia

Uso interno de congregación. Ajuste según sus políticas locales.
