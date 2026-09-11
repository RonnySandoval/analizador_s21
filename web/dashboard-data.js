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
    { id: 'grupo', label: 'Grupo' },
    { id: 'sexo', label: 'Sexo' },
    { id: 'esperanza', label: 'Esperanza' },
    { id: 'anciano', label: 'Anciano' },
    { id: 'siervo_ministerial', label: 'Siervo ministerial' },
    { id: 'precursor_regular', label: 'Precursor regular' },
    { id: 'precursor_especial', label: 'Precursor especial' },
    { id: 'misionero', label: 'Misionero' },
    { id: 'mes', label: 'Mes' },
];

/** Campos disponibles en TOTALES (agrupar / subagrupar). */
const S21_TOTALS_GROUP_FIELDS = [
    { id: 'origen', label: 'Perfil' },
    { id: 'grupo', label: 'Grupos' },
    { id: 'sexo', label: 'Sexo' },
    { id: 'esperanza', label: 'Esperanza' },
    { id: 'mes', label: 'Mes' },
];

function groupFieldLabel(fieldId) {
    return S21_TOTALS_GROUP_FIELDS.find(g => g.id === fieldId)?.label
        || S21_GROUP_FIELDS.find(g => g.id === fieldId)?.label
        || fieldId;
}

function sortGroupValues(fieldId, values) {
    const list = [...new Set(values.filter(v => v != null && v !== ''))];
    if (fieldId === 'mes') {
        return list.sort((a, b) => {
            const ia = S21_MESES.indexOf(a);
            const ib = S21_MESES.indexOf(b);
            if (ia >= 0 && ib >= 0) return ia - ib;
            return String(a).localeCompare(String(b), 'es');
        });
    }
    if (fieldId === 'grupo') {
        return list.sort((a, b) => {
            const na = Number(a);
            const nb = Number(b);
            if (!Number.isNaN(na) && !Number.isNaN(nb) && String(a) === String(na) && String(b) === String(nb)) {
                return na - nb;
            }
            return String(a).localeCompare(String(b), 'es', { numeric: true });
        });
    }
    return list.sort((a, b) => String(a).localeCompare(String(b), 'es', { numeric: true }));
}

const S21_CHART_METRICS = [
    { id: 'horas', label: 'Horas', aggregation: 'sum' },
    { id: 'cursos', label: 'Cursos bíblicos', aggregation: 'avg' },
    { id: 'participacion', label: 'Informes con participación', aggregation: 'avg' },
    { id: 'precursor_auxiliar', label: 'Meses precursor auxiliar', aggregation: 'avg' },
    { id: 'publicadores_con_cursos', label: 'Publicadores con cursos', aggregation: 'count' },
    { id: 'publicadores_sin_cursos', label: 'Publicadores sin cursos', aggregation: 'count' },
    { id: 'inactivos', label: 'Inactivos e irregulares (S-21)', aggregation: 'count' },
];

function isPerfilInactivo(origen) {
    return /\binactiv/i.test(String(origen || ''));
}

const S21_INACTIVE_MONTHS = 6;

function monthHasReport(row) {
    if (!row) return false;
    return !!row.participacion || Number(row.horas) > 0;
}

function elapsedMonthsThrough(refMes) {
    const idx = S21_MESES.indexOf(refMes);
    if (idx < 0) return [];
    return S21_MESES.slice(0, idx + 1);
}

function indexMensualByPerson(mensual) {
    const map = new Map();
    (mensual || []).forEach(row => {
        if (!row?.nombre) return;
        const pk = personIdentityKey(row);
        if (!map.has(pk)) map.set(pk, new Map());
        const monthMap = map.get(pk);
        const existing = monthMap.get(row.mes);
        if (!existing || (monthHasReport(row) && !monthHasReport(existing))) {
            monthMap.set(row.mes, row);
        }
    });
    return map;
}

function monthSpanLabel(meses) {
    if (!meses?.length) return '';
    if (meses.length === 1) return mesLabel(meses[0], 'completo');
    return `${mesLabel(meses[0], 'corto')}–${mesLabel(meses[meses.length - 1], 'corto')}`;
}

