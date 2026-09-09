# Tipografía y color de secciones del dashboard

Reglas unificadas para títulos y bloques del analizador S-21. Aplican en **tema claro y oscuro** mediante tokens CSS.

## Jerarquía de títulos

| Nivel | Token base | Uso | Clases HTML |
|-------|------------|-----|-------------|
| **Sección** | `--heading-section-*` | Sección activa del dashboard (Indicadores, Totales, Grupos, Publicadores) | `#dashboard-header-section` y `.dashboard-section-title` en el acordeón |
| **Subsección** | `--heading-subsection-*` | Bloques dentro de una sección (Gráficos, Tarjeta de publicador) | `.dashboard-heading-subsection`, `.summary-subsection-title`, `.publisher-detail-card-title` |
| **Panel** | `--heading-panel-*` | Etiquetas de bloques internos (filtros, gráficos, roles de grupo, pasos del wizard) | `.dashboard-heading-panel`, `.filters-title`, `.chart-card h3`, `.publisher-chart-title`, `.grupos-role-card-title`, `.detail-monthly-filter-title`, `.wizard-step-label` |

### Reglas de color

- **Sección y subsección**: `--heading-section-color` / `--heading-subsection-color` → `var(--text-main)`.
- **Panel**: `--heading-panel-color` → `var(--text-muted)` (en claro: `#475569` para mejor contraste en mayúsculas).
- **No** asignar colores distintos por sección (ámbar, púrpura, magenta, verde) en títulos ni fondos de acordeón.
- El acento `--primary` queda para **interacción** (nav activo, enlaces, botones, KPIs), no para títulos de sección.

### Reglas de forma

- Sección y subsección: **mayúsculas**, peso 600–700, tracking amplio.
- Panel: **mayúsculas**, peso 600, tamaño menor (0.72rem).
- Subtítulos de sección (`.dashboard-section-sub` en el acordeón): frase normal, `var(--text-muted)`, sin mayúsculas.
- El título de sección aparece en el **header fijo** (`#dashboard-header-section`) y en el **encabezado del acordeón** (`.dashboard-section-title`), con el mismo color unificado.
- La información de la carga JSON (restaurada, nombre, fecha) **no** va en el encabezado de secciones; queda en el panel Datos (historial de cargas).

## Fondos de sección

- Todas las secciones usan el mismo `--section-bg` / gradiente del tema activo.
- Las clases `.dashboard-section--kpi`, `--table`, `--grupos`, `--publishers` se conservan solo por semántica o anclas; **no** llevan gradientes ni bordes propios.
- Separadores internos (p. ej. bloque Gráficos): `var(--surface-border-light)`.

## Navegación inferior

- Pestaña activa: `color: var(--primary)` y fondo `var(--surface-hover-strong)`.
- Mismo estilo para Indicadores, Totales, Grupos y Publicadores (sin color por sección).

## Tokens (definición)

En `web/style.css` (`:root`):

```css
--heading-section-color, --heading-section-size, --heading-section-weight, ...
--heading-subsection-color, --heading-subsection-size, ...
--heading-panel-color, --heading-panel-size, ...
```

Tema claro sobreescribe solo los colores en `web/theme-light.css`.

## Añadir un título nuevo

1. Decide el nivel (sección / subsección / panel).
2. Usa la clase existente del nivel o añade el selector al grupo correspondiente en `web/dashboard.css` (bloque «Heading levels»).
3. **No** hardcodear `#6ee7b7`, `accent-emerald`, etc. en títulos.
4. Comprueba contraste en claro y oscuro.

## Archivos implicados

| Archivo | Rol |
|---------|-----|
| `web/style.css` | Tokens `--heading-*` |
| `web/dashboard.css` | Reglas unificadas y mapeo de clases |
| `web/theme-cyber.css` | Fondo/borde unificado de secciones (oscuro) |
| `web/theme-light.css` | Colores de heading en claro |
