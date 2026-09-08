---
name: s21-dashboard-ux
description: UX and visual design rules for the S-21 analizador dashboard (typography, themes, settings panel, local datasets, mobile). Use when changing dashboard.html, dashboard.css, theme files, preferences, navigation, wizard, storage, or help copy in analizador_s21.
---

# S-21 Dashboard UX

(Same content as `.cursor/skills/s21-dashboard-ux/SKILL.md` — kept in repo because `.cursor/` is gitignored.)

## Design tokens

- Base font: `calc(20px * var(--app-font-scale, 1))` on `html.dashboard-root`
- Mobile bases must also multiply by `--app-font-scale` (never fixed `15px` / `14px` without scale)
- Font scale range: `0.85` – `1.25`, stored in `analisis_servicio_prefs.fontScale`
- Theme: `data-theme="dark|light"` on `<html>`; dark = `theme-cyber.css`, light = `theme-light.css` (soft gray)
- Touch targets: minimum 44×44px on mobile
- Destructive actions: confirm modal with explicit consequences, never bare `confirm()` for delete-all

## Navigation

- **Top header:** app title + subtitle only (no config controls)
- **Fixed app footer** (`#dashboard-app-footer`): always visible — app title, **⚙ config** (opens settings → Datos tab), **☀ / 🌙 theme** (two buttons replacing the old toggle)
- **Section nav** (`dashboard-nav--bottom`): Indicadores, Totales, Grupos, Publicadores — sits **above** the app footer
- Font size slider stays in settings → Apariencia tab (long-press footer title opens it as shortcut)

## Settings sheet structure

### Tab «Datos»
- Cargas guardadas (historial, activar/abrir, eliminar)
- Wizard de carga (PDF / JSON)
- Alias de perfiles (cuando hay carga activa)
- Ayuda (`<details>`): WhatsApp, servidor local vs móvil
- Borrar datos locales (discreto, modal con confirmación)

### Tab «Apariencia»
- Tema claro / oscuro (same two buttons as footer; synced)
- Deslizador tamaño de texto (aplica en vivo vía `--app-font-scale`)

## Light theme contrast (required)

Light mode uses **semantic surface tokens** defined in `style.css` (`--surface-*`, `--chart-*`) and overridden in `theme-light.css`. Never hardcode dark rgba backgrounds in components — use variables so light mode stays coherent.

| Token | Light value | Used for |
|-------|-------------|----------|
| `--surface-elevated` | `#ffffff` | KPI cards, filter cards, list items |
| `--surface-muted` | `#f8fafc` | Grupos cards, filters panel, charts toolbar inner |
| `--surface-input` | `#ffffff` | selects, inputs, table headers |
| `--surface-pill` | `#f1f5f9` | mode toggles, pill groups |
| `--text-main` | `#1e293b` | body text on light surfaces |
| `--text-muted` | `#64748b` | labels; use `#475569` for small caps on white |
| `--chart-tick` | `#475569` | Chart.js axis labels |
| `--chart-grid` | `rgba(100,116,139,0.22)` | Chart.js grid lines |

Chart.js reads `--chart-*` via `chartPalette()` in `dashboard.js`; re-render charts on `s21-prefs-changed`.

Dark mode keeps existing cyber palette; do not change dark token defaults unless fixing a bug.

## Copy rules

- No long instructional paragraphs inline in wizard steps
- Short labels in UI; detailed help in `<details>` accordions inside the Datos tab
- Empty state references the gear icon, not a «Datos» button

## Local data (no server DB)

- **Dataset** = one load operation (one or more compatible JSON packages, same service year)
- Max **15** datasets in IndexedDB; recommend deleting duplicates (same profiles + same service year)
- On new load: always ask **Añadir al historial** vs **Reemplazar carga activa**
- Switching datasets must not require re-attaching files
- Active dataset must always be openable via **Abrir** or card click

## Pre-merge checklist

- [ ] Mobile 375px layout OK
- [ ] Light and dark themes readable (KPI labels pass visual check)
- [ ] Font slider updates live on mobile and desktop
- [ ] Gear opens settings; tabs switch Datos / Apariencia
- [ ] History switches active dataset
- [ ] Clear-data modal warns about local loss
- [ ] New load shows duplicate warnings when profiles+year overlap

## Key files

| File | Role |
|------|------|
| `web/style.css` | Base tokens incl. `--surface-*`, `--chart-*` |
| `web/theme-light.css` | Light overrides for all surface/chart tokens |
| `web/dashboard-preferences.js` | Theme + font scale |
| `web/dashboard-storage.js` | IndexedDB datasets |
| `web/dashboard-datos.js` | Settings panel, tabs, modals, history UI |
| `web/dashboard.css` | Layout; uses surface tokens, not hardcoded dark rgba |
| `web/dashboard.js` | `chartPalette()` for Chart.js theme colors |