function classifyPublisherActivity(pub, mensualByPerson, refMes) {
    const pk = personIdentityKey(pub);
    const byMes = mensualByPerson instanceof Map && mensualByPerson.get(pk) instanceof Map
        ? mensualByPerson.get(pk)
        : (mensualByPerson instanceof Map ? mensualByPerson.get(pk) : null);
    const monthMap = byMes instanceof Map ? byMes : new Map();
    const elapsed = elapsedMonthsThrough(refMes);
    const window = elapsed.slice(-S21_INACTIVE_MONTHS);
    const missedFromEnd = [];
    for (let i = elapsed.length - 1; i >= 0; i--) {
        if (monthHasReport(monthMap.get(elapsed[i]))) break;
        missedFromEnd.push(elapsed[i]);
    }
    missedFromEnd.reverse();
    const streak = missedFromEnd.length;
    const missedInWindow = window.filter(mes => !monthHasReport(monthMap.get(mes)));
    const reportedInWindow = window.filter(mes => monthHasReport(monthMap.get(mes)));
    const lastReportMes = [...elapsed].reverse().find(mes => monthHasReport(monthMap.get(mes))) || null;
    const inFolder = isPerfilInactivo(pub?.origen);
    let status = 'ok';
    if (streak >= S21_INACTIVE_MONTHS) status = 'inactivo';
    else if (missedInWindow.length > 0) status = 'irregular';

    let reason;
    if (status === 'inactivo') {
        reason = `${streak} meses seguidos sin participación (${monthSpanLabel(missedFromEnd)}). Regla S-21: 6 meses seguidos = inactivo.`;
    } else if (status === 'irregular') {
        if (streak > 0) {
            const n = `${streak} mes${streak === 1 ? '' : 'es'} seguido${streak === 1 ? '' : 's'}`;
            reason = `${n} sin participación (${monthSpanLabel(missedFromEnd)}). Aún no llega a 6 (S-21).`;
        } else {
            reason = `Sin participación en ${missedInWindow.length} de los últimos ${window.length} meses (${monthSpanLabel(missedInWindow)}). Último informe: ${lastReportMes ? mesLabel(lastReportMes, 'completo') : '—'}.`;
        }
    } else if (lastReportMes) {
        reason = `Informó en ${mesLabel(lastReportMes, 'completo')}. No cumple la regla de 6 meses.`;
    } else if (!elapsed.length) {
        reason = 'No hay un mes de referencia para aplicar la regla S-21.';
    } else {
        reason = 'No hay informes en el periodo visible.';
    }
    if (inFolder) {
        reason += status === 'ok'
            ? ' Está en el perfil Inactivos, pero la regla S-21 no lo marca inactivo.'
            : ' También está en el perfil Inactivos.';
    }

    let reasonShort;
    if (status === 'inactivo') {
        reasonShort = `${streak} meses seguidos`;
    } else if (status === 'irregular' && streak > 0) {
        reasonShort = `${streak} mes${streak === 1 ? '' : 'es'} seguido${streak === 1 ? '' : 's'}`;
    } else if (status === 'irregular') {
        reasonShort = `${missedInWindow.length} mes${missedInWindow.length === 1 ? '' : 'es'} sin informe`;
    } else if (lastReportMes) {
        reasonShort = `Informó en ${mesLabel(lastReportMes, 'corto')}`;
    } else {
        reasonShort = 'Sin informe';
    }
    if (inFolder && status === 'ok') reasonShort = 'Carpeta, sí informó';

    return {
        status,
        inMetric: status === 'inactivo' || status === 'irregular',
        inFolder,
        streak,
        lastReportMes,
        missedInWindow,
        reasonShort,
        reason,
        refMes,
    };
}

function foldText(value) {
    return String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
}

function isBlankDate(value) {
    const s = String(value ?? '').trim();
    return !s || s === '—' || s === '-' || /^n\/?a$/i.test(s);
}

function origenCompatible(a, b) {
    const x = foldText(a);
    const y = foldText(b);
    if (!x || !y) return !x && !y;
    if (x === y) return true;
    return x.includes(y) || y.includes(x);
}

