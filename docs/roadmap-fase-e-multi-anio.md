# Fase E — Año de servicio en el dashboard (pendiente)

Documento de referencia para el siguiente hito del plan de escalado de **Análisis de Servicio**.

## Problema

El analizador ya exporta `año_servicio` en JSON (schema **1.1**), con periodo septiembre→agosto. El dashboard **aún no usa ese campo** para aislar cargas:

- Varios JSON de distintos años pueden fusionarse en un solo bloque sept–ago.
- La clave de publicador es `perfil::nombre` **sin año** → duplicados y totales inflados.
- El historial IndexedDB guarda `serviceYear`, pero no impide mezclar datos al activar cargas incompatibles.

## Objetivo

Un **dataset activo = un año de servicio** (salvo aviso explícito). KPIs, tablas, gráficos y grupos deben referirse solo a ese año.

## Alcance propuesto

### E1 — Detección y etiquetado

- Leer `año_servicio` de cada paquete JSON al cargar.
- Mostrar año en cabecera, historial de cargas y panel Datos.
- Bloquear o advertir al mezclar paquetes con años distintos en la misma carga.

### E2 — Clave de publicador con año

- Evaluar clave `año::origen::nombre` (o metadata en filas planas) cuando hay multi-año en el dispositivo.
- Evitar duplicados al listar publicadores.

### E3 — Historial por año

- Filtrar / agrupar cargas guardadas por `serviceYear`.
- Al activar una carga de otro año: confirmación y reset de filtros/vistas.

### E4 — Grupos y persistencia (relacionado)

- Los grupos ya pueden guardarse **por carga** (`persistGrupos` + `gruposConfig` en IndexedDB). Ver [grupos-persistencia-ux.md](./grupos-persistencia-ux.md).
- **Futuro:** opcionalmente inyectar en JSON exportado campos como:
  ```json
  "grupo_campo": 2,
  "grupo_rol": "superintendente" | "auxiliar" | null
  ```
  en cada registro, para compartir asignación junto con el informe S-21.

### E5 — QA y documentación

- Casos de prueba: dos años en historial, cambio de carga activa, sin duplicados en KPIs.
- Actualizar README y ayuda del panel Datos.

## Fuera de alcance (por ahora)

- Analizar PDF en el navegador (Pyodide).
- Sincronización en la nube.

## Orden sugerido

1. E1 — etiquetas y validación al cargar  
2. E3 — UX al cambiar de año en historial  
3. E2 — claves internas si siguen apareciendo duplicados  
4. E4 — export JSON con grupos (opcional)  
5. E5 — QA  

## Estado

| Ítem | Estado |
|------|--------|
| `año_servicio` en analizador (Python) | Hecho |
| Dashboard respeta un solo año | **Pendiente** |
| Grupos persistentes por carga | Hecho (ver `gruposConfig` en dataset) |
| Grupos en JSON compartido | Pendiente |

---

*Última actualización: 2026-09-09*
