---
name: s21-dashboard-ux
description: UX and visual design rules for the S-21 analizador dashboard (typography, themes, datos panel, local datasets, mobile). Use when changing dashboard.html, dashboard.css, theme files, preferences, navigation, wizard, storage, or help copy in analizador_s21.
---

# S-21 Dashboard UX

(Same content as `.cursor/skills/s21-dashboard-ux/SKILL.md` — kept in repo because `.cursor/` is gitignored.)

## Design tokens

- Base font: `calc(20px * var(--app-font-scale, 1))` on `html.dashboard-root`
- Font scale range: `0.85` – `1.25`, stored in `analisis_servicio_prefs.fontScale`
- Theme: `data-theme="dark|light"` on `<html>`; dark = `theme-cyber.css`, light = `theme-light.css` (soft gray)
- Touch targets: minimum 44×44px on mobile
- Destructive actions: confirm modal with explicit consequences, never bare `confirm()` for delete-all

## Navigation

- **Top header:** app title + **Datos** button (configuration, loads, history, settings, help)
- **Bottom nav:** Indicadores, Totales, Grupos, Publicadores only (4 items)
- Do not put Datos in bottom nav

## Copy rules

- No long instructional paragraphs inline in wizard steps
- Short labels in UI; detailed help in `<details>` accordions inside the Datos panel
- WhatsApp / Word / ZIP guidance lives under **Ayuda** in Datos panel

## Local data (no server DB)

- **Dataset** = one load operation (one or more compatible JSON packages, same service year)
- Max **15** datasets in IndexedDB; recommend deleting duplicates (same profiles + same service year)
- On new load: always ask **Añadir al historial** vs **Reemplazar carga activa**
- Switching datasets must not require re-attaching files

## Pre-merge checklist

- [ ] Mobile 375px layout OK
- [ ] Light and dark themes readable
- [ ] Font slider updates live
- [ ] Datos panel opens/closes; history switches active dataset
- [ ] Clear-data modal warns about local loss
- [ ] New load shows duplicate warnings when profiles+year overlap
