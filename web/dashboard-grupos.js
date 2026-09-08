(function () {
    const GRUPOS_KEY = 'analisis_servicio_grupos';
    const MAX_GROUPS = 30;
    const MIN_GROUPS = 1;

    let config = defaultConfig();
    let assignView = 'group';
    let matrixSearch = '';
    let matrixProfilesExpanded = null;
    let ctx = null;
    let roleComboBlurTimer = null;

    function defaultConfig() {
        return { groupCount: 5, assignments: {}, roles: {} };
    }

    function personKey(row) {
        return `${row.origen || ''}::${row.nombre || ''}`;
    }

    function publisherByKey(key) {
        return getPublishers().find(p => personKey(p) === key) || null;
    }

    function loadConfig() {
        try {
            const raw = JSON.parse(localStorage.getItem(GRUPOS_KEY) || 'null');
            if (!raw || typeof raw !== 'object') return defaultConfig();
            return normalizeConfig({
                groupCount: Number(raw.groupCount) || 5,
                assignments: raw.assignments && typeof raw.assignments === 'object' ? { ...raw.assignments } : {},
                roles: raw.roles && typeof raw.roles === 'object' ? { ...raw.roles } : {},
            });
        } catch {
            return defaultConfig();
        }
    }

    function saveConfig() {
        localStorage.setItem(GRUPOS_KEY, JSON.stringify(config));
    }

    function normalizeConfig(cfg) {
        cfg.groupCount = Math.max(MIN_GROUPS, Math.min(MAX_GROUPS, Math.round(cfg.groupCount) || MIN_GROUPS));
        const cleanedAssignments = {};
        for (const [key, groupNum] of Object.entries(cfg.assignments || {})) {
            const n = Number(groupNum);
            if (n >= 1 && n <= cfg.groupCount) cleanedAssignments[key] = n;
        }
        cfg.assignments = cleanedAssignments;

        const cleanedRoles = {};
        for (let g = 1; g <= cfg.groupCount; g += 1) {
            const id = String(g);
            const role = cfg.roles?.[id] || {};
            const members = new Set(
                Object.entries(cleanedAssignments).filter(([, n]) => n === g).map(([k]) => k)
            );
            const sup = role.superintendent && members.has(role.superintendent) ? role.superintendent : '';
            const aux = role.auxiliary && members.has(role.auxiliary) && role.auxiliary !== sup
                ? role.auxiliary : '';
            if (sup || aux) cleanedRoles[id] = { superintendent: sup, auxiliary: aux };
        }
        cfg.roles = cleanedRoles;
        return cfg;
    }

    function getConfig() {
        return config;
    }

    function setGroupCount(count) {
        config.groupCount = Math.max(MIN_GROUPS, Math.min(MAX_GROUPS, Math.round(count) || MIN_GROUPS));
        config = normalizeConfig(config);
        saveConfig();
        notifyChange();
    }

    function getAssignment(key) {
        return config.assignments[key] || 0;
    }

    function grupoLabel(num) {
        if (!num || num < 1) return '—';
        return `Grupo ${num}`;
    }

    function assignPerson(key, groupNum, options = {}) {
        if (!key) return;
        const n = Number(groupNum);
        if (!n || n < 1 || n > config.groupCount) {
            delete config.assignments[key];
        } else {
            config.assignments[key] = n;
        }
        config = normalizeConfig(config);
        saveConfig();
        const patchMatrix = options.matrixPatch && assignView === 'profile';
        notifyChange(patchMatrix ? { matrixPatch: key } : {});
    }

    function assignMany(keys, groupNum) {
        const n = Number(groupNum);
        if (!n || n < 1 || n > config.groupCount) {
            keys.forEach(k => delete config.assignments[k]);
        } else {
            keys.forEach(k => { if (k) config.assignments[k] = n; });
        }
        config = normalizeConfig(config);
        saveConfig();
        notifyChange();
    }

    function setRole(groupNum, roleType, personKeyVal) {
        const id = String(groupNum);
        if (!config.roles[id]) config.roles[id] = { superintendent: '', auxiliary: '' };

        if (personKeyVal) {
            config.assignments[personKeyVal] = groupNum;
        }

        if (roleType === 'superintendent') {
            config.roles[id].superintendent = personKeyVal || '';
            if (personKeyVal && config.roles[id].auxiliary === personKeyVal) {
                config.roles[id].auxiliary = '';
            }
        } else if (roleType === 'auxiliary') {
            config.roles[id].auxiliary = personKeyVal || '';
            if (personKeyVal && config.roles[id].superintendent === personKeyVal) {
                config.roles[id].superintendent = '';
            }
        }

        config = normalizeConfig(config);
        saveConfig();
        notifyChange();
    }

    function applyToRows(rows) {
        return rows.map(row => ({
            ...row,
            grupo: grupoLabel(getAssignment(personKey(row))),
            grupo_num: getAssignment(personKey(row)),
        }));
    }

    function notifyChange(options = {}) {
        ctx?.onChange?.(options);
        if (options.matrixPatch) {
            updateMatrixAssignment(options.matrixPatch);
            renderSummary();
            return;
        }
        render();
    }

    function captureMatrixScrollState() {
        return [...document.querySelectorAll('.grupos-matrix-scroll')].map(el => ({
            top: el.scrollTop,
            left: el.scrollLeft,
        }));
    }

    function restoreMatrixScrollState(states) {
        if (!states?.length) return;
        requestAnimationFrame(() => {
            const scrollEls = document.querySelectorAll('.grupos-matrix-scroll');
            scrollEls.forEach((el, i) => {
                const s = states[i];
                if (!s) return;
                el.scrollTop = s.top;
                el.scrollLeft = s.left;
            });
        });
    }

    function updateMatrixAssignment(key) {
        const assigned = getAssignment(key);
        let row = null;
        document.querySelectorAll('tr.grupos-matrix-person-row').forEach(r => {
            if (r.dataset.personKey === key) row = r;
        });
        if (!row) return;

        row.querySelectorAll('.grupos-matrix-cell').forEach(cell => {
            const g = Number(cell.dataset.matrixGroup);
            const active = assigned === g;
            cell.classList.toggle('is-active', active);
            cell.textContent = active ? String(g) : '';
            cell.title = active ? 'Quitar de grupo' : `Asignar a grupo ${g}`;
        });

        const pub = publisherByKey(key);
        const nameEl = row.querySelector('.grupos-matrix-name-text');
        if (pub && nameEl) {
            nameEl.innerHTML = `${escapeHtml(pub.nombre)}${roleBadgesHtml(key)}`;
        }
    }

    function getPublishers() {
        return ctx?.getPublishers?.() || [];
    }

    function escapeHtml(s) {
        return ctx?.escapeHtml?.(s) ?? String(s ?? '');
    }

    function escapeAttr(s) {
        return ctx?.escapeAttr?.(s) ?? String(s ?? '');
    }

    function displayPerfil(origen) {
        return ctx?.displayPerfil?.(origen) ?? origen;
    }

    function sortedPublishers() {
        return getPublishers().slice().sort((a, b) =>
            String(a.nombre).localeCompare(String(b.nombre), 'es')
        );
    }

    function sortByName(a, b) {
        return String(a.nombre).localeCompare(String(b.nombre), 'es');
    }

    function roleChipHtml(chip) {
        if (chip === 'sup') return '<span class="grupos-chip grupos-chip--sup">Sup</span>';
        if (chip === 'aux') return '<span class="grupos-chip grupos-chip--aux">Aux</span>';
        return '';
    }

    function roleBadgesHtml(key) {
        const badges = [];
        for (let g = 1; g <= config.groupCount; g += 1) {
            const role = config.roles[String(g)] || {};
            if (role.superintendent === key) badges.push('<span class="grupos-chip grupos-chip--sup">Sup</span>');
            if (role.auxiliary === key) badges.push('<span class="grupos-chip grupos-chip--aux">Aux</span>');
        }
        return badges.length ? ` ${badges.join('')}` : '';
    }

    function splitGroupPublishers(groupNum, allPubs) {
        const role = config.roles[String(groupNum)] || {};
        const inGroup = allPubs.filter(p => getAssignment(personKey(p)) === groupNum);
        const others = allPubs.filter(p => getAssignment(personKey(p)) !== groupNum);

        const leaders = [];
        const leaderKeys = new Set();

        for (const entry of [
            { key: role.superintendent, chip: 'sup' },
            { key: role.auxiliary, chip: 'aux' },
        ]) {
            if (!entry.key || leaderKeys.has(entry.key)) continue;
            const pub = publisherByKey(entry.key);
            if (!pub || getAssignment(entry.key) !== groupNum) continue;
            leaders.push({ pub, chip: entry.chip });
            leaderKeys.add(entry.key);
        }

        const members = [
            ...leaders,
            ...inGroup
                .filter(p => !leaderKeys.has(personKey(p)))
                .sort(sortByName)
                .map(pub => ({ pub, chip: null })),
        ];

        return { members, others: others.sort(sortByName) };
    }

    function renderMemberCheck(p, groupNum, checked, chip) {
        const k = personKey(p);
        return `<label class="grupos-member-check">
            <input type="checkbox" data-grupo-check="${groupNum}" data-person-key="${escapeAttr(k)}"${checked ? ' checked' : ''}>
            <span class="grupos-member-check-main">
                <span class="grupos-member-name">${escapeHtml(p.nombre)}</span>
                ${roleChipHtml(chip)}
            </span>
            <span class="grupos-member-profile">${escapeHtml(displayPerfil(p.origen))}</span>
        </label>`;
    }

    function renderSummary() {
        const el = document.getElementById('grupos-summary');
        if (!el) return;
        const pubs = getPublishers();
        const assigned = pubs.filter(p => getAssignment(personKey(p)) > 0).length;
        const unassigned = pubs.length - assigned;
        el.textContent = pubs.length
            ? `${assigned} asignados · ${unassigned} sin grupo · ${config.groupCount} grupos`
            : 'Cargue datos para asignar grupos';
    }

    function renderViewTabs() {
        document.querySelectorAll('[data-grupos-view]').forEach(btn => {
            const active = btn.dataset.gruposView === assignView;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-selected', active ? 'true' : 'false');
        });
    }

    function filterPublishersByQuery(pubs, q) {
        if (!q) return pubs;
        const matchingOrigenes = new Set();
        for (const origen of new Set(pubs.map(p => p.origen))) {
            if (displayPerfil(origen).toLowerCase().includes(q)) matchingOrigenes.add(origen);
        }
        return pubs.filter(p =>
            matchingOrigenes.has(p.origen) ||
            String(p.nombre).toLowerCase().includes(q)
        );
    }

    function roleCombo(groupNum, roleType, selectedKey) {
        const label = roleType === 'superintendent' ? 'Superintendente' : 'Auxiliar';
        const selected = publisherByKey(selectedKey);
        const displayValue = selected ? selected.nombre : '';
        return `<div class="grupos-role-field">
            <span class="grupos-role-label">${label}</span>
            <div class="grupos-role-combo" data-grupo-role="${groupNum}" data-role-type="${roleType}" data-selected-key="${escapeAttr(selectedKey || '')}">
                <input type="text" class="grupos-role-input" value="${escapeAttr(displayValue)}"
                    placeholder="Buscar publicador…" autocomplete="off" spellcheck="false"
                    aria-label="${label} del grupo ${groupNum}">
                <button type="button" class="grupos-role-clear${selectedKey ? '' : ' hidden'}" title="Quitar" aria-label="Quitar ${label.toLowerCase()}">×</button>
                <ul class="grupos-role-dropdown hidden" role="listbox"></ul>
            </div>
        </div>`;
    }

    function renderGroupRoles() {
        const panel = document.getElementById('grupos-roles-panel');
        if (!panel) return;
        const pubs = sortedPublishers();
        if (!pubs.length) {
            panel.innerHTML = '';
            return;
        }

        panel.innerHTML = `<details class="grupos-roles-accordion">
            <summary class="grupos-roles-accordion-summary">
                <span>Superintendentes y auxiliares</span>
                <span class="grupos-group-badge">${config.groupCount} grupos</span>
            </summary>
            <div class="grupos-roles-accordion-body">
                <div class="grupos-roles-grid">${Array.from({ length: config.groupCount }, (_, i) => {
                    const g = i + 1;
                    const role = config.roles[String(g)] || {};
                    return `<div class="grupos-role-card">
                        <span class="grupos-role-card-title">Grupo ${g}</span>
                        <div class="grupos-roles-row">
                            ${roleCombo(g, 'superintendent', role.superintendent || '')}
                            ${roleCombo(g, 'auxiliary', role.auxiliary || '')}
                        </div>
                    </div>`;
                }).join('')}</div>
            </div>
        </details>`;
    }

    function renderGroupListView() {
        const pubs = sortedPublishers();
        if (!pubs.length) return '<p class="grupos-empty">No hay publicadores cargados.</p>';

        return `<div class="grupos-group-list">${Array.from({ length: config.groupCount }, (_, i) => {
            const g = i + 1;
            const { members, others } = splitGroupPublishers(g, pubs);
            return `<details class="grupos-group-card"${g === 1 ? ' open' : ''}>
                <summary class="grupos-group-summary">
                    <span class="grupos-group-title">Grupo ${g}</span>
                    <span class="grupos-group-badge">${members.length} miembro${members.length === 1 ? '' : 's'}</span>
                </summary>
                <div class="grupos-group-body">
                    <div class="grupos-member-list grupos-member-list--in">
                        ${members.length
                            ? members.map(({ pub, chip }) => renderMemberCheck(pub, g, true, chip)).join('')
                            : '<p class="grupos-empty-inline">Ningún miembro asignado.</p>'}
                    </div>
                    <details class="grupos-others-details">
                        <summary class="grupos-others-summary">No pertenecen al grupo (${others.length})</summary>
                        <div class="grupos-member-list grupos-member-list--out">
                            ${others.length
                                ? others.map(p => renderMemberCheck(p, g, false, null)).join('')
                                : '<p class="grupos-empty-inline">Todos los publicadores están en este grupo.</p>'}
                        </div>
                    </details>
                </div>
            </details>`;
        }).join('')}</div>`;
    }

    function rolePersonName(key) {
        const p = publisherByKey(key);
        return p ? p.nombre : '—';
    }

    let colHeadTooltipEl = null;
    let colHeadTooltipAnchor = null;
    const colHeadCompactMq = window.matchMedia('(max-width: 767px)');

    function colHeadTooltipEnabled() {
        return colHeadCompactMq.matches;
    }

    function ensureColHeadTooltip() {
        if (colHeadTooltipEl) return colHeadTooltipEl;
        colHeadTooltipEl = document.createElement('div');
        colHeadTooltipEl.id = 'grupos-col-tooltip';
        colHeadTooltipEl.className = 'grupos-col-tooltip hidden';
        colHeadTooltipEl.setAttribute('role', 'tooltip');
        document.body.appendChild(colHeadTooltipEl);
        return colHeadTooltipEl;
    }

    function showColHeadTooltip(colHead) {
        if (!colHeadTooltipEnabled()) return;
        const supName = colHead.dataset.grupoSup || '—';
        const auxName = colHead.dataset.grupoAux || '—';
        const tip = ensureColHeadTooltip();
        tip.innerHTML = `
            <div class="grupos-col-tooltip-line">
                <span class="grupos-chip grupos-chip--sup">Sup</span>
                <span class="grupos-col-tooltip-name">${escapeHtml(supName)}</span>
            </div>
            <div class="grupos-col-tooltip-line">
                <span class="grupos-chip grupos-chip--aux">Aux</span>
                <span class="grupos-col-tooltip-name">${escapeHtml(auxName)}</span>
            </div>`;
        tip.classList.remove('hidden');
        colHeadTooltipAnchor = colHead;
        positionColHeadTooltip(colHead);
    }

    function positionColHeadTooltip(colHead) {
        const tip = colHeadTooltipEl;
        if (!tip || tip.classList.contains('hidden')) return;
        const rect = colHead.getBoundingClientRect();
        tip.style.left = `${rect.left + rect.width / 2}px`;
        tip.style.top = `${rect.top - 6}px`;
        requestAnimationFrame(() => {
            if (!tip || tip.classList.contains('hidden')) return;
            const tipRect = tip.getBoundingClientRect();
            let shiftX = 0;
            if (tipRect.left < 8) shiftX = 8 - tipRect.left;
            else if (tipRect.right > window.innerWidth - 8) shiftX = window.innerWidth - 8 - tipRect.right;
            tip.style.transform = shiftX
                ? `translate(calc(-50% + ${shiftX}px), -100%)`
                : 'translate(-50%, -100%)';
        });
    }

    function hideColHeadTooltip() {
        if (!colHeadTooltipEl) return;
        colHeadTooltipEl.classList.add('hidden');
        colHeadTooltipAnchor = null;
    }

    function captureMatrixProfileState() {
        const blocks = document.querySelectorAll('.grupos-matrix-profile-block');
        if (!blocks.length) return;
        matrixProfilesExpanded = new Set();
        blocks.forEach(el => {
            if (el.open && el.dataset.origen) matrixProfilesExpanded.add(el.dataset.origen);
        });
    }

    function isMatrixProfileOpen(origen) {
        if (matrixProfilesExpanded === null) return true;
        return matrixProfilesExpanded.has(origen);
    }

    function renderMatrixColumnHead(g) {
        const role = config.roles[String(g)] || {};
        const supName = rolePersonName(role.superintendent);
        const auxName = rolePersonName(role.auxiliary);
        const hoverTip = `Sup: ${supName} · Aux: ${auxName}`;
        return `<th class="grupos-matrix-col grupos-matrix-col-head" scope="col" data-grupo-head="${g}"
            data-grupo-sup="${escapeAttr(supName)}" data-grupo-aux="${escapeAttr(auxName)}"
            aria-label="Grupo ${g}. ${hoverTip}. Pulse para editar." role="button" tabindex="0">
            <span class="grupos-col-num">${g}</span>
            <span class="grupos-col-roles-expanded">
                <span class="grupos-col-role-line">
                    <span class="grupos-chip grupos-chip--sup">Sup</span>
                    <span class="grupos-col-person">${escapeHtml(supName)}</span>
                </span>
                <span class="grupos-col-role-line">
                    <span class="grupos-chip grupos-chip--aux">Aux</span>
                    <span class="grupos-col-person">${escapeHtml(auxName)}</span>
                </span>
            </span>
        </th>`;
    }

    function renderMatrixPersonRow(p) {
        const k = personKey(p);
        const assigned = getAssignment(k);
        const cells = Array.from({ length: config.groupCount }, (_, i) => {
            const g = i + 1;
            const active = assigned === g;
            return `<td class="grupos-matrix-cell${active ? ' is-active' : ''}"
                data-matrix-key="${escapeAttr(k)}" data-matrix-group="${g}"
                title="${active ? 'Quitar de grupo' : `Asignar a grupo ${g}`}"
                role="button" tabindex="0">${active ? g : ''}</td>`;
        }).join('');
        return `<tr class="grupos-matrix-person-row" data-person-key="${escapeAttr(k)}">
            <th class="grupos-matrix-name" scope="row">
                <span class="grupos-matrix-name-text">${escapeHtml(p.nombre)}${roleBadgesHtml(k)}</span>
            </th>
            ${cells}
        </tr>`;
    }

    function renderMatrixProfileView(origenes, byOrigen) {
        const colHeads = Array.from({ length: config.groupCount }, (_, i) =>
            renderMatrixColumnHead(i + 1)
        ).join('');

        const blocks = origenes.map(origen => {
            const list = byOrigen.get(origen).slice().sort(sortByName);
            const open = isMatrixProfileOpen(origen);
            return `<details class="grupos-matrix-profile-block" data-origen="${escapeAttr(origen)}"${open ? ' open' : ''}>
                <summary class="grupos-matrix-profile-summary">
                    <span class="grupos-matrix-profile-label">${escapeHtml(displayPerfil(origen))}</span>
                    <span class="grupos-group-badge">${list.length}</span>
                </summary>
                <div class="grupos-matrix-scroll table-wrap">
                    <table class="grupos-matrix-table">
                        <thead><tr><th class="grupos-matrix-name-col" scope="col">Publicador</th>${colHeads}</tr></thead>
                        <tbody>${list.map(renderMatrixPersonRow).join('')}</tbody>
                    </table>
                </div>
            </details>`;
        }).join('');

        return `
            <div class="grupos-matrix-toolbar">
                <input type="search" id="grupos-matrix-search" class="grupos-matrix-search" placeholder="Filtrar por nombre o perfil…" value="${escapeAttr(matrixSearch)}" autocomplete="off">
                <span class="grupos-matrix-hint">Pulse encabezado de grupo para ampliar · celda para asignar</span>
            </div>
            <div class="grupos-matrix-profiles">${blocks || '<p class="grupos-empty">Sin coincidencias.</p>'}</div>`;
    }

    function showGroupModal(groupNum) {
        const modal = document.getElementById('grupos-group-modal');
        if (!modal) return;
        const role = config.roles[String(groupNum)] || {};
        const title = document.getElementById('grupos-modal-title');
        const supEl = document.getElementById('grupos-modal-sup');
        const auxEl = document.getElementById('grupos-modal-aux');
        if (title) title.textContent = `Grupo ${groupNum}`;
        if (supEl) supEl.textContent = rolePersonName(role.superintendent);
        if (auxEl) auxEl.textContent = rolePersonName(role.auxiliary);
        modal.classList.remove('hidden');
        modal.hidden = false;
        modal.querySelector('.grupos-modal-close')?.focus();
    }

    function closeGroupModal() {
        const modal = document.getElementById('grupos-group-modal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.hidden = true;
    }

    function renderAssignPanel() {
        const panel = document.getElementById('grupos-panel-assign');
        if (!panel) return;
        const pubs = getPublishers();

        if (!pubs.length) {
            panel.innerHTML = '<p class="grupos-empty">No hay publicadores cargados.</p>';
            return;
        }

        if (assignView === 'group') {
            panel.innerHTML = renderGroupListView();
            return;
        }

        if (assignView === 'profile') captureMatrixProfileState();

        const scrollState = assignView === 'profile' ? captureMatrixScrollState() : null;

        const q = matrixSearch.trim().toLowerCase();
        const filtered = filterPublishersByQuery(pubs, q);
        const byOrigen = new Map();
        for (const p of filtered) {
            if (!byOrigen.has(p.origen)) byOrigen.set(p.origen, []);
            byOrigen.get(p.origen).push(p);
        }
        const origenes = [...byOrigen.keys()].sort((a, b) =>
            displayPerfil(a).localeCompare(displayPerfil(b), 'es')
        );

        panel.innerHTML = renderMatrixProfileView(origenes, byOrigen);
        if (scrollState) restoreMatrixScrollState(scrollState);
    }

    function render() {
        renderSummary();
        renderViewTabs();
        renderGroupRoles();
        renderAssignPanel();
    }

    function filterRoleOptions(publishers, query) {
        const q = query.trim().toLowerCase();
        if (!q) return publishers.slice(0, 80);
        return publishers.filter(p =>
            String(p.nombre).toLowerCase().includes(q) ||
            displayPerfil(p.origen).toLowerCase().includes(q)
        ).slice(0, 80);
    }

    function renderRoleDropdown(combo, query) {
        const dropdown = combo.querySelector('.grupos-role-dropdown');
        if (!dropdown) return;
        const pubs = filterRoleOptions(sortedPublishers(), query);
        if (!pubs.length) {
            dropdown.innerHTML = '<li class="grupos-role-option grupos-role-option--empty">Sin coincidencias</li>';
            dropdown.classList.remove('hidden');
            return;
        }
        dropdown.innerHTML = pubs.map(p => {
            const k = personKey(p);
            return `<li class="grupos-role-option" role="option" data-person-key="${escapeAttr(k)}" tabindex="-1">
                <span class="grupos-role-option-name">${escapeHtml(p.nombre)}</span>
                <span class="grupos-role-option-profile">${escapeHtml(displayPerfil(p.origen))}</span>
            </li>`;
        }).join('');
        dropdown.classList.remove('hidden');
    }

    function closeRoleDropdown(combo) {
        combo?.querySelector('.grupos-role-dropdown')?.classList.add('hidden');
    }

    function closeAllRoleDropdowns(except) {
        document.querySelectorAll('.grupos-role-combo').forEach(combo => {
            if (combo !== except) closeRoleDropdown(combo);
        });
    }

    function syncRoleComboUi(combo, key) {
        const pub = publisherByKey(key);
        const input = combo.querySelector('.grupos-role-input');
        const clearBtn = combo.querySelector('.grupos-role-clear');
        if (input) input.value = pub ? pub.nombre : '';
        combo.dataset.selectedKey = key || '';
        clearBtn?.classList.toggle('hidden', !key);
    }

    function selectRoleOption(combo, key) {
        if (!combo) return;
        const groupNum = Number(combo.dataset.grupoRole);
        const roleType = combo.dataset.roleType;
        setRole(groupNum, roleType, key || '');
        closeRoleDropdown(combo);
    }

    function commitRoleCombo(combo) {
        if (!combo) return;
        const input = combo.querySelector('.grupos-role-input');
        if (!input) return;
        const text = input.value.trim();
        const previousKey = combo.dataset.selectedKey || '';

        if (!text) {
            if (previousKey) selectRoleOption(combo, '');
            return;
        }

        const matches = sortedPublishers().filter(p =>
            String(p.nombre).toLowerCase() === text.toLowerCase()
        );
        if (matches.length === 1) {
            selectRoleOption(combo, personKey(matches[0]));
            return;
        }

        const fuzzy = filterRoleOptions(sortedPublishers(), text);
        if (fuzzy.length === 1) {
            selectRoleOption(combo, personKey(fuzzy[0]));
            return;
        }

        syncRoleComboUi(combo, previousKey);
        closeRoleDropdown(combo);
    }

    function onPanelClick(e) {
        if (e.target.closest('[data-grupos-modal-close]')) {
            closeGroupModal();
            return;
        }

        const colHead = e.target.closest('[data-grupo-head]');
        if (colHead) {
            hideColHeadTooltip();
            showGroupModal(Number(colHead.dataset.grupoHead));
            return;
        }

        const option = e.target.closest('.grupos-role-option[data-person-key]');
        if (option) {
            clearTimeout(roleComboBlurTimer);
            selectRoleOption(option.closest('.grupos-role-combo'), option.dataset.personKey);
            return;
        }

        const clearBtn = e.target.closest('.grupos-role-clear');
        if (clearBtn) {
            clearTimeout(roleComboBlurTimer);
            selectRoleOption(clearBtn.closest('.grupos-role-combo'), '');
            return;
        }

        const matrixCell = e.target.closest('.grupos-matrix-cell');
        if (!matrixCell) return;
        const key = matrixCell.dataset.matrixKey;
        const g = Number(matrixCell.dataset.matrixGroup);
        const current = getAssignment(key);
        assignPerson(key, current === g ? 0 : g, { matrixPatch: true });
    }

    function onPanelChange(e) {
        const grupoCheck = e.target.closest('input[data-grupo-check]');
        if (!grupoCheck) return;
        const g = Number(grupoCheck.dataset.grupoCheck);
        const key = grupoCheck.dataset.personKey;
        assignPerson(key, grupoCheck.checked ? g : 0);
    }

    function onPanelKeydown(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('grupos-group-modal');
            if (modal && !modal.hidden) {
                closeGroupModal();
                return;
            }
        }

        const colHead = e.target.closest('[data-grupo-head]');
        if (colHead && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            hideColHeadTooltip();
            showGroupModal(Number(colHead.dataset.grupoHead));
            return;
        }

        const input = e.target.closest('.grupos-role-input');
        if (input) {
            const combo = input.closest('.grupos-role-combo');
            const dropdown = combo?.querySelector('.grupos-role-dropdown');
            const options = dropdown ? [...dropdown.querySelectorAll('.grupos-role-option[data-person-key]')] : [];
            if (e.key === 'ArrowDown' && options.length) {
                e.preventDefault();
                options[0].focus();
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                commitRoleCombo(combo);
                return;
            }
            if (e.key === 'Escape') {
                closeRoleDropdown(combo);
                syncRoleComboUi(combo, combo.dataset.selectedKey || '');
                return;
            }
        }

        const option = e.target.closest('.grupos-role-option[data-person-key]');
        if (option) {
            const options = [...option.parentElement.querySelectorAll('.grupos-role-option[data-person-key]')];
            const idx = options.indexOf(option);
            if (e.key === 'Enter') {
                e.preventDefault();
                selectRoleOption(option.closest('.grupos-role-combo'), option.dataset.personKey);
            } else if (e.key === 'ArrowDown' && idx < options.length - 1) {
                e.preventDefault();
                options[idx + 1].focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (idx > 0) options[idx - 1].focus();
                else option.closest('.grupos-role-combo')?.querySelector('.grupos-role-input')?.focus();
            } else if (e.key === 'Escape') {
                option.closest('.grupos-role-combo')?.querySelector('.grupos-role-input')?.focus();
                closeRoleDropdown(option.closest('.grupos-role-combo'));
            }
            return;
        }

        if (e.key !== 'Enter' && e.key !== ' ') return;
        const cell = e.target.closest('.grupos-matrix-cell');
        if (!cell) return;
        e.preventDefault();
        cell.click();
    }

    function bindEvents() {
        const root = document.getElementById('grupos-section');
        if (!root) return;

        const countInput = document.getElementById('grupos-count');
        countInput?.addEventListener('change', () => setGroupCount(countInput.value));

        root.querySelectorAll('[data-grupos-view]').forEach(btn => {
            btn.addEventListener('click', () => {
                assignView = btn.dataset.gruposView === 'profile' ? 'profile' : 'group';
                if (assignView === 'profile') matrixProfilesExpanded = null;
                render();
            });
        });

        document.addEventListener('keydown', e => {
            if (e.key !== 'Escape') return;
            const modal = document.getElementById('grupos-group-modal');
            if (modal && !modal.hidden) closeGroupModal();
        });

        root.addEventListener('click', onPanelClick);
        root.addEventListener('change', onPanelChange);
        root.addEventListener('keydown', onPanelKeydown);

        root.addEventListener('focusin', e => {
            const input = e.target.closest('.grupos-role-input');
            if (!input) return;
            const combo = input.closest('.grupos-role-combo');
            closeAllRoleDropdowns(combo);
            renderRoleDropdown(combo, input.value);
        });

        root.addEventListener('input', e => {
            if (e.target.id === 'grupos-matrix-search') {
                matrixSearch = e.target.value;
                renderAssignPanel();
                return;
            }
            const input = e.target.closest('.grupos-role-input');
            if (input) {
                renderRoleDropdown(input.closest('.grupos-role-combo'), input.value);
            }
        });

        root.addEventListener('focusout', e => {
            const combo = e.target.closest('.grupos-role-combo');
            if (!combo) return;
            if (combo.contains(e.relatedTarget)) return;
            clearTimeout(roleComboBlurTimer);
            roleComboBlurTimer = setTimeout(() => commitRoleCombo(combo), 160);
        });

        root.addEventListener('mouseover', e => {
            const colHead = e.target.closest('[data-grupo-head]');
            if (!colHead || !colHeadTooltipEnabled()) return;
            if (colHead === colHeadTooltipAnchor) return;
            showColHeadTooltip(colHead);
        });

        root.addEventListener('mouseout', e => {
            const colHead = e.target.closest('[data-grupo-head]');
            if (!colHead || colHead !== colHeadTooltipAnchor) return;
            const to = e.relatedTarget;
            if (to && colHead.contains(to)) return;
            hideColHeadTooltip();
        });

        root.addEventListener('focusin', e => {
            const colHead = e.target.closest('[data-grupo-head]');
            if (colHead && colHeadTooltipEnabled()) showColHeadTooltip(colHead);
        });

        root.addEventListener('focusout', e => {
            const colHead = e.target.closest('[data-grupo-head]');
            if (!colHead || colHead !== colHeadTooltipAnchor) return;
            const to = e.relatedTarget;
            if (to && colHead.contains(to)) return;
            hideColHeadTooltip();
        });

        root.addEventListener('scroll', e => {
            if (e.target.closest('.grupos-matrix-scroll')) hideColHeadTooltip();
        }, true);

        colHeadCompactMq.addEventListener('change', hideColHeadTooltip);
        window.addEventListener('scroll', hideColHeadTooltip, true);
        window.addEventListener('resize', () => {
            if (colHeadTooltipAnchor) positionColHeadTooltip(colHeadTooltipAnchor);
        });
    }

    function init(options) {
        ctx = options || {};
        config = loadConfig();
        bindEvents();
        const countInput = document.getElementById('grupos-count');
        if (countInput) countInput.value = config.groupCount;
        render();
    }

    function assignFiltered(keys, groupNum) {
        assignMany(keys, groupNum);
    }

    window.S21DashboardGrupos = {
        GRUPOS_KEY,
        init,
        getConfig,
        loadConfig,
        applyToRows,
        grupoLabel,
        getAssignment,
        assignFiltered,
        render,
        personKey,
    };
})();