function namesLikelySame(a, b) {
    const x = foldText(a);
    const y = foldText(b);
    if (!x || !y) return false;
    if (x === y) return true;
    const shorter = x.length <= y.length ? x : y;
    const longer = x.length <= y.length ? y : x;
    if (shorter.length < 12) return false;
    return longer.startsWith(shorter);
}

function publisherScore(p) {
    return (Number(p?.total_horas) || 0)
        + (Number(p?.total_cursos) || 0)
        + (Number(p?.meses_participacion) || 0);
}

function publishersAreDuplicate(a, b) {
    if (!a || !b) return false;
    if (personIdentityKey(a) === personIdentityKey(b)) return true;
    if (foldText(a.nombre) === foldText(b.nombre) && origenCompatible(a.origen, b.origen)) return true;
    const dateA = String(a.fecha_nacimiento || '').trim();
    const dateB = String(b.fecha_nacimiento || '').trim();
    if (!isBlankDate(dateA) && dateA === dateB && namesLikelySame(a.nombre, b.nombre)) return true;
    return false;
}

function uniquePublishers(rows) {
    const map = new Map();
    (rows || []).forEach(p => {
        const pk = personIdentityKey(p);
        const prev = map.get(pk);
        if (!prev || publisherScore(p) >= publisherScore(prev)) map.set(pk, p);
    });
    const kept = [];
    for (const p of map.values()) {
        const idx = kept.findIndex(k => publishersAreDuplicate(k, p));
        if (idx < 0) kept.push(p);
        else if (publisherScore(p) >= publisherScore(kept[idx])) kept[idx] = p;
    }
    return kept;
}

function uniqueMensualRows(rows) {
    const map = new Map();
    (rows || []).forEach(row => {
        const key = `${personIdentityKey(row)}::${row.mes || ''}`;
        const prev = map.get(key);
        if (!prev) {
            map.set(key, row);
            return;
        }
        const prevYear = Number(prev.año_servicio) || 0;
        const nextYear = Number(row.año_servicio) || 0;
        if (nextYear !== prevYear) {
            map.set(key, nextYear >= prevYear ? row : prev);
            return;
        }
        map.set(key, row);
    });
    const list = [...map.values()];
    const kept = [];
    for (const row of list) {
        const idx = kept.findIndex(k => k.mes === row.mes && publishersAreDuplicate(k, row));
        if (idx < 0) kept.push(row);
        else {
            const prev = kept[idx];
            const prevYear = Number(prev.año_servicio) || 0;
            const nextYear = Number(row.año_servicio) || 0;
            kept[idx] = nextYear >= prevYear ? row : prev;
        }
    }
    return kept;
}

