/** Capa de datos del dashboard — parser JSON S-21, filas planas y agregación */

const S21_MESES = [
    'septiembre', 'octubre', 'noviembre', 'diciembre',
    'enero', 'febrero', 'marzo', 'abril',
    'mayo', 'junio', 'julio', 'agosto',
];

/** Clave interna (mes) → etiquetas corta (gráficos) y completa (tablas, chips). */
const S21_MESES_MAP = {
    septiembre: { corto: 'Sep', completo: 'Septiembre' },
    octubre: { corto: 'Oct', completo: 'Octubre' },
    noviembre: { corto: 'Nov', completo: 'Noviembre' },
    diciembre: { corto: 'Dic', completo: 'Diciembre' },
    enero: { corto: 'Ene', completo: 'Enero' },
    febrero: { corto: 'Feb', completo: 'Febrero' },
    marzo: { corto: 'Mar', completo: 'Marzo' },
    abril: { corto: 'Abr', completo: 'Abril' },
    mayo: { corto: 'May', completo: 'Mayo' },
    junio: { corto: 'Jun', completo: 'Junio' },
    julio: { corto: 'Jul', completo: 'Julio' },
    agosto: { corto: 'Ago', completo: 'Agosto' },
};

const S21_MESES_LABEL = Object.fromEntries(
    Object.entries(S21_MESES_MAP).map(([k, v]) => [k, v.corto])
);

function mesLabel(mes, variant = 'completo') {
    const entry = S21_MESES_MAP[mes];
    if (!entry) return mes;
    return variant === 'corto' ? entry.corto : entry.completo;
}

const S21_GROUP_FIELDS = [
    { id: 'origen', label: 'Perfil' },
    { id: 'sexo', label: 'Sexo' },
    { id: 'esperanza', label: 'Esperanza' },
    { id: 'anciano', label: 'Anciano' },
    { id: 'siervo_ministerial', label: 'Siervo ministerial' },
    { id: 'precursor_regular', label: 'Precursor regular' },
    { id: 'precursor_especial', label: 'Precursor especial' },
    { id: 'misionero', label: 'Misionero' },
    { id: 'mes', label: 'Mes' },
];

const S21_CHART_METRICS = [
    { id: 'horas', label: 'Horas', aggregation: 'sum' },
    { id: 'cursos', label: 'Cursos bíblicos', aggregation: 'avg' },
    { id: 'participacion', label: 'Informes con participación', aggregation: 'avg' },
    { id: 'precursor_auxiliar', label: 'Meses precursor auxiliar', aggregation: 'avg' },
    { id: 'publicadores_con_cursos', label: 'Publicadores con cursos', aggregation: 'count' },
    { id: 'publicadores_sin_cursos', label: 'Publicadores sin cursos', aggregation: 'count' },
    { id: 'inactivos', label: 'Inactivos (perfil)', aggregation: 'count' },
];

function isPerfilInactivo(origen) {
    return /\binactiv/i.test(String(origen || ''));
}

function filterMensualByScope(rows, scope) {
    if (!scope || scope === 'year') return rows;
    return rows.filter(r => r.mes === scope);
}

function filterRowsByOrigenes(rows, includedOrigenes) {
    if (!includedOrigenes?.size) return [];
    return rows.filter(r => includedOrigenes.has(r.origen));
}

function publicadoresEnMensual(mensual, publicadores) {
    const keys = new Set(mensual.map(r => personKey(r)));
    return publicadores.filter(p => keys.has(personKey(p)));
}

function chartMetricValue(row, metricId) {
    const spec = S21_CHART_METRICS.find(m => m.id === metricId) || S21_CHART_METRICS[0];
    const raw = ({
        horas: row.horas || 0,
        cursos: row.cursos || 0,
        participacion: row.participacion || 0,
        precursor_auxiliar: row.precursor_auxiliar || 0,
        publicadores_con_cursos: row.publicadores_con_cursos || 0,
        publicadores_sin_cursos: row.publicadores_sin_cursos || 0,
        inactivos: row.inactivos || 0,
    }[metricId]) ?? row.horas ?? 0;

    if (spec.aggregation === 'avg') {
        const n = row.publicadores || 0;
        return n > 0 ? raw / n : 0;
    }
    return raw;
}

function chartMetricLabel(metricId) {
    const spec = S21_CHART_METRICS.find(m => m.id === metricId) || S21_CHART_METRICS[0];
    return spec.aggregation === 'avg' ? `${spec.label} (prom.)` : spec.label;
}

