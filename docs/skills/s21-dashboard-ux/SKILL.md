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

- **Top header:** app title + **gear icon** (`btn-settings-header`, id `btn-open-datos-panel`) opens the settings sheet
- **Settings sheet tabs:** **Datos** | **Apariencia** — do not mix data loads with appearance controls in one undifferentiated list
- **Bottom nav:** Indicadores, Totales, Grupos, Publicadores only (4 items)
- Do not put settings in bottom nav

## Settings sheet structure

### Tab «Datos»
- Cargas guardadas (historial, activar/abrir, eliminar)
- Wizard de carga (PDF / JSON)
- Alias de perfiles (cuando hay carga activa)
- Ayuda (`<details>`): WhatsApp, servidor local vs móvil
- Borrar datos locales (discreto, modal con confirmación)

### Tab «Apariencia»
- Tema claro / oscuro
- Deslizador tamaño de texto (aplica en vivo vía `--app-font-scale`)

## Light theme contrast (required)

Light mode is a soft gray UI, not pure white. KPI and cards must stay readable:

| Element | Rule |
|---------|------|
| `.kpi-card` | White `#ffffff` surface, visible border — never dark translucent overlay on light sections |
| `.kpi-label` | `#334155` or darker, weight 600 |
| `.kpi-value` | `#0e7490` (primary dark cyan) |
| `.kpi-hint` | `#64748b` minimum |
| `.kpi-mode-toggle` | Light pill `#f1f5f9`; active tab white text on primary |

Define light overrides in `theme-light.css`, not scattered one-offs.

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
| `web/dashboard-preferences.js` | Theme + font scale |
| `web/theme-light.css` | Light theme variables + contrast overrides |
| `web/dashboard-storage.js` | IndexedDB datasets |
| `web/dashboard-datos.js` | Settings panel, tabs, modals, history UI |
| `web/dashboard.css` | Layout, panel, modals, font-scale base |