function classifyPublishersActivity(publicadores, mensual, refMes) {
    const byPerson = indexMensualByPerson(mensual);
    return uniquePublishers(publicadores).map(pub => ({
        pub,
        ...classifyPublisherActivity(pub, byPerson, refMes),
    }));
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

            const year = meta.año_servicio ?? pkg.año_servicio?.valor ?? pkg.año_servicio ?? null;

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
                año_servicio: year == null || Number.isNaN(Number(year)) ? null : Number(year),
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

    return {
        mensual: uniqueMensualRows(mensual),
        publicadores: uniquePublishers(publicadores),
        packages,
    };
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

function normalizeMonthTrim(opts) {
    if (opts && typeof opts === 'object') {
        return {
            n: Math.max(0, Math.min(Number(opts.n) || 0, S21_MESES.length)),
            side: opts.side === 'first' ? 'first' : 'last',
            mode: opts.mode === 'keep' ? 'keep' : 'omit',
        };
    }
    return {
        n: Math.max(0, Math.min(Number(opts) || 0, S21_MESES.length)),
        side: 'last',
        mode: 'omit',
    };
}

function monthTrimSet(opts) {
    const { n, side } = normalizeMonthTrim(opts);
    if (!n) return new Set();
    const months = side === 'first' ? S21_MESES.slice(0, n) : S21_MESES.slice(-n);
    return new Set(months);
}

function trimMonthlySeries(series, opts) {
    const list = series || [];
    const { n, side, mode } = normalizeMonthTrim(opts);
    const count = Math.max(0, Math.min(n, list.length));
    if (!count) return list;
    if (side === 'first') {
        return mode === 'keep' ? list.slice(0, count) : list.slice(count);
    }
    return mode === 'keep' ? list.slice(list.length - count) : list.slice(0, list.length - count);
}

function filterMensualByExcludedMonths(rows, opts) {
    const trim = normalizeMonthTrim(opts);
    if (!trim.n) return rows || [];
    const set = monthTrimSet(trim);
    if (trim.mode === 'keep') return (rows || []).filter(r => set.has(r.mes));
    return (rows || []).filter(r => !set.has(r.mes));
}

function excludedMonthLabels(opts) {
    return [...monthTrimSet(opts)].map(m => mesLabel(m, 'corto'));
}

function monthTrimHint(opts) {
    const labels = excludedMonthLabels(opts);
    if (!labels.length) return '';
    const { mode } = normalizeMonthTrim(opts);
    const list = labels.join(', ');
    return mode === 'keep' ? `solo ${list}` : `sin ${list}`;
}

function monthRangeBounds(fromMes, toMes) {
    let from = S21_MESES.indexOf(fromMes);
    let to = S21_MESES.indexOf(toMes);
    if (from < 0) from = 0;
    if (to < 0) to = S21_MESES.length - 1;
    if (from > to) {
        const tmp = from;
        from = to;
        to = tmp;
    }
    return { from, to };
}

function isFullServiceYearRange(fromMes, toMes) {
    const { from, to } = monthRangeBounds(fromMes, toMes);
    return from === 0 && to === S21_MESES.length - 1;
}

function filterMensualByMonthRange(rows, fromMes, toMes) {
    if (!rows?.length) return rows || [];
    if (isFullServiceYearRange(fromMes, toMes)) return rows;
    const { from, to } = monthRangeBounds(fromMes, toMes);
    const allowed = new Set(S21_MESES.slice(from, to + 1));
    return rows.filter(r => allowed.has(r.mes));
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
        _inactivosRegla: new Set(),
        _conCursos: new Set(),
        _sinCursos: new Set(),
    };
}