function sortRowsForBarChart(rows, groupFields, metricId) {
    const fields = groupFields.filter(Boolean);
    const mesIdx = fields.indexOf('mes');

    if (mesIdx >= 0) {
        return [...rows].sort((a, b) => {
            const ma = a.keys[mesIdx]?.value ?? '';
            const mb = b.keys[mesIdx]?.value ?? '';
            const ia = S21_MESES.indexOf(ma);
            const ib = S21_MESES.indexOf(mb);
            if (ia !== ib) return ia - ib;
            if (fields.length > 1) {
                return a.label.localeCompare(b.label, 'es');
            }
            return 0;
        });
    }

    return [...rows].sort((a, b) => chartMetricValue(b, metricId) - chartMetricValue(a, metricId));
}

function parseNumero(valor) {
    if (valor === null || valor === undefined || valor === '' || valor === '/Off') return 0;
    const texto = String(valor).trim();
    if (!texto) return 0;
    if (/^\d+$/.test(texto)) return parseInt(texto, 10);
    const m = texto.match(/^(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
}

function boolLabel(val) {
    return val ? 'Sí' : 'No';
}

function detectCongregacion(origenes) {
    const list = [...new Set((origenes || []).filter(Boolean))];
    if (!list.length) return null;

    const suffixes = list.map(o => {
        const m = String(o).match(/\s{2,}(.+)$/);
        return m ? m[1].trim() : null;
    }).filter(Boolean);

    if (!suffixes.length) return null;

    const counts = new Map();
    for (const s of suffixes) counts.set(s, (counts.get(s) || 0) + 1);
    const [best, n] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (n >= Math.ceil(list.length / 2)) return best;
    return null;
}

function suggestPerfilAlias(origen, congregacion = null) {
    let text = String(origen || '').trim();
    if (!text) return '—';

    if (congregacion) {
        const escaped = congregacion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        text = text.replace(new RegExp(`\\s{2,}${escaped}\\s*$`, 'i'), '').trim();
    }

    if (/\s{2,}.+$/.test(text)) {
        text = text.replace(/\s{2,}.+$/, '').trim();
    }

    return text.replace(/\s+/g, ' ').trim() || String(origen).trim();
}

function parseJsonPackage(raw, fileName = '') {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const origen = data.origen
        || (fileName ? fileName.replace(/\.json$/i, '') : 'Sin origen');
    const titulo = data.titulo || origen;
    const registros = data.registros || [];
    return {
        schema_version: data.schema_version || '0',
        titulo,
        origen,
        exported_at: data.exported_at || null,
        año_servicio: data.año_servicio || null,
        fileName,
        registros,
        cantidad: data.cantidad ?? registros.length,
    };
}

function flattenPackages(packages) {
    const mensual = [];
    const publicadores = [];

    for (const pkg of packages) {
        for (const reg of pkg.registros) {
            const id = reg.identificacion || {};
            const priv = reg.privilegios || {};
            const meta = reg.metadata || {};
            const origen = meta.carpeta_origen || pkg.origen;

            const base = {
                origen,
                titulo_paquete: pkg.titulo,
                nombre: id.nombre || '—',
                fecha_nacimiento: id.fecha_nacimiento || '',
                fecha_bautismo: id.fecha_bautismo || '',
                sexo: id.sexo || '—',
                esperanza: id.esperanza || '—',
                anciano: boolLabel(!!priv.anciano),
                siervo_ministerial: boolLabel(!!priv.siervo_ministerial),
                precursor_regular: boolLabel(!!priv.precursor_regular),
                precursor_especial: boolLabel(!!priv.precursor_especial),
                misionero: boolLabel(!!priv.misionero),
                archivo: meta.archivo || '',
            };

            let totalHoras = reg.totales?.horas;
            if (totalHoras === undefined || totalHoras === null) {
                totalHoras = 0;
            } else {
                totalHoras = parseNumero(totalHoras);
            }

            let totalCursos = 0;
            let sumHorasMes = 0;
            let mesesParticipacion = 0;
            let mesesPrecursorAux = 0;

            const registro = reg.registro || {};
            for (const mes of S21_MESES) {
                const m = registro[mes] || {};
                const horas = parseNumero(m.horas);
                const cursos = parseNumero(m.cursos_biblicos);
                const participacion = !!m.participacion;
                const precursorAux = !!m.precursor_auxiliar;
                const notas = String(m.comentarios ?? m.notas ?? '').trim();

                sumHorasMes += horas;
                totalCursos += cursos;
                if (participacion) mesesParticipacion += 1;
                if (precursorAux) mesesPrecursorAux += 1;

                mensual.push({
                    ...base,
                    mes,
                    mes_label: mesLabel(mes, 'completo'),
                    mes_corto: mesLabel(mes, 'corto'),
                    horas,
                    cursos,
                    participacion: participacion ? 1 : 0,
                    precursor_auxiliar: precursorAux ? 1 : 0,
                    notas,
                });
            }

            publicadores.push({
                ...base,
                total_horas: sumHorasMes || totalHoras,
                total_cursos: totalCursos,
                meses_participacion: mesesParticipacion,
                meses_precursor_aux: mesesPrecursorAux,
            });
        }
    }

    return { mensual, publicadores, packages };
}

function uniqueValues(rows, field) {
    return [...new Set(rows.map(r => r[field] ?? '—'))].sort((a, b) =>
        String(a).localeCompare(String(b), 'es')
    );
}

function applyFilters(rows, filters, mode = 'include') {
    return rows.filter(row => {
        for (const [field, values] of Object.entries(filters)) {
            if (!values?.length) continue;
            const cell = row[field] ?? '—';
            if (mode === 'exclude') {
                if (values.includes(cell)) return false;
            } else if (!values.includes(cell)) {
                return false;
            }
        }
        return true;
    });
}

function trimMonthlySeries(series, excludeLastN) {
    const n = Math.max(0, Math.min(Number(excludeLastN) || 0, series.length));
    if (!n) return series;
    return series.slice(0, series.length - n);
}

function filterMensualByExcludedMonths(rows, excludeLastN) {
    const n = Math.max(0, Math.min(Number(excludeLastN) || 0, S21_MESES.length));
    if (!n) return rows;
    const excluded = new Set(S21_MESES.slice(-n));
    return rows.filter(r => !excluded.has(r.mes));
}

function excludedMonthLabels(excludeLastN) {
    const n = Math.max(0, Math.min(Number(excludeLastN) || 0, S21_MESES.length));
    if (!n) return [];
    return S21_MESES.slice(-n).map(m => mesLabel(m, 'corto'));
}

function makeGroup(parts, groupFields) {
    return {
        keys: groupFields.map((f, i) => ({
            field: f,
            label: S21_GROUP_FIELDS.find(g => g.id === f)?.label || f,
            value: parts[i] ?? '—',
        })),
        horas: 0,
        cursos: 0,
        participacion: 0,
        precursor_auxiliar: 0,
        _people: new Set(),
        _inactivosPerfil: new Set(),
        _conCursos: new Set(),
        _sinCursos: new Set(),
    };
}

function aggregateRows(mensualRows, groupFields, publicadoresRows = []) {
    const fields = groupFields.filter(Boolean);
    const includesMes = fields.includes('mes');
    const groups = new Map();

    function getGroup(row) {
        const parts = fields.map(f => row[f] ?? '—');
        const key = parts.join('\0') || '(total)';
        if (!groups.has(key)) groups.set(key, makeGroup(parts, fields));
        return groups.get(key);
    }

    for (const row of mensualRows) {
        const g = getGroup(row);
        g.horas += row.horas || 0;
        g.cursos += row.cursos || 0;
        g.participacion += row.participacion || 0;
        g.precursor_auxiliar += row.precursor_auxiliar || 0;
        if (row.nombre) {
            const pk = personKey(row);
            if (includesMes) {
                g._people.add(pk);
                if (isPerfilInactivo(row.origen)) g._inactivosPerfil.add(pk);
                if (row.cursos > 0) g._conCursos.add(pk);
                else g._sinCursos.add(pk);
            } else if (isPerfilInactivo(row.origen)) {
                g._inactivosPerfil.add(pk);
            }
        }
    }

    if (!includesMes) {
        for (const row of publicadoresRows) {
            const g = getGroup(row);
            if (row.nombre) {
                const pk = personKey(row);
                g._people.add(pk);
                if (isPerfilInactivo(row.origen)) g._inactivosPerfil.add(pk);
                if (row.total_cursos > 0) g._conCursos.add(pk);
                else g._sinCursos.add(pk);
            }
        }
    }

    return Array.from(groups.values()).map(g => ({
        keys: g.keys,
        label: g.keys.map(k =>
            k.field === 'mes' ? mesLabel(k.value, 'completo') : k.value
        ).join(' · ') || 'Total',
        horas: g.horas,
        cursos: g.cursos,
        participacion: g.participacion,
        precursor_auxiliar: g.precursor_auxiliar,
        publicadores: g._people.size,
        inactivos: g._inactivosPerfil.size,
        publicadores_con_cursos: g._conCursos.size,
        publicadores_sin_cursos: g._sinCursos.size,
    }));
}

function aggregateMonthlyTrend(rows, metricId) {
    if (metricId === 'publicadores_con_cursos' || metricId === 'publicadores_sin_cursos' || metricId === 'inactivos') {
        const byMes = new Map(S21_MESES.map(m => [m, {
            mes: m,
            mes_label: mesLabel(m, 'corto'),
            con: new Set(),
            sin: new Set(),
            inactivos: new Set(),
        }]));
        for (const row of rows) {
            const slot = byMes.get(row.mes);
            if (!slot || !row.nombre) continue;
            const pk = personKey(row);
            if (row.cursos > 0) slot.con.add(pk);
            else slot.sin.add(pk);
            if (metricId === 'inactivos' && isPerfilInactivo(row.origen)) slot.inactivos.add(pk);
        }
        return S21_MESES.map(m => {
            const slot = byMes.get(m);
            let value;
            if (metricId === 'publicadores_con_cursos') value = slot.con.size;
            else if (metricId === 'publicadores_sin_cursos') value = slot.sin.size;
            else value = slot.inactivos.size;
            return { mes: m, mes_label: slot.mes_label, value };
        });
    }

    const byMes = new Map(S21_MESES.map(m => [m, { mes: m, mes_label: mesLabel(m, 'corto'), horas: 0, cursos: 0, participacion: 0, precursor_auxiliar: 0 }]));
    for (const row of rows) {
        const slot = byMes.get(row.mes);
        if (!slot) continue;
        slot.horas += row.horas || 0;
        slot.cursos += row.cursos || 0;
        slot.participacion += row.participacion || 0;
        slot.precursor_auxiliar += row.precursor_auxiliar || 0;
    }
    return S21_MESES.map(m => {
        const slot = byMes.get(m);
        let value;
        switch (metricId) {
            case 'cursos': value = slot.cursos; break;
            case 'participacion': value = slot.participacion; break;
            case 'precursor_auxiliar': value = slot.precursor_auxiliar; break;
            default: value = slot.horas;
        }
        return { ...slot, value };
    });
}

function monthlySeriesForKpi(mensual, metricKey) {
    if (metricKey === 'publicadores') {
        const byMes = new Map(S21_MESES.map(m => [m, new Set()]));
        for (const row of mensual) {
            if (row.nombre) byMes.get(row.mes)?.add(personKey(row));
        }
        return S21_MESES.map(m => ({
            mes: m,
            mes_label: mesLabel(m, 'corto'),
            value: byMes.get(m).size,
        }));
    }
    if (metricKey === 'origenes') {
        const byMes = new Map(S21_MESES.map(m => [m, new Set()]));
        for (const row of mensual) {
            if (row.origen) byMes.get(row.mes)?.add(row.origen);
        }
        return S21_MESES.map(m => ({
            mes: m,
            mes_label: mesLabel(m, 'corto'),
            value: byMes.get(m).size,
        }));
    }
    if (metricKey === 'inactivos') {
        const byMes = new Map(S21_MESES.map(m => [m, new Set()]));
        for (const row of mensual) {
            if (row.nombre && isPerfilInactivo(row.origen)) {
                byMes.get(row.mes)?.add(personKey(row));
            }
        }
        return S21_MESES.map(m => ({
            mes: m,
            mes_label: mesLabel(m, 'corto'),
            value: byMes.get(m).size,
        }));
    }
    const id = metricKey === 'precursor_aux' ? 'precursor_auxiliar' : metricKey;
    return aggregateMonthlyTrend(mensual, id);
}

function statsFromMonthlySeries(series) {
    if (!series.length) return { max: 0, maxMes: '—', avg: 0 };
    let max = 0;
    let maxMes = '—';
    let sum = 0;
    for (const slot of series) {
        sum += slot.value;
        if (slot.value >= max) {
            max = slot.value;
            maxMes = slot.mes_label;
        }
    }
    return { max, maxMes, avg: sum / series.length };
}

/** Agregados de un mes (congregación completa). */
function monthAggregateStats(mensual, mes) {
    const stats = { horas: 0, cursos: 0, participacion: 0, precursor_auxiliar: 0, filas: 0 };
    for (const row of mensual) {
        if (row.mes !== mes) continue;
        stats.filas += 1;
        stats.horas += row.horas || 0;
        stats.cursos += row.cursos || 0;
        stats.participacion += row.participacion || 0;
        stats.precursor_auxiliar += row.precursor_auxiliar || 0;
    }
    return stats;
}

/** Mes con actividad registrada: al menos participación, horas, cursos o precursor auxiliar. */
function monthHasRegisteredActivity(mensual, mes) {
    const stats = monthAggregateStats(mensual, mes);
    return stats.participacion > 0
        || stats.horas > 0
        || stats.cursos > 0
        || stats.precursor_auxiliar > 0;
}

/** Último mes del año de servicio con datos; omite meses vacíos al final (p. ej. agosto sin informes). */
function findLastRegisteredMonth(mensual) {
    for (let i = S21_MESES.length - 1; i >= 0; i--) {
        const mes = S21_MESES[i];
        if (monthHasRegisteredActivity(mensual, mes)) return mes;
    }
    return null;
}

function kpiMetric(mensual, publicadores, metricKey, lastMes = null) {
    const series = monthlySeriesForKpi(mensual, metricKey);
    const { max, maxMes, avg } = statsFromMonthlySeries(series);
    let last = 0;
    if (lastMes) {
        const slot = series.find(s => s.mes === lastMes);
        last = slot?.value ?? 0;
    }
    let total;
    switch (metricKey) {
        case 'publicadores':
            total = new Set(publicadores.map(p => `${p.origen}::${p.nombre}`)).size;
            break;
        case 'origenes':
            total = new Set(publicadores.map(p => p.origen)).size;
            break;
        case 'horas':
            total = mensual.reduce((s, r) => s + r.horas, 0);
            break;
        case 'cursos':
            total = mensual.reduce((s, r) => s + r.cursos, 0);
            break;
        case 'participacion':
            total = mensual.reduce((s, r) => s + r.participacion, 0);
            break;
        case 'precursor_aux':
            total = mensual.reduce((s, r) => s + r.precursor_auxiliar, 0);
            break;
        case 'inactivos':
            total = new Set(
                publicadores.filter(p => isPerfilInactivo(p.origen)).map(p => personKey(p))
            ).size;
            break;
        default:
            total = 0;
    }
    return { total, max, maxMes, avg, last };
}

function computeKpis(mensual, publicadores) {
    const keys = ['publicadores', 'horas', 'cursos', 'participacion', 'precursor_aux', 'inactivos'];
    const lastRegisteredMonth = findLastRegisteredMonth(mensual);
    const metrics = {};
    for (const key of keys) {
        metrics[key] = kpiMetric(mensual, publicadores, key, lastRegisteredMonth);
    }
    return {
        publicadores_total: metrics.publicadores.total,
        lastRegisteredMonth,
        lastRegisteredMonthLabel: lastRegisteredMonth ? mesLabel(lastRegisteredMonth, 'completo') : '—',
        lastRegisteredMonthShort: lastRegisteredMonth ? mesLabel(lastRegisteredMonth, 'corto') : '—',
        metrics,
    };
}

const TOTALS_METRIC_COLUMNS = {
    horas: { label: 'Horas', getValue: row => row.horas },
    cursos: { label: 'Cursos', getValue: row => row.cursos },
    participacion: { label: 'Participación', getValue: row => row.participacion },
    precursor_auxiliar: { label: 'Prec. aux.', getValue: row => row.precursor_auxiliar },
    publicadores: { label: 'Publicadores', getValue: row => row.publicadores },
    inactivos: { label: 'Inactivos', getValue: row => row.inactivos },
};

function totalsMetricColumns(scope = 'year') {
    if (scope && scope !== 'year') {
        return ['horas', 'cursos', 'participacion', 'precursor_auxiliar', 'publicadores', 'inactivos'];
    }
    return ['horas', 'publicadores', 'inactivos'];
}

function aggregatedToCsv(rows, groupFields, formatGroupValue = (_f, v) => v, scope = 'year') {
    const metricIds = totalsMetricColumns(scope);
    const headers = [
        ...groupFields.filter(Boolean).map(f => S21_GROUP_FIELDS.find(g => g.id === f)?.label || f),
        ...metricIds.map(id => TOTALS_METRIC_COLUMNS[id].label),
    ];
    const lines = [headers.join(',')];
    for (const row of rows) {
        const cols = [
            ...groupFields.filter(Boolean).map((f, i) =>
                csvEscape(formatGroupValue(f, row.keys[i]?.value ?? ''))
            ),
            ...metricIds.map(id => TOTALS_METRIC_COLUMNS[id].getValue(row)),
        ];
        lines.push(cols.join(','));
    }
    return '\ufeff' + lines.join('\n');
}

function personKey(row) {
    return `${row.origen || ''}::${row.nombre || ''}`;
}

/** Criterios sobre celdas mensuales (participación, cursos, precursor auxiliar). */
function matchesMonthlyCell(row, criteria) {
    if (!criteria) return true;
    if (criteria.participacion === 'yes' && !row.participacion) return false;
    if (criteria.participacion === 'no' && row.participacion) return false;
    if (criteria.cursos === 'with' && !(row.cursos > 0)) return false;
    if (criteria.cursos === 'without' && row.cursos > 0) return false;
    if (criteria.precursor_auxiliar === 'yes' && !row.precursor_auxiliar) return false;
    if (criteria.precursor_auxiliar === 'no' && row.precursor_auxiliar) return false;
    return true;
}

function publisherMatchesMonthlyCriteria(rows, criteria) {
    if (!criteria || !Object.keys(criteria).length) return true;
    if (criteria.participacion === 'no') return !rows.some(r => r.participacion);
    if (criteria.participacion === 'yes') return rows.some(r => r.participacion);
    if (criteria.cursos === 'with') return rows.some(r => r.cursos > 0);
    if (criteria.cursos === 'without') return !rows.some(r => r.cursos > 0);
    if (criteria.precursor_auxiliar === 'yes') return rows.some(r => r.precursor_auxiliar);
    if (criteria.precursor_auxiliar === 'no') return !rows.some(r => r.precursor_auxiliar);
    return true;
}

function applyMonthlyDrillFilter(publishers, mensual, drill) {
    if (!drill) return publishers;

    const criteria = drill.criteria;
    const hasCriteria = criteria && Object.keys(criteria).length > 0;

    if (drill.mes) {
        const monthRows = mensual.filter(r => r.mes === drill.mes);
        if (criteria?.perfil_inactivo) {
            const keys = new Set(
                monthRows.filter(r => isPerfilInactivo(r.origen)).map(r => personKey(r))
            );
            return publishers.filter(p => keys.has(personKey(p)));
        }
        if (!hasCriteria) {
            const keys = new Set(monthRows.map(r => personKey(r)));
            return publishers.filter(p => keys.has(personKey(p)));
        }
        const matching = new Set();
        for (const row of monthRows) {
            if (matchesMonthlyCell(row, criteria)) matching.add(personKey(row));
        }
        return publishers.filter(p => matching.has(personKey(p)));
    }

    if (!hasCriteria) return publishers;

    if (criteria.perfil_inactivo) {
        return publishers.filter(p => isPerfilInactivo(p.origen));
    }

    const byPerson = new Map();
    for (const row of mensual) {
        const pk = personKey(row);
        if (!byPerson.has(pk)) byPerson.set(pk, []);
        byPerson.get(pk).push(row);
    }

    const matching = new Set();
    for (const [pk, rows] of byPerson) {
        if (publisherMatchesMonthlyCriteria(rows, criteria)) matching.add(pk);
    }
    return publishers.filter(p => matching.has(personKey(p)));
}

function monthlyCriteriaFromTableColumn(colId) {
    switch (colId) {
        case 'inactivos': return { perfil_inactivo: true };
        case 'participacion': return { participacion: 'yes' };
        case 'cursos': return { cursos: 'with' };
        case 'precursor_auxiliar': return { precursor_auxiliar: 'yes' };
        default: return null;
    }
}

const DETAIL_METRIC_IDS = new Set(['horas', 'cursos', 'participacion', 'precursor_auxiliar']);

function detailMetricFromDrillSource(sourceId) {
    switch (sourceId) {
        case 'horas':
            return 'horas';
        case 'cursos':
        case 'publicadores_con_cursos':
        case 'publicadores_sin_cursos':
            return 'cursos';
        case 'participacion':
            return 'participacion';
        case 'precursor_auxiliar':
        case 'precursor_aux':
            return 'precursor_auxiliar';
        default:
            return null;
    }
}

function resolvePublisherDetailMetric(sourceId, current = 'horas') {
    const mapped = detailMetricFromDrillSource(sourceId);
    if (mapped && DETAIL_METRIC_IDS.has(mapped)) return mapped;
    return DETAIL_METRIC_IDS.has(current) ? current : 'horas';
}

function monthlyCriteriaFromChart(metricId) {
    switch (metricId) {
        case 'inactivos': return { perfil_inactivo: true };
        case 'participacion': return { participacion: 'yes' };
        case 'publicadores_con_cursos': return { cursos: 'with' };
        case 'publicadores_sin_cursos': return { cursos: 'without' };
        case 'precursor_auxiliar': return { precursor_auxiliar: 'yes' };
        case 'cursos': return { cursos: 'with' };
        default: return null;
    }
}

function formatMonthlyCriteriaLabel(criteria, mes) {
    if (!criteria) return '';
    const parts = [];
    const mesNombre = mes ? mesLabel(mes, 'completo') : 'el año';
    const inMes = mes ? ` en ${mesNombre}` : ' en el año';

    if (criteria.participacion === 'no') parts.push(`Sin participación${inMes}`);
    else if (criteria.participacion === 'yes') parts.push(`Con participación${inMes}`);

    if (criteria.cursos === 'with') parts.push(`Con cursos${inMes}`);
    else if (criteria.cursos === 'without') parts.push(`Sin cursos${inMes}`);

    if (criteria.precursor_auxiliar === 'yes') parts.push(`Precursor auxiliar${inMes}`);
    else if (criteria.precursor_auxiliar === 'no') parts.push(`Sin precursor auxiliar${inMes}`);

    if (criteria.perfil_inactivo) parts.push('Perfil inactivos');

    return parts.join(' · ');
}

function monthlyDrillToChips(drill) {
    if (!drill) return [];
    const chips = [];

    const source = drill.source
        || (/^gráfico/i.test(drill.sourceLabel || '') ? 'grafico'
            : /^tabla/i.test(drill.sourceLabel || '') ? 'tabla' : null);
    if (source === 'grafico') {
        chips.push({ kind: 'source', label: 'Gráfico', title: drill.sourceLabel || 'Desde gráfico' });
    } else if (source === 'tabla') {
        chips.push({ kind: 'source', label: 'Tabla', title: drill.sourceLabel || 'Desde tabla' });
    }

    if (drill.groupLabel) {
        chips.push({ kind: 'context', label: drill.groupLabel, title: drill.groupLabel });
    }

    if (drill.mes) {
        const nombreMes = mesLabel(drill.mes, 'completo');
        chips.push({
            kind: 'mes',
            label: nombreMes,
            title: `Mes: ${nombreMes}`,
        });
    } else if (drill.criteria && Object.keys(drill.criteria).length) {
        chips.push({ kind: 'scope', label: 'Todo el año', title: 'Evalúa todos los meses del año de servicio' });
    }

    const criteria = drill.criteria;
    if (criteria) {
        if (criteria.participacion === 'no') {
            chips.push({ kind: 'metric', label: 'Sin participación', title: 'Sin informe con participación' });
        } else if (criteria.participacion === 'yes') {
            chips.push({ kind: 'metric', label: 'Con participación', title: 'Informó participación' });
        }
        if (criteria.cursos === 'with') {
            chips.push({ kind: 'metric', label: 'Con cursos', title: 'Al menos un curso bíblico' });
        } else if (criteria.cursos === 'without') {
            chips.push({ kind: 'metric', label: 'Sin cursos', title: 'Sin cursos bíblicos' });
        }
        if (criteria.precursor_auxiliar === 'yes') {
            chips.push({ kind: 'metric', label: 'Precursor aux.', title: 'Mes como precursor auxiliar' });
        } else if (criteria.precursor_auxiliar === 'no') {
            chips.push({ kind: 'metric', label: 'Sin prec. aux.', title: 'No fue precursor auxiliar' });
        }
    } else if (drill.mes) {
        chips.push({ kind: 'metric', label: 'Registros del mes', title: 'Publicadores con actividad en ese mes' });
    }

    return chips;
}

function formatMonthlyDrillLabel(drill) {
    if (!drill) return '';
    const parts = [];
    if (drill.sourceLabel) parts.push(drill.sourceLabel);
    const criteriaLabel = formatMonthlyCriteriaLabel(drill.criteria, drill.mes);
    if (criteriaLabel) parts.push(criteriaLabel);
    else if (drill.mes) parts.push(`Mes: ${mesLabel(drill.mes, 'completo')}`);
    return parts.join(' · ');
}

function parsePersonKey(key) {
    const idx = String(key).indexOf('::');
    if (idx < 0) return { origen: '', nombre: key };
    return { origen: key.slice(0, idx), nombre: key.slice(idx + 2) };
}

function sumPublisherMonthly(monthly) {
    return monthly.reduce((acc, row) => {
        acc.horas += row.horas || 0;
        acc.cursos += row.cursos || 0;
        acc.participacion += row.participacion ? 1 : 0;
        acc.precursor_auxiliar += row.precursor_auxiliar ? 1 : 0;
        return acc;
    }, { horas: 0, cursos: 0, participacion: 0, precursor_auxiliar: 0 });
}

function getPublisherMonthlyRows(mensual, key) {
    return S21_MESES.map(mes => {
        const row = mensual.find(r => personKey(r) === key && r.mes === mes);
        return row || {
            mes,
            mes_label: mesLabel(mes, 'completo'),
            mes_corto: mesLabel(mes, 'corto'),
            horas: 0,
            cursos: 0,
            participacion: 0,
            precursor_auxiliar: 0,
            notas: '',
        };
    });
}

function sortPublishers(rows) {
    return [...rows].sort((a, b) => {
        const byName = String(a.nombre).localeCompare(String(b.nombre), 'es');
        if (byName !== 0) return byName;
        return String(a.origen).localeCompare(String(b.origen), 'es');
    });
}

function publishersToCsv(rows, formatPerfil = v => v) {
    const headers = [
        'Nombre', 'Perfil', 'Fecha nacimiento', 'Fecha bautismo', 'Sexo', 'Esperanza',
        'Anciano', 'Siervo ministerial', 'Precursor regular', 'Precursor especial', 'Misionero',
        'Horas', 'Cursos', 'Participación', 'Prec. aux.',
    ];
    const lines = [headers.join(',')];
    for (const row of rows) {
        lines.push([
            csvEscape(row.nombre),
            csvEscape(formatPerfil(row.origen)),
            csvEscape(row.fecha_nacimiento || ''),
            csvEscape(row.fecha_bautismo || ''),
            csvEscape(row.sexo),
            csvEscape(row.esperanza),
            csvEscape(row.anciano),
            csvEscape(row.siervo_ministerial),
            csvEscape(row.precursor_regular),
            csvEscape(row.precursor_especial),
            csvEscape(row.misionero),
            row.total_horas,
            row.total_cursos,
            row.meses_participacion,
            row.meses_precursor_aux,
        ].join(','));
    }
    return '\ufeff' + lines.join('\n');
}

function csvEscape(val) {
    const s = String(val ?? '');
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

function packageServiceYear(pkg) {
    const as = pkg?.año_servicio;
    if (as?.valor != null && !Number.isNaN(Number(as.valor))) {
        return Number(as.valor);
    }
    for (const reg of pkg?.registros || []) {
        const meta = reg.metadata?.año_servicio;
        if (meta == null) continue;
        const v = typeof meta === 'object' ? meta.valor : meta;
        if (v != null && !Number.isNaN(Number(v))) return Number(v);
    }
    return null;
}

function analyzePackageYears(packages) {
    const byYear = new Map();
    let sinAnio = 0;
    for (const pkg of packages) {
        const y = packageServiceYear(pkg);
        if (y == null) {
            sinAnio += 1;
            continue;
        }
        if (!byYear.has(y)) byYear.set(y, []);
        byYear.get(y).push(pkg);
    }
    return {
        years: [...byYear.keys()].sort((a, b) => b - a),
        sinAnio,
        byYear,
    };
}

function analyzeSourceYears(sources) {
    const byYear = new Map();
    let sinAnio = 0;
    for (const src of sources) {
        const as = src.año_servicio;
        const y = as?.valor != null ? Number(as.valor) : null;
        if (y == null || Number.isNaN(y)) {
            sinAnio += 1;
            continue;
        }
        if (!byYear.has(y)) byYear.set(y, []);
        byYear.get(y).push(src);
    }
    return {
        years: [...byYear.keys()].sort((a, b) => b - a),
        sinAnio,
        byYear,
    };
}

function filterPackagesByYear(packages, year) {
    if (year == null) return packages;
    return packages.filter(p => packageServiceYear(p) === year);
}

function añoServicioVigente(fecha = new Date()) {
    return fecha.getMonth() >= 8 ? fecha.getFullYear() + 1 : fecha.getFullYear();
}

function periodoServicioTexto(anio) {
    return `sept ${anio - 1} – ago ${anio}`;
}

window.S21DashboardData = {
    S21_MESES,
    S21_MESES_MAP,
    S21_MESES_LABEL,
    mesLabel,
    S21_GROUP_FIELDS,
    S21_CHART_METRICS,
    parseJsonPackage,
    isPerfilInactivo,
    filterMensualByScope,
    filterRowsByOrigenes,
    publicadoresEnMensual,
    totalsMetricColumns,
    TOTALS_METRIC_COLUMNS,
    packageServiceYear,
    analyzePackageYears,
    analyzeSourceYears,
    filterPackagesByYear,
    añoServicioVigente,
    periodoServicioTexto,
    detectCongregacion,
    suggestPerfilAlias,
    flattenPackages,
    uniqueValues,
    applyFilters,
    aggregateRows,
    aggregateMonthlyTrend,
    chartMetricValue,
    chartMetricLabel,
    sortRowsForBarChart,
    computeKpis,
    findLastRegisteredMonth,
    aggregatedToCsv,
    personKey,
    applyMonthlyDrillFilter,
    monthlyCriteriaFromTableColumn,
    detailMetricFromDrillSource,
    resolvePublisherDetailMetric,
    monthlyCriteriaFromChart,
    formatMonthlyDrillLabel,
    monthlyDrillToChips,
    parsePersonKey,
    trimMonthlySeries,
    filterMensualByExcludedMonths,
    excludedMonthLabels,
    getPublisherMonthlyRows,
    sumPublisherMonthly,
    sortPublishers,
    publishersToCsv,
};
