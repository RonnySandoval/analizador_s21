/** Actualización de una carga activa con un JSON ya analizado. */
(function (global) {
    function D() {
        return global.S21DashboardData;
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function normName(value) {
        return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
    }

    function normOrigen(value) {
        return String(value || '').trim();
    }

    function boolish(value) {
        if (value === true || value === 1) return true;
        const s = String(value ?? '').trim().toLowerCase();
        return s === 'sí' || s === 'si' || s === 'true' || s === '1' || s === '/yes';
    }

    function num(value) {
        return D().parseNumero ? D().parseNumero(value) : Number(value) || 0;
    }

    function registroOrigen(pkg, reg) {
        return normOrigen(reg?.metadata?.carpeta_origen || pkg?.origen || '');
    }

    function registroYear(pkg, reg) {
        const meta = reg?.metadata?.año_servicio;
        const raw = typeof meta === 'object' ? meta?.valor : meta;
        if (raw != null && !Number.isNaN(Number(raw))) return Number(raw);
        const y = D().packageServiceYear?.(pkg);
        return y == null ? null : Number(y);
    }

    function registroNombre(reg) {
        return String(reg?.identificacion?.nombre || '').trim() || '—';
    }

    function personId(pkg, reg) {
        return `${registroOrigen(pkg, reg)}::${normName(reg?.identificacion?.nombre)}`;
    }

    function cardId(pkg, reg) {
        return `${personId(pkg, reg)}::${registroYear(pkg, reg) ?? ''}`;
    }

    function packageKey(pkg) {
        return `${normOrigen(pkg?.origen)}::${D().packageServiceYear?.(pkg) ?? ''}`;
    }

    function monthSnapshot(cell) {
        const horas = num(cell?.horas);
        const cursos = num(cell?.cursos_biblicos);
        const participacion = boolish(cell?.participacion);
        const precursor_auxiliar = boolish(cell?.precursor_auxiliar);
        const notas = String(cell?.comentarios ?? cell?.notas ?? '').trim();
        const empty = !horas && !cursos && !participacion && !precursor_auxiliar && !notas;
        return { horas, cursos, participacion, precursor_auxiliar, notas, empty };
    }

    function snapshotEqual(a, b) {
        return a.horas === b.horas
            && a.cursos === b.cursos
            && a.participacion === b.participacion
            && a.precursor_auxiliar === b.precursor_auxiliar
            && a.notas === b.notas;
    }

    const PERSONAL_FIELDS = [
        { id: 'fecha_nacimiento', label: 'Nacimiento' },
        { id: 'fecha_bautismo', label: 'Bautismo' },
        { id: 'sexo', label: 'Sexo' },
        { id: 'esperanza', label: 'Esperanza' },
    ];

    const PRIVILEGE_FIELDS = [
        { id: 'anciano', label: 'Anciano' },
        { id: 'siervo_ministerial', label: 'Siervo ministerial' },
        { id: 'precursor_regular', label: 'Precursor regular' },
        { id: 'precursor_especial', label: 'Precursor especial' },
        { id: 'misionero', label: 'Misionero' },
    ];

    const MONTH_FIELDS = [
        { id: 'horas', label: 'Horas' },
        { id: 'cursos', label: 'Cursos' },
        { id: 'participacion', label: 'Participación' },
        { id: 'precursor_auxiliar', label: 'Prec. aux.' },
        { id: 'notas', label: 'Notas' },
    ];

    function formatCell(fieldId, value) {
        if (fieldId === 'participacion' || fieldId === 'precursor_auxiliar') {
            return value ? 'Sí' : 'No';
        }
        if (value === true) return 'Sí';
        if (value === false) return 'No';
        if (value == null || value === '') return '—';
        return String(value);
    }

    function emptyDiff() {
        return {
            addedPublishers: [],
            removedPublishers: [],
            removedCards: [],
            newYearCards: [],
            monthsFilled: [],
            monthsCleared: [],
            cellChanges: [],
            personalChanges: [],
            privilegeChanges: [],
        };
    }

    function indexCurrent(packages) {
        const byCard = new Map();
        const byPerson = new Map();
        const scopes = new Set();
        (packages || []).forEach((pkg, pkgIndex) => {
            (pkg.registros || []).forEach((reg, regIndex) => {
                const loc = { pkg, reg, pkgIndex, regIndex };
                byCard.set(cardId(pkg, reg), loc);
                const pid = personId(pkg, reg);
                if (!byPerson.has(pid)) byPerson.set(pid, []);
                byPerson.get(pid).push(loc);
                scopes.add(`${registroOrigen(pkg, reg)}::${registroYear(pkg, reg) ?? ''}`);
            });
        });
        return { byCard, byPerson, scopes };
    }

    function compareIdentity(oldReg, newReg, nombre, origen) {
        const personal = [];
        const privileges = [];
        const oldId = oldReg.identificacion || {};
        const newId = newReg.identificacion || {};
        if (String(oldId.nombre || '').trim() !== String(newId.nombre || '').trim()) {
            personal.push({
                nombre, origen, field: 'Nombre',
                from: oldId.nombre || '—', to: newId.nombre || '—',
            });
        }
        PERSONAL_FIELDS.forEach(f => {
            const from = String(oldId[f.id] ?? '').trim();
            const to = String(newId[f.id] ?? '').trim();
            if (from !== to) {
                personal.push({ nombre, origen, field: f.label, from: from || '—', to: to || '—' });
            }
        });
        const oldPriv = oldReg.privilegios || {};
        const newPriv = newReg.privilegios || {};
        PRIVILEGE_FIELDS.forEach(f => {
            const from = boolish(oldPriv[f.id]);
            const to = boolish(newPriv[f.id]);
            if (from !== to) {
                privileges.push({
                    nombre, origen, field: f.label,
                    from: from ? 'Sí' : 'No', to: to ? 'Sí' : 'No',
                });
            }
        });
        return { personal, privileges };
    }

    function compareMonths(oldReg, newReg, nombre, origen, year) {
        const filled = [];
        const cleared = [];
        const cells = [];
        const months = D().S21_MESES || [];
        const oldMap = oldReg.registro || {};
        const newMap = newReg.registro || {};
        months.forEach(mes => {
            const a = monthSnapshot(oldMap[mes]);
            const b = monthSnapshot(newMap[mes]);
            if (snapshotEqual(a, b)) return;
            const mesLabel = D().mesLabel?.(mes, 'completo') || mes;
            if (a.empty && !b.empty) {
                filled.push({ nombre, origen, mes, mesLabel, year });
                return;
            }
            if (!a.empty && b.empty) {
                cleared.push({ nombre, origen, mes, mesLabel, year });
                return;
            }
            MONTH_FIELDS.forEach(f => {
                if (a[f.id] === b[f.id]) return;
                const fromEmpty = f.id === 'notas' ? !a.notas : (f.id === 'horas' || f.id === 'cursos' ? !a[f.id] : !a[f.id]);
                const toEmpty = f.id === 'notas' ? !b.notas : (f.id === 'horas' || f.id === 'cursos' ? !b[f.id] : !b[f.id]);
                cells.push({
                    nombre,
                    origen,
                    mes,
                    mesLabel,
                    year,
                    field: f.label,
                    from: formatCell(f.id, a[f.id]),
                    to: formatCell(f.id, b[f.id]),
                    cleared: !fromEmpty && toEmpty,
                    kind: !fromEmpty && toEmpty ? 'cleared' : (!toEmpty && fromEmpty ? 'filled' : 'changed'),
                });
            });
        });
        return { filled, cleared, cells };
    }

    function diffPackagesForUpdate(currentPackages, incomingPackages) {
        const diff = emptyDiff();
        const current = indexCurrent(currentPackages);
        const incomingIdsByScope = new Map();
        const incomingPersonIds = new Set();

        (incomingPackages || []).forEach(pkg => {
            (pkg.registros || []).forEach(reg => {
                const pid = personId(pkg, reg);
                const cid = cardId(pkg, reg);
                const year = registroYear(pkg, reg);
                const origen = registroOrigen(pkg, reg);
                const nombre = registroNombre(reg);
                const scope = `${origen}::${year ?? ''}`;
                incomingPersonIds.add(pid);
                if (!incomingIdsByScope.has(scope)) incomingIdsByScope.set(scope, new Set());
                incomingIdsByScope.get(scope).add(pid);

                const sameCard = current.byCard.get(cid);
                if (sameCard) {
                    const idDiff = compareIdentity(sameCard.reg, reg, nombre, origen);
                    diff.personalChanges.push(...idDiff.personal);
                    diff.privilegeChanges.push(...idDiff.privileges);
                    const monthDiff = compareMonths(sameCard.reg, reg, nombre, origen, year);
                    diff.monthsFilled.push(...monthDiff.filled);
                    diff.monthsCleared.push(...monthDiff.cleared);
                    diff.cellChanges.push(...monthDiff.cells);
                    return;
                }

                const previous = current.byPerson.get(pid);
                if (previous?.length) {
                    const fromYear = registroYear(previous[0].pkg, previous[0].reg);
                    diff.newYearCards.push({
                        nombre,
                        origen,
                        year,
                        fromYear: fromYear ?? '—',
                    });
                    return;
                }

                diff.addedPublishers.push({ nombre, origen, year });
            });
        });

        (currentPackages || []).forEach(pkg => {
            (pkg.registros || []).forEach(reg => {
                const year = registroYear(pkg, reg);
                const origen = registroOrigen(pkg, reg);
                const scope = `${origen}::${year ?? ''}`;
                if (!incomingIdsByScope.has(scope)) return;
                const pid = personId(pkg, reg);
                if (incomingIdsByScope.get(scope).has(pid)) return;
                const item = {
                    nombre: registroNombre(reg),
                    origen,
                    year,
                };
                if (incomingPersonIds.has(pid)) {
                    diff.removedCards.push(item);
                } else {
                    const stillElsewhere = (current.byPerson.get(pid) || []).some(loc => {
                        const otherScope = `${registroOrigen(loc.pkg, loc.reg)}::${registroYear(loc.pkg, loc.reg) ?? ''}`;
                        return otherScope !== scope && !incomingIdsByScope.has(otherScope);
                    });
                    if (stillElsewhere) diff.removedCards.push(item);
                    else diff.removedPublishers.push(item);
                }
            });
        });

        diff.hasChanges = [
            'addedPublishers', 'removedPublishers', 'removedCards', 'newYearCards',
            'monthsFilled', 'monthsCleared', 'cellChanges', 'personalChanges', 'privilegeChanges',
        ].some(key => diff[key].length > 0);

        diff.incomingYears = [...new Set((incomingPackages || [])
            .map(p => D().packageServiceYear?.(p))
            .filter(y => y != null))];
        diff.incomingOrigins = [...new Set((incomingPackages || []).map(p => normOrigen(p.origen)).filter(Boolean))];
        return diff;
    }

    function applyPackageUpdate(currentPackages, incomingPackages) {
        const diff = diffPackagesForUpdate(currentPackages, incomingPackages);
        const next = clone(currentPackages || []);
        const destByKey = new Map();
        next.forEach((pkg, i) => destByKey.set(packageKey(pkg), i));

        (incomingPackages || []).forEach(inPkg => {
            const key = packageKey(inPkg);
            let destIndex = destByKey.get(key);
            if (destIndex == null) {
                next.push(clone(inPkg));
                destByKey.set(key, next.length - 1);
                return;
            }
            const dest = next[destIndex];
            const incomingByPerson = new Map();
            (inPkg.registros || []).forEach(reg => {
                incomingByPerson.set(personId(inPkg, reg), clone(reg));
            });
            dest.registros = (dest.registros || []).filter(reg => incomingByPerson.has(personId(dest, reg)));
            const destByPerson = new Map();
            dest.registros.forEach((reg, i) => destByPerson.set(personId(dest, reg), i));
            incomingByPerson.forEach((reg, pid) => {
                const idx = destByPerson.get(pid);
                if (idx == null) {
                    dest.registros.push(reg);
                    destByPerson.set(pid, dest.registros.length - 1);
                } else {
                    dest.registros[idx] = reg;
                }
            });
            dest.cantidad = dest.registros.length;
            if (inPkg.exported_at) dest.exported_at = inPkg.exported_at;
            if (inPkg.año_servicio) dest.año_servicio = clone(inPkg.año_servicio);
            if (inPkg.titulo) dest.titulo = inPkg.titulo;
        });

        return { packages: next, diff };
    }

    function summarizeDiff(diff) {
        const lines = [];
        const add = (n, one, many) => {
            if (!n) return;
            lines.push(n === 1 ? one : `${n} ${many}`);
        };
        add(diff.addedPublishers.length, '1 publicador nuevo', 'publicadores nuevos');
        add(diff.removedPublishers.length, '1 publicador eliminado', 'publicadores eliminados');
        add(diff.removedCards.length, '1 registro/tarjeta eliminado', 'registros/tarjetas eliminados');
        add(diff.newYearCards.length, '1 tarjeta de nuevo año', 'tarjetas de nuevo año');
        add(diff.monthsFilled.length, '1 mes nuevo o actualizado', 'meses nuevos o actualizados');
        add(diff.monthsCleared.length, '1 mes borrado', 'meses borrados');
        const cellCleared = (diff.cellChanges || []).filter(c => c.kind === 'cleared').length;
        const cellChanged = (diff.cellChanges || []).length - cellCleared;
        add(cellChanged, '1 celda cambiada', 'celdas cambiadas');
        add(cellCleared, '1 celda borrada', 'celdas borradas');
        add(diff.privilegeChanges.length, '1 cambio de privilegio', 'cambios de privilegios');
        add(diff.personalChanges.length, '1 cambio de datos personales', 'cambios de datos personales');
        return lines;
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function sortDiffItems(items) {
        const months = D().S21_MESES || [];
        return [...(items || [])].sort((a, b) => {
            const byName = String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es');
            if (byName) return byName;
            const byOrigen = String(a.origen || '').localeCompare(String(b.origen || ''), 'es');
            if (byOrigen) return byOrigen;
            const byYear = String(a.year ?? '').localeCompare(String(b.year ?? ''), 'es');
            if (byYear) return byYear;
            return months.indexOf(a.mes) - months.indexOf(b.mes);
        });
    }

    function personLabel(item) {
        const bits = [item.nombre || '—'];
        if (item.origen) bits.push(item.origen);
        if (item.year != null && item.year !== '') bits.push(String(item.year));
        return bits.join(' · ');
    }

    function groupByPerson(items) {
        const map = new Map();
        sortDiffItems(items).forEach(item => {
            const key = `${item.nombre || ''}\0${item.origen || ''}\0${item.year ?? ''}`;
            if (!map.has(key)) {
                map.set(key, { nombre: item.nombre, origen: item.origen, year: item.year, items: [] });
            }
            map.get(key).items.push(item);
        });
        return [...map.values()];
    }

    const REPORT_LIMIT = 80;

    function reportListHtml(items, lineFn) {
        const extra = items.length > REPORT_LIMIT
            ? `<li class="datos-update-more">… y ${items.length - REPORT_LIMIT} más</li>`
            : '';
        return `<ul class="datos-update-list">${items.slice(0, REPORT_LIMIT).map(item =>
            `<li>${lineFn(item)}</li>`
        ).join('')}${extra}</ul>`;
    }

    function reportSectionHtml(index, title, count, innerHtml) {
        if (!count) return '';
        return `<section class="datos-update-section">
            <h4 class="datos-update-section-title">${index}. ${escapeHtml(title)} (${count})</h4>
            ${innerHtml}
        </section>`;
    }

    function snapshotReport(diff, extra = {}) {
        const at = extra.at || Date.now();
        const payload = { ...extra, at };
        return {
            at,
            hasChanges: !!diff?.hasChanges,
            summary: summarizeDiff(diff),
            text: formatDiffReportText(diff, payload),
            html: renderDiffReportHtml(diff, payload),
        };
    }

    function formatDiffReportText(diff, extra = {}) {
        const when = extra.at
            ? new Date(extra.at).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })
            : new Date().toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
        const lines = [
            'Análisis de Servicio — Informe de actualización',
            `Fecha: ${when}`,
        ];
        if (extra.heading) lines.push(extra.heading);
        lines.push('');
        const summary = summarizeDiff(diff);
        if (!diff?.hasChanges) {
            lines.push('No hay diferencias respecto a la carga activa.');
            return lines.join('\n');
        }
        lines.push('Resumen:');
        summary.forEach(line => lines.push(`• ${line}`));
        lines.push('');

        let index = 0;
        const nextTitle = title => {
            index += 1;
            return `${index}. ${title}`;
        };
        const pushSection = (title, items, lineFn) => {
            if (!items?.length) return;
            lines.push(`${nextTitle(title)} (${items.length})`);
            sortDiffItems(items).slice(0, REPORT_LIMIT).forEach(item => lines.push(`  - ${lineFn(item)}`));
            if (items.length > REPORT_LIMIT) lines.push(`  - … y ${items.length - REPORT_LIMIT} más`);
            lines.push('');
        };

        pushSection('Publicadores nuevos', diff.addedPublishers, personLabel);
        pushSection('Publicadores eliminados', diff.removedPublishers, personLabel);
        pushSection('Registros o tarjetas eliminados', diff.removedCards, personLabel);
        pushSection('Tarjetas de nuevo año', diff.newYearCards, item =>
            `${personLabel(item)} (antes ${item.fromYear ?? '—'})`);

        const monthGroups = [
            ['Meses nuevos o actualizados', diff.monthsFilled],
            ['Meses borrados', diff.monthsCleared],
        ];
        monthGroups.forEach(([title, items]) => {
            if (!items?.length) return;
            lines.push(`${nextTitle(title)} (${items.length})`);
            groupByPerson(items).slice(0, REPORT_LIMIT).forEach(group => {
                lines.push(`  ${personLabel(group)}`);
                group.items.forEach(item => lines.push(`    · ${item.mesLabel || item.mes}`));
            });
            if (groupByPerson(items).length > REPORT_LIMIT) {
                lines.push(`  - … y más`);
            }
            lines.push('');
        });

        if (diff.cellChanges?.length) {
            lines.push(`${nextTitle('Celdas cambiadas o borradas')} (${diff.cellChanges.length})`);
            groupByPerson(diff.cellChanges).slice(0, REPORT_LIMIT).forEach(group => {
                lines.push(`  ${personLabel(group)}`);
                group.items.forEach(item => {
                    const tag = item.kind === 'cleared' ? 'borrada' : (item.kind === 'filled' ? 'nueva' : 'cambiada');
                    lines.push(`    · ${item.mesLabel || item.mes} · ${item.field}: ${item.from} → ${item.to} (${tag})`);
                });
            });
            lines.push('');
        }

        pushSection('Privilegios', diff.privilegeChanges, item =>
            `${personLabel(item)} · ${item.field}: ${item.from} → ${item.to}`);
        pushSection('Datos personales', diff.personalChanges, item =>
            `${personLabel(item)} · ${item.field}: ${item.from} → ${item.to}`);

        return lines.join('\n').trim();
    }

    function renderDiffReportHtml(diff, extra = {}) {
        const when = extra.at
            ? new Date(extra.at).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })
            : new Date().toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
        const warn = extra.errors?.length
            ? `<p class="datos-muted">Avisos: ${escapeHtml(extra.errors.slice(0, 4).join(' · '))}</p>`
            : '';
        const heading = extra.heading
            ? `<p class="datos-update-lead">${escapeHtml(extra.heading)}</p>`
            : '';
        if (!diff?.hasChanges) {
            return `<div class="datos-update-report">
            <p class="datos-muted">Detectado el ${escapeHtml(when)}</p>
            ${warn}${heading}
            <p>No hay diferencias respecto a la carga activa.</p>
        </div>`;
        }
        const summary = summarizeDiff(diff);
        const summaryHtml = `<ol class="datos-update-summary">${summary.map(line =>
            `<li>${escapeHtml(line)}</li>`
        ).join('')}</ol>`;
        const sections = [];
        const addSection = (title, count, innerHtml) => {
            if (!count) return;
            sections.push(reportSectionHtml(sections.length + 1, title, count, innerHtml));
        };
        const personLi = item => escapeHtml(personLabel(item));
        addSection('Publicadores nuevos', diff.addedPublishers.length,
            reportListHtml(sortDiffItems(diff.addedPublishers), personLi));
        addSection('Publicadores eliminados', diff.removedPublishers.length,
            reportListHtml(sortDiffItems(diff.removedPublishers), personLi));
        addSection('Registros o tarjetas eliminados', diff.removedCards.length,
            reportListHtml(sortDiffItems(diff.removedCards), personLi));
        addSection('Tarjetas de nuevo año', diff.newYearCards.length,
            reportListHtml(sortDiffItems(diff.newYearCards), item =>
                `${escapeHtml(personLabel(item))} <span class="datos-muted">(antes ${escapeHtml(String(item.fromYear ?? '—'))})</span>`));
        addSection('Meses nuevos o actualizados', diff.monthsFilled.length,
            groupByPerson(diff.monthsFilled).map(group =>
                `<div class="datos-update-person"><strong>${escapeHtml(personLabel(group))}</strong><ul>${
                    group.items.map(item => `<li>${escapeHtml(item.mesLabel || item.mes)}</li>`).join('')
                }</ul></div>`
            ).join(''));
        addSection('Meses borrados', diff.monthsCleared.length,
            groupByPerson(diff.monthsCleared).map(group =>
                `<div class="datos-update-person"><strong>${escapeHtml(personLabel(group))}</strong><ul>${
                    group.items.map(item => `<li>${escapeHtml(item.mesLabel || item.mes)}</li>`).join('')
                }</ul></div>`
            ).join(''));
        addSection('Celdas cambiadas o borradas', diff.cellChanges.length,
            groupByPerson(diff.cellChanges).map(group =>
                `<div class="datos-update-person"><strong>${escapeHtml(personLabel(group))}</strong><ul>${
                    group.items.map(item => {
                        const tag = item.kind === 'cleared' ? 'borrada' : (item.kind === 'filled' ? 'nueva' : 'cambiada');
                        return `<li>${escapeHtml(item.mesLabel || item.mes)} · ${escapeHtml(item.field)}: ${escapeHtml(item.from)} → ${escapeHtml(item.to)} (${escapeHtml(tag)})</li>`;
                    }).join('')
                }</ul></div>`
            ).join(''));
        addSection('Privilegios', diff.privilegeChanges.length,
            reportListHtml(sortDiffItems(diff.privilegeChanges), item =>
                `${escapeHtml(personLabel(item))} · ${escapeHtml(item.field)}: ${escapeHtml(item.from)} → ${escapeHtml(item.to)}`));
        addSection('Datos personales', diff.personalChanges.length,
            reportListHtml(sortDiffItems(diff.personalChanges), item =>
                `${escapeHtml(personLabel(item))} · ${escapeHtml(item.field)}: ${escapeHtml(item.from)} → ${escapeHtml(item.to)}`));

        return `<div class="datos-update-report">
            <p class="datos-muted">Detectado el ${escapeHtml(when)}</p>
            ${warn}${heading}
            <h4 class="datos-update-section-title">Resumen</h4>
            ${summaryHtml}
            ${sections.join('')}
        </div>`;
    }

    global.S21DashboardUpdate = {
        diffPackagesForUpdate,
        applyPackageUpdate,
        summarizeDiff,
        formatDiffReportText,
        renderDiffReportHtml,
        snapshotReport,
    };
})(window);