function aggregateRows(mensualRows, groupFields, publicadoresRows = []) {
    const fields = groupFields.filter(Boolean);
    const includesMes = fields.includes('mes');
    const groups = new Map();
    const byPerson = indexMensualByPerson(mensualRows);
    const refMesYear = findLastRegisteredMonth(mensualRows);

    function getGroup(row) {
        const parts = fields.map(f => row[f] ?? '—');
        const key = parts.join('\0') || '(total)';
        if (!groups.has(key)) groups.set(key, makeGroup(parts, fields));
        return groups.get(key);
    }

    function markActivity(g, pubLike, refMes) {
        if (!pubLike?.nombre || !refMes) return;
        const cls = classifyPublisherActivity(pubLike, byPerson, refMes);
        if (cls.inMetric) g._inactivosRegla.add(personKey(pubLike));
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
                markActivity(g, row, row.mes);
                if (row.cursos > 0) g._conCursos.add(pk);
                else g._sinCursos.add(pk);
            }
        }
    }

    if (!includesMes) {
        for (const row of publicadoresRows) {
            const g = getGroup(row);
            if (row.nombre) {
                const pk = personKey(row);
                g._people.add(pk);
                markActivity(g, row, refMesYear);
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
        inactivos: g._inactivosRegla.size,
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
        }
        if (metricId === 'inactivos') {
            const lastMes = findLastRegisteredMonth(rows);
            const lastIdx = lastMes ? S21_MESES.indexOf(lastMes) : -1;
            const byPerson = indexMensualByPerson(rows);
            const pubs = [];
            const seen = new Set();
            rows.forEach(row => {
                if (!row.nombre) return;
                const pk = personKey(row);
                if (seen.has(pk)) return;
                seen.add(pk);
                pubs.push(row);
            });
            return S21_MESES.map((m, idx) => {
                const slot = byMes.get(m);
                let value = 0;
                if (lastIdx >= 0 && idx <= lastIdx) {
                    pubs.forEach(pub => {
                        if (classifyPublisherActivity(pub, byPerson, m).inMetric) value += 1;
                    });
                }
                return { mes: m, mes_label: slot.mes_label, value };
            });
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
            if (row.nombre) byMes.get(row.mes)?.add(personIdentityKey(row));
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
        const lastMes = findLastCompleteMonth(mensual);
        const lastIdx = lastMes ? S21_MESES.indexOf(lastMes) : -1;
        const byPerson = indexMensualByPerson(mensual);
        const pubs = [];
        const seen = new Set();
        for (const row of mensual) {
            if (!row.nombre) continue;
            const pk = personIdentityKey(row);
            if (seen.has(pk)) continue;
            seen.add(pk);
            pubs.push(row);
        }
        return S21_MESES.map((m, idx) => {
            let value = 0;
            if (lastIdx >= 0 && idx <= lastIdx) {
                pubs.forEach(pub => {
                    if (classifyPublisherActivity(pub, byPerson, m).inMetric) value += 1;
                });
            }
            return { mes: m, mes_label: mesLabel(m, 'corto'), value };
        });
    }
    if (metricKey === 'con_cursos') {
        const byMes = new Map(S21_MESES.map(m => [m, new Set()]));
        for (const row of mensual) {
            if (row.nombre && row.cursos > 0) byMes.get(row.mes)?.add(personIdentityKey(row));
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

function monthReportCounts(mensual) {
    const byMes = new Map(S21_MESES.map(m => [m, new Set()]));
    for (const row of mensual || []) {
        if (!row?.nombre || !monthHasReport(row)) continue;
        byMes.get(row.mes)?.add(personIdentityKey(row));
    }
    return S21_MESES.map(mes => ({ mes, score: byMes.get(mes).size }));
}

/** Último mes con al menos un informe (el «hoy» del dashboard, aunque el mes aún esté incompleto). */
function findLastRegisteredMonth(mensual) {
    const scored = monthReportCounts(mensual);
    for (let i = scored.length - 1; i >= 0; i--) {
        if (scored[i].score > 0) return scored[i].mes;
    }
    return null;
}

/** Último mes con volumen real de informes; ignora un mes nuevo casi vacío al aplicar la regla S-21. */
function findLastCompleteMonth(mensual) {
    const scored = monthReportCounts(mensual);
    const peak = Math.max(0, ...scored.map(s => s.score));
    if (!peak) return null;
    const threshold = Math.max(1, Math.ceil(peak * 0.2));
    for (let i = scored.length - 1; i >= 0; i--) {
        if (scored[i].score >= threshold) return scored[i].mes;
    }
    return findLastRegisteredMonth(mensual);
}

function trimSeriesToLastRegistered(series, mensual) {
    const lastMes = findLastCompleteMonth(mensual);
    const lastIdx = lastMes ? S21_MESES.indexOf(lastMes) : -1;
    if (lastIdx < 0) return series;
    return series.filter(slot => S21_MESES.indexOf(slot.mes) <= lastIdx);
}

function kpiMetric(mensual, publicadores, metricKey, lastMes = null) {
    const full = monthlySeriesForKpi(mensual, metricKey);
    const series = trimSeriesToLastRegistered(full, mensual);
    const { max, maxMes, avg } = statsFromMonthlySeries(series);
    let last = 0;
    if (lastMes) {
        last = (full.find(s => s.mes === lastMes) || series.find(s => s.mes === lastMes))?.value ?? 0;
    }
    let total;
    switch (metricKey) {
        case 'publicadores':
            total = uniquePublishers(publicadores).length;
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
        case 'inactivos': {
            const ref = lastMes || findLastCompleteMonth(mensual);
            total = classifyPublishersActivity(publicadores, mensual, ref)
                .filter(item => item.inMetric).length;
            break;
        }
        case 'con_cursos':
            total = uniquePublishers(publicadores).filter(p => (p.total_cursos || 0) > 0).length;
            break;
        default:
            total = 0;
    }
    return { total, max, maxMes, avg, last };
}

function computeKpis(mensual, publicadores) {
    const keys = ['publicadores', 'horas', 'cursos', 'con_cursos', 'participacion', 'precursor_aux', 'inactivos'];
    const lastRegisteredMonth = findLastRegisteredMonth(mensual);
    const lastCompleteMonth = findLastCompleteMonth(mensual);
    const metrics = {};
    for (const key of keys) {
        const ref = key === 'inactivos' ? lastCompleteMonth : lastRegisteredMonth;
        metrics[key] = kpiMetric(mensual, publicadores, key, ref);
    }
    return {
        publicadores_total: metrics.publicadores.total,
        lastRegisteredMonth,
        lastCompleteMonth,
        lastRegisteredMonthLabel: lastRegisteredMonth ? mesLabel(lastRegisteredMonth, 'completo') : '—',
        lastRegisteredMonthShort: lastRegisteredMonth ? mesLabel(lastRegisteredMonth, 'corto') : '—',
        lastCompleteMonthLabel: lastCompleteMonth ? mesLabel(lastCompleteMonth, 'completo') : '—',
        lastCompleteMonthShort: lastCompleteMonth ? mesLabel(lastCompleteMonth, 'corto') : '—',
        metrics,
    };
}

const TOTALS_METRIC_COLUMNS = {
    horas: { label: 'Horas', getValue: row => row.horas },
    cursos: { label: 'Cursos', getValue: row => row.cursos },
    participacion: { label: 'Participación', getValue: row => row.participacion },
    precursor_auxiliar: { label: 'Prec. aux.', getValue: row => row.precursor_auxiliar },
    publicadores: { label: 'Publicadores', getValue: row => row.publicadores },
    inactivos: { label: 'Inact./irreg.', getValue: row => row.inactivos },
};

function totalsMetricColumns(scope = 'year', groupFields = []) {
    const fields = (groupFields || []).filter(Boolean);
    const onlyMes = fields.length === 1 && fields[0] === 'mes';
    if (onlyMes || (scope && scope !== 'year')) {
        return ['horas', 'cursos', 'participacion', 'precursor_auxiliar', 'publicadores', 'inactivos'];
    }
    return ['horas', 'publicadores', 'inactivos'];
}

function aggregatedToCsv(rows, groupFields, formatGroupValue = (_f, v) => v, scope = 'year') {
    const metricIds = totalsMetricColumns(scope, groupFields);
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

function personIdentityKey(row) {
    const nom = foldText(row?.nombre);
    const nac = String(row?.fecha_nacimiento || '').trim();
    if (nom && !isBlankDate(nac)) return `id::${nom}::${nac}`;
    const origen = foldText(row?.origen);
    if (nom && origen) return `id::${nom}::${origen}`;
    return personKey(row);
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
        'Nombre', 'Perfil', 'Grupo', 'Fecha nacimiento', 'Fecha bautismo', 'Sexo', 'Esperanza',
        'Anciano', 'Siervo ministerial', 'Precursor regular', 'Precursor especial', 'Misionero',
        'Horas', 'Cursos', 'Participación', 'Prec. aux.',
    ];
    const lines = [headers.join(',')];
    for (const row of rows) {
        lines.push([
            csvEscape(row.nombre),
            csvEscape(formatPerfil(row.origen)),
            csvEscape(row.grupo || '—'),
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
    S21_TOTALS_GROUP_FIELDS,
    groupFieldLabel,
    sortGroupValues,
    S21_CHART_METRICS,
    parseNumero,
    parseJsonPackage,
    isPerfilInactivo,
    S21_INACTIVE_MONTHS,
    classifyPublisherActivity,
    classifyPublishersActivity,
    uniquePublishers,
    foldText,
    origenCompatible,
    indexMensualByPerson,
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
    monthlySeriesForKpi,
    findLastRegisteredMonth,
    findLastCompleteMonth,
    monthHasReport,
    aggregatedToCsv,
    personKey,
    personIdentityKey,
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
    filterMensualByMonthRange,
    isFullServiceYearRange,
    excludedMonthLabels,
    monthTrimHint,
    getPublisherMonthlyRows,
    sumPublisherMonthly,
    sortPublishers,
    publishersToCsv,
};
