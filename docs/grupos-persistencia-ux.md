# Grupos — persistencia por carga y UX de navegación

Documento de diseño e implementación para la sección **Grupos** del dashboard S-21.

## Objetivos

1. **Persistencia opcional:** el usuario decide si la asignación de grupos (número de grupo, superintendente, auxiliar) se guarda **junto con la carga activa** en IndexedDB.
2. **Desmarcar sin ambigüedad:** quitar a un publicador de un grupo solo con el **checkbox** (vista por grupo) o la **celda de la matriz** (vista por perfil). Pulsar el nombre **no** cambia la asignación.
3. **Detalle desde el nombre:** pulsar el nombre abre el registro individual del publicador (tabla mensual + gráfico en **Publicadores**).
4. **Volver a Grupos:** al abrir el detalle desde Grupos, aparece un botón **«Volver a Grupos»** (flecha arriba) que restaura la sección tal como estaba (vista, acordeones, búsqueda, scroll).

## Persistencia por carga

### Comportamiento en UI

- Toggle en la barra de Grupos: **«Guardar grupos con esta carga»** (`#grupos-persist-checkbox`).
- **Activado:** cada cambio en grupos se sincroniza al dataset activo en IndexedDB.
- **Desactivado:** los grupos viven solo en `localStorage` (clave `s21_grupos_config`); al cambiar de carga activa se resetean a vacío / valores por defecto.
- **Reemplazar carga activa** (mismo id en historial): si `persistGrupos` estaba activo, se conserva `gruposConfig` del dataset anterior.

### Modelo en IndexedDB (por dataset)

```json
{
  "persistGrupos": true,
  "gruposConfig": {
    "groupCount": 5,
    "assignments": {
      "informe_publicadores::Juan Pérez": 2
    },
    "roles": {
      "2": {
        "superintendent": "informe_publicadores::Juan Pérez",
        "auxiliary": "informe_publicadores::María López"
      }
    }
  }
}
```

| Campo | Descripción |
|-------|-------------|
| `persistGrupos` | Preferencia del usuario para esta carga |
| `gruposConfig.groupCount` | Cantidad de grupos (1–30) |
| `gruposConfig.assignments` | Mapa `origen::nombre` → número de grupo |
| `gruposConfig.roles` | Por grupo: claves de superintendente y auxiliar |

La clave de publicador coincide con el resto del dashboard (`personKey`: `origen::nombre`). Los roles **sup/aux** no van como campo aparte en cada assignment: se derivan del mapa `roles` por número de grupo.

### Futuro (Fase E, opcional)

Exportar en JSON compartido campos por registro, por ejemplo:

```json
"grupo_campo": 2,
"grupo_rol": "superintendente"
```

Eso permitiría round-trip con informes S-21; **no está implementado** en esta entrega. Ver [roadmap-fase-e-multi-anio.md](./roadmap-fase-e-multi-anio.md) § E4.

## UX de asignación vs detalle

### Vista «Por grupo»

- Fila = `<div class="grupos-member-check">` (ya **no** es `<label>`).
- Checkbox → asignar / quitar del grupo.
- Nombre = `<button class="grupos-publisher-name-btn">` → abre detalle en Publicadores.

### Vista «Por perfil» (matriz)

- Celda numérica → asignar / quitar (comportamiento existente).
- Nombre en la primera columna → mismo botón de detalle; la celda no se activa al pulsar el nombre.

### Navegación de retorno

Al abrir detalle desde Grupos:

1. `captureNavigationState()` guarda: vista activa, búsqueda de matriz, acordeones de grupos abiertos, perfiles expandidos en matriz, scroll horizontal de matriz, posición de scroll de la página.
2. Se muestra `#publisher-detail-back-wrap` con `#btn-publisher-back-grupos`.
3. **Volver a Grupos** restaura estado vía `restoreNavigationState()`, vuelve al acordeón Grupos y limpia la selección de publicador.

Si el detalle se abre desde el listado de Publicadores (no desde Grupos), el botón volver **no** aparece.

## Archivos tocados

| Archivo | Cambios |
|---------|---------|
| `web/dashboard.html` | Toggle persistencia, contenedor botón volver |
| `web/dashboard-grupos.js` | Persistencia, nombre clickeable, capture/restore estado, exports |
| `web/dashboard-datos.js` | `persistGrupos`, `gruposConfig` en dataset; sync al guardar |
| `web/dashboard.js` | Carga/restauración por dataset, `gruposReturnState`, botón volver |
| `web/dashboard.css` | Estilos nombre, toggle, botón volver |

## Plan de pruebas manual

- [ ] Con persistencia **off**: asignar grupos, cambiar de carga en historial → grupos vacíos.
- [ ] Con persistencia **on**: asignar, cambiar de carga y volver → mismos grupos y roles.
- [ ] Reemplazar carga activa con persistencia on → conserva `gruposConfig`.
- [ ] Checkbox asigna/desasigna; clic en nombre no cambia grupo.
- [ ] Matriz: celda asigna/desasigna; clic en nombre abre detalle.
- [ ] Desde Grupos → detalle → **Volver a Grupos** → misma vista y scroll aproximado.
- [ ] Detalle desde Publicadores → sin botón volver.

## Relación con multi-año (pendiente)

Cuando exista **un dataset = un año de servicio** (Fase E), la persistencia de grupos seguirá siendo **por dataset**, es decir por año + carga guardada. No mezclar asignaciones entre años distintos.
