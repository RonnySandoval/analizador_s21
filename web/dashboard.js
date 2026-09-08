document.addEventListener('DOMContentLoaded', () => {
    const D = window.S21DashboardData;
    const FILTERS_COLLAPSED_KEY = 'analisis_servicio_filters_collapsed';
    const ACCORDION_STATE_KEY = 'analisis_servicio_accordion_state';
    const PERFIL_ALIASES_KEY = 'analisis_servicio_perfil_aliases';
    const CHART_PROFILES_KEY = 'analisis_servicio_chart_profiles';

    const FILTER_LAYOUT = {
        wide: ['origen'],
        compact: [
            'sexo', 'esperanza', 'anciano', 'siervo_ministerial',
            'precursor_regular', 'precursor_especial', 'misionero',
        ],
    };

    const dropZone = document.getElementById('drop-zone');
    const btnClearData = document.getElementById('btn-clear-data');
    const loadStatus = document.getElementById('load-status');
    const dataSourcesBar = document.getElementById('data-sources-bar');
    const fileList = document.getElementById('file-list');
    const dashboardContent = document.getElementById('dashboard-content');
    const emptyState = document.getElementById('empty-state');
    const kpiGrid = document.getElementById('kpi-grid');
    const kpiModeBtns = document.querySelectorAll('.kpi-mode-btn');
    const filtersBody = document.getElementById('filters-body');
    const filtersPanel = document.getElementById('filters-panel');
    const btnToggleFilters = document.getElementById('btn-toggle-filters');
    const filtersChevron = document.getElementById('filters-chevron');
    const filtersSummary = document.getElementById('filters-summary');
    const filterModeBtns = document.querySelectorAll('.filter-mode-btn');
    const btnClearFilters = document.getElementById('btn-clear-filters');
    const group1 = document.getElementById('group-1');
    const group2 = document.getElementById('group-2');
    const totalsScopeSelect = document.getElementById('totals-scope');
    const metricSelect = document.getElementById('metric');
    const chartExcludeToggle = document.getElementById('chart-exclude-toggle');
    const pivotHead = document.getElementById('pivot-head');
    const pivotBody = document.getElementById('pivot-body');
    const pivotFoot = document.getElementById('pivot-foot');
    const btnExportCsv = document.getElementById('btn-export-csv');
    const chartGrid = document.getElementById('chart-grid');
    const chartBarCard = document.getElementById('chart-bar-card');
    const chartBarTitle = document.getElementById('chart-bar-title');
    const chartProfileTogglesWrap = document.getElementById('chart-profile-toggles-wrap');
    const chartProfileToggles = document.getElementById('chart-profile-toggles');
    const publisherSearch = document.getElementById('publisher-search');
    const publisherCount = document.getElementById('publisher-count');
    const publisherListBody = document.getElementById('publisher-list-body');
    const publisherListHead = document.getElementById('publisher-list-head');
    const publisherDetailEmpty = document.getElementById('publisher-detail-empty');
    const publisherDetailContent = document.getElementById('publisher-detail-content');
    const btnExportPublishers = document.getElementById('btn-export-publishers');
    const detailCrossFilter = document.getElementById('detail-cross-filter');
    const detailCrossFilterChips = document.getElementById('detail-cross-filter-chips');
    const btnClearCrossFilter = document.getElementById('btn-clear-cross-filter');
    const publisherSection = document.getElementById('publisher-section');
    const perfilAliasesHint = document.getElementById('perfil-aliases-hint');
    const btnResetPerfilAliases = document.getElementById('btn-reset-perfil-aliases');

    let packages = [];
    let flat = { mensual: [], publicadores: [] };
    let filters = {};
    let filterMode = 'include';
    let aggregated = [];
    let barChart = null;
    let lineChart = null;
    let publisherDetailChart = null;
    let publisherDetailMetric = 'horas';
    let publisherDetailMonthlyCache = [];
    let currentFuente = '';
    let sortState = { column: 'horas', direction: 'desc' };
    let publisherSortState = { column: 'nombre', direction: 'asc' };
    let tableColumns = [];
    let filteredMensualCache = [];
    let filteredPubCache = [];
    let kpisCache = {};
    let kpiMode = 'last';
    let selectedPublisherKey = '';
    let chartExcludeMonths = 0;
    let totalsScope = 'year';
    let chartProfileInclude = {};
    let publisherSearchQuery = '';
    let detailMonthlyFilter = null;
    let tableRowsCache = [];
    let chartBarRowsCache = [];
    let chartLineTrendCache = [];
    let perfilAliases = {};
    let congregacionDetectada = null;

    const FILTER_FIELDS = [...FILTER_LAYOUT.wide, ...FILTER_LAYOUT.compact];

    const KPI_ITEMS = [
        { key: 'publicadores', label: 'Publicadores' },
        { key: 'horas', label: 'Horas' },
        { key: 'cursos', label: 'Cursos' },
        { key: 'participacion', label: 'Participación' },
        { key: 'precursor_aux', label: 'Prec. aux.' },
        { key: 'inactivos', label: 'Inactivos' },
    ];

    const PUBLISHER_LIST_COLUMNS = [
        { id: 'nombre', label: 'Nombre', type: 'text', getValue: row => row.nombre },
        { id: 'origen', label: 'Perfil', type: 'text', getValue: row => displayPerfil(row.origen) },
        { id: 'fecha_nacimiento', label: 'Nacimiento', type: 'text', getValue: row => row.fecha_nacimiento || '' },
        { id: 'fecha_bautismo', label: 'Bautismo', type: 'text', getValue: row => row.fecha_bautismo || '' },
    ];

    const PUBLISHER_DETAIL_METRICS = [
        { id: 'horas', label: 'Horas' },
        { id: 'cursos', label: 'Cursos' },
        { id: 'participacion', label: 'Part.' },
        { id: 'precursor_auxiliar', label: 'P. aux.' },
    ];

    initControls();
    bindEvents();
    initSectionAccordions();
    initFiltersCollapsed();
    initWizard();

    function initControls() {
        group1.innerHTML = D.S21_GROUP_FIELDS.map(f =>
            `<option value="${f.id}">${f.label}</option>`
        ).join('');
        group1.value = 'origen';

        group2.innerHTML = '<option value="">— Ninguno —</option>' + D.S21_GROUP_FIELDS.map(f =>
            `<option value="${f.id}">${f.label}</option>`
        ).join('');

        if (totalsScopeSelect) {
            totalsScopeSelect.innerHTML =
                '<option value="year">Año completo</option>' +
                D.S21_MESES.map(m =>
                    `<option value="${m}">${D.mesLabel(m, 'completo')}</option>`
                ).join('');
        }

        metricSelect.innerHTML = D.S21_CHART_METRICS.map(m =>
            `<option value="${m.id}">${m.label}</option>`
        ).join('');

        if (chartExcludeToggle) {
            chartExcludeToggle.innerHTML = Array.from({ length: 12 }, (_, n) =>
                `<button type="button" class="chart-exclude-btn${n === chartExcludeMonths ? ' active' : ''}"
                    data-months="${n}" role="tab" aria-selected="${n === chartExcludeMonths}">${n}</button>`
            ).join('');
        }
    }

    function bindEvents() {
        btnClearData.addEventListener('click', clearAll);
        btnToggleFilters.addEventListener('click', toggleFilters);
        filterModeBtns.forEach(btn => {
            btn.addEventListener('click', () => setFilterMode(btn.dataset.filterMode));
        });
        if (btnClearFilters) btnClearFilters.addEventListener('click', clearPublisherFilters);
        if (btnClearCrossFilter) btnClearCrossFilter.addEventListener('click', clearDetailLinkFilter);
        if (btnResetPerfilAliases) btnResetPerfilAliases.addEventListener('click', resetPerfilAliasesToSuggested);
        if (pivotBody) pivotBody.addEventListener('click', onPivotBodyClick);
        group1.addEventListener('change', refresh);
        group2.addEventListener('change', refresh);
        totalsScopeSelect?.addEventListener('change', () => {
            totalsScope = totalsScopeSelect.value || 'year';
            refresh();
        });
        metricSelect.addEventListener('change', () => refreshCharts());
        if (chartExcludeToggle) {
            chartExcludeToggle.addEventListener('click', (e) => {
                const btn = e.target.closest('.chart-exclude-btn');
                if (!btn) return;
                setChartExcludeMonths(Number(btn.dataset.months));
            });
        }
        kpiModeBtns.forEach(btn => {
            btn.addEventListener('click', () => setKpiMode(btn.dataset.kpiMode));
        });
        btnExportCsv.addEventListener('click', exportCsv);
        if (btnExportPublishers) btnExportPublishers.addEventListener('click', exportPublishersCsv);
        if (publisherSearch) {
            publisherSearch.addEventListener('input', () => {
                publisherSearchQuery = publisherSearch.value.trim().toLowerCase();
                renderPublisherList();
            });
        }
    }

    function initWizard() {
        window.S21DashboardWizard.init({
            onPackagesLoaded: (loadedPackages, meta) => {
                packages = loadedPackages;
                currentFuente = meta?.label || 'Carga manual';
                rebuild();
            },
            onClear: () => {
                packages = [];
                currentFuente = '';
            },
            setLoadStatus,
        });
    }

    function setLoadStatus(text, isWarn) {
        if (!loadStatus) return;
        loadStatus.textContent = text;
        loadStatus.classList.toggle('warn', !!isWarn);
        loadStatus.classList.remove('hidden');
    }

    function clearAll() {
        packages = [];
        currentFuente = '';
        if (loadStatus) loadStatus.classList.add('hidden');
        window.S21DashboardWizard.resetAll();
        window.S21DashboardWizard.showWizard();
        rebuild();
    }

    function rebuild() {
        if (!packages.length) {
            flat = { mensual: [], publicadores: [] };
            dashboardContent.classList.add('hidden');
            emptyState.classList.remove('hidden');
            btnClearData.classList.add('hidden');
            destroyCharts();
            destroyPublisherDetailChart();
            selectedPublisherKey = '';
            if (publisherListBody) publisherListBody.innerHTML = '';
            if (publisherDetailContent) {
                publisherDetailContent.innerHTML = '';
                publisherDetailContent.classList.add('hidden');
            }
            if (publisherDetailEmpty) publisherDetailEmpty.classList.remove('hidden');
            renderFileList();
            if (chartProfileTogglesWrap) chartProfileTogglesWrap.classList.add('hidden');
            return;
        }

        flat = D.flattenPackages(packages);
        initPerfilAliases();
        initChartProfileInclude();
        filters = buildDefaultFilters();
        filterMode = 'include';
        detailMonthlyFilter = null;
        updateDetailFilterBanner();
        syncFilterModeUI();
        renderFilters();
        renderFileList();
        emptyState.classList.add('hidden');
        dashboardContent.classList.remove('hidden');
        btnClearData.classList.remove('hidden');
        refresh();
    }

    function loadPerfilAliasesSaved() {
        try {
            return JSON.parse(localStorage.getItem(PERFIL_ALIASES_KEY) || '{}');
        } catch {
            return {};
        }
    }

    function savePerfilAliasesToStorage() {
        localStorage.setItem(PERFIL_ALIASES_KEY, JSON.stringify(perfilAliases));
    }

    function initChartProfileInclude() {
        const saved = loadChartProfileIncludeSaved();
        const origenes = D.uniqueValues(flat.mensual, 'origen');
        chartProfileInclude = {};
        for (const raw of origenes) {
            if (Object.prototype.hasOwnProperty.call(saved, raw)) {
                chartProfileInclude[raw] = !!saved[raw];
            } else {
                chartProfileInclude[raw] = !D.isPerfilInactivo(raw);
            }
        }
        renderChartProfileToggles();
    }

    function loadChartProfileIncludeSaved() {
        try {
            return JSON.parse(localStorage.getItem(CHART_PROFILES_KEY) || '{}');
        } catch {
            return {};
        }
    }

    function saveChartProfileInclude() {
        localStorage.setItem(CHART_PROFILES_KEY, JSON.stringify(chartProfileInclude));
    }

    function getChartIncludedOrigenes() {
        return new Set(Object.entries(chartProfileInclude).filter(([, on]) => on).map(([k]) => k));
    }

    function filterMensualForCharts(mensual) {
        return D.filterRowsByOrigenes(mensual, getChartIncludedOrigenes());
    }

    function filterPublicadoresForCharts() {
        return D.filterRowsByOrigenes(flat.publicadores, getChartIncludedOrigenes());
    }

    function renderChartProfileToggles() {
        if (!chartProfileToggles || !chartProfileTogglesWrap) return;
        const origenes = D.uniqueValues(flat.mensual, 'origen');
        if (!origenes.length) {
            chartProfileToggles.innerHTML = '';
            chartProfileTogglesWrap.classList.add('hidden');
            return;
        }
        chartProfileTogglesWrap.classList.remove('hidden');
        chartProfileToggles.innerHTML = origenes.map(raw => {
            const checked = !!chartProfileInclude[raw];
            const label = displayPerfil(raw);
            const inactivo = D.isPerfilInactivo(raw);
            return `<label class="chart-profile-toggle${inactivo ? ' is-inactivo' : ''}">
                <input type="checkbox" data-origen="${escapeAttr(raw)}"${checked ? ' checked' : ''}>
                <span>${escapeHtml(label)}</span>
            </label>`;
        }).join('');

        chartProfileToggles.querySelectorAll('input[type=checkbox]').forEach(cb => {
            cb.addEventListener('change', () => {
                chartProfileInclude[cb.dataset.origen] = cb.checked;
                saveChartProfileInclude();
                refreshCharts();
            });
        });
    }

    function initPerfilAliases() {
        const saved = loadPerfilAliasesSaved();
        const origenes = D.uniqueValues(flat.mensual, 'origen');
        congregacionDetectada = D.detectCongregacion(origenes);
        perfilAliases = {};
        for (const raw of origenes) {
            perfilAliases[raw] = saved[raw] || D.suggestPerfilAlias(raw, congregacionDetectada);
        }
    }

    function displayPerfil(raw) {
        if (!raw || raw === '—') return '—';
        return perfilAliases[raw] || D.suggestPerfilAlias(raw, congregacionDetectada) || raw;
    }

    function displayGroupValue(field, value) {
        if (field === 'origen') return displayPerfil(value);
        if (field === 'mes') return D.mesLabel(value, 'completo');
        return value ?? '—';
    }

    function formatAggRowLabel(row) {
        if (!row?.keys?.length) return row?.label || '';
        return row.keys.map(k => displayGroupValue(k.field, k.value)).join(' · ');
    }

    function onPerfilAliasChange(input) {
        const raw = input.dataset.origen;
        if (!raw) return;
        const suggested = D.suggestPerfilAlias(raw, congregacionDetectada);
        perfilAliases[raw] = input.value.trim() || suggested;
        input.value = perfilAliases[raw];
        savePerfilAliasesToStorage();
        refreshAfterAliasChange();
    }

    function resetPerfilAliasesToSuggested() {
        for (const raw of D.uniqueValues(flat.mensual, 'origen')) {
            perfilAliases[raw] = D.suggestPerfilAlias(raw, congregacionDetectada);
        }
        savePerfilAliasesToStorage();
        refreshAfterAliasChange();
    }

    function refreshAfterAliasChange() {
        renderFileList();
        renderChartProfileToggles();
        renderFilters();
        updateDetailFilterBanner();
        refresh();
    }

    function renderFileList() {
        const dropZoneEl = document.getElementById('drop-zone');
        if (!fileList) return;

        if (!packages.length) {
            fileList.innerHTML = '';
            dataSourcesBar?.classList.add('hidden');
            dropZoneEl?.classList.remove('has-sources');
            window.S21DashboardWizard?.showWizard();
            return;
        }

        window.S21DashboardWizard?.showLoaded();
        dataSourcesBar?.classList.remove('hidden');
        dropZoneEl?.classList.add('has-sources');

        if (perfilAliasesHint) {
            perfilAliasesHint.textContent = congregacionDetectada
                ? `Congregación «${congregacionDetectada}» oculta en alias sugeridos.`
                : 'Edite el nombre visible en tablas y gráficos.';
        }

        const origenes = D.uniqueValues(flat.mensual, 'origen');
        const counts = new Map();
        for (const row of flat.publicadores) {
            counts.set(row.origen, (counts.get(row.origen) || 0) + 1);
        }

        fileList.innerHTML = origenes.map(raw => {
            const alias = perfilAliases[raw] ?? D.suggestPerfilAlias(raw, congregacionDetectada);
            const suggested = D.suggestPerfilAlias(raw, congregacionDetectada);
            const count = counts.get(raw) || 0;
            return `<li class="file-source-item">
                <div class="file-source-main">
                    <span class="file-source-count">${count} reg.</span>
                    <input type="text" class="perfil-alias-input file-source-alias" data-origen="${escapeAttr(raw)}"
                        value="${escapeAttr(alias)}" aria-label="Alias para ${escapeAttr(raw)}"
                        placeholder="${escapeAttr(suggested)}">
                </div>
                <span class="file-source-raw" title="${escapeAttr(raw)}">${escapeHtml(raw)}</span>
            </li>`;
        }).join('');

        fileList.querySelectorAll('.file-source-alias').forEach(input => {
            input.addEventListener('change', () => onPerfilAliasChange(input));
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') input.blur();
            });
        });
    }

    function buildDefaultFilters() {
        const f = {};
        for (const field of [...FILTER_LAYOUT.wide, ...FILTER_LAYOUT.compact]) {
            f[field] = [];
        }
        return f;
    }

    function renderFilterCell(field, { scroll = false } = {}) {
        const label = D.S21_GROUP_FIELDS.find(g => g.id === field)?.label || field;
        const values = D.uniqueValues(flat.mensual, field);
        if (!filters[field]) filters[field] = [];
        const chips = values.map(v => {
            const active = filters[field].includes(v);
            return `<button type="button" class="filter-chip ${active ? 'on' : ''}${filterMode === 'exclude' && active ? ' filter-chip-exclude' : ''}"
                data-field="${field}" data-value="${escapeAttr(v)}" title="${escapeAttr(v)}">${escapeHtml(field === 'origen' ? displayPerfil(v) : v)}</button>`;
        }).join('');
        return `<div class="filter-card">
            <span class="filter-label">${escapeHtml(label)}</span>
            <div class="filter-chips${scroll ? ' filter-chips-scroll' : ''}">${chips}</div>
        </div>`;
    }

    function renderFilters() {
        const allFields = [...FILTER_LAYOUT.wide, ...FILTER_LAYOUT.compact];
        filtersBody.innerHTML = `<div class="filters-grid">${allFields.map(field =>
            renderFilterCell(field, { scroll: field === 'origen' })
        ).join('')}</div>`;

        filtersBody.querySelectorAll('.filter-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                const field = btn.dataset.field;
                const val = btn.dataset.value;
                const idx = filters[field].indexOf(val);
                if (idx >= 0) {
                    filters[field].splice(idx, 1);
                    btn.classList.remove('on');
                } else {
                    filters[field].push(val);
                    btn.classList.add('on');
                }
                updateFiltersSummary();
                refreshPublishersSection();
            });
        });

        updateFiltersSummary();
    }

    function applyPublisherFilters() {
        const activeFilters = getActiveFilters();
        const mensualProfile = D.applyFilters(flat.mensual, activeFilters, filterMode);
        let pubs = D.applyFilters(flat.publicadores, activeFilters, filterMode);

        if (detailMonthlyFilter) {
            pubs = D.applyMonthlyDrillFilter(pubs, mensualProfile, detailMonthlyFilter);
        }

        filteredMensualCache = mensualProfile;
        filteredPubCache = pubs;
    }

    function detailFocusMes() {
        if (detailMonthlyFilter?.mes) return detailMonthlyFilter.mes;
        if (totalsScope && totalsScope !== 'year') return totalsScope;
        return null;
    }

    function mergeFilterValue(field, value) {
        if (!FILTER_FIELDS.includes(field)) return false;
        if (!filters[field]) filters[field] = [];
        if (filters[field].includes(value)) return false;
        filters[field].push(value);
        return true;
    }

    function setPublisherDetailMetricFromDrill(sourceId) {
        const mapped = D.detailMetricFromDrillSource(sourceId);
        if (!mapped) return;
        publisherDetailMetric = mapped;
        if (selectedPublisherKey) renderPublisherDetail();
    }

    function applyDetailFilter({ row, criteria, sourceLabel, source = 'tabla', detailMetric = null, metricSource = null }) {
        let mes = null;
        if (row?.keys) {
            for (const { field, value } of row.keys) {
                if (field === 'mes') mes = value;
                else mergeFilterValue(field, value);
            }
        }
        if (!mes && totalsScope !== 'year') mes = totalsScope;

        const resolvedDetailMetric = detailMetric
            ?? D.detailMetricFromDrillSource(metricSource);

        detailMonthlyFilter = {
            mes,
            criteria,
            source,
            groupLabel: row ? formatAggRowLabel(row) : null,
            sourceLabel: sourceLabel || '',
            detailMetric: resolvedDetailMetric,
        };

        filterMode = 'include';
        syncFilterModeUI();
        renderFilters();
        updateDetailFilterBanner();
        selectedPublisherKey = '';
        expandFiltersPanel();
        refreshPublishersSection();
        scrollToPublisherSection();
    }

    function applyDetailFilterFromTable(row, colId) {
        const col = tableColumns.find(c => c.id === colId);
        setPublisherDetailMetricFromDrill(colId);
        applyDetailFilter({
            row,
            criteria: D.monthlyCriteriaFromTableColumn(colId),
            sourceLabel: `Tabla · ${formatAggRowLabel(row)} · ${col?.label || colId}`,
            metricSource: colId,
        });
    }

    function applyDetailFilterFromBar(row) {
        setPublisherDetailMetricFromDrill(metricSelect.value);
        applyDetailFilter({
            row,
            criteria: D.monthlyCriteriaFromChart(metricSelect.value),
            source: 'grafico',
            sourceLabel: `Gráfico · ${formatAggRowLabel(row)} · ${D.chartMetricLabel(metricSelect.value)}`,
            metricSource: metricSelect.value,
        });
    }

    function applyDetailFilterFromLinePoint(point) {
        const chartMetric = metricSelect.value;
        setPublisherDetailMetricFromDrill(chartMetric);
        detailMonthlyFilter = {
            mes: point.mes,
            criteria: D.monthlyCriteriaFromChart(chartMetric),
            source: 'grafico',
            groupLabel: null,
            sourceLabel: `Gráfico · ${D.mesLabel(point.mes, 'completo')} · ${D.chartMetricLabel(chartMetric)}`,
            detailMetric: D.detailMetricFromDrillSource(chartMetric),
        };
        updateDetailFilterBanner();
        selectedPublisherKey = '';
        expandFiltersPanel();
        refreshPublishersSection();
        scrollToPublisherSection();
    }

    function clearDetailLinkFilter() {
        detailMonthlyFilter = null;
        updateDetailFilterBanner();
        refreshPublishersSection();
    }

    function clearPublisherFilters() {
        filters = buildDefaultFilters();
        clearDetailLinkFilter();
        renderFilters();
        refreshPublishersSection();
    }

    function updateDetailFilterBanner() {
        if (!detailCrossFilter || !detailCrossFilterChips) return;
        const chips = D.monthlyDrillToChips(detailMonthlyFilter);
        if (chips.length) {
            detailCrossFilterChips.innerHTML = chips.map(chip =>
                `<span class="detail-monthly-chip detail-monthly-chip-${chip.kind}" title="${escapeAttr(chip.title || chip.label)}">${escapeHtml(chip.label)}</span>`
            ).join('');
            detailCrossFilter.classList.remove('hidden');
        } else {
            detailCrossFilterChips.innerHTML = '';
            detailCrossFilter.classList.add('hidden');
        }
    }

    function expandFiltersPanel() {
        if (!filtersPanel) return;
        filtersPanel.classList.remove('collapsed');
        btnToggleFilters?.setAttribute('aria-expanded', 'true');
        if (filtersChevron) filtersChevron.textContent = '▾';
        localStorage.setItem(FILTERS_COLLAPSED_KEY, '0');
    }

    function scrollToPublisherSection() {
        expandAccordion('publishers');
        publisherSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function initSectionAccordions() {
        const accordions = document.querySelectorAll('.dashboard-accordion[data-accordion-id]');
        if (!accordions.length) return;

        let saved = {};
        try {
            saved = JSON.parse(localStorage.getItem(ACCORDION_STATE_KEY) || '{}');
        } catch (_) { /* ignore */ }

        if (saved.charts === 'collapsed' && saved.table !== 'expanded') {
            saved.table = 'collapsed';
        }
        if ('charts' in saved) {
            delete saved.charts;
            localStorage.setItem(ACCORDION_STATE_KEY, JSON.stringify(saved));
        }

        accordions.forEach(section => {
            const id = section.dataset.accordionId;
            const trigger = section.querySelector('.dashboard-accordion-trigger');
            if (!trigger) return;

            const collapsed = saved[id] === 'collapsed';
            setAccordionCollapsed(section, trigger, collapsed, false);

            trigger.addEventListener('click', () => {
                const willCollapse = !section.classList.contains('collapsed');
                setAccordionCollapsed(section, trigger, willCollapse, true);
                if (id === 'table' && !willCollapse) {
                    scheduleChartResize();
                }
            });
        });
    }

    function setAccordionCollapsed(section, trigger, collapsed, persist) {
        section.classList.toggle('collapsed', collapsed);
        trigger.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        const body = section.querySelector('.dashboard-accordion-body');
        if (body) body.setAttribute('aria-hidden', collapsed ? 'true' : 'false');
        if (!persist) return;
        const id = section.dataset.accordionId;
        let saved = {};
        try {
            saved = JSON.parse(localStorage.getItem(ACCORDION_STATE_KEY) || '{}');
        } catch (_) { /* ignore */ }
        saved[id] = collapsed ? 'collapsed' : 'expanded';
        localStorage.setItem(ACCORDION_STATE_KEY, JSON.stringify(saved));
    }

    function expandAccordion(id) {
        const section = document.querySelector(`.dashboard-accordion[data-accordion-id="${id}"]`);
        if (!section || !section.classList.contains('collapsed')) return;
        const trigger = section.querySelector('.dashboard-accordion-trigger');
        if (!trigger) return;
        setAccordionCollapsed(section, trigger, false, true);
        if (id === 'table') scheduleChartResize();
    }

    function scheduleChartResize() {
        requestAnimationFrame(resizeDashboardCharts);
        setTimeout(resizeDashboardCharts, 420);
    }

    function resizeDashboardCharts() {
        barChart?.resize();
        lineChart?.resize();
        publisherDetailChart?.resize();
    }

    function onPivotBodyClick(e) {
        const td = e.target.closest('td.num.drillable');
        if (!td) return;
        const tr = td.closest('tr[data-row-index]');
        if (!tr) return;
        const rowIdx = Number(tr.dataset.rowIndex);
        const colId = td.dataset.colId;
        const row = tableRowsCache[rowIdx];
        if (!row || !colId) return;
        applyDetailFilterFromTable(row, colId);
    }

    function setFilterMode(mode) {
        if (!['include', 'exclude'].includes(mode) || mode === filterMode) return;
        filterMode = mode;
        syncFilterModeUI();
        renderFilters();
        refreshPublishersSection();
    }

    function syncFilterModeUI() {
        filterModeBtns.forEach(btn => {
            const active = btn.dataset.filterMode === filterMode;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-selected', active ? 'true' : 'false');
        });
    }

    function refreshPublishersSection() {
        applyPublisherFilters();
        renderPublishersSection();
    }

    function updateFiltersSummary() {
        if (!filtersSummary) return;
        const parts = [];
        const prefix = filterMode === 'exclude' ? 'Excl. ' : '';
        for (const field of [...FILTER_LAYOUT.wide, ...FILTER_LAYOUT.compact]) {
            const selected = filters[field] || [];
            if (selected.length) {
                const label = D.S21_GROUP_FIELDS.find(g => g.id === field)?.label || field;
                parts.push(`${prefix}${label} (${selected.length})`);
            }
        }
        filtersSummary.textContent = parts.length ? parts.join(' · ') : 'Sin restricciones';
    }

    function initFiltersCollapsed() {
        if (!filtersPanel) return;
        const collapsed = localStorage.getItem(FILTERS_COLLAPSED_KEY) === '1';
        filtersPanel.classList.toggle('collapsed', collapsed);
        btnToggleFilters.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        filtersChevron.textContent = collapsed ? '▸' : '▾';
    }

    function getActiveFilters() {
        const active = {};
        for (const [field, values] of Object.entries(filters)) {
            if (values?.length) active[field] = values;
        }
        return active;
    }

    function refresh() {
        kpisCache = D.computeKpis(flat.mensual, flat.publicadores);
        renderKpis(kpisCache);

        const g1 = group1.value;
        const g2 = group2.value;
        const groupFields = [g1, g2].filter((v, i, arr) => v && arr.indexOf(v) === i);
        const scopedMensual = D.filterMensualByScope(flat.mensual, totalsScope);

        aggregated = D.aggregateRows(scopedMensual, groupFields, flat.publicadores);
        renderTable(aggregated, groupFields);
        renderCharts(aggregated, scopedMensual, metricSelect.value, groupFields);
        refreshPublishersSection();
    }

    function refreshCharts() {
        const g1 = group1.value;
        const g2 = group2.value;
        const groupFields = [g1, g2].filter((v, i, arr) => v && arr.indexOf(v) === i);
        const scopedMensual = D.filterMensualByScope(flat.mensual, totalsScope);
        renderCharts(aggregated, scopedMensual, metricSelect.value, groupFields);
    }

    function setChartExcludeMonths(n) {
        const months = Math.max(0, Math.min(11, Number(n) || 0));
        if (months === chartExcludeMonths) return;
        chartExcludeMonths = months;
        chartExcludeToggle?.querySelectorAll('.chart-exclude-btn').forEach(btn => {
            const active = Number(btn.dataset.months) === months;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        refreshCharts();
    }

    function chartExcludeHintHtml() {
        if (!chartExcludeMonths) return '';
        const labels = D.excludedMonthLabels(chartExcludeMonths);
        if (!labels.length) return '';
        return `<span class="chart-title-note">(sin ${escapeHtml(labels.join(', ').toLowerCase())})</span>`;
    }

    function chartBarTitleText(metricId, groupFields) {
        const metric = D.S21_CHART_METRICS.find(m => m.id === metricId);
        const metricLabel = metric?.label || metricId;
        const labels = groupFields.filter(Boolean).map(f =>
            D.S21_GROUP_FIELDS.find(g => g.id === f)?.label || f
        );
        const groupPart = labels.length ? labels.join(' · ') : 'Grupo';
        return `${metricLabel} por ${groupPart}`;
    }

    function publicadoresForBarChart(mensualScoped) {
        const byProfile = filterPublicadoresForCharts();
        if (totalsScope === 'year') return byProfile;
        return D.publicadoresEnMensual(mensualScoped, byProfile);
    }

    function chartScopeHintHtml() {
        if (totalsScope === 'year') return '';
        return chartTitleNoteHtml(D.mesLabel(totalsScope, 'completo'));
    }

    function chartTitleNoteHtml(text) {
        const s = String(text || '').trim();
        if (!s) return '';
        return `<span class="chart-title-note">(${escapeHtml(s.toLowerCase())})</span>`;
    }

    function setChartTitle(el, mainHtml, ...notes) {
        if (!el) return;
        el.innerHTML = [mainHtml, ...notes.filter(Boolean)].join(' ');
    }

    function renderPublishersSection() {
        if (!publisherListBody) return;

        const pubs = D.sortPublishers(filteredPubCache);
        if (selectedPublisherKey && !pubs.some(p => D.personKey(p) === selectedPublisherKey)) {
            selectedPublisherKey = '';
        }

        if (publisherCount) {
            publisherCount.textContent = `${pubs.length} publicador${pubs.length === 1 ? '' : 'es'}`;
        }

        renderPublisherList();
        renderPublisherDetail();
    }

    function filterPublishersForList(pubs) {
        if (!publisherSearchQuery) return pubs;
        return pubs.filter(p => {
            const haystack = `${p.nombre} ${p.origen} ${displayPerfil(p.origen)}`.toLowerCase();
            return haystack.includes(publisherSearchQuery);
        });
    }

    function sortPublisherRows(rows) {
        const col = PUBLISHER_LIST_COLUMNS.find(c => c.id === publisherSortState.column);
        if (!col) return rows;
        const dir = publisherSortState.direction === 'asc' ? 1 : -1;
        return [...rows].sort((a, b) => {
            const va = col.getValue(a);
            const vb = col.getValue(b);
            if (col.type === 'number') {
                return (Number(va) - Number(vb)) * dir;
            }
            return String(va).localeCompare(String(vb), 'es') * dir;
        });
    }

    function onPublisherSortColumn(columnId) {
        if (publisherSortState.column === columnId) {
            publisherSortState.direction = publisherSortState.direction === 'asc' ? 'desc' : 'asc';
        } else {
            publisherSortState.column = columnId;
            publisherSortState.direction = 'asc';
        }
        renderPublisherList();
    }

    function renderPublisherList() {
        if (!publisherListBody) return;

        if (publisherListHead) {
            publisherListHead.innerHTML = `<tr>${PUBLISHER_LIST_COLUMNS.map(col => {
                const sortClass = publisherSortState.column === col.id
                    ? (publisherSortState.direction === 'asc' ? 'sort-asc' : 'sort-desc')
                    : '';
                return `<th class="sortable ${sortClass}" data-col="${col.id}" scope="col">
                    ${escapeHtml(col.label)}<span class="sort-icon" aria-hidden="true"></span>
                </th>`;
            }).join('')}</tr>`;
            publisherListHead.querySelectorAll('th.sortable').forEach(th => {
                th.addEventListener('click', () => onPublisherSortColumn(th.dataset.col));
            });
        }

        const pubs = sortPublisherRows(filterPublishersForList(filteredPubCache));
        if (!pubs.length) {
            publisherListBody.innerHTML = `<tr><td colspan="4" class="publisher-list-empty">Sin publicadores con los filtros actuales.</td></tr>`;
            return;
        }

        publisherListBody.innerHTML = pubs.map(pub => {
            const key = D.personKey(pub);
            const selected = key === selectedPublisherKey ? ' selected' : '';
            return `<tr data-publisher-key="${escapeAttr(key)}" class="${selected.trim()}">
                <td title="${escapeAttr(pub.nombre)}">${escapeHtml(pub.nombre)}</td>
                <td title="${escapeAttr(displayPerfil(pub.origen))}">${escapeHtml(displayPerfil(pub.origen))}</td>
                <td>${escapeHtml(showField(pub.fecha_nacimiento))}</td>
                <td>${escapeHtml(showField(pub.fecha_bautismo))}</td>
            </tr>`;
        }).join('');

        publisherListBody.querySelectorAll('tr[data-publisher-key]').forEach(tr => {
            tr.addEventListener('click', () => selectPublisher(tr.dataset.publisherKey));
        });
    }

    function selectPublisher(key) {
        selectedPublisherKey = key;
        renderPublisherList();
        renderPublisherDetail();
    }

    function showComentario(text) {
        const t = String(text ?? '').trim();
        return t || '—';
    }

    function renderPublisherDetail() {
        if (!publisherDetailEmpty || !publisherDetailContent) return;

        if (!selectedPublisherKey) {
            destroyPublisherDetailChart();
            publisherDetailEmpty.classList.remove('hidden');
            publisherDetailContent.classList.add('hidden');
            publisherDetailContent.innerHTML = '';
            return;
        }

        const pub = filteredPubCache.find(p => D.personKey(p) === selectedPublisherKey);
        if (!pub) {
            selectedPublisherKey = '';
            destroyPublisherDetailChart();
            publisherDetailEmpty.classList.remove('hidden');
            publisherDetailContent.classList.add('hidden');
            publisherDetailContent.innerHTML = '';
            return;
        }

        const monthly = D.getPublisherMonthlyRows(filteredMensualCache, selectedPublisherKey);
        const monthlyTotals = D.sumPublisherMonthly(monthly);
        const focusMes = detailFocusMes();
        if (detailMonthlyFilter?.detailMetric) {
            publisherDetailMetric = D.resolvePublisherDetailMetric(
                detailMonthlyFilter.detailMetric,
                publisherDetailMetric
            );
        }
        const badges = [
            ['Anciano', pub.anciano],
            ['Siervo min.', pub.siervo_ministerial],
            ['Prec. reg.', pub.precursor_regular],
            ['Prec. esp.', pub.precursor_especial],
            ['Misionero', pub.misionero],
        ].filter(([, val]) => val === 'Sí')
            .map(([label]) => `<span class="publisher-badge">${escapeHtml(label)}</span>`)
            .join('');

        publisherDetailEmpty.classList.add('hidden');
        publisherDetailContent.classList.remove('hidden');
        publisherDetailMonthlyCache = monthly;
        publisherDetailContent.innerHTML = `
            <div class="publisher-profile">
                <h4 class="publisher-name">${escapeHtml(pub.nombre)}</h4>
                <div class="publisher-meta">
                    ${escapeHtml(displayPerfil(pub.origen))} · ${escapeHtml(pub.sexo)} · ${escapeHtml(pub.esperanza)}<br>
                    Nacimiento: ${escapeHtml(showField(pub.fecha_nacimiento))} · Bautismo: ${escapeHtml(showField(pub.fecha_bautismo))}
                </div>
                ${badges ? `<div class="publisher-badges">${badges}</div>` : ''}
            </div>
            <div class="publisher-monthly-panel">
                <div class="publisher-monthly-grid">
                    <div class="publisher-monthly-head">
                        <span>Mes</span>
                        <span class="num">Horas</span>
                        <span class="num">Cursos</span>
                        <span class="num">Part.</span>
                        <span class="num">P. aux.</span>
                        <span class="comment-head">Comentarios</span>
                    </div>
                    ${monthly.map(row => {
                        const focused = focusMes && row.mes === focusMes;
                        const rowClass = focused
                            ? 'publisher-monthly-row publisher-monthly-row-focus publisher-monthly-row-flash'
                            : 'publisher-monthly-row';
                        const comentario = showComentario(row.notas);
                        return `<div class="${rowClass}" data-mes="${escapeAttr(row.mes)}">
                        <span>${escapeHtml(row.mes_label)}</span>
                        <span class="num">${formatNum(row.horas)}</span>
                        <span class="num">${formatNum(row.cursos)}</span>
                        <span class="num">${row.participacion ? 'Sí' : '—'}</span>
                        <span class="num">${row.precursor_auxiliar ? 'Sí' : '—'}</span>
                        <span class="comment${comentario === '—' ? ' comment-empty' : ''}" title="${escapeAttr(comentario === '—' ? '' : comentario)}">${escapeHtml(comentario)}</span>
                    </div>`;
                    }).join('')}
                    <div class="publisher-monthly-row publisher-monthly-total">
                        <span>Total</span>
                        <span class="num">${formatNum(monthlyTotals.horas)}</span>
                        <span class="num">${formatNum(monthlyTotals.cursos)}</span>
                        <span class="num">${formatNum(monthlyTotals.participacion)}</span>
                        <span class="num">${formatNum(monthlyTotals.precursor_auxiliar)}</span>
                        <span class="comment comment-empty"></span>
                    </div>
                </div>
                <div class="publisher-chart-panel">
                    <div class="publisher-metric-toggle" role="tablist" aria-label="Métrica del gráfico">
                        ${PUBLISHER_DETAIL_METRICS.map(m =>
                            `<button type="button" class="publisher-metric-btn${m.id === publisherDetailMetric ? ' active' : ''}"
                                data-metric="${m.id}" role="tab" aria-selected="${m.id === publisherDetailMetric}">${m.label}</button>`
                        ).join('')}
                    </div>
                    <div class="publisher-chart-wrap">
                        <canvas id="publisher-detail-chart"></canvas>
                    </div>
                </div>
            </div>`;

        publisherDetailContent.querySelectorAll('.publisher-metric-btn').forEach(btn => {
            btn.addEventListener('click', () => setPublisherDetailMetric(btn.dataset.metric));
        });
        renderPublisherDetailChart(monthly, publisherDetailMetric);
        if (focusMes) {
            requestAnimationFrame(() => {
                const row = publisherDetailContent.querySelector(`.publisher-monthly-row-focus[data-mes="${focusMes}"]`);
                row?.querySelector('span')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            });
        }
    }

    function setPublisherDetailMetric(metricId) {
        if (!PUBLISHER_DETAIL_METRICS.some(m => m.id === metricId) || metricId === publisherDetailMetric) return;
        publisherDetailMetric = metricId;
        publisherDetailContent?.querySelectorAll('.publisher-metric-btn').forEach(btn => {
            const active = btn.dataset.metric === metricId;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        renderPublisherDetailChart(publisherDetailMonthlyCache, metricId);
    }

    function publisherMetricValue(row, metricId) {
        switch (metricId) {
            case 'cursos': return row.cursos || 0;
            case 'participacion': return row.participacion || 0;
            case 'precursor_auxiliar': return row.precursor_auxiliar || 0;
            default: return row.horas || 0;
        }
    }

    function renderPublisherDetailChart(monthly, metricId) {
        destroyPublisherDetailChart();
        const canvas = publisherDetailContent?.querySelector('#publisher-detail-chart');
        if (!canvas || !monthly.length) return;

        const spec = PUBLISHER_DETAIL_METRICS.find(m => m.id === metricId) || PUBLISHER_DETAIL_METRICS[0];
        const focusMes = detailFocusMes();
        const labels = monthly.map(r => r.mes_corto || D.mesLabel(r.mes, 'corto'));
        const data = monthly.map(r => publisherMetricValue(r, metricId));
        const isBinary = metricId === 'participacion' || metricId === 'precursor_auxiliar';

        publisherDetailChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: spec.label,
                    data,
                    borderColor: 'rgba(56, 189, 248, 1)',
                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: monthly.map(r => focusMes && r.mes === focusMes ? 5 : 2),
                    pointBackgroundColor: monthly.map(r =>
                        focusMes && r.mes === focusMes ? 'rgba(251, 191, 36, 1)' : 'rgba(56, 189, 248, 1)'
                    ),
                    pointBorderColor: monthly.map(r =>
                        focusMes && r.mes === focusMes ? 'rgba(251, 191, 36, 1)' : 'rgba(56, 189, 248, 1)'
                    ),
                    pointHoverRadius: 4,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label(ctx) {
                                const v = ctx.parsed.y;
                                if (isBinary) return `${spec.label}: ${v ? 'Sí' : 'No'}`;
                                return `${spec.label}: ${Math.round(v).toLocaleString('es')}`;
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        ticks: { color: '#8fa3bf', font: { size: 10 }, maxRotation: 0 },
                        grid: { color: 'rgba(255,255,255,0.06)' },
                    },
                    y: {
                        beginAtZero: true,
                        max: isBinary ? 1 : undefined,
                        ticks: {
                            color: '#8fa3bf',
                            font: { size: 10 },
                            stepSize: isBinary ? 1 : undefined,
                            callback(v) {
                                if (isBinary) return v ? 'Sí' : '—';
                                return v;
                            },
                        },
                        grid: { color: 'rgba(255,255,255,0.06)' },
                    },
                },
            },
        });
    }

    function destroyPublisherDetailChart() {
        if (publisherDetailChart) {
            publisherDetailChart.destroy();
            publisherDetailChart = null;
        }
    }

    function exportPublishersCsv() {
        const pubs = sortPublisherRows(filterPublishersForList(filteredPubCache));
        if (!pubs.length) return;
        const csv = D.publishersToCsv(pubs, displayPerfil);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `publicadores_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    function showField(val) {
        const s = String(val ?? '').trim();
        return s || '—';
    }

    function buildTableColumns(groupFields) {
        const cols = groupFields.map((f, i) => ({
            id: `group_${i}`,
            label: D.S21_GROUP_FIELDS.find(g => g.id === f)?.label || f,
            type: 'text',
            getValue: row => {
                const val = row.keys[i]?.value ?? '—';
                if (row.keys[i]?.field === 'mes') return D.mesLabel(val, 'completo');
                if (row.keys[i]?.field === 'origen') return displayPerfil(val);
                return val;
            },
        }));
        for (const metricId of D.totalsMetricColumns(totalsScope)) {
            const spec = D.TOTALS_METRIC_COLUMNS[metricId];
            cols.push({
                id: metricId,
                label: spec.label,
                type: 'number',
                getValue: row => spec.getValue(row),
            });
        }
        return cols;
    }

    function sortRows(rows, columns) {
        const col = columns.find(c => c.id === sortState.column);
        if (!col) return rows;
        const dir = sortState.direction === 'asc' ? 1 : -1;
        return [...rows].sort((a, b) => {
            const va = col.getValue(a);
            const vb = col.getValue(b);
            if (col.type === 'number') {
                return (Number(va) - Number(vb)) * dir;
            }
            return String(va).localeCompare(String(vb), 'es') * dir;
        });
    }

    function onSortColumn(columnId) {
        if (sortState.column === columnId) {
            sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
        } else {
            sortState.column = columnId;
            sortState.direction = columnId.startsWith('group_') ? 'asc' : 'desc';
        }
        const g1 = group1.value;
        const g2 = group2.value;
        const groupFields = [g1, g2].filter((v, i, arr) => v && arr.indexOf(v) === i);
        renderTable(aggregated, groupFields);
    }

    function renderTable(rows, groupFields) {
        tableColumns = buildTableColumns(groupFields);
        tableRowsCache = sortRows(rows, tableColumns);
        const sorted = tableRowsCache;

        pivotHead.innerHTML = `<tr>${tableColumns.map(col => {
            const sortClass = sortState.column === col.id
                ? (sortState.direction === 'asc' ? 'sort-asc' : 'sort-desc')
                : '';
            return `<th class="sortable ${sortClass}" data-col="${col.id}" scope="col">
                ${escapeHtml(col.label)}<span class="sort-icon" aria-hidden="true"></span>
            </th>`;
        }).join('')}</tr>`;

        pivotHead.querySelectorAll('th.sortable').forEach(th => {
            th.addEventListener('click', () => onSortColumn(th.dataset.col));
        });

        pivotBody.innerHTML = sorted.map((row, rowIdx) =>
            `<tr data-row-index="${rowIdx}">${tableColumns.map(col => {
                const val = col.getValue(row);
                if (col.type === 'number') {
                    const text = formatNum(val);
                    return `<td class="num drillable" data-col-id="${col.id}" title="Filtrar detalle por este valor">${text}</td>`;
                }
                return `<td>${escapeHtml(val)}</td>`;
            }).join('')}</tr>`
        ).join('');

        const totals = sorted.reduce((acc, r) => {
            acc.horas += r.horas;
            acc.cursos += r.cursos;
            acc.participacion += r.participacion;
            acc.precursor_auxiliar += r.precursor_auxiliar;
            acc.inactivos += r.inactivos || 0;
            return acc;
        }, { horas: 0, cursos: 0, participacion: 0, precursor_auxiliar: 0, inactivos: 0 });

        const metricIds = D.totalsMetricColumns(totalsScope);
        const footerMetrics = metricIds.map(id => {
            if (id === 'publicadores') {
                let n = kpisCache.publicadores_total ?? 0;
                if (totalsScope !== 'year') {
                    n = new Set(
                        D.filterMensualByScope(flat.mensual, totalsScope).map(r => D.personKey(r))
                    ).size;
                }
                return `<td class="num">${formatNum(n)}</td>`;
            }
            if (id === 'inactivos') {
                let n = kpisCache.metrics?.inactivos?.total ?? totals.inactivos;
                if (totalsScope !== 'year') n = totals.inactivos;
                return `<td class="num">${formatNum(n)}</td>`;
            }
            return `<td class="num">${formatNum(totals[id] ?? 0)}</td>`;
        }).join('');

        const groupCells = groupFields.length
            ? groupFields.map((_, i) => i === 0 ? '<td>Total</td>' : '<td></td>').join('')
            : '<td>Total</td>';
        pivotFoot.innerHTML = `<tr>${groupCells}${footerMetrics}</tr>`;
    }

    function setKpiMode(mode) {
        if (!['total', 'max', 'avg', 'last'].includes(mode) || mode === kpiMode) return;
        kpiMode = mode;
        kpiModeBtns.forEach(btn => {
            const active = btn.dataset.kpiMode === mode;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        renderKpis(kpisCache);
    }

    function renderKpis(kpis) {
        if (!kpis?.metrics) {
            kpiGrid.innerHTML = '';
            return;
        }
        const lastHint = kpis.lastRegisteredMonthShort && kpis.lastRegisteredMonthShort !== '—'
            ? kpis.lastRegisteredMonthShort
            : '';
        kpiGrid.innerHTML = KPI_ITEMS.map(({ key, label }) => {
            const m = kpis.metrics[key];
            let valueHtml;
            let hint = '';
            if (kpiMode === 'max') {
                valueHtml = formatNum(m.max);
                if (m.maxMes && m.maxMes !== '—') hint = m.maxMes;
            } else if (kpiMode === 'avg') {
                valueHtml = formatNum(m.avg, 1);
            } else if (kpiMode === 'last') {
                valueHtml = formatNum(m.last);
                if (lastHint) hint = lastHint;
            } else {
                valueHtml = formatNum(m.total);
            }
            return `<div class="kpi-card">
                <span class="kpi-value">${valueHtml}</span>
                <span class="kpi-label">${label}</span>
                ${hint ? `<span class="kpi-hint">${escapeHtml(hint)}</span>` : ''}
            </div>`;
        }).join('');
    }

    function renderCharts(aggRows, filteredMensual, metricId, groupFields) {
        const fields = groupFields || [];
        const onlyMes = fields.length === 1 && fields[0] === 'mes';
        const hideBar = onlyMes;

        if (chartBarCard) chartBarCard.classList.toggle('hidden', hideBar);
        if (chartGrid) chartGrid.classList.toggle('single-chart', hideBar);

        const mensualByProfileScoped = filterMensualForCharts(filteredMensual);
        const mensualForBar = D.filterMensualByExcludedMonths(mensualByProfileScoped, chartExcludeMonths);
        const mensualForTrend = D.filterMensualByExcludedMonths(
            filterMensualForCharts(flat.mensual),
            chartExcludeMonths
        );
        const barRows = D.aggregateRows(
            mensualForBar,
            fields,
            publicadoresForBarChart(mensualForBar)
        );
        const trend = D.trimMonthlySeries(
            D.aggregateMonthlyTrend(mensualForTrend, metricId),
            chartExcludeMonths
        );
        const focusMes = totalsScope !== 'year' ? totalsScope : null;
        const lineStyles = buildLineChartFocusStyles(trend, focusMes);
        const excludeHint = chartExcludeHintHtml();
        const lineLabels = trend.map(t => t.mes_label);
        const lineData = trend.map(t => t.value);
        const chartLabel = D.chartMetricLabel(metricId);

        destroyCharts();

        if (!hideBar) {
            const sorted = D.sortRowsForBarChart(barRows, fields, metricId);
            const top = sorted.slice(0, 16);
            chartBarRowsCache = top;
            const barLabels = top.map(r => formatAggRowLabel(r));
            const barData = top.map(r => D.chartMetricValue(r, metricId));

            if (chartBarTitle) {
                setChartTitle(
                    chartBarTitle,
                    escapeHtml(chartBarTitleText(metricId, fields)),
                    chartScopeHintHtml(),
                    excludeHint
                );
            }

            barChart = new Chart(document.getElementById('chart-bar'), {
                type: 'bar',
                data: {
                    labels: barLabels,
                    datasets: [{
                        label: chartLabel,
                        data: barData,
                        backgroundColor: 'rgba(56, 189, 248, 0.65)',
                        borderColor: 'rgba(56, 189, 248, 1)',
                        borderWidth: 1,
                        borderRadius: 4,
                    }],
                },
                options: {
                    ...chartOptions(metricId),
                    onClick: (_evt, elements) => {
                        if (!elements.length) return;
                        const row = chartBarRowsCache[elements[0].index];
                        if (row) applyDetailFilterFromBar(row);
                    },
                },
            });
        } else {
            chartBarRowsCache = [];
        }

        chartLineTrendCache = trend;
        const lineCardTitle = document.querySelector('#chart-line-card h3');
        if (lineCardTitle) {
            const focusHint = focusMes
                ? chartTitleNoteHtml(`foco: ${D.mesLabel(focusMes, 'completo')}`)
                : '';
            setChartTitle(lineCardTitle, 'Tendencia mensual', excludeHint, focusHint);
        }

        lineChart = new Chart(document.getElementById('chart-line'), {
            type: 'line',
            data: {
                labels: lineLabels,
                datasets: [{
                    label: chartLabel,
                    data: lineData,
                    borderColor: 'rgba(16, 185, 129, 0.85)',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: lineStyles.pointRadius,
                    pointBackgroundColor: lineStyles.pointBackgroundColor,
                    pointBorderColor: lineStyles.pointBorderColor,
                    pointBorderWidth: lineStyles.pointBorderWidth,
                }],
            },
            options: {
                ...chartLineOptions(metricId, trend, focusMes),
                onClick: (_evt, elements) => {
                    if (!elements.length) return;
                    const point = chartLineTrendCache[elements[0].index];
                    if (point) applyDetailFilterFromLinePoint(point);
                },
            },
        });
    }

    function buildLineChartFocusStyles(trend, focusMes) {
        if (!focusMes) {
            return {
                pointRadius: 3,
                pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                pointBorderColor: 'rgba(16, 185, 129, 1)',
                pointBorderWidth: 1,
            };
        }
        return {
            pointRadius: trend.map(t => t.mes === focusMes ? 6 : 3),
            pointBackgroundColor: trend.map(t =>
                t.mes === focusMes ? 'rgba(56, 189, 248, 1)' : 'rgba(16, 185, 129, 0.35)'
            ),
            pointBorderColor: trend.map(t =>
                t.mes === focusMes ? '#7dd3fc' : 'rgba(16, 185, 129, 0.45)'
            ),
            pointBorderWidth: trend.map(t => t.mes === focusMes ? 2 : 1),
        };
    }

    function chartLineOptions(metricId, trend, focusMes) {
        const base = chartOptions(metricId);
        if (!focusMes) return base;
        return {
            ...base,
            scales: {
                ...base.scales,
                x: {
                    ...base.scales.x,
                    ticks: {
                        ...base.scales.x.ticks,
                        color(ctx) {
                            const mes = trend[ctx.index]?.mes;
                            return mes === focusMes ? '#38bdf8' : '#6b8299';
                        },
                        font(ctx) {
                            const mes = trend[ctx.index]?.mes;
                            return { size: 10, weight: mes === focusMes ? '700' : '400' };
                        },
                    },
                },
            },
        };
    }

    function chartOptions(metricId) {
        const spec = D.S21_CHART_METRICS.find(m => m.id === metricId);
        const isAvg = spec?.aggregation === 'avg';
        const isCount = spec?.aggregation === 'count';
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label(ctx) {
                            const v = ctx.parsed.y;
                            if (isAvg) {
                                return `${ctx.dataset.label}: ${v.toLocaleString('es', { maximumFractionDigits: 1 })}`;
                            }
                            return `${ctx.dataset.label}: ${Math.round(v).toLocaleString('es')}`;
                        },
                    },
                },
            },
            scales: {
                x: {
                    ticks: { color: '#8fa3bf', maxRotation: 45, font: { size: 10 } },
                    grid: { color: 'rgba(255,255,255,0.06)' },
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#8fa3bf',
                        font: { size: 10 },
                        precision: isCount ? 0 : undefined,
                    },
                    grid: { color: 'rgba(255,255,255,0.06)' },
                },
            },
        };
    }

    function destroyCharts() {
        if (barChart) { barChart.destroy(); barChart = null; }
        if (lineChart) { lineChart.destroy(); lineChart = null; }
    }

    function exportCsv() {
        if (!aggregated.length) return;
        const g1 = group1.value;
        const g2 = group2.value;
        const groupFields = [g1, g2].filter((v, i, arr) => v && arr.indexOf(v) === i);
        const csv = D.aggregatedToCsv(
            sortRows(aggregated, tableColumns),
            groupFields,
            displayGroupValue,
            totalsScope
        );
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `analisis_servicio_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    function toggleFilters() {
        if (!filtersPanel) return;
        const collapsed = filtersPanel.classList.toggle('collapsed');
        btnToggleFilters.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        filtersChevron.textContent = collapsed ? '▸' : '▾';
        localStorage.setItem(FILTERS_COLLAPSED_KEY, collapsed ? '1' : '0');
        updateFiltersSummary();
    }

    function formatNum(n, decimals) {
        if (decimals !== undefined) {
            return Number(n || 0).toLocaleString('es', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
            });
        }
        return Number(n || 0).toLocaleString('es');
    }

    function escapeHtml(s) {
        return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function escapeAttr(s) {
        return String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    }
});
