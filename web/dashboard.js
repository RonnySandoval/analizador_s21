document.addEventListener('DOMContentLoaded', () => {
    const D = window.S21DashboardData;
    const G = window.S21DashboardGrupos;
    const FILTERS_COLLAPSED_KEY = 'analisis_servicio_filters_collapsed';
    const ACCORDION_STATE_KEY = 'analisis_servicio_accordion_state';
    const PERFIL_ALIASES_KEY = 'analisis_servicio_perfil_aliases';
    const CHART_PROFILES_KEY = 'analisis_servicio_chart_profiles';
    const EXPORT_GROUPS_KEY = 'analisis_servicio_export_groups';
    const Storage = window.S21DashboardStorage;
    const Datos = window.S21DashboardDatos;

    const FILTER_LAYOUT = {
        rows: [
            ['origen', 'grupo'],
            ['sexo', 'esperanza'],
            ['anciano', 'siervo_ministerial'],
            ['precursor_regular', 'precursor_especial', 'misionero'],
        ],
    };

    const FILTER_FIELDS = FILTER_LAYOUT.rows.flat();

    const FILTER_SHORT_LABELS = {
        origen: 'Perfil',
        grupo: 'Grupo',
        sexo: 'Sexo',
        esperanza: 'Esper.',
        anciano: 'Anc.',
        siervo_ministerial: 'S. min.',
        precursor_regular: 'P.reg',
        precursor_especial: 'P.esp',
        misionero: 'Mis.',
    };

    const dropZone = document.getElementById('drop-zone');
    const btnClearData = document.getElementById('btn-clear-data'); // legacy, may be null
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
    const btnExportPng = document.getElementById('btn-export-png');
    const btnExportPdf = document.getElementById('btn-export-pdf');
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
    const btnExportPublishersCsv = document.getElementById('btn-export-publishers-csv');
    const btnExportPublishersPng = document.getElementById('btn-export-publishers-png');
    const btnExportPublishersPdf = document.getElementById('btn-export-publishers-pdf');
    const exportOptionsModal = document.getElementById('export-options-modal');
    const exportOptionsGroups = document.getElementById('export-options-groups');
    const exportOptionsConfirm = document.getElementById('export-options-confirm');
    const exportOptionsTitle = document.getElementById('export-options-title');
    const publisherBulkGrupo = document.getElementById('publisher-bulk-grupo');
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
    let publisherGroupFilter = '';
    let pendingExport = null;
    let detailMonthlyFilter = null;
    let tableRowsCache = [];
    let chartBarRowsCache = [];
    let chartLineTrendCache = [];
    let expandedPublisherListKey = '';
    let perfilAliases = {};
    let congregacionDetectada = null;
    let publisherDetailReturn = null;
    let publisherDetailPaintGen = 0;
    let publisherDetailMotionMode = 'instant';
    let layoutMode = 'continuous';
    let singleActiveSection = 'kpi';
    let navSwapGen = 0;
    const NAV_SECTION_ORDER = ['kpi', 'table', 'grupos', 'publishers'];

    const dashboardHeaderSection = document.getElementById('dashboard-header-section');
    const publisherDetailBackWrap = document.getElementById('publisher-detail-back-wrap');
    const btnToggleLayoutMode = document.getElementById('btn-toggle-layout-mode');
    const btnPublisherBack = document.getElementById('btn-publisher-back');
    const publisherBackLabel = document.getElementById('publisher-back-label');

    const Icons = window.S21DashboardIcons;

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
        { id: 'grupo', label: 'Grupo', type: 'text', getValue: row => row.grupo || '—' },
        { id: 'fecha_nacimiento', label: 'Nacimiento', type: 'text', getValue: row => row.fecha_nacimiento || '' },
        { id: 'fecha_bautismo', label: 'Bautismo', type: 'text', getValue: row => row.fecha_bautismo || '' },
    ];

    const PUBLISHER_DETAIL_METRICS = [
        { id: 'horas', label: 'Horas', title: 'Horas' },
        { id: 'cursos', label: 'Cursos', title: 'Cursos' },
        { id: 'participacion', label: 'Part.', title: 'Participación' },
        { id: 'precursor_auxiliar', label: 'P. aux.', title: 'Precursor auxiliar' },
    ];

    initControls();
    bindEvents();
    initSectionAccordions();
    initDashboardNav();
    initLayoutMode();
    initFiltersCollapsed();
    initDatosModule();
    initWizard();
    initGruposModule();
    restoreDashboardCache();

    function initDatosModule() {
        if (!Datos) return;
        Datos.init({
            onDatasetActivated: async (loadedPackages, meta) => {
                await applyPackages(loadedPackages, meta);
                await loadGruposForActiveDataset();
                window.S21DashboardWizard?.showLoaded();
            },
            onPanelOpen: async () => {
                if (packages.length || !Storage?.isAvailable()) return;
                try {
                    const active = await Storage.getActiveDataset();
                    if (!active?.packages?.length) return;
                    await applyPackages(active.packages, {
                        label: active.name || active.meta?.label,
                        ...active.meta,
                    });
                    window.S21DashboardWizard?.showLoaded();
                } catch (error) {
                    console.warn('No se pudo restaurar la carga activa al abrir Datos', error);
                }
            },
            onAllDatasetsCleared: () => clearAll(false),
            onClearAll: alsoGrupos => clearAll(alsoGrupos),
        });
    }

    async function applyPackages(loadedPackages, meta, options = {}) {
        packages = loadedPackages;
        currentFuente = meta?.label || meta?.name || 'Carga';
        rebuild();
        if (!options.skipGrupos) {
            await loadGruposForActiveDataset();
        }
    }

    async function loadGruposForActiveDataset() {
        if (!G || !Datos?.getActiveGruposMeta) return;
        try {
            const meta = await Datos.getActiveGruposMeta();
            if (meta.persistGrupos && meta.gruposConfig) {
                G.importConfig(meta.gruposConfig);
            } else {
                G.importConfig(null);
            }
            G.setPersistGrupos(meta.persistGrupos, { silent: true });
        } catch (err) {
            console.warn('No se pudo restaurar grupos de la carga activa', err);
        }
    }

    function initWizard() {
        window.S21DashboardWizard.init({
            onPackagesLoaded: async (loadedPackages, meta) => {
                if (!Datos) {
                    await applyPackages(loadedPackages, meta);
                    return;
                }
                const action = await Datos.promptSaveAction(loadedPackages, meta);
                if (!action) return;
                await applyPackages(loadedPackages, meta);
                await Datos.persistSave(action, loadedPackages, meta);
                Datos.closePanel();
            },
            onClear: () => {
                packages = [];
                currentFuente = '';
            },
            setLoadStatus,
        });
    }

    function initGruposModule() {
        if (!G) return;
        G.init({
            getPublishers: () => flat.publicadores,
            displayPerfil,
            escapeHtml,
            escapeAttr,
            onPersistConfig: gruposConfig => {
                Datos?.syncActiveDatasetGrupos?.({ persistGrupos: true, gruposConfig });
            },
            onPersistDisabled: () => {
                Datos?.syncActiveDatasetGrupos?.({ persistGrupos: false, gruposConfig: null });
            },
            onChange: (options = {}) => {
                applyGruposToFlat();
                renderPublisherBulkGrupoSelect();
                if (options.matrixPatch || options.rolesPatch != null || options.groupPatch != null) {
                    refreshPublishersSection();
                    return;
                }
                renderFilters();
                refreshPublishersSection();
                refresh();
            },
            showHint: msg => setLoadStatus(msg, false),
        });
    }

    function applyGruposToFlat() {
        if (!G || !flat.publicadores.length) return;
        flat.publicadores = G.applyToRows(flat.publicadores);
        flat.mensual = G.applyToRows(flat.mensual);
    }

    function renderPublisherBulkGrupoSelect() {
        if (!publisherBulkGrupo || !G) return;
        const count = G.getConfig().groupCount;
        const selected = publisherGroupFilter;
        publisherBulkGrupo.innerHTML = '<option value="">Todos los grupos</option>' +
            '<option value="0">Sin grupo</option>' +
            Array.from({ length: count }, (_, i) => {
                const n = i + 1;
                return `<option value="${n}">Grupo ${n}</option>`;
            }).join('');
        const valid = selected === '' || selected === '0'
            || (Number(selected) >= 1 && Number(selected) <= count);
        publisherGroupFilter = valid ? selected : '';
        publisherBulkGrupo.value = publisherGroupFilter;
    }

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

    function setExportMenuOpen(menu, open) {
        menu.classList.toggle('is-open', open);
        menu.querySelector('.export-menu-toggle')?.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function closeExportMenus(exceptMenu) {
        document.querySelectorAll('.export-menu.is-open').forEach(menu => {
            if (menu !== exceptMenu) setExportMenuOpen(menu, false);
        });
    }

    function bindExportMenus() {
        document.querySelectorAll('[data-export-menu]').forEach(menu => {
            const toggle = menu.querySelector('.export-menu-toggle');
            toggle?.addEventListener('click', e => {
                e.stopPropagation();
                const willOpen = !menu.classList.contains('is-open');
                closeExportMenus();
                setExportMenuOpen(menu, willOpen);
            });
            menu.querySelectorAll('.export-menu-item').forEach(item => {
                item.addEventListener('click', () => setExportMenuOpen(menu, false));
            });
        });
        document.addEventListener('click', () => closeExportMenus());
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') closeExportMenus();
        });
    }

    function bindEvents() {
        btnClearData?.addEventListener('click', () => clearAll(false));
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
        btnExportCsv.addEventListener('click', () => requestExport('totals', 'csv'));
        btnExportPng?.addEventListener('click', () => requestExport('totals', 'image'));
        btnExportPdf?.addEventListener('click', () => requestExport('totals', 'pdf'));
        btnExportPublishersCsv?.addEventListener('click', () => requestExport('publishers', 'csv'));
        btnExportPublishersPng?.addEventListener('click', () => requestExport('publishers', 'image'));
        btnExportPublishersPdf?.addEventListener('click', () => requestExport('publishers', 'pdf'));
        bindExportOptionsModal();
        bindExportMenus();
        btnPublisherBack?.addEventListener('click', returnFromPublisherDetail);
        document.addEventListener('click', onGruposOpenPublisherClick);
        if (publisherSearch) {
            publisherSearch.addEventListener('input', () => {
                publisherSearchQuery = publisherSearch.value.trim();
                renderPublisherList();
            });
        }
        if (publisherBulkGrupo) {
            publisherBulkGrupo.addEventListener('change', () => {
                publisherGroupFilter = publisherBulkGrupo.value;
                renderPublisherList();
            });
        }

        window.matchMedia('(min-width: 769px)').addEventListener('change', syncPublisherMetricLayout);

        let lastBarHorizontal = prefersHorizontalBarChart();
        let resizeFrame = 0;
        let resizeSettle = 0;
        window.addEventListener('resize', () => {
            const horizontal = prefersHorizontalBarChart();
            if (horizontal !== lastBarHorizontal) {
                lastBarHorizontal = horizontal;
                if (aggregated.length) refresh();
            }
            if (!resizeFrame) {
                resizeFrame = requestAnimationFrame(() => {
                    resizeFrame = 0;
                    resizeDashboardCharts();
                });
            }
            window.clearTimeout(resizeSettle);
            resizeSettle = window.setTimeout(resizeDashboardCharts, 80);
        });

        window.addEventListener('s21-prefs-changed', () => {
            requestAnimationFrame(resizeDashboardCharts);
            if (packages.length) {
                refreshCharts();
                if (selectedPublisherKey) renderPublisherDetail();
            }
        });
    }

    async function restoreDashboardCache() {
        if (!Storage?.isAvailable()) return;
        try {
            const active = await Storage.getActiveDataset();
            if (!active?.packages?.length) return;
            await applyPackages(active.packages, {
                label: active.name || active.meta?.label,
                ...active.meta,
            }, { skipStatus: false, skipGrupos: true });
            await loadGruposForActiveDataset();
            window.S21DashboardWizard.showLoaded();
            Datos?.renderHistory();
        } catch (error) {
            console.warn('No se pudo restaurar datos locales', error);
        }
    }

    let loadStatusHideTimer = null;

    function hideLoadStatus() {
        if (loadStatusHideTimer) {
            clearTimeout(loadStatusHideTimer);
            loadStatusHideTimer = null;
        }
        loadStatus?.classList.add('hidden');
    }

    function setLoadStatus(text, isWarn, options = {}) {
        if (!loadStatus) return;
        const duration = options.duration ?? 4500;
        loadStatus.textContent = text;
        loadStatus.classList.toggle('warn', !!isWarn);
        loadStatus.classList.add('load-status--toast');
        loadStatus.classList.remove('hidden');
        if (loadStatusHideTimer) clearTimeout(loadStatusHideTimer);
        loadStatusHideTimer = setTimeout(hideLoadStatus, duration);
    }

    function clearAll(alsoGrupos = false) {
        packages = [];
        currentFuente = '';
        hideLoadStatus();
        Storage?.clearDashboardCache?.().catch(() => {});
        if (alsoGrupos && G) {
            localStorage.removeItem(G.GRUPOS_KEY);
            G.render?.();
        }
        window.S21DashboardWizard.resetAll();
        window.S21DashboardWizard.showWizard();
        rebuild();
        Datos?.renderHistory();
    }

    function setStageOpen(el, open) {
        setMotionOpen(el, open, { from: 'fade' });
    }

    function setMotionOpen(el, open, options) {
        if (!el) return Promise.resolve();
        el.classList.add('motion-root');
        const motion = window.S21Motion;
        if (motion?.setOpen) return motion.setOpen(el, open, options);
        el.hidden = !open;
        el.classList.toggle('hidden', !open);
        el.classList.toggle('is-open', !!open);
        return Promise.resolve();
    }

    function rebuild() {
        if (!packages.length) {
            flat = { mensual: [], publicadores: [] };
            setStageOpen(dashboardContent, false);
            setStageOpen(emptyState, true);
            destroyCharts();
            destroyPublisherDetailChart();
            selectedPublisherKey = '';
            if (publisherListBody) publisherListBody.innerHTML = '';
            if (publisherDetailContent) {
                publisherDetailContent.innerHTML = '';
            }
            publisherDetailMotionMode = 'instant';
            setPublisherDetailVisible(false, 'instant');
            renderFileList();
            if (chartProfileTogglesWrap) chartProfileTogglesWrap.classList.add('hidden');
            return;
        }

        flat = D.flattenPackages(packages);
        applyGruposToFlat();
        publisherGroupFilter = '';
        renderPublisherBulkGrupoSelect();
        if (G) G.render();
        initPerfilAliases();
        initChartProfileInclude();
        filters = buildDefaultFilters();
        filterMode = 'include';
        detailMonthlyFilter = null;
        updateDetailFilterBanner();
        syncFilterModeUI();
        renderFilters();
        renderFileList();
        setStageOpen(emptyState, false);
        setStageOpen(dashboardContent, true);
        hideLoadStatus();
        refresh();
        if (layoutMode === 'single') {
            applySingleSectionView(singleActiveSection);
        }
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
        for (const field of FILTER_FIELDS) {
            f[field] = [];
        }
        return f;
    }

    function filterFieldLabel(field, short = false) {
        if (short && FILTER_SHORT_LABELS[field]) return FILTER_SHORT_LABELS[field];
        return D.S21_GROUP_FIELDS.find(g => g.id === field)?.label || field;
    }

    function renderFilterCell(field) {
        const label = filterFieldLabel(field);
        const shortLabel = filterFieldLabel(field, true);
        const values = field === 'grupo'
            ? D.uniqueValues(flat.publicadores, field)
            : D.uniqueValues(flat.mensual, field);
        if (!filters[field]) filters[field] = [];
        const activeCount = filters[field].length;
        const chips = values.map(v => {
            const active = filters[field].includes(v);
            return `<button type="button" class="filter-chip ${active ? 'on' : ''}${filterMode === 'exclude' && active ? ' filter-chip-exclude' : ''}"
                data-field="${field}" data-value="${escapeAttr(v)}" title="${escapeAttr(v)}">${escapeHtml(field === 'origen' ? displayPerfil(v) : v)}</button>`;
        }).join('');
        return `<details class="filter-group"${activeCount ? ' open' : ''}>
            <summary class="filter-group-summary" title="${escapeAttr(label)}">
                <span class="filter-group-label">
                    <span class="filter-label-full">${escapeHtml(label)}</span>
                    <span class="filter-label-short" aria-hidden="true">${escapeHtml(shortLabel)}</span>
                </span>
                ${activeCount ? `<span class="filter-group-count">${activeCount}</span>` : ''}
            </summary>
            <div class="filter-group-chips">${chips || '<span class="filter-group-empty">Sin valores</span>'}</div>
        </details>`;
    }

    function renderFilters() {
        filtersBody.innerHTML = `<div class="filters-compact">${FILTER_LAYOUT.rows.map(row =>
            `<div class="filters-row${row.length > 2 ? ' filters-row--triple' : ''}">${row.map(field =>
                renderFilterCell(field)
            ).join('')}</div>`
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

    function motionScrollBehavior() {
        return window.S21Motion?.scrollBehavior?.() || 'smooth';
    }

    function scrollToPublisherSection() {
        expandAccordion('publishers');
        publisherSection?.scrollIntoView({ behavior: motionScrollBehavior(), block: 'start' });
    }

    function getDashboardSectionElement(targetId) {
        if (targetId === 'publishers') return document.getElementById('publisher-section');
        if (targetId === 'grupos') return document.getElementById('grupos-section');
        return document.querySelector(`.dashboard-accordion[data-accordion-id="${targetId}"]`);
    }

    function getCurrentNavTarget() {
        return document.querySelector('.dashboard-nav-btn.active')?.dataset.navTarget || null;
    }

    function initLayoutMode() {
        const prefs = window.S21DashboardPreferences?.loadPrefs?.() || {};
        layoutMode = prefs.layoutMode === 'single' ? 'single' : 'continuous';
        singleActiveSection = getCurrentNavTarget() || 'kpi';
        applyLayoutMode();
        btnToggleLayoutMode?.addEventListener('click', () => {
            if (layoutMode === 'continuous') {
                singleActiveSection = getCurrentNavTarget() || singleActiveSection;
            }
            window.S21DashboardPreferences?.toggleLayoutMode?.();
        });
        window.addEventListener('s21-prefs-changed', e => {
            const next = e.detail?.layoutMode === 'single' ? 'single' : 'continuous';
            if (next === layoutMode) return;
            layoutMode = next;
            applyLayoutMode();
        });
    }

    function syncLayoutModeButton() {
        if (!btnToggleLayoutMode) return;
        const single = layoutMode === 'single';
        btnToggleLayoutMode.setAttribute('aria-pressed', single ? 'true' : 'false');
        btnToggleLayoutMode.setAttribute('aria-label', single ? 'Vista continua' : 'Vista por sección');
        btnToggleLayoutMode.title = single ? 'Vista continua' : 'Vista por sección';
        btnToggleLayoutMode.querySelector('.dashboard-layout-icon--to-single')
            ?.classList.toggle('hidden', single);
        btnToggleLayoutMode.querySelector('.dashboard-layout-icon--to-continuous')
            ?.classList.toggle('hidden', !single);
    }

    function applyLayoutMode() {
        document.body.classList.toggle('dashboard-layout-single', layoutMode === 'single');
        syncLayoutModeButton();
        if (layoutMode === 'single') {
            applySingleSectionView(singleActiveSection);
        } else {
            clearSingleSectionView();
        }
    }

    function navSectionIndex(id) {
        const i = NAV_SECTION_ORDER.indexOf(id);
        return i < 0 ? 0 : i;
    }

    function setSectionMotionOpen(section, open, options) {
        if (!section) return Promise.resolve();
        section.classList.add('motion-root');
        const motion = window.S21Motion;
        if (motion?.setOpen) return motion.setOpen(section, open, options);
        section.hidden = !open;
        section.classList.toggle('hidden', !open);
        section.classList.toggle('is-open', !!open);
        section.classList.remove('is-closing');
        return Promise.resolve();
    }

    function prepareSoloSection(section) {
        if (!section) return;
        section.classList.add('dashboard-section--solo');
        const trigger = section.querySelector('.dashboard-accordion-trigger');
        if (trigger && section.classList.contains('collapsed')) {
            setAccordionCollapsed(section, trigger, false, false);
        }
    }

    function applySingleSectionView(sectionId, options = {}) {
        if (!sectionId) return Promise.resolve();
        const prevId = singleActiveSection;
        const animate = options.animate === true
            && Boolean(prevId)
            && prevId !== sectionId
            && !window.S21Motion?.prefersReduced?.();

        singleActiveSection = sectionId;
        setDashboardNavActive(sectionId);

        const sections = [...document.querySelectorAll('.dashboard-accordion[data-accordion-id]')];
        const incoming = getDashboardSectionElement(sectionId);

        if (!animate) {
            sections.forEach(section => {
                const active = section.dataset.accordionId === sectionId;
                section.classList.toggle('dashboard-section--solo', active);
                setSectionMotionOpen(section, active, { instant: true, from: 'fade' });
            });
            prepareSoloSection(incoming);
            if (sectionId === 'table') scheduleChartResize();
            return Promise.resolve();
        }

        const dir = navSectionIndex(sectionId) - navSectionIndex(prevId);
        const incomingFrom = dir > 0 ? 'right' : 'left';
        const outgoingFrom = dir > 0 ? 'left' : 'right';
        const outgoing = getDashboardSectionElement(prevId);
        const gen = ++navSwapGen;

        sections.forEach(section => {
            const id = section.dataset.accordionId;
            if (id === sectionId || id === prevId) return;
            section.classList.remove('dashboard-section--solo');
            setSectionMotionOpen(section, false, { instant: true });
        });

        outgoing?.classList.remove('dashboard-section--solo');
        prepareSoloSection(incoming);

        setSectionMotionOpen(outgoing, false, { from: outgoingFrom });
        return setSectionMotionOpen(incoming, true, { from: incomingFrom }).then(() => {
            if (gen !== navSwapGen) return;
            if (sectionId === 'table') scheduleChartResize();
        }).finally(() => {
            if (sectionId === 'table') requestAnimationFrame(() => scheduleChartResize());
        });
    }

    function clearSingleSectionView() {
        navSwapGen += 1;
        document.querySelectorAll('.dashboard-accordion[data-accordion-id]').forEach(section => {
            section.classList.remove('dashboard-section--solo', 'is-open', 'is-closing', 'hidden');
            section.hidden = false;
            delete section.dataset.motionFrom;
        });
    }

    function initDashboardNav() {
        const nav = document.getElementById('dashboard-nav');
        if (!nav) return;

        nav.querySelectorAll('[data-nav-target]').forEach(btn => {
            btn.addEventListener('click', () => navigateToDashboardSection(btn.dataset.navTarget));
        });

        const sections = [
            { id: 'kpi', el: document.querySelector('[data-accordion-id="kpi"]') },
            { id: 'table', el: document.querySelector('[data-accordion-id="table"]') },
            { id: 'grupos', el: document.getElementById('grupos-section') },
            { id: 'publishers', el: document.getElementById('publisher-section') },
        ].filter(s => s.el);

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(entries => {
                if (layoutMode !== 'continuous') return;
                const visible = entries
                    .filter(e => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
                if (visible.length) {
                    setDashboardNavActive(visible[0].target.dataset.navSection);
                }
            }, { rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.15, 0.4] });

            sections.forEach(({ id, el }) => {
                el.dataset.navSection = id;
                observer.observe(el);
            });
        }

        syncHeaderSectionTitle(singleActiveSection || 'kpi');
    }

    function getSectionLabel(sectionId) {
        if (!sectionId) return '';
        const section = getDashboardSectionElement(sectionId);
        if (section?.dataset.sectionLabel) return section.dataset.sectionLabel;
        const navBtn = document.querySelector(`.dashboard-nav-btn[data-nav-target="${sectionId}"]`);
        return navBtn?.getAttribute('title') || navBtn?.querySelector('.dashboard-nav-text')?.textContent?.trim() || '';
    }

    function syncHeaderSectionTitle(sectionId) {
        if (!dashboardHeaderSection || !sectionId) return;
        const label = getSectionLabel(sectionId);
        if (label) dashboardHeaderSection.textContent = label;
    }

    function setDashboardNavActive(targetId) {
        document.querySelectorAll('.dashboard-nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.navTarget === targetId);
        });
        syncHeaderSectionTitle(targetId);
    }

    function navigateToDashboardSection(targetId, options = {}) {
        if (!targetId) return Promise.resolve();
        const behavior = motionScrollBehavior();
        if (layoutMode === 'single') {
            const crossSection = options.crossSection === true;
            const promise = applySingleSectionView(targetId, { animate: !crossSection });
            document.getElementById('dashboard-content')?.scrollIntoView({ behavior, block: 'start' });
            return promise;
        }
        setDashboardNavActive(targetId);
        expandAccordion(targetId);
        getDashboardSectionElement(targetId)?.scrollIntoView({ behavior, block: 'start' });
        if (targetId === 'table') scheduleChartResize();
        return Promise.resolve();
    }

    function scrollPublisherListRowIntoView(key) {
        if (!key || !publisherListBody) return;
        let row = null;
        publisherListBody.querySelectorAll('tr.publisher-row[data-publisher-key]').forEach(tr => {
            if (tr.dataset.publisherKey === key) row = tr;
        });
        if (!row) return;
        const wrap = row.closest('.publisher-list-wrap');
        if (wrap) {
            const targetTop = row.offsetTop - Math.max(0, (wrap.clientHeight - row.offsetHeight) / 2);
            wrap.scrollTo({ top: targetTop, behavior: motionScrollBehavior() });
        } else {
            row.scrollIntoView({ behavior: motionScrollBehavior(), block: 'nearest' });
        }
        row.querySelector('.pub-cell-tap')?.focus({ preventScroll: true });
    }

    function scrollPublisherDetailIntoView() {
        const detail = document.getElementById('publisher-detail');
        if (!detail) return;
        expandAccordion('publishers');
        prepareSoloSection(getDashboardSectionElement('publishers'));
        detail.scrollIntoView({ behavior: motionScrollBehavior(), block: 'start' });
    }

    function onGruposOpenPublisherClick(e) {
        const btn = e.target.closest('[data-grupos-action="detail"]');
        if (!btn) return;
        const gruposRoot = document.getElementById('grupos-section');
        if (!gruposRoot?.contains(btn)) return;
        e.preventDefault();
        e.stopPropagation();
        const key = btn.getAttribute('data-person-key') || btn.dataset.personKey || '';
        openPublisherFromList(key, { fromGrupos: true });
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
                if (layoutMode === 'single') return;
                const willCollapse = !section.classList.contains('collapsed');
                setAccordionCollapsed(section, trigger, willCollapse, true);
                if (id === 'table' && !willCollapse) {
                    scheduleChartResize();
                }
            });
        });
    }

    function runFoldMotion(elements, apply) {
        const nodes = (Array.isArray(elements) ? elements : [elements]).filter(Boolean);
        if (!nodes.length || window.S21Motion?.prefersReduced?.()) {
            apply();
            return;
        }
        nodes.forEach(el => el.classList.add('is-folding'));
        void nodes[0].offsetWidth;
        apply();
        const ms = Math.max(
            160,
            ...nodes.map(el => window.S21Motion?.measureTransitionMs?.(el) || 0)
        );
        window.setTimeout(() => {
            nodes.forEach(el => el.classList.remove('is-folding'));
        }, ms + 50);
    }

    function setAccordionCollapsed(section, trigger, collapsed, persist) {
        const body = section.querySelector('.dashboard-accordion-body');
        const apply = () => {
            section.classList.toggle('collapsed', collapsed);
            trigger.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
            if (body) body.setAttribute('aria-hidden', collapsed ? 'true' : 'false');
        };
        if (persist) runFoldMotion(body, apply);
        else apply();
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

    function prefersHorizontalBarChart() {
        return window.matchMedia('(max-width: 640px)').matches;
    }

    function prefersMobileLayout() {
        return window.matchMedia('(max-width: 640px)').matches;
    }

    function scheduleChartResize() {
        requestAnimationFrame(resizeDashboardCharts);
        setTimeout(resizeDashboardCharts, 420);
    }

    function resizeDashboardCharts() {
        refreshChartScrollWidths();
        barChart?.resize();
        lineChart?.resize();
        publisherDetailChart?.resize();
    }

    function syncChartScrollWidth(scrollEl, innerEl, itemCount, pxPerItem) {
        if (!scrollEl || !innerEl || !itemCount) {
            if (innerEl) {
                innerEl.style.width = '100%';
                innerEl.style.minWidth = '100%';
            }
            return;
        }
        const viewport = scrollEl.clientWidth || scrollEl.parentElement?.clientWidth || 0;
        const contentWidth = itemCount * pxPerItem;
        if (!viewport || contentWidth <= viewport) {
            innerEl.style.width = '100%';
            innerEl.style.minWidth = '100%';
            return;
        }
        innerEl.style.width = `${contentWidth}px`;
        innerEl.style.minWidth = `${contentWidth}px`;
    }

    function syncBarChartDimensions(scrollEl, innerEl, itemCount) {
        if (!innerEl) return;
        const horizontal = prefersHorizontalBarChart();
        scrollEl?.classList.toggle('chart-scroll-wrap--vertical', horizontal);
        if (!itemCount) {
            innerEl.style.width = '100%';
            innerEl.style.minWidth = '100%';
            innerEl.style.height = horizontal ? '160px' : '210px';
            innerEl.style.minHeight = horizontal ? '160px' : '210px';
            return;
        }
        if (horizontal) {
            innerEl.style.width = '100%';
            innerEl.style.minWidth = '100%';
            const minHeight = Math.max(160, itemCount * 34 + 28);
            innerEl.style.height = `${minHeight}px`;
            innerEl.style.minHeight = `${minHeight}px`;
            return;
        }
        innerEl.style.height = '210px';
        innerEl.style.minHeight = '210px';
        syncChartScrollWidth(scrollEl, innerEl, itemCount, 56);
    }

    function refreshChartScrollWidths() {
        syncBarChartDimensions(
            document.getElementById('chart-bar-scroll'),
            document.getElementById('chart-bar-wrap'),
            barChart?.data?.labels?.length || 0
        );
        syncChartScrollWidth(
            document.getElementById('chart-line-scroll'),
            document.getElementById('chart-line-wrap'),
            lineChart?.data?.labels?.length || 0,
            42
        );
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
        for (const field of FILTER_FIELDS) {
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
        const stored = localStorage.getItem(FILTERS_COLLAPSED_KEY);
        const collapsed = stored !== '0';
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
        if (selectedPublisherKey
            && !pubs.some(p => D.personKey(p) === selectedPublisherKey)
            && !flat.publicadores.some(p => D.personKey(p) === selectedPublisherKey)) {
            selectedPublisherKey = '';
        }

        renderPublisherList();
        renderPublisherDetail();
    }

    function filterPublishersForList(pubs) {
        let rows = pubs;
        if (publisherGroupFilter !== '') {
            const groupNum = Number(publisherGroupFilter);
            rows = rows.filter(p => Number(p.grupo_num || 0) === groupNum);
        }
        const TM = window.S21TextMatch;
        if (!TM || !publisherSearchQuery) return rows;
        return TM.filterPublishers(rows, publisherSearchQuery, displayPerfil);
    }

    function publishersForListDisplay() {
        let rows = filterPublishersForList(filteredPubCache);
        if (selectedPublisherKey && !rows.some(p => D.personKey(p) === selectedPublisherKey)) {
            const pub = flat.publicadores.find(p => D.personKey(p) === selectedPublisherKey);
            if (pub) rows = [...rows, pub];
        }
        return sortPublisherRows(rows);
    }

    function updatePublisherVisibleCount(pubs) {
        if (!publisherCount) return;
        publisherCount.textContent = `${pubs.length} publicador${pubs.length === 1 ? '' : 'es'}`;
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
            }).join('')}<th class="pub-expand-head" scope="col" aria-hidden="true"></th></tr>`;
            publisherListHead.querySelectorAll('th.sortable').forEach(th => {
                th.addEventListener('click', () => onPublisherSortColumn(th.dataset.col));
            });
        }

        const pubs = publishersForListDisplay();
        updatePublisherVisibleCount(pubs);
        if (!pubs.length) {
            publisherListBody.innerHTML = `<tr><td colspan="6" class="publisher-list-empty">Sin publicadores con los filtros actuales.</td></tr>`;
            return;
        }

        publisherListBody.innerHTML = pubs.flatMap(pub => {
            const key = D.personKey(pub);
            const selected = key === selectedPublisherKey ? ' selected' : '';
            const expanded = key === expandedPublisherListKey;
            const nac = showField(pub.fecha_nacimiento);
            const baut = showField(pub.fecha_bautismo);
            const mainRow = `<tr data-publisher-key="${escapeAttr(key)}" class="publisher-row${selected}${expanded ? ' is-expanded' : ''}">
                <td class="pub-cell-name pub-cell-tap" title="${escapeAttr(pub.nombre)}" role="button" tabindex="0"><span class="person-name">${Icons?.personNameInnerHtml(pub, escapeHtml(pub.nombre)) || escapeHtml(pub.nombre)}</span></td>
                <td class="pub-cell-profile pub-cell-tap" title="${escapeAttr(displayPerfil(pub.origen))}" role="button" tabindex="0">${escapeHtml(displayPerfil(pub.origen))}</td>
                <td class="pub-cell-grupo">${escapeHtml(pub.grupo || '—')}</td>
                <td class="pub-cell-nac pub-date-col" aria-hidden="true">${escapeHtml(nac)}</td>
                <td class="pub-cell-baut pub-date-col" aria-hidden="true">${escapeHtml(baut)}</td>
                <td class="pub-cell-expand">
                    <button type="button" class="pub-expand-btn" aria-expanded="${expanded ? 'true' : 'false'}" aria-label="Ver fechas de nacimiento y bautismo">
                        <span class="pub-expand-icon" aria-hidden="true"></span>
                    </button>
                </td>
            </tr>`;
            const datesRow = `<tr class="publisher-row-dates${expanded ? '' : ' is-collapsed'}" data-publisher-key="${escapeAttr(key)}">
                <td colspan="6">
                    <div class="pub-dates-fold">
                    <dl class="pub-dates-kv">
                        <div class="pub-kv"><dt>Nacimiento</dt><dd>${escapeHtml(nac)}</dd></div>
                        <div class="pub-kv"><dt>Bautismo</dt><dd>${escapeHtml(baut)}</dd></div>
                    </dl>
                    </div>
                </td>
            </tr>`;
            return [mainRow, datesRow];
        }).join('');

        publisherListBody.querySelectorAll('.pub-expand-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const row = btn.closest('tr[data-publisher-key]');
                if (!row) return;
                togglePublisherDatesRow(row.dataset.publisherKey);
            });
        });

        publisherListBody.querySelectorAll('.pub-cell-tap').forEach(cell => {
            const open = () => {
                const tr = cell.closest('tr.publisher-row');
                if (tr) openPublisherFromList(tr.dataset.publisherKey, { fromList: true });
            };
            cell.addEventListener('click', e => {
                e.stopPropagation();
                open();
            });
            cell.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    open();
                }
            });
        });
    }

    function togglePublisherDatesRow(key) {
        if (!publisherListBody || !key) return;
        expandedPublisherListKey = expandedPublisherListKey === key ? '' : key;
        const folds = [];
        publisherListBody.querySelectorAll('tr.publisher-row-dates[data-publisher-key]').forEach(row => {
            const willCollapse = row.dataset.publisherKey !== expandedPublisherListKey;
            if (row.classList.contains('is-collapsed') !== willCollapse) {
                const fold = row.querySelector('.pub-dates-fold');
                if (fold) folds.push(fold);
            }
        });
        runFoldMotion(folds, () => {
            publisherListBody.querySelectorAll('tr.publisher-row[data-publisher-key]').forEach(row => {
                const on = row.dataset.publisherKey === expandedPublisherListKey;
                row.classList.toggle('is-expanded', on);
                const btn = row.querySelector('.pub-expand-btn');
                if (btn) btn.setAttribute('aria-expanded', on ? 'true' : 'false');
            });
            publisherListBody.querySelectorAll('tr.publisher-row-dates[data-publisher-key]').forEach(row => {
                row.classList.toggle('is-collapsed', row.dataset.publisherKey !== expandedPublisherListKey);
            });
        });
    }

    function capturePublisherListNavigationState() {
        const listWrap = document.querySelector('.publisher-list-wrap');
        const section = document.getElementById('publisher-section');
        return {
            scrollTop: listWrap?.scrollTop ?? 0,
            expandedPublisherListKey,
            publisherSearchQuery,
            publisherGroupFilter,
            scrollY: window.scrollY,
            sectionTop: section
                ? section.getBoundingClientRect().top + window.scrollY
                : window.scrollY,
        };
    }

    function restorePublisherListNavigationState(state) {
        if (!state) return;
        expandedPublisherListKey = state.expandedPublisherListKey || '';
        publisherSearchQuery = state.publisherSearchQuery || '';
        publisherGroupFilter = state.publisherGroupFilter || '';
        if (publisherSearch) publisherSearch.value = publisherSearchQuery;
        if (publisherBulkGrupo) publisherBulkGrupo.value = publisherGroupFilter;
        renderPublisherList();
        requestAnimationFrame(() => {
            const listWrap = document.querySelector('.publisher-list-wrap');
            if (listWrap) listWrap.scrollTop = state.scrollTop ?? 0;
            window.scrollTo({
                top: state.sectionTop ?? state.scrollY ?? 0,
                behavior: 'smooth',
            });
        });
    }

    function syncPublisherDetailBackButton() {
        if (!publisherDetailBackWrap) return;
        if (!publisherDetailReturn || !selectedPublisherKey) {
            publisherDetailBackWrap.classList.add('hidden');
            return;
        }
        const label = publisherDetailReturn.origin === 'grupos'
            ? 'Volver a Grupos'
            : 'Volver al listado';
        publisherDetailBackWrap.classList.remove('hidden');
        if (publisherBackLabel) publisherBackLabel.textContent = label;
        btnPublisherBack?.setAttribute('aria-label', label);
    }

    function findPublisherByKey(key) {
        if (!key) return null;
        return flat.publicadores.find(p => D.personKey(p) === key)
            || G?.getPublisherByKey?.(key)
            || null;
    }

    function openPublisherFromList(key, options = {}) {
        const normalizedKey = String(key || '').trim();
        if (!normalizedKey) return;
        const pub = findPublisherByKey(normalizedKey);
        if (!pub) return;
        const resolvedKey = D.personKey(pub);

        if (options.fromGrupos) {
            publisherDetailReturn = {
                origin: 'grupos',
                state: G?.captureNavigationState?.() || null,
            };
            publisherSearchQuery = '';
            publisherGroupFilter = '';
            if (publisherSearch) publisherSearch.value = '';
            if (publisherBulkGrupo) publisherBulkGrupo.value = '';
            detailMonthlyFilter = null;
            updateDetailFilterBanner();
        } else if (options.fromList) {
            publisherDetailReturn = {
                origin: 'publishers',
                state: capturePublisherListNavigationState(),
            };
        } else {
            publisherDetailReturn = null;
        }

        if (options.fromGrupos) {
            publisherDetailMotionMode = 'instant';
        } else {
        const switching = Boolean(
            !options.fromGrupos
            && selectedPublisherKey
            && selectedPublisherKey !== resolvedKey
        );
        publisherDetailMotionMode = switching ? 'instant' : 'open';
        }
        selectedPublisherKey = resolvedKey;

        const showDetail = () => {
            expandAccordion('publishers');
            prepareSoloSection(getDashboardSectionElement('publishers'));
            renderPublisherList();
            Promise.resolve(renderPublisherDetail()).then(() => {
                scrollPublisherListRowIntoView(selectedPublisherKey);
                scrollPublisherDetailIntoView();
                publisherDetailChart?.resize?.();
            });
        };

        navigateToDashboardSection('publishers', { crossSection: !!options.fromGrupos }).then(() => {
            requestAnimationFrame(() => showDetail());
        });
    }

    function returnFromPublisherDetail() {
        if (!publisherDetailReturn) return;
        const { origin, state } = publisherDetailReturn;
        publisherDetailReturn = null;
        publisherDetailMotionMode = origin === 'grupos' ? 'instant' : 'back';
        selectedPublisherKey = '';
        renderPublisherList();
        renderPublisherDetail();
        if (origin === 'grupos') {
            navigateToDashboardSection('grupos');
            G?.restoreNavigationState?.(state);
            return;
        }
        navigateToDashboardSection('publishers');
        restorePublisherListNavigationState(state);
    }

    function selectPublisher(key) {
        openPublisherFromList(key, { fromList: true });
    }

    function showComentario(text) {
        const t = String(text ?? '').trim();
        return t || '—';
    }

    function takePublisherDetailMotionMode() {
        const mode = publisherDetailMotionMode;
        publisherDetailMotionMode = 'instant';
        return mode;
    }

    function publisherDetailMotionOpts(mode, role) {
        const instant = mode === 'instant' || window.S21Motion?.prefersReduced?.();
        if (mode === 'open') {
            return { from: role === 'incoming' ? 'right' : 'left', instant };
        }
        if (mode === 'back') {
            return { from: role === 'incoming' ? 'left' : 'right', instant };
        }
        return { from: 'fade', instant };
    }

    function setPublisherDetailVisible(hasDetail, mode) {
        const gen = ++publisherDetailPaintGen;
        if (hasDetail) {
            setMotionOpen(publisherDetailEmpty, false, publisherDetailMotionOpts(mode, 'outgoing'));
            return setMotionOpen(publisherDetailContent, true, publisherDetailMotionOpts(mode, 'incoming')).then(() => {
                if (gen !== publisherDetailPaintGen) return;
                publisherDetailChart?.resize?.();
            });
        }
        destroyPublisherDetailChart();
        publisherDetailBackWrap?.classList.add('hidden');
        setMotionOpen(publisherDetailEmpty, true, publisherDetailMotionOpts(mode, 'incoming'));
        return setMotionOpen(publisherDetailContent, false, publisherDetailMotionOpts(mode, 'outgoing')).then(() => {
            if (gen !== publisherDetailPaintGen) return;
            if (selectedPublisherKey) return;
            publisherDetailContent.innerHTML = '';
        });
    }

    function renderPublisherDetail() {
        if (!publisherDetailEmpty || !publisherDetailContent) return Promise.resolve();

        if (!selectedPublisherKey) {
            return setPublisherDetailVisible(false, takePublisherDetailMotionMode());
        }

        syncPublisherDetailBackButton();

        const pub = filteredPubCache.find(p => D.personKey(p) === selectedPublisherKey)
            || flat.publicadores.find(p => D.personKey(p) === selectedPublisherKey);
        if (!pub) {
            selectedPublisherKey = '';
            publisherDetailMotionMode = 'instant';
            return setPublisherDetailVisible(false, 'instant');
        }

        const mensualSource = filteredPubCache.some(p => D.personKey(p) === selectedPublisherKey)
            ? filteredMensualCache
            : flat.mensual;
        const monthly = D.getPublisherMonthlyRows(mensualSource, selectedPublisherKey);
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

        destroyPublisherDetailChart();
        publisherDetailMonthlyCache = monthly;
        publisherDetailContent.innerHTML = `
            <div class="publisher-profile">
                <h3 class="publisher-detail-card-title">Tarjeta de publicador</h3>
                <h4 class="publisher-name person-name">${Icons?.personNameInnerHtml(pub, escapeHtml(pub.nombre)) || escapeHtml(pub.nombre)}</h4>
                <div class="publisher-meta">
                    ${escapeHtml(displayPerfil(pub.origen))} · ${escapeHtml(pub.sexo)} · ${escapeHtml(pub.esperanza)}<br>
                    Nacimiento: ${escapeHtml(showField(pub.fecha_nacimiento))} · Bautismo: ${escapeHtml(showField(pub.fecha_bautismo))}
                </div>
                ${badges ? `<div class="publisher-badges">${badges}</div>` : ''}
            </div>
            <div class="publisher-monthly-panel">
                <div class="publisher-monthly-scroll">
                    <div class="publisher-monthly-grid">
                        <div class="publisher-monthly-head">
                            <span>Mes</span>
                            ${PUBLISHER_DETAIL_METRICS.map(m => {
                                const active = m.id === publisherDetailMetric;
                                return `<button type="button" class="num metric-head publisher-metric-head-btn${active ? ' active' : ''}"
                                    data-metric="${m.id}" aria-pressed="${active ? 'true' : 'false'}"
                                    aria-label="Gráfico de ${escapeAttr(m.label)}">${Icons?.metricIcon(m.id) || ''}<span>${escapeHtml(m.label)}</span></button>`;
                            }).join('')}
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
                </div>
                <div class="publisher-chart-panel">
                    <div class="publisher-metric-toggle" role="tablist" aria-label="Métrica del gráfico">
                        ${PUBLISHER_DETAIL_METRICS.map(m =>
                            `<button type="button" class="publisher-metric-btn${m.id === publisherDetailMetric ? ' active' : ''}"
                                data-metric="${m.id}" role="tab" aria-selected="${m.id === publisherDetailMetric}">${Icons?.metricIcon(m.id) || ''}<span>${m.label}</span></button>`
                        ).join('')}
                    </div>
                    <h3 class="publisher-chart-title" id="publisher-detail-chart-title">${escapeHtml(publisherMetricChartTitle(publisherDetailMetric))}</h3>
                    <div class="publisher-chart-wrap">
                        <canvas id="publisher-detail-chart"></canvas>
                    </div>
                </div>
            </div>`;

        publisherDetailContent.querySelectorAll('[data-metric]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('publisher-metric-head-btn') && !publisherMetricHeadersInteractive()) return;
                setPublisherDetailMetric(btn.dataset.metric);
            });
        });
        syncPublisherMetricLayout();
        const mode = takePublisherDetailMotionMode();
        const opening = setPublisherDetailVisible(true, mode);
        renderPublisherDetailChart(monthly, publisherDetailMetric);
        if (focusMes) {
            requestAnimationFrame(() => {
                const row = publisherDetailContent.querySelector(`.publisher-monthly-row-focus[data-mes="${focusMes}"]`);
                row?.querySelector('span')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            });
        }
        return opening;
    }

    function publisherMetricHeadersInteractive() {
        return window.matchMedia('(min-width: 769px)').matches;
    }

    function syncPublisherMetricLayout() {
        const wide = publisherMetricHeadersInteractive();
        publisherDetailContent?.querySelectorAll('.publisher-metric-head-btn').forEach(btn => {
            btn.tabIndex = wide ? 0 : -1;
        });
        const toggle = publisherDetailContent?.querySelector('.publisher-metric-toggle');
        if (toggle) toggle.hidden = wide;
    }

    function setPublisherDetailMetric(metricId) {
        if (!PUBLISHER_DETAIL_METRICS.some(m => m.id === metricId) || metricId === publisherDetailMetric) return;
        publisherDetailMetric = metricId;
        publisherDetailContent?.querySelectorAll('[data-metric]').forEach(btn => {
            const active = btn.dataset.metric === metricId;
            btn.classList.toggle('active', active);
            if (btn.classList.contains('publisher-metric-head-btn')) {
                btn.setAttribute('aria-pressed', active ? 'true' : 'false');
            } else {
                btn.setAttribute('aria-selected', active ? 'true' : 'false');
            }
        });
        syncPublisherChartTitle(metricId);
        renderPublisherDetailChart(publisherDetailMonthlyCache, metricId);
    }

    function publisherMetricSpec(metricId) {
        return PUBLISHER_DETAIL_METRICS.find(m => m.id === metricId) || PUBLISHER_DETAIL_METRICS[0];
    }

    function publisherMetricChartTitle(metricId) {
        const spec = publisherMetricSpec(metricId);
        return spec.title || spec.label;
    }

    function syncPublisherChartTitle(metricId) {
        const el = publisherDetailContent?.querySelector('#publisher-detail-chart-title');
        if (el) el.textContent = publisherMetricChartTitle(metricId);
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

        const spec = publisherMetricSpec(metricId);
        syncPublisherChartTitle(metricId);
        const focusMes = detailFocusMes();
        const labels = monthly.map(r => r.mes_corto || D.mesLabel(r.mes, 'corto'));
        const data = monthly.map(r => publisherMetricValue(r, metricId));
        const isBinary = metricId === 'participacion' || metricId === 'precursor_auxiliar';
        const c = chartPalette();

        publisherDetailChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: spec.title || spec.label,
                    data,
                    borderColor: c.barBorder,
                    backgroundColor: c.barFill,
                    fill: true,
                    tension: 0.3,
                    pointRadius: monthly.map(r => focusMes && r.mes === focusMes ? 5 : 2),
                    pointBackgroundColor: monthly.map(r =>
                        focusMes && r.mes === focusMes ? '#f59e0b' : c.barBorder
                    ),
                    pointBorderColor: monthly.map(r =>
                        focusMes && r.mes === focusMes ? '#f59e0b' : c.barBorder
                    ),
                    pointHoverRadius: 4,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                resizeDelay: 0,
                animation: { duration: 400 },
                transitions: { resize: { animation: { duration: 0 } } },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label(ctx) {
                                const v = ctx.parsed.y;
                                const name = spec.title || spec.label;
                                if (isBinary) return `${name}: ${v ? 'Sí' : 'No'}`;
                                return `${name}: ${Math.round(v).toLocaleString('es')}`;
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        ticks: { color: c.tick, font: { size: 10 }, maxRotation: 0 },
                        grid: { color: c.grid },
                    },
                    y: {
                        beginAtZero: true,
                        max: isBinary ? 1 : undefined,
                        ticks: {
                            color: c.tick,
                            font: { size: 10 },
                            stepSize: isBinary ? 1 : undefined,
                            callback(v) {
                                if (isBinary) return v ? 'Sí' : '—';
                                return v;
                            },
                        },
                        grid: { color: c.grid },
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

    function publisherExportGroups() {
        return [
            {
                id: 'identity',
                label: 'Identidad',
                hint: 'Nombre, perfil y grupo',
                required: true,
                columns: [
                    { id: 'nombre', label: 'Nombre', getValue: row => row.nombre || '' },
                    { id: 'origen', label: 'Perfil', getValue: row => displayPerfil(row.origen) },
                    { id: 'grupo', label: 'Grupo', getValue: row => row.grupo || '—' },
                ],
            },
            {
                id: 'personal',
                label: 'Datos personales',
                hint: 'Nacimiento, bautismo, sexo y esperanza',
                columns: [
                    { id: 'fecha_nacimiento', label: 'Nacimiento', getValue: row => row.fecha_nacimiento || '' },
                    { id: 'fecha_bautismo', label: 'Bautismo', getValue: row => row.fecha_bautismo || '' },
                    { id: 'sexo', label: 'Sexo', getValue: row => row.sexo || '' },
                    { id: 'esperanza', label: 'Esperanza', getValue: row => row.esperanza || '' },
                ],
            },
            {
                id: 'privileges',
                label: 'Privilegios',
                hint: 'Anciano, siervo ministerial y precursores',
                columns: [
                    { id: 'anciano', label: 'Anciano', getValue: row => row.anciano || '' },
                    { id: 'siervo_ministerial', label: 'S. min.', getValue: row => row.siervo_ministerial || '' },
                    { id: 'precursor_regular', label: 'P. reg.', getValue: row => row.precursor_regular || '' },
                    { id: 'precursor_especial', label: 'P. esp.', getValue: row => row.precursor_especial || '' },
                    { id: 'misionero', label: 'Mis.', getValue: row => row.misionero || '' },
                ],
            },
            {
                id: 'service',
                label: 'Informe de servicio',
                hint: 'Horas, cursos, participación y prec. aux.',
                columns: [
                    { id: 'horas', label: 'Horas', numeric: true, getValue: row => formatNum(row.total_horas) },
                    { id: 'cursos', label: 'Cursos', numeric: true, getValue: row => formatNum(row.total_cursos) },
                    { id: 'participacion', label: 'Part.', numeric: true, getValue: row => formatNum(row.meses_participacion) },
                    { id: 'precursor_auxiliar', label: 'Prec. aux.', numeric: true, getValue: row => formatNum(row.meses_precursor_aux) },
                ],
            },
        ];
    }

    function totalsExportGroups() {
        const groupCols = tableColumns.filter(c => String(c.id).startsWith('group_')).map(col => ({
            id: col.id,
            label: col.label,
            getValue: row => {
                const val = col.getValue(row);
                return col.type === 'number' ? formatNum(val) : String(val ?? '');
            },
        }));
        const peopleCols = tableColumns.filter(c => c.id === 'publicadores' || c.id === 'inactivos').map(col => ({
            id: col.id,
            label: col.label,
            numeric: true,
            getValue: row => formatNum(col.getValue(row)),
        }));
        const serviceCols = tableColumns
            .filter(c => ['horas', 'cursos', 'participacion', 'precursor_auxiliar'].includes(c.id))
            .map(col => ({
                id: col.id,
                label: col.label,
                numeric: true,
                getValue: row => formatNum(col.getValue(row)),
            }));
        const groups = [];
        if (groupCols.length) {
            groups.push({
                id: 'grouping',
                label: 'Agrupación',
                hint: groupCols.map(c => c.label).join(', '),
                required: true,
                columns: groupCols,
            });
        }
        if (peopleCols.length) {
            groups.push({
                id: 'people',
                label: 'Publicadores',
                hint: 'Totales e inactivos',
                columns: peopleCols,
            });
        }
        if (serviceCols.length) {
            groups.push({
                id: 'service',
                label: 'Informe de servicio',
                hint: serviceCols.map(c => c.label).join(', '),
                columns: serviceCols,
            });
        }
        return groups;
    }

    function exportGroupDefs(kind) {
        return kind === 'publishers' ? publisherExportGroups() : totalsExportGroups();
    }

    function readExportGroupPrefs(kind) {
        try {
            const raw = JSON.parse(localStorage.getItem(EXPORT_GROUPS_KEY) || '{}');
            return Array.isArray(raw[kind]) ? raw[kind] : null;
        } catch {
            return null;
        }
    }

    function saveExportGroupPrefs(kind, ids) {
        let raw = {};
        try { raw = JSON.parse(localStorage.getItem(EXPORT_GROUPS_KEY) || '{}'); } catch { raw = {}; }
        raw[kind] = ids;
        localStorage.setItem(EXPORT_GROUPS_KEY, JSON.stringify(raw));
    }

    function bindExportOptionsModal() {
        if (!exportOptionsModal) return;
        exportOptionsModal.querySelectorAll('[data-export-options-close]').forEach(el => {
            el.addEventListener('click', closeExportOptions);
        });
        exportOptionsConfirm?.addEventListener('click', confirmExportOptions);
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && exportOptionsModal.classList.contains('is-open')) {
                closeExportOptions();
            }
        });
    }

    function requestExport(kind, format) {
        if (kind === 'publishers' && !filterPublishersForList(filteredPubCache).length) {
            setLoadStatus('No hay publicadores para exportar.', true);
            return;
        }
        if (kind === 'totals' && !aggregated.length) {
            setLoadStatus('No hay datos para exportar.', true);
            return;
        }
        const groups = exportGroupDefs(kind);
        if (!groups.length) {
            setLoadStatus('No hay columnas para exportar.', true);
            return;
        }
        pendingExport = { kind, format };
        renderExportOptions(kind, groups, format);
        window.S21Motion?.setOpen(exportOptionsModal, true, { from: 'scale' });
    }

    function renderExportOptions(kind, groups, format) {
        const saved = readExportGroupPrefs(kind);
        const formatLabel = format === 'csv' ? 'CSV' : (format === 'image' ? 'imagen' : 'PDF');
        if (exportOptionsTitle) exportOptionsTitle.textContent = `Exportar ${formatLabel}`;
        if (exportOptionsConfirm) {
            exportOptionsConfirm.textContent = format === 'csv'
                ? 'Descargar CSV'
                : (format === 'image' ? 'Generar imagen' : 'Generar PDF');
        }
        if (!exportOptionsGroups) return;
        exportOptionsGroups.innerHTML = groups.map(g => {
            const checked = g.required || !saved || saved.includes(g.id);
            const disabled = g.required ? ' disabled' : '';
            return `<label class="export-option">
                <input type="checkbox" data-export-group="${escapeAttr(g.id)}"${checked ? ' checked' : ''}${disabled}>
                <span class="export-option-text">
                    <span class="export-option-label">${escapeHtml(g.label)}</span>
                    <span class="export-option-hint">${escapeHtml(g.hint || '')}${g.required ? ' · Siempre incluido' : ''}</span>
                </span>
            </label>`;
        }).join('');
    }

    function closeExportOptions() {
        pendingExport = null;
        window.S21Motion?.setOpen(exportOptionsModal, false, { from: 'scale' });
    }

    function selectedExportGroups(kind) {
        const defs = exportGroupDefs(kind);
        const boxes = exportOptionsGroups?.querySelectorAll('[data-export-group]') || [];
        const checked = new Set([...boxes].filter(el => el.checked).map(el => el.dataset.exportGroup));
        return defs.filter(g => g.required || checked.has(g.id));
    }

    async function confirmExportOptions() {
        if (!pendingExport) return;
        const { kind, format } = pendingExport;
        const groups = selectedExportGroups(kind);
        if (!groups.length) {
            setLoadStatus('Seleccione al menos un grupo de columnas.', true);
            return;
        }
        saveExportGroupPrefs(kind, groups.map(g => g.id));
        pendingExport = null;
        if (exportOptionsConfirm) exportOptionsConfirm.disabled = true;
        try {
            await window.S21Motion?.setOpen(exportOptionsModal, false, { from: 'scale' });
            await performExport(kind, format, groups);
        } finally {
            if (exportOptionsConfirm) exportOptionsConfirm.disabled = false;
        }
    }

    function csvEscapeCell(val) {
        const s = String(val ?? '');
        if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
    }

    function specToCsv(spec) {
        const colCount = spec.headers?.length || 1;
        const titleRow = (text) => {
            const cells = Array(colCount).fill('');
            cells[0] = text;
            return cells.map(csvEscapeCell).join(',');
        };
        const lines = [titleRow('Análisis de Servicio')];
        if (spec.title) lines.push(titleRow(spec.title));
        if (spec.subtitle) lines.push(titleRow(spec.subtitle));
        lines.push('');
        if (spec.headerGroups?.length) {
            const groupCells = [];
            spec.headerGroups.forEach(g => {
                for (let i = 0; i < g.span; i += 1) groupCells.push(i === 0 ? g.label : '');
            });
            lines.push(groupCells.map(csvEscapeCell).join(','));
        }
        lines.push(spec.headers.map(csvEscapeCell).join(','));
        spec.rows.forEach(row => lines.push(row.map(csvEscapeCell).join(',')));
        if (spec.footerRow?.length) lines.push(spec.footerRow.map(csvEscapeCell).join(','));
        return `\ufeff${lines.join('\n')}`;
    }

    function totalsScopeLabel() {
        if (!totalsScope || totalsScope === 'year') return 'Año completo';
        return D.mesLabel(totalsScope, 'completo');
    }

    function buildTotalsExportSpec(selectedGroups) {
        if (!aggregated.length) return null;
        const groups = selectedGroups?.length ? selectedGroups : totalsExportGroups();
        const headerGroups = groups.map(g => ({ label: g.label, span: g.columns.length }));
        const columns = groups.flatMap(g => g.columns);
        const sorted = sortRows(aggregated, tableColumns);
        const numericColumns = new Set(columns.map((c, i) => (c.numeric ? i : -1)).filter(i => i >= 0));
        const rows = sorted.map(row => columns.map(col => col.getValue(row)));

        const totals = sorted.reduce((acc, r) => {
            acc.horas += r.horas;
            acc.cursos += r.cursos;
            acc.participacion += r.participacion;
            acc.precursor_auxiliar += r.precursor_auxiliar;
            acc.inactivos += r.inactivos || 0;
            return acc;
        }, { horas: 0, cursos: 0, participacion: 0, precursor_auxiliar: 0, inactivos: 0 });

        const footerRow = columns.map((col, i) => {
            if (i === 0) return 'Total';
            if (!col.numeric) return '';
            if (col.id === 'publicadores') {
                let n = kpisCache.publicadores_total ?? 0;
                if (totalsScope !== 'year') {
                    n = new Set(
                        D.filterMensualByScope(flat.mensual, totalsScope).map(r => D.personKey(r))
                    ).size;
                }
                return formatNum(n);
            }
            if (col.id === 'inactivos') {
                let n = kpisCache.metrics?.inactivos?.total ?? totals.inactivos;
                if (totalsScope !== 'year') n = totals.inactivos;
                return formatNum(n);
            }
            return formatNum(totals[col.id] ?? 0);
        });

        const g1 = group1.value;
        const g2 = group2.value;
        const groupFields = [g1, g2].filter((v, i, arr) => v && arr.indexOf(v) === i);
        const groupLabels = groupFields.map(f => D.S21_GROUP_FIELDS.find(g => g.id === f)?.label || f);
        const included = groups.map(g => g.label).join(' · ');

        return {
            title: 'Totales',
            subtitle: `Alcance: ${totalsScopeLabel()} · Agrupado: ${groupLabels.join(' / ') || '—'} · ${included}`,
            headers: columns.map(c => c.label),
            headerGroups,
            rows,
            footerRow,
            numericColumns,
            filenameBase: 'analisis_servicio',
        };
    }

    function buildPublishersExportSpec(selectedGroups) {
        const pubs = sortPublisherRows(filterPublishersForList(filteredPubCache));
        if (!pubs.length) return null;
        const groups = selectedGroups?.length ? selectedGroups : publisherExportGroups();
        const headerGroups = groups.map(g => ({ label: g.label, span: g.columns.length }));
        const columns = groups.flatMap(g => g.columns);
        const numericColumns = new Set(columns.map((c, i) => (c.numeric ? i : -1)).filter(i => i >= 0));
        const rows = pubs.map(row => columns.map(col => col.getValue(row)));
        const footerRow = columns.map((col, i) => {
            if (i === 0) return `Total (${pubs.length})`;
            if (!col.numeric) return '';
            const sum = pubs.reduce((acc, row) => {
                switch (col.id) {
                    case 'horas': return acc + (row.total_horas || 0);
                    case 'cursos': return acc + (row.total_cursos || 0);
                    case 'participacion': return acc + (row.meses_participacion || 0);
                    case 'precursor_auxiliar': return acc + (row.meses_precursor_aux || 0);
                    default: return acc;
                }
            }, 0);
            return formatNum(sum);
        });
        const filterNote = [
            publisherSearchQuery ? `Búsqueda: «${publisherSearchQuery}»` : '',
            publisherGroupFilter === '0' ? 'Sin grupo' : (publisherGroupFilter ? `Grupo ${publisherGroupFilter}` : ''),
            groups.map(g => g.label).join(' · '),
        ].filter(Boolean).join(' · ');
        return {
            title: 'Publicadores',
            subtitle: `${pubs.length} registro${pubs.length === 1 ? '' : 's'}${filterNote ? ` · ${filterNote}` : ''}`,
            headers: columns.map(c => c.label),
            headerGroups,
            rows,
            footerRow,
            numericColumns,
            filenameBase: 'publicadores',
        };
    }

    async function performExport(kind, format, groups) {
        const spec = kind === 'publishers' ? buildPublishersExportSpec(groups) : buildTotalsExportSpec(groups);
        if (!spec) {
            setLoadStatus('No hay datos para exportar.', true);
            return;
        }
        const Export = window.S21DashboardExport;
        if (format === 'csv') {
            const blob = new Blob([specToCsv(spec)], { type: 'text/csv;charset=utf-8' });
            Export?.downloadBlob(blob, `${spec.filenameBase}_${new Date().toISOString().slice(0, 10)}.csv`);
            setLoadStatus('CSV descargado.', false);
            return;
        }
        if (!Export) {
            setLoadStatus('Exportación no disponible.', true);
            return;
        }
        try {
            setLoadStatus(format === 'image' ? 'Generando imagen…' : 'Generando PDF…', false);
            const result = format === 'image'
                ? await Export.exportTableImage(spec)
                : await Export.exportTablePdf(spec);
            if (result === 'shared') {
                setLoadStatus('Listo para compartir (WhatsApp, etc.).', false);
            } else if (result === 'downloaded') {
                setLoadStatus(format === 'image'
                    ? 'Imagen descargada. Ábrala y compártala por WhatsApp.'
                    : 'PDF descargado.', false);
            }
        } catch (err) {
            setLoadStatus(err?.message || 'No se pudo exportar.', true);
        }
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
            const metricMark = D.TOTALS_METRIC_COLUMNS[col.id]
                ? (Icons?.metricIcon(col.id) || '')
                : '';
            return `<th class="sortable ${sortClass}" data-col="${col.id}" scope="col">
                <span class="th-label">${metricMark}<span>${escapeHtml(col.label)}</span></span><span class="sort-icon" aria-hidden="true"></span>
            </th>`;
        }).join('')}</tr>`;

        pivotHead.querySelectorAll('th.sortable').forEach(th => {
            th.addEventListener('click', () => onSortColumn(th.dataset.col));
        });

        pivotBody.innerHTML = sorted.map((row, rowIdx) =>
            `<tr data-row-index="${rowIdx}">${tableColumns.map(col => {
                const val = col.getValue(row);
                const labelAttr = ` data-label="${escapeAttr(col.label)}"`;
                if (col.type === 'number') {
                    const text = formatNum(val);
                    return `<td class="num drillable" data-col-id="${col.id}"${labelAttr} title="Filtrar detalle por este valor">${text}</td>`;
                }
                return `<td${labelAttr}>${escapeHtml(val)}</td>`;
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
        pivotFoot.innerHTML = `<tr>${tableColumns.map(col => {
            const labelAttr = ` data-label="${escapeAttr(col.label)}"`;
            if (col.type !== 'number') {
                const isFirst = col.id === 'group_0';
                return `<td${labelAttr}>${isFirst ? 'Total' : ''}</td>`;
            }
            if (col.id === 'publicadores') {
                let n = kpisCache.publicadores_total ?? 0;
                if (totalsScope !== 'year') {
                    n = new Set(
                        D.filterMensualByScope(flat.mensual, totalsScope).map(r => D.personKey(r))
                    ).size;
                }
                return `<td class="num"${labelAttr}>${formatNum(n)}</td>`;
            }
            if (col.id === 'inactivos') {
                let n = kpisCache.metrics?.inactivos?.total ?? totals.inactivos;
                if (totalsScope !== 'year') n = totals.inactivos;
                return `<td class="num"${labelAttr}>${formatNum(n)}</td>`;
            }
            return `<td class="num"${labelAttr}>${formatNum(totals[col.id] ?? 0)}</td>`;
        }).join('')}</tr>`;
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
            return `<div class="kpi-card kpi-card--${key}">
                <span class="kpi-card-icon" aria-hidden="true">${Icons?.metricIcon(key) || ''}</span>
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
                        backgroundColor: chartPalette().barBg,
                        borderColor: chartPalette().barBorder,
                        borderWidth: 1,
                        borderRadius: 4,
                    }],
                },
                options: {
                    ...chartBarOptions(metricId),
                    onClick: (_evt, elements) => {
                        if (!elements.length) return;
                        const row = chartBarRowsCache[elements[0].index];
                        if (row) applyDetailFilterFromBar(row);
                    },
                },
            });
            refreshChartScrollWidths();
            requestAnimationFrame(refreshChartScrollWidths);
        } else {
            chartBarRowsCache = [];
            syncBarChartDimensions(
                document.getElementById('chart-bar-scroll'),
                document.getElementById('chart-bar-wrap'),
                0
            );
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
                    borderColor: chartPalette().line,
                    backgroundColor: chartPalette().lineFill,
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
        refreshChartScrollWidths();
        requestAnimationFrame(refreshChartScrollWidths);
    }

    function chartPalette() {
        const root = getComputedStyle(document.documentElement);
        const v = name => root.getPropertyValue(name).trim();
        return {
            tick: v('--chart-tick') || '#8fa3bf',
            grid: v('--chart-grid') || 'rgba(255,255,255,0.06)',
            barBg: v('--chart-bar-bg') || 'rgba(56, 189, 248, 0.65)',
            barBorder: v('--chart-bar-border') || 'rgba(56, 189, 248, 1)',
            barFill: v('--chart-bar-fill') || 'rgba(56, 189, 248, 0.12)',
            line: v('--chart-line') || 'rgba(16, 185, 129, 0.85)',
            lineFill: v('--chart-line-fill') || 'rgba(16, 185, 129, 0.12)',
            linePoint: v('--chart-line-point') || 'rgba(16, 185, 129, 1)',
            linePointDim: v('--chart-line-point-dim') || 'rgba(16, 185, 129, 0.35)',
            linePointBorderDim: v('--chart-line-point-border-dim') || 'rgba(16, 185, 129, 0.45)',
            focusTick: v('--chart-focus-tick') || '#38bdf8',
            focusTickMuted: v('--chart-focus-tick-muted') || '#6b8299',
        };
    }

    function buildLineChartFocusStyles(trend, focusMes) {
        const c = chartPalette();
        if (!focusMes) {
            return {
                pointRadius: 3,
                pointBackgroundColor: c.linePoint,
                pointBorderColor: c.linePoint,
                pointBorderWidth: 1,
            };
        }
        return {
            pointRadius: trend.map(t => t.mes === focusMes ? 6 : 3),
            pointBackgroundColor: trend.map(t =>
                t.mes === focusMes ? c.focusTick : c.linePointDim
            ),
            pointBorderColor: trend.map(t =>
                t.mes === focusMes ? c.focusTick : c.linePointBorderDim
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
                            const c = chartPalette();
                            return mes === focusMes ? c.focusTick : c.focusTickMuted;
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

    function chartValueTooltipLabel(ctx, metricId) {
        const spec = D.S21_CHART_METRICS.find(m => m.id === metricId);
        const isAvg = spec?.aggregation === 'avg';
        const horizontal = ctx.chart.options.indexAxis === 'y';
        const v = horizontal ? ctx.parsed.x : ctx.parsed.y;
        if (isAvg) {
            return `${ctx.dataset.label}: ${v.toLocaleString('es', { maximumFractionDigits: 1 })}`;
        }
        return `${ctx.dataset.label}: ${Math.round(v).toLocaleString('es')}`;
    }

    function chartBarOptions(metricId) {
        const horizontal = prefersHorizontalBarChart();
        const base = chartOptions(metricId);
        const c = chartPalette();
        if (!horizontal) return base;
        const spec = D.S21_CHART_METRICS.find(m => m.id === metricId);
        const isCount = spec?.aggregation === 'count';
        return {
            ...base,
            indexAxis: 'y',
            plugins: {
                ...base.plugins,
                tooltip: {
                    callbacks: {
                        label(ctx) {
                            return chartValueTooltipLabel(ctx, metricId);
                        },
                    },
                },
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        color: c.tick,
                        font: { size: 10 },
                        precision: isCount ? 0 : undefined,
                    },
                    grid: { color: c.grid },
                },
                y: {
                    ticks: { color: c.tick, font: { size: 10 }, autoSkip: false },
                    grid: { display: false },
                },
            },
        };
    }

    function chartOptions(metricId) {
        const spec = D.S21_CHART_METRICS.find(m => m.id === metricId);
        const isAvg = spec?.aggregation === 'avg';
        const isCount = spec?.aggregation === 'count';
        const c = chartPalette();
        return {
            responsive: true,
            maintainAspectRatio: false,
            resizeDelay: 0,
            animation: { duration: 400 },
            transitions: { resize: { animation: { duration: 0 } } },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label(ctx) {
                            return chartValueTooltipLabel(ctx, metricId);
                        },
                    },
                },
            },
            scales: {
                x: {
                    ticks: { color: c.tick, maxRotation: 0, minRotation: 0, font: { size: 10 }, autoSkip: false },
                    grid: { color: c.grid },
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: c.tick,
                        font: { size: 10 },
                        precision: isCount ? 0 : undefined,
                    },
                    grid: { color: c.grid },
                },
            },
        };
    }

    function destroyCharts() {
        if (barChart) { barChart.destroy(); barChart = null; }
        if (lineChart) { lineChart.destroy(); lineChart = null; }
    }

    function toggleFilters() {
        if (!filtersPanel) return;
        const fold = filtersPanel.querySelector('.filters-body-fold');
        runFoldMotion(fold, () => {
            const collapsed = filtersPanel.classList.toggle('collapsed');
            btnToggleFilters.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
            filtersChevron.textContent = collapsed ? '▸' : '▾';
            localStorage.setItem(FILTERS_COLLAPSED_KEY, collapsed ? '1' : '0');
            updateFiltersSummary();
        });
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
