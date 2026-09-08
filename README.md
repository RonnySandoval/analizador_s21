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
| `web/dashboard.html` | Dashboard principal |
| `web/dashboard-wizard.js` | Asistente de carga y analizador |
| `resultados/` | Salida JSON (local, no versionada) |

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
