document.addEventListener('DOMContentLoaded', () => {
    const D = window.S21DashboardData;
    const G = window.S21DashboardGrupos;
    const FILTERS_COLLAPSED_KEY = 'analisis_servicio_filters_collapsed';
    const TOTALS_LAYOUT_KEY = 'analisis_servicio_totals_layout';
    const TOTALS_CHART_MODE_KEY = 'analisis_servicio_totals_chart_mode';
    const TOTALS_EXCLUDE_KEY = 'analisis_servicio_totals_exclude';
    const TOTALS_TRIM_SIDE_KEY = 'analisis_servicio_totals_trim_side';
    const TOTALS_TRIM_MODE_KEY = 'analisis_servicio_totals_trim_mode';
    const TOTALS_MONTH_FROM_KEY = 'analisis_servicio_totals_month_from';
    const TOTALS_MONTH_TO_KEY = 'analisis_servicio_totals_month_to';
    const TOTALS_DOCK_RIGHT_KEY = 'analisis_servicio_totals_dock_right';
    const TOOLS_DOCK_VISIBLE_KEY = 'analisis_servicio_section_dock_visible';
    const SPARK_METRIC_KEY = 'analisis_servicio_spark_metric';
    const SPARK_VISIBLE_KEY = 'analisis_servicio_spark_visible';
    const GRUPOS_DOCK_KEY = 'analisis_servicio_grupos_dock';
    const PUBLISHERS_DOCK_KEY = 'analisis_servicio_publishers_dock';
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
        anciano: 'Anciano',
        siervo_ministerial: 'Siervo min.',
        precursor_regular: 'P. regular',
        precursor_especial: 'P. especial',
        misionero: 'Misionero',
    };

    const FILTER_SWITCH_FIELDS = new Set([
        'anciano',
        'siervo_ministerial',
        'precursor_regular',
        'precursor_especial',
        'misionero',
    ]);

    const FILTER_EXCLUSIVE_FIELDS = new Set(['sexo', 'esperanza']);

    const FILTER_VALUE_SHORT = {
        'Otras ovejas': 'Otras',
        'Ungidos': 'Ungidos',
        'Hombre': 'Hombre',
        'Mujer': 'Mujer',
    };

    const dropZone = document.getElementById('drop-zone');
    const btnClearData = document.getElementById('btn-clear-data'); // legacy, may be null
    const loadStatus = document.getElementById('load-status');
    const dataSourcesBar = document.getElementById('data-sources-bar');
    const fileList = document.getElementById('file-list');
    const dashboardContent = document.getElementById('dashboard-content');
    const emptyState = document.getElementById('empty-state');
    const kpiGrid = document.getElementById('kpi-grid');
    const kpiNowLabel = document.getElementById('kpi-now-label');
    const kpiSectionSub = document.getElementById('kpi-section-sub');
    const kpiModeBtns = document.querySelectorAll('.kpi-mode-btn');
    const kpiDetailModal = document.getElementById('kpi-detail-modal');
    const kpiDetailTitle = document.getElementById('kpi-detail-title');
    const kpiDetailLead = document.getElementById('kpi-detail-lead');
    const kpiDetailFilters = document.getElementById('kpi-detail-filters');
    const kpiDetailBody = document.getElementById('kpi-detail-body');
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
    const totalsExcludeSelect = document.getElementById('totals-exclude');
    const pivotTable = document.getElementById('pivot-table');
    const pivotHead = document.getElementById('pivot-head');
    const pivotBody = document.getElementById('pivot-body');
    const pivotFoot = document.getElementById('pivot-foot');
    const btnExportCsv = document.getElementById('btn-export-csv');
    const btnExportPng = document.getElementById('btn-export-png');
    const btnExportPdf = document.getElementById('btn-export-pdf');
    const chartGrid = document.getElementById('chart-grid');
    const chartBarCard = document.getElementById('chart-bar-card');
    const chartLineCard = document.getElementById('chart-line-card');
    const chartBarTitle = document.getElementById('chart-bar-title');
    const chartProfileTogglesWrap = document.getElementById('chart-profile-toggles-wrap');
    const chartProfileToggles = document.getElementById('chart-profile-toggles');
    const publisherSearch = document.getElementById('publisher-search');
    const publisherCount = document.getElementById('publisher-count');
    const publisherListBody = document.getElementById('publisher-list-body');
    const publisherListHead = document.getElementById('publisher-list-head');
    const publisherLayout = document.querySelector('.publisher-layout');
    const publisherMonthView = document.getElementById('publisher-month-view');
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
    let publisherViewMode = 'list';
    let publisherMonthSortState = { column: 'nombre', direction: 'asc' };
    let publisherMonthFocus = '';
    let publisherMonthNameFlexPct = 58;
    const PUBLISHER_MONTH_METRIC_PX = 48;
    const PUBLISHER_MONTH_METRIC_IDS = ['horas', 'cursos', 'participacion', 'precursor_auxiliar'];
    const PUBLISHER_MONTH_COMMENT_ICON = '<svg class="metric-icon metric-icon--comentarios" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    const PUBLISHER_MONTH_CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
    const PUBLISHER_MONTH_FAIL_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    let publisherMonthResizeObserver = null;
    let tableColumns = [];
    let filteredMensualCache = [];
    let filteredPubCache = [];
    let kpisCache = {};
    let kpiMode = 'last';
    let kpiDetailKey = '';
    let kpiDetailPrivilegeFilters = ['', ''];
    let kpiDetailCursosTab = 'with';
    let kpiDetailSort = { column: '', direction: 'asc' };
    let selectedPublisherKey = '';
    let chartExcludeMonths = 0;
    let chartTrimSide = 'last';
    let chartTrimMode = 'omit';
    let totalsScope = 'year';
    let totalsLayoutMode = 'both';
    let totalsChartMode = 'together';
    let totalsMonthFrom = 'septiembre';
    let totalsMonthTo = 'agosto';
    let totalsMensualCache = [];
    let chartProfileInclude = {};
    let publisherSearchQuery = '';
    let publisherGroupFilter = '';
    let publisherPerfilFiltersOpen = false;
    let pendingExport = null;
    let detailMonthlyFilter = null;
    let tableRowsCache = [];
    let chartBarRowsCache = [];
    let chartBarClickContext = null;
    let chartLineTrendCache = [];
    let totalsDimensionSwapped = false;
    let matrixCellCache = new Map();
    let expandedPublisherListKey = '';
    let perfilAliases = {};
    let congregacionDetectada = null;
    let publisherDetailReturn = null;
    let publisherDetailPaintGen = 0;
    let publisherDetailMotionMode = 'instant';
    let layoutMode = 'single';
    let singleActiveSection = 'kpi';
    let navSwapGen = 0;
    let totalsDockUserVisible = localStorage.getItem(TOOLS_DOCK_VISIBLE_KEY) !== '0';
    let sparkMetric = localStorage.getItem(SPARK_METRIC_KEY) || 'horas';
    let sparkVisible = localStorage.getItem(SPARK_VISIBLE_KEY) !== '0';
    if (sparkMetric === 'none') {
        sparkVisible = false;
        sparkMetric = 'horas';
        localStorage.setItem(SPARK_METRIC_KEY, sparkMetric);
        localStorage.setItem(SPARK_VISIBLE_KEY, '0');
    }
    let sparkCache = new Map();
    const SPARK_METRICS = ['horas', 'cursos', 'participacion', 'precursor_auxiliar'];
    const SECTION_DOCKS = {
        table: ['totals-dock-right'],
        grupos: ['grupos-dock'],
        publishers: ['publishers-dock'],
    };
    const SPARK_TOGGLE_ICONS = {
        on: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
        off: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
    };
    const SPARK_METRIC_ICONS = {
        horas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5.5l3.2 1.8"/></svg>',
        cursos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h8M8 11h5"/></svg>',
        participacion: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>',
        precursor_auxiliar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="7" r="3.2"/><path d="M3.5 20.5v-.8c0-3 2.5-5.1 5.5-5.1 1.1 0 2.1.3 3 .8"/><circle cx="17.5" cy="16.5" r="4"/><path d="M17.5 14.6v2.1l1.4.8"/></svg>',
    };
    const NAV_SECTION_ORDER = ['kpi', 'table', 'grupos', 'publishers'];

    const CHART_SUBGROUP_COLORS = [
        { bg: 'rgba(56, 189, 248, 0.78)', border: 'rgba(56, 189, 248, 1)' },
        { bg: 'rgba(16, 185, 129, 0.78)', border: 'rgba(16, 185, 129, 1)' },
        { bg: 'rgba(251, 191, 36, 0.78)', border: 'rgba(251, 191, 36, 1)' },
        { bg: 'rgba(167, 139, 250, 0.78)', border: 'rgba(167, 139, 250, 1)' },
        { bg: 'rgba(244, 114, 182, 0.78)', border: 'rgba(244, 114, 182, 1)' },
        { bg: 'rgba(45, 212, 191, 0.78)', border: 'rgba(45, 212, 191, 1)' },
        { bg: 'rgba(248, 113, 113, 0.78)', border: 'rgba(248, 113, 113, 1)' },
        { bg: 'rgba(129, 140, 248, 0.78)', border: 'rgba(129, 140, 248, 1)' },
    ];

    const totalsLayoutToggle = document.getElementById('totals-layout-toggle');
    const totalsChartModeField = document.getElementById('totals-chart-mode-field');
    const totalsChartModeToggle = document.getElementById('totals-chart-mode-toggle');
    const totalsTrimModeToggle = document.getElementById('totals-trim-mode');
    const totalsTrimSideToggle = document.getElementById('totals-trim-side');
    const totalsDockRight = document.getElementById('totals-dock-right');
    const gruposDock = document.getElementById('grupos-dock');
    const publishersDock = document.getElementById('publishers-dock');
    const totalsDockBtnGrafico = document.getElementById('totals-dock-btn-grafico');
    const totalsDockBtnEjes = document.getElementById('totals-dock-btn-ejes');
    const btnToggleTotalsDock = document.getElementById('btn-toggle-totals-dock');
    const totalsMonthFromSelect = document.getElementById('totals-month-from');
    const totalsMonthToSelect = document.getElementById('totals-month-to');
    const totalsChartsBlock = document.getElementById('totals-charts-block');
    const totalsTableBlock = document.getElementById('totals-table-block');
    const totalsTableWrap = document.getElementById('totals-table-wrap');
    const totalsBody = document.getElementById('totals-body');
    const totalsMetricField = document.getElementById('totals-metric-field');
    const totalsMatrixSummary = document.getElementById('totals-matrix-summary');
    const dashboardHeaderSection = document.getElementById('dashboard-header-section');
    const publisherDetailBackWrap = document.getElementById('publisher-detail-back-wrap');
    const btnToggleLayoutMode = document.getElementById('btn-toggle-layout-mode');
    const btnPublisherBack = document.getElementById('btn-publisher-back');
    const publisherBackLabel = document.getElementById('publisher-back-label');

    const Icons = window.S21DashboardIcons;
    window.S21DashboardSparklines = {
        nameInnerHtml: (...args) => personNameWithSparkHtml(...args),
        getMetric: () => sparkMetric,
        isVisible: () => sparkVisible,
    };

    const KPI_ITEMS = [
        { key: 'publicadores', label: 'Publicadores' },
        { key: 'horas', label: 'Horas' },
        { key: 'cursos', label: 'Cursos' },
        { key: 'participacion', label: 'Participación' },
        { key: 'precursor_aux', label: 'Prec. aux.' },
        { key: 'inactivos', label: 'Inactivos' },
    ];

    const KPI_PRIVILEGE_OPTIONS = [
        { id: 'anciano', label: 'Anciano' },
        { id: 'siervo_ministerial', label: 'Siervo ministerial' },
        { id: 'precursor_regular', label: 'Precursor regular' },
        { id: 'misionero', label: 'Misionero' },
        { id: 'precursor_especial', label: 'Precursor especial' },
        { id: 'precursor_auxiliar', label: 'Precursor auxiliar' },
        { id: 'hombre', label: 'Hombre' },
        { id: 'mujer', label: 'Mujer' },
        { id: 'ungidos', label: 'Ungidos' },
        { id: 'otras_ovejas', label: 'Otras ovejas' },
        { id: 'no_bautizado', label: 'No bautizado' },
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

    const PUBLISHER_MONTH_COLUMNS = [
        { id: 'nombre', label: 'Nombre', type: 'text', getValue: row => row.nombre },
        { id: 'horas', label: 'Horas', type: 'number', getValue: row => row.horas },
        { id: 'cursos', label: 'Cursos', type: 'number', getValue: row => row.cursos },
        { id: 'participacion', label: 'Part.', type: 'number', getValue: row => row.participacion },
        { id: 'precursor_auxiliar', label: 'P. aux.', type: 'number', getValue: row => row.precursor_auxiliar },
        { id: 'comentarios', label: 'Comentarios', type: 'text', getValue: row => row.notas || '' },
    ];

    try {
        initControls();
    } catch (error) {
        console.error('No se pudieron iniciar los controles de Totales', error);
        populateMetricSelect();
    }
    let chromeReady = false;
    try {
        bindEvents();
        initSectionAccordions();
        initDashboardNav();
        chromeReady = true;
        initLayoutMode();
        initFiltersCollapsed();
        initDatosModule();
        initBackupModule();
        initWizard();
        initGruposModule();
        restoreDashboardCache();
    } catch (error) {
        console.error('Error al iniciar el dashboard', error);
        if (!chromeReady) {
            try { initDashboardNav(); } catch (navError) {
                console.error('No se pudo iniciar la navegación', navError);
            }
        }
    }

    function initBackupModule() {
        const Backup = window.S21DashboardBackup;
        if (!Backup) return;

        async function applyRestoredDataset(ds) {
            if (ds?.packages?.length) {
                await applyPackages(ds.packages, {
                    label: ds.meta?.label || ds.name,
                    folderLabel: ds.meta?.folderLabel,
                    añoMeta: ds.meta?.añoMeta,
                    datasetId: ds.id,
                    skipSavePrompt: true,
                });
                window.S21DashboardWizard?.showLoaded?.();
            } else {
                clearAll(false);
            }
        }

        Backup.init({
            onRestored: applyRestoredDataset,
            onRestoredEmpty: () => clearAll(false),
        });
        window.S21BackupGoogleUi?.init?.();
        window.S21AutoBackup?.start?.();

        window.addEventListener('s21-backup-restored', async (e) => {
            await applyRestoredDataset(e.detail?.dataset || null);
        });
    }

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
            hasActiveLoad: () => packages.length > 0,
            getActivePackages: () => packages,
            onUpdateApplied: async (mergedPackages, meta) => {
                await applyPackages(mergedPackages, meta);
                if (Storage?.isAvailable()) {
                    await Datos.persistSave('replace', mergedPackages, meta);
                }
                setLoadStatus('Carga actualizada. El detalle queda en el informe.', false);
            },
        });
    }

    async function getPackagesForComparison() {
        if (packages.length) return packages;
        if (!Storage?.isAvailable()) return [];
        try {
            const active = await Storage.getActiveDataset();
            return active?.packages?.length ? active.packages : [];
        } catch {
            return [];
        }
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
                    return true;
                }
                const current = await getPackagesForComparison();
                if (current.length) {
                    const review = await Datos.promptIncomingReview(loadedPackages, meta, current);
                    if (review === 'update') return true;
                    if (review !== 'new') return true;
                }
                const action = await Datos.promptSaveAction(loadedPackages, meta);
                if (!action) return packages.length > 0;
                await applyPackages(loadedPackages, meta);
                await Datos.persistSave(action, loadedPackages, { ...meta, lastUpdateReport: null });
                Datos.closePanel();
                return true;
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
        /* Grupo se filtra desde el panel de filtros (toggles numéricos). */
        if (!G) return;
        const count = G.getConfig().groupCount;
        const selected = publisherGroupFilter;
        const valid = selected === '' || selected === '0'
            || (Number(selected) >= 1 && Number(selected) <= count);
        publisherGroupFilter = valid ? selected : '';
        if (publisherBulkGrupo) {
            publisherBulkGrupo.innerHTML = '<option value="">Todos los grupos</option>' +
                '<option value="0">Sin grupo</option>' +
                Array.from({ length: count }, (_, i) => {
                    const n = i + 1;
                    return `<option value="${n}">Grupo ${n}</option>`;
                }).join('');
            publisherBulkGrupo.value = publisherGroupFilter;
        }
    }

    function populateMetricSelect() {
        const metrics = D?.S21_CHART_METRICS;
        if (!metricSelect || !Array.isArray(metrics) || !metrics.length) return;
        const prev = metricSelect.value;
        metricSelect.innerHTML = metrics.map(m =>
            `<option value="${escapeAttr(m.id)}">${escapeHtml(m.label)}</option>`
        ).join('');
        metricSelect.value = metrics.some(m => m.id === prev) ? prev : metrics[0].id;
    }

    function initControls() {
        populateMetricSelect();
        if (!D || !group1 || !group2) return;
        group1.innerHTML = D.S21_TOTALS_GROUP_FIELDS.map(f =>
            `<option value="${f.id}">${f.label}</option>`
        ).join('');
        group1.value = 'origen';

        group2.innerHTML = '<option value="">— Ninguno —</option>' + D.S21_TOTALS_GROUP_FIELDS.map(f =>
            `<option value="${f.id}">${f.label}</option>`
        ).join('');

        restoreTotalsPrefs();
        syncTotalsGroupSelects();
        syncTotalsReportLayout();

        if (totalsScopeSelect) {
            totalsScopeSelect.innerHTML =
                '<option value="year">Año completo</option>' +
                D.S21_MESES.map(m =>
                    `<option value="${m}">${D.mesLabel(m, 'completo')}</option>`
                ).join('');
        }

        fillTotalsMonthSelect(totalsMonthFromSelect, totalsMonthFrom);
        fillTotalsMonthSelect(totalsMonthToSelect, totalsMonthTo);

        if (totalsExcludeSelect) {
            totalsExcludeSelect.innerHTML = Array.from({ length: 12 }, (_, n) =>
                `<option value="${n}">${n === 0 ? 'Ninguno' : n}</option>`
            ).join('');
            totalsExcludeSelect.value = String(chartExcludeMonths);
        }
    }

    function fillTotalsMonthSelect(select, selected) {
        if (!select) return;
        select.innerHTML = D.S21_MESES.map(m =>
            `<option value="${m}">${D.mesLabel(m, 'completo')}</option>`
        ).join('');
        select.value = D.S21_MESES.includes(selected) ? selected : D.S21_MESES[0];
    }

    function restoreTotalsPrefs() {
        const layout = localStorage.getItem(TOTALS_LAYOUT_KEY);
        if (layout === 'table' || layout === 'charts' || layout === 'both') totalsLayoutMode = layout;
        const chartMode = localStorage.getItem(TOTALS_CHART_MODE_KEY);
        if (chartMode === 'together' || chartMode === 'bar' || chartMode === 'line') totalsChartMode = chartMode;
        const excludeRaw = Number(localStorage.getItem(TOTALS_EXCLUDE_KEY));
        if (Number.isFinite(excludeRaw)) {
            chartExcludeMonths = Math.max(0, Math.min(11, excludeRaw));
        }
        const trimSide = localStorage.getItem(TOTALS_TRIM_SIDE_KEY);
        if (trimSide === 'first' || trimSide === 'last') chartTrimSide = trimSide;
        const trimMode = localStorage.getItem(TOTALS_TRIM_MODE_KEY);
        if (trimMode === 'keep' || trimMode === 'omit') chartTrimMode = trimMode;
        const from = localStorage.getItem(TOTALS_MONTH_FROM_KEY);
        const to = localStorage.getItem(TOTALS_MONTH_TO_KEY);
        if (D.S21_MESES.includes(from)) totalsMonthFrom = from;
        if (D.S21_MESES.includes(to)) totalsMonthTo = to;
    }

    function persistTotalsTimePrefs() {
        localStorage.setItem(TOTALS_EXCLUDE_KEY, String(chartExcludeMonths));
        localStorage.setItem(TOTALS_TRIM_SIDE_KEY, chartTrimSide);
        localStorage.setItem(TOTALS_TRIM_MODE_KEY, chartTrimMode);
        localStorage.setItem(TOTALS_MONTH_FROM_KEY, totalsMonthFrom);
        localStorage.setItem(TOTALS_MONTH_TO_KEY, totalsMonthTo);
    }

    function normalizeTotalsMonthRange() {
        const fromIdx = D.S21_MESES.indexOf(totalsMonthFrom);
        const toIdx = D.S21_MESES.indexOf(totalsMonthTo);
        if (fromIdx < 0 || toIdx < 0 || fromIdx <= toIdx) return;
        const tmp = totalsMonthFrom;
        totalsMonthFrom = totalsMonthTo;
        totalsMonthTo = tmp;
        if (totalsMonthFromSelect) totalsMonthFromSelect.value = totalsMonthFrom;
        if (totalsMonthToSelect) totalsMonthToSelect.value = totalsMonthTo;
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
            if (e.key === 'Escape') {
                closeExportMenus();
                closeTotalsDockPanels();
            }
        });
    }

    function bindEvents() {
        btnClearData?.addEventListener('click', () => clearAll(false));
        btnToggleFilters?.addEventListener('click', toggleFilters);
        filterModeBtns.forEach(btn => {
            btn.addEventListener('click', () => setFilterMode(btn.dataset.filterMode));
        });
        if (btnClearFilters) btnClearFilters.addEventListener('click', clearPublisherFilters);
        if (btnClearCrossFilter) btnClearCrossFilter.addEventListener('click', clearDetailLinkFilter);
        if (btnResetPerfilAliases) btnResetPerfilAliases.addEventListener('click', resetPerfilAliasesToSuggested);
        if (pivotBody) pivotBody.addEventListener('click', onPivotBodyClick);
        group1?.addEventListener('change', onTotalsGroupingChange);
        group2?.addEventListener('change', onTotalsGroupingChange);
        totalsLayoutToggle?.addEventListener('change', onTotalsViewCheck);
        totalsChartModeToggle?.addEventListener('change', onTotalsChartCheck);
        totalsTrimModeToggle?.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-trim-mode]');
            if (btn) setTotalsTrimMode(btn.dataset.trimMode);
        });
        totalsTrimSideToggle?.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-trim-side]');
            if (btn) setTotalsTrimSide(btn.dataset.trimSide);
        });
        bindTotalsDocks();
        totalsExcludeSelect?.addEventListener('change', () => {
            setChartExcludeMonths(Number(totalsExcludeSelect.value));
        });
        totalsScopeSelect?.addEventListener('change', () => {
            totalsScope = totalsScopeSelect.value || 'year';
            refresh();
        });
        totalsMonthFromSelect?.addEventListener('change', () => {
            totalsMonthFrom = totalsMonthFromSelect.value || D.S21_MESES[0];
            normalizeTotalsMonthRange();
            persistTotalsTimePrefs();
            refresh();
        });
        totalsMonthToSelect?.addEventListener('change', () => {
            totalsMonthTo = totalsMonthToSelect.value || D.S21_MESES[D.S21_MESES.length - 1];
            normalizeTotalsMonthRange();
            persistTotalsTimePrefs();
            refresh();
        });
        metricSelect?.addEventListener('change', () => {
            refreshCharts();
            if (isTotalsReportMode()) {
                renderTable(aggregated, getTotalsGroupFields());
            }
        });
        kpiModeBtns.forEach(btn => {
            btn.addEventListener('click', () => setKpiMode(btn.dataset.kpiMode));
        });
        bindKpiDetailModal();
        btnExportCsv?.addEventListener('click', () => requestExport('totals', 'csv'));
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
                refreshPublisherViews();
            });
        }
        if (publisherBulkGrupo) {
            publisherBulkGrupo.addEventListener('change', () => {
                publisherGroupFilter = publisherBulkGrupo.value;
                updateFiltersSummary();
                refreshPublisherViews();
            });
        }
        document.querySelectorAll('#publishers-dock [data-publisher-view]').forEach(btn => {
            btn.addEventListener('click', () => setPublisherViewMode(btn.dataset.publisherView));
        });

        window.matchMedia('(min-width: 769px)').addEventListener('change', syncPublisherMetricLayout);

        let lastBarHorizontal = prefersHorizontalBarChart({ stacked: isBarChartStacked() });
        window.addEventListener('resize', () => {
            const horizontal = prefersHorizontalBarChart({ stacked: isBarChartStacked() });
            if (horizontal !== lastBarHorizontal) {
                lastBarHorizontal = horizontal;
                if (aggregated.length) refresh();
                return;
            }
            scheduleChartResize();
        });

        window.addEventListener('s21-prefs-changed', () => {
            scheduleChartResize();
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
        sparkCache.clear();
        if (!packages.length) {
            flat = { mensual: [], publicadores: [] };
            setStageOpen(dashboardContent, false);
            setStageOpen(emptyState, true);
            destroyCharts();
            destroyPublisherDetailChart();
            selectedPublisherKey = '';
            if (publisherListBody) publisherListBody.innerHTML = '';
            if (publisherMonthView) publisherMonthView.innerHTML = '';
            if (publisherDetailContent) {
                publisherDetailContent.innerHTML = '';
            }
            publisherDetailMotionMode = 'instant';
            setPublisherDetailVisible(false, 'instant');
            renderFileList();
            if (chartProfileTogglesWrap) chartProfileTogglesWrap.classList.add('hidden');
            syncTotalsDockChrome();
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
        populateMetricSelect();
        setStageOpen(emptyState, false);
        setStageOpen(dashboardContent, true);
        hideLoadStatus();
        refresh();
        if (layoutMode === 'single') {
            applySingleSectionView(singleActiveSection);
        }
        syncTotalsDockChrome();
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

    function sparkMetricLabel(id) {
        if (id === 'none') return 'Ocultar';
        return PUBLISHER_DETAIL_METRICS.find(m => m.id === id)?.title
            || D.chartMetricLabel?.(id)
            || id;
    }

    function publisherSparkSvg(pub) {
        try {
            if (!sparkVisible || sparkMetric === 'none') return '';
            if (!D?.publisherMetricSeries || !D?.sparklineSvg) return '';
            const key = D.personKey(pub);
            const cacheKey = `${sparkMetric}::${key}`;
            if (sparkCache.has(cacheKey)) return sparkCache.get(cacheKey);
            const binary = Boolean(D.isBinaryMetric?.(sparkMetric));
            const values = D.publisherMetricSeries(flat.mensual, key, sparkMetric);
            const svg = D.sparklineSvg(values, {
                binary,
                width: 132,
                height: binary ? 14 : 36,
            });
            sparkCache.set(cacheKey, svg);
            return svg;
        } catch {
            return '';
        }
    }

    function personNameWithSparkHtml(pub, escapedName) {
        const name = escapedName ?? escapeHtml(pub?.nombre || '—');
        const icon = Icons?.personIconHtml?.(pub, { decorative: true }) || '';
        if (!sparkVisible || sparkMetric === 'none') {
            return `${icon}<span class="person-name-text">${name}</span>`;
        }
        const spark = publisherSparkSvg(pub);
        const metric = sparkMetricLabel(sparkMetric);
        const binary = Boolean(D.isBinaryMetric?.(sparkMetric));
        const mainClass = binary ? 'person-name-main person-name-main--bits' : 'person-name-main';
        const sparkClass = binary ? 'person-sparkline person-sparkline--below' : 'person-sparkline';
        return `${icon}<span class="${mainClass}"><span class="person-name-text">${name}</span><span class="${sparkClass}" title="${escapeAttr(metric)}" aria-hidden="true">${spark}</span></span>`;
    }

    function syncSparkVisibilityButtons() {
        const label = sparkVisible ? 'Ocultar tendencia' : 'Mostrar tendencia';
        document.querySelectorAll('[data-spark-visible-toggle]').forEach(btn => {
            btn.classList.toggle('is-open', sparkVisible);
            btn.setAttribute('aria-pressed', sparkVisible ? 'true' : 'false');
            btn.setAttribute('aria-label', label);
            btn.title = label;
            btn.innerHTML = sparkVisible ? SPARK_TOGGLE_ICONS.on : SPARK_TOGGLE_ICONS.off;
        });
    }

    function syncSparkDockMarks() {
        document.querySelectorAll('[data-spark-metric]').forEach(btn => {
            const on = btn.dataset.sparkMetric === sparkMetric;
            btn.classList.toggle('is-open', on);
            btn.classList.toggle('active', on);
            btn.setAttribute('aria-pressed', on ? 'true' : 'false');
            if (btn.getAttribute('role') === 'option') {
                btn.setAttribute('aria-selected', on ? 'true' : 'false');
            }
        });
        document.querySelectorAll('.totals-dock-btn[data-dock-panel="metrica"]').forEach(btn => {
            btn.classList.toggle('has-value', sparkVisible && sparkMetric !== 'horas');
        });
        syncSparkVisibilityButtons();
    }

    function refreshSparkViews() {
        sparkCache.clear();
        syncSparkDockMarks();
        renderPublisherList();
        if (selectedPublisherKey) renderPublisherDetail();
        G?.render?.();
        if (kpiDetailKey && kpiDetailModal?.classList.contains('is-open')) {
            refreshKpiDetailTable();
        }
    }

    function setSparkVisible(visible) {
        const next = Boolean(visible);
        if (next === sparkVisible) return;
        sparkVisible = next;
        localStorage.setItem(SPARK_VISIBLE_KEY, sparkVisible ? '1' : '0');
        refreshSparkViews();
    }

    function setSparkMetric(metricId) {
        if (!SPARK_METRICS.includes(metricId)) return;
        const metricChanged = metricId !== sparkMetric;
        const wasHidden = !sparkVisible;
        if (!metricChanged && !wasHidden) return;
        sparkMetric = metricId;
        sparkVisible = true;
        localStorage.setItem(SPARK_METRIC_KEY, sparkMetric);
        localStorage.setItem(SPARK_VISIBLE_KEY, '1');
        refreshSparkViews();
    }

    function syncPublisherOrigenFiltersFromChart(row) {
        const allOrigenes = D.uniqueValues(flat.mensual, 'origen');
        if (!allOrigenes.length) return;

        const included = getChartIncludedOrigenes();
        const includedList = allOrigenes.filter(o => included.has(o));
        const clickHasOrigen = Boolean(row?.keys?.some(k => k.field === 'origen'));

        if (!includedList.length) {
            filters.origen = [];
            return;
        }

        if (clickHasOrigen) {
            if (!filters.origen) filters.origen = [];
            filters.origen = filters.origen.filter(o => included.has(o));
            return;
        }

        if (includedList.length < allOrigenes.length) {
            filters.origen = includedList;
        }
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
                refresh();
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

    const CHART_LABEL_SHORT = {
        Participación: 'Part.',
        'Precursor auxiliar': 'P. aux.',
        'Siervo ministerial': 'Siervo m.',
        'Precursor regular': 'P. reg.',
        'Precursor especial': 'P. esp.',
        Publicadores: 'Publ.',
        'Inact./irreg.': 'Inact.',
    };

    const CHART_AXIS_CHAR_PX = 5.4;

    function shortenChartLabel(text, maxLen = 10) {
        const s = String(text ?? '').trim();
        if (!s || s === '—') return '—';
        if (CHART_LABEL_SHORT[s]) return CHART_LABEL_SHORT[s];
        if (s.length <= maxLen) return s;
        return `${s.slice(0, Math.max(1, maxLen - 1))}…`;
    }

    function fitChartAxisLabel(text, slotPx) {
        const s = String(text ?? '').trim();
        if (!s || s === '—') return '—';
        if (!slotPx || slotPx >= s.length * CHART_AXIS_CHAR_PX + 2) return s;
        const maxChars = Math.max(3, Math.floor((slotPx - 2) / CHART_AXIS_CHAR_PX));
        return shortenChartLabel(s, maxChars);
    }

    function chartAxisTickCallback(value, index, ticks) {
        try {
            const chart = this.chart;
            const labels = chart?.data?.labels;
            const label = String(
                labels && index >= 0 && index < labels.length
                    ? labels[index]
                    : (this.getLabelForValue?.(value) ?? value ?? '')
            );
            const area = chart?.chartArea;
            const onCategoryX = this.axis !== 'y';
            const areaSize = area
                ? (onCategoryX ? (area.right - area.left) : (area.bottom - area.top))
                : 0;
            const count = Math.max(ticks?.length || labels?.length || 1, 1);
            const slotPx = areaSize > 0 ? areaSize / count : 0;
            return fitChartAxisLabel(label, slotPx);
        } catch (_) {
            return '';
        }
    }

    const TABLE_HEADER_LINES = {
        participación: ['Partic.', 'ipación'],
        'prec. aux.': ['Prec.', 'aux.'],
        publicadores: ['Public.', 'adores'],
        'inact./irreg.': ['Inact.', 'irreg.'],
        'siervo ministerial': ['Siervo', 'minist.'],
        'precursor regular': ['Prec.', 'regular'],
        'precursor especial': ['Prec.', 'especial'],
        'precursor auxiliar': ['Prec.', 'aux.'],
        'no bautizado': ['No', 'bautizado'],
        'no bautizados': ['No', 'bautizados'],
        publicador: ['Public.', 'ador'],
        publicadora: ['Public.', 'adora'],
    };

    function splitLabelLines(label) {
        const text = String(label ?? '').trim();
        if (!text || text === '—') return ['—'];
        const preset = TABLE_HEADER_LINES[text.toLowerCase()];
        if (preset) return preset;
        const words = text.split(/\s+/).filter(Boolean);
        if (words.length >= 3 && text.length > 10) {
            const mid = Math.ceil(words.length / 2);
            return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
        }
        if (words.length === 2 && text.length > 8) return words;
        return [text];
    }

    function formatTableHeaderHtml(label) {
        return splitLabelLines(label).map(escapeHtml).join('<br>');
    }

    function shouldCompactTableHeaders(columnCount) {
        return columnCount > 7;
    }

    function formatTableColumnHeader(label, columnCount) {
        const text = String(label ?? '');
        if (!shouldCompactTableHeaders(columnCount) && text.length <= 16 && !text.includes(' ')) {
            return escapeHtml(text);
        }
        if (!shouldCompactTableHeaders(columnCount) && text.length <= 18 && !TABLE_HEADER_LINES[text.toLowerCase()]) {
            return escapeHtml(text);
        }
        return formatTableHeaderHtml(text);
    }

    function formatMatrixAxisLabel(field, value, compact = false) {
        if (field === 'mes') return escapeHtml(D.mesLabel(value, 'corto'));
        const full = displayGroupValue(field, value);
        if (!compact && full.length <= 16) return escapeHtml(full);
        return formatTableHeaderHtml(full);
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

    function filterChipClass(field, active) {
        return `${active ? 'on' : ''}${filterMode === 'exclude' && active ? ' is-exclude' : ''}`.trim();
    }

    function filterValueLabel(field, value) {
        if (field === 'origen') return displayPerfil(value);
        if (field === 'grupo') {
            if (value === '—' || value === '0') return '—';
            const n = String(value).match(/\d+/);
            return n ? n[0] : String(value);
        }
        return FILTER_VALUE_SHORT[value] || String(value);
    }

    function grupoFilterOptions() {
        const count = G?.getConfig?.()?.groupCount || 0;
        const opts = [];
        for (let i = 1; i <= count; i += 1) {
            opts.push({ value: `Grupo ${i}`, label: String(i) });
        }
        opts.push({ value: '—', label: '—' });
        return opts;
    }

    function fieldFilterValues(field) {
        if (field === 'grupo') return grupoFilterOptions().map(o => o.value);
        if (FILTER_SWITCH_FIELDS.has(field)) return ['Sí'];
        return field === 'origen'
            ? D.uniqueValues(flat.publicadores, field)
            : D.uniqueValues(flat.mensual, field);
    }

    function isFilterValueActive(field, value) {
        return Boolean(filters[field]?.includes(value));
    }

    function isSwitchFilterOn(field) {
        return isFilterValueActive(field, 'Sí');
    }

    function setFilterValues(field, values) {
        filters[field] = Array.isArray(values) ? values : [];
    }

    function toggleMultiFilterValue(field, value) {
        if (!filters[field]) filters[field] = [];
        const idx = filters[field].indexOf(value);
        if (idx >= 0) filters[field].splice(idx, 1);
        else filters[field].push(value);
    }

    function toggleExclusiveFilterValue(field, value) {
        if (!filters[field]) filters[field] = [];
        if (filters[field].length === 1 && filters[field][0] === value) {
            filters[field] = [];
        } else {
            filters[field] = [value];
        }
    }

    function toggleSwitchFilter(field) {
        setFilterValues(field, isSwitchFilterOn(field) ? [] : ['Sí']);
    }

    function renderFusedSeg(field, values, options = {}) {
        const exclusive = Boolean(options.exclusive);
        const aria = options.ariaLabel || filterFieldLabel(field);
        const grid = Boolean(options.grid);
        const buttons = values.map(v => {
            const active = isFilterValueActive(field, v);
            const label = options.labelFn ? options.labelFn(v) : filterValueLabel(field, v);
            return `<button type="button" class="pub-filter-seg-btn ${filterChipClass(field, active)}"
                data-field="${field}" data-value="${escapeAttr(v)}" data-filter-kind="${exclusive ? 'exclusive' : 'multi'}"
                title="${escapeAttr(String(v))}" aria-pressed="${active ? 'true' : 'false'}">${escapeHtml(label)}</button>`;
        }).join('');
        const segClass = grid
            ? 'pub-filter-seg pub-filter-seg--fused pub-filter-seg--grid'
            : 'pub-filter-seg pub-filter-seg--fused';
        return `<div class="${segClass}" role="group" aria-label="${escapeAttr(aria)}">${buttons || '<span class="filter-group-empty">Sin valores</span>'}</div>`;
    }

    function renderSwitchBtn(field) {
        const active = isSwitchFilterOn(field);
        const label = FILTER_SHORT_LABELS[field] || filterFieldLabel(field);
        return `<button type="button" class="pub-filter-switch ${active ? 'on' : ''}${filterMode === 'exclude' && active ? ' is-exclude' : ''}"
            data-field="${field}" data-filter-kind="switch" aria-pressed="${active ? 'true' : 'false'}"
            title="${escapeAttr(filterFieldLabel(field))}">${escapeHtml(label)}</button>`;
    }

    function renderFilters() {
        if (!filtersBody) return;
        for (const field of FILTER_FIELDS) {
            if (!filters[field]) filters[field] = [];
        }

        const perfilValues = fieldFilterValues('origen');
        const sexoValues = fieldFilterValues('sexo').filter(v => v && v !== '—');
        const esperanzaValues = fieldFilterValues('esperanza').filter(v => v && v !== '—');
        const grupoOpts = grupoFilterOptions();
        const perfilActive = filters.origen?.length || 0;
        const perfilOpen = publisherPerfilFiltersOpen;

        filtersBody.innerHTML = `<div class="pub-filters-grid">
            <div class="pub-filter-perfil${perfilOpen ? ' is-open' : ''}">
                <button type="button" class="pub-filter-perfil-toggle" data-perfil-toggle
                    aria-expanded="${perfilOpen ? 'true' : 'false'}">
                    <span class="pub-filter-perfil-toggle-main">
                        <span class="pub-filter-label pub-filter-label--inline">Perfil</span>
                        ${perfilActive ? `<span class="pub-filter-perfil-count">${perfilActive}</span>` : ''}
                    </span>
                    <span class="pub-filter-perfil-chevron" aria-hidden="true">${perfilOpen ? '▾' : '▸'}</span>
                </button>
                <div class="pub-filter-perfil-body${perfilOpen ? ' is-open' : ''}" ${perfilOpen ? '' : 'hidden'}>
                    ${renderFusedSeg('origen', perfilValues, {
                        ariaLabel: 'Perfil',
                        grid: true,
                        labelFn: v => displayPerfil(v),
                    })}
                </div>
            </div>
            <div class="pub-filter-row">
                <span class="pub-filter-label">Grupo</span>
                ${renderFusedSeg('grupo', grupoOpts.map(o => o.value), {
                    ariaLabel: 'Grupo',
                    labelFn: v => grupoOpts.find(o => o.value === v)?.label || filterValueLabel('grupo', v),
                })}
            </div>
            <div class="pub-filter-row pub-filter-row--solo">
                ${renderFusedSeg('sexo', sexoValues, { exclusive: true, ariaLabel: 'Sexo' })}
            </div>
            <div class="pub-filter-row pub-filter-row--solo">
                ${renderFusedSeg('esperanza', esperanzaValues, { exclusive: true, ariaLabel: 'Esperanza' })}
            </div>
            <div class="pub-filter-row pub-filter-row--pair">
                ${renderSwitchBtn('anciano')}
                ${renderSwitchBtn('siervo_ministerial')}
            </div>
            <div class="pub-filter-row pub-filter-row--triple">
                ${renderSwitchBtn('precursor_regular')}
                ${renderSwitchBtn('precursor_especial')}
                ${renderSwitchBtn('misionero')}
            </div>
        </div>`;

        filtersBody.querySelector('[data-perfil-toggle]')?.addEventListener('click', () => {
            publisherPerfilFiltersOpen = !publisherPerfilFiltersOpen;
            renderFilters();
        });

        filtersBody.querySelectorAll('[data-filter-kind]').forEach(btn => {
            btn.addEventListener('click', () => {
                const field = btn.dataset.field;
                const kind = btn.dataset.filterKind;
                const val = btn.dataset.value;
                if (kind === 'switch') toggleSwitchFilter(field);
                else if (kind === 'exclusive') toggleExclusiveFilterValue(field, val);
                else toggleMultiFilterValue(field, val);
                if (field === 'grupo') publisherGroupFilter = '';
                if (field === 'origen') publisherPerfilFiltersOpen = true;
                renderFilters();
                refreshPublishersSection();
            });
        });

        updateFiltersSummary();
    }

    function applyPublisherFilters() {
        const activeFilters = getActiveFilters();
        const mensualProfile = D.applyFilters(flat.mensual, activeFilters, filterMode);
        let pubs = D.applyFilters(flat.publicadores, activeFilters, filterMode);
        if (D.uniquePublishers) pubs = D.uniquePublishers(pubs);

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
        if (source === 'grafico') {
            syncPublisherOrigenFiltersFromChart(row);
        }
        syncFilterModeUI();
        renderFilters();
        updateDetailFilterBanner();
        selectedPublisherKey = '';
        expandFiltersPanel();
        refreshPublishersSection();
        navigateToPublishersFromDrill();
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
        filterMode = 'include';
        syncPublisherOrigenFiltersFromChart(null);
        syncFilterModeUI();
        renderFilters();
        updateDetailFilterBanner();
        selectedPublisherKey = '';
        expandFiltersPanel();
        refreshPublishersSection();
        navigateToPublishersFromDrill();
    }

    function clearDetailLinkFilter() {
        detailMonthlyFilter = null;
        updateDetailFilterBanner();
        refreshPublishersSection();
    }

    function clearPublisherFilters() {
        filters = buildDefaultFilters();
        publisherGroupFilter = '';
        if (publisherBulkGrupo) publisherBulkGrupo.value = '';
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
        if (publishersDock && !publishersDock.hidden) {
            publishersDock.classList.remove('is-collapsed');
            openTotalsDockPanel('publishers-dock-panel-filtros');
        }
    }

    function motionScrollBehavior() {
        return window.S21Motion?.scrollBehavior?.() || 'smooth';
    }

    function navigateToPublishersFromDrill() {
        navigateToDashboardSection('publishers', { crossSection: true }).then(() => {
            expandAccordion('publishers');
            syncTotalsDockChrome();
            expandFiltersPanel();
            publisherSection?.scrollIntoView({ behavior: motionScrollBehavior(), block: 'start' });
        });
    }

    function scrollToPublisherSection() {
        navigateToPublishersFromDrill();
    }

    function getTotalsGroupFields() {
        const g1 = group1?.value;
        const g2 = group2?.value;
        return [g1, g2].filter((v, i, arr) => v && arr.indexOf(v) === i);
    }

    function getTotalsDimensions() {
        const [f1, f2] = getTotalsGroupFields();
        if (!f2) {
            return { primary: f1, secondary: null, fields: f1 ? [f1] : [] };
        }
        if (totalsDimensionSwapped) {
            return { primary: f2, secondary: f1, fields: [f2, f1] };
        }
        return { primary: f1, secondary: f2, fields: [f1, f2] };
    }

    function isTotalsReportMode() {
        return getTotalsGroupFields().length === 2;
    }

    function getTotalsMetricIds() {
        return D.totalsMetricColumns(totalsScope, getTotalsGroupFields());
    }

    function isTotalsFullYearRange() {
        return D.isFullServiceYearRange(totalsMonthFrom, totalsMonthTo);
    }

    function totalsHasTimeFilter() {
        return chartExcludeMonths > 0 || !isTotalsFullYearRange();
    }

    function totalsHasProfileFilter() {
        const all = D.uniqueValues(flat.mensual, 'origen');
        if (!all.length) return false;
        return getChartIncludedOrigenes().size !== all.length;
    }

    function getTotalsMensual(sourceMensual, { applyScope = true } = {}) {
        let rows = sourceMensual || [];
        if (applyScope) rows = D.filterMensualByScope(rows, totalsScope);
        rows = D.filterMensualByMonthRange(rows, totalsMonthFrom, totalsMonthTo);
        rows = D.filterMensualByExcludedMonths(rows, getTotalsTrimOpts());
        return filterMensualForCharts(rows);
    }

    function totalsUniquePeople(mensual) {
        return new Set((mensual || []).map(r => D.personKey(r))).size;
    }

    function totalsFooterPublisherCount() {
        if (totalsScope === 'year' && !totalsHasTimeFilter() && !totalsHasProfileFilter()) {
            return kpisCache.publicadores_total ?? totalsUniquePeople(totalsMensualCache);
        }
        return totalsUniquePeople(totalsMensualCache);
    }

    function totalsFooterInactivos(sumInactivos) {
        if (totalsScope === 'year' && !totalsHasTimeFilter() && !totalsHasProfileFilter()) {
            return kpisCache.metrics?.inactivos?.total ?? sumInactivos;
        }
        return sumInactivos;
    }

    function syncTotalsSegToggle(root, attr, value) {
        root?.querySelectorAll(`[${attr}]`).forEach(btn => {
            const active = btn.getAttribute(attr) === value;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-selected', active ? 'true' : 'false');
        });
    }

    function getTotalsTrimOpts() {
        return { n: chartExcludeMonths, side: chartTrimSide, mode: chartTrimMode };
    }

    function setDockPanelOpen(panel, open, from) {
        if (window.S21Motion?.setOpen) {
            return window.S21Motion.setOpen(panel, open, { from });
        }
        panel.classList.toggle('hidden', !open);
        panel.hidden = !open;
        panel.classList.toggle('is-open', !!open);
        return Promise.resolve();
    }

    function closeDockPanelsIn(dock, exceptId) {
        const panels = dock
            ? dock.querySelectorAll('.totals-dock-panel')
            : document.querySelectorAll('.totals-dock-panel');
        panels.forEach(panel => {
            if (exceptId && panel.id === exceptId) return;
            const from = (dock || panel.closest('.totals-dock'))?.classList.contains('totals-dock--left')
                ? 'left' : 'right';
            setDockPanelOpen(panel, false, from);
        });
        const btns = dock
            ? dock.querySelectorAll('.totals-dock-btn.is-open[data-dock-panel]')
            : document.querySelectorAll('.totals-dock-btn.is-open[data-dock-panel]');
        btns.forEach(btn => {
            if (exceptId && btn.getAttribute('aria-controls') === exceptId) return;
            btn.classList.remove('is-open');
            btn.setAttribute('aria-expanded', 'false');
        });
    }

    function closeTotalsDockPanels(exceptId) {
        closeDockPanelsIn(null, exceptId);
    }

    function openTotalsDockPanel(panelId) {
        const panel = document.getElementById(panelId);
        const btn = document.querySelector(`.totals-dock-btn[aria-controls="${panelId}"]`);
        if (!panel || !btn) return;
        const dock = panel.closest('.totals-dock');
        const from = dock?.classList.contains('totals-dock--left') ? 'left' : 'right';
        const willOpen = !panel.classList.contains('is-open');
        closeTotalsDockPanels(willOpen ? panelId : null);
        setDockPanelOpen(panel, willOpen, from);
        btn.classList.toggle('is-open', willOpen);
        btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    }

    function dockCollapseKey(id) {
        if (id === 'totals-dock-right') return TOTALS_DOCK_RIGHT_KEY;
        if (id === 'grupos-dock') return GRUPOS_DOCK_KEY;
        if (id === 'publishers-dock') return PUBLISHERS_DOCK_KEY;
        return null;
    }

    function injectSparkMetricTool(dock) {
        if (!dock || dock.querySelector('[data-dock-panel="metrica"]')) return;
        const collapse = dock.querySelector('.totals-dock-collapse');
        const rail = dock.querySelector('.totals-dock-rail');
        if (!rail || !collapse) return;
        const panelId = `${dock.id}-panel-metrica`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'totals-dock-btn';
        btn.dataset.dockPanel = 'metrica';
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', panelId);
        btn.dataset.tip = 'Métrica';
        btn.title = 'Métrica';
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>';
        collapse.before(btn);
        const visBtn = document.createElement('button');
        visBtn.type = 'button';
        visBtn.className = 'totals-dock-btn';
        visBtn.dataset.sparkVisibleToggle = '1';
        visBtn.setAttribute('aria-pressed', sparkVisible ? 'true' : 'false');
        visBtn.dataset.tip = 'Tendencia';
        visBtn.title = sparkVisible ? 'Ocultar tendencia' : 'Mostrar tendencia';
        visBtn.innerHTML = sparkVisible ? SPARK_TOGGLE_ICONS.on : SPARK_TOGGLE_ICONS.off;
        collapse.before(visBtn);
        const options = SPARK_METRICS.map(id =>
            `<button type="button" class="spark-metric-option" data-spark-metric="${id}" role="option" aria-selected="false">${SPARK_METRIC_ICONS[id]}<span>${escapeHtml(sparkMetricLabel(id))}</span></button>`
        ).join('');
        dock.insertAdjacentHTML('beforeend', `<div id="${panelId}" class="totals-dock-panel motion-root hidden" hidden>
            <div class="totals-dock-panel-card motion-card">
                <div class="totals-dock-panel-head">
                    <strong>Métrica</strong>
                    <button type="button" class="totals-dock-panel-close" data-dock-close aria-label="Cerrar">×</button>
                </div>
                <div class="totals-dock-panel-body">
                    <div class="spark-metric-list" role="listbox" aria-label="Métrica de tendencia">${options}</div>
                </div>
            </div>
        </div>`);
    }

    function setDockCollapsed(dock, collapsed) {
        if (!dock) return;
        dock.classList.toggle('is-collapsed', collapsed);
        const key = dockCollapseKey(dock.id);
        if (key) localStorage.setItem(key, collapsed ? '0' : '1');
        if (collapsed) closeDockPanelsIn(dock);
        scheduleChartResize();
    }

    function setTotalsDockCollapsed(side, collapsed) {
        setDockCollapsed(totalsDockRight, collapsed);
    }

    function bindTotalsDocks() {
        injectSparkMetricTool(gruposDock);
        injectSparkMetricTool(publishersDock);
        const filtersSlot = document.getElementById('publishers-dock-filters-slot');
        if (filtersSlot && filtersPanel && filtersPanel.parentElement !== filtersSlot) {
            filtersSlot.appendChild(filtersPanel);
            filtersPanel.classList.remove('collapsed');
        }
        document.querySelectorAll('.totals-dock-btn[data-dock-panel]').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                openTotalsDockPanel(btn.getAttribute('aria-controls'));
            });
        });
        totalsDockBtnEjes?.addEventListener('click', e => {
            e.stopPropagation();
            if (!isTotalsReportMode()) return;
            setTotalsDimensionSwapped(!totalsDimensionSwapped);
        });
        document.querySelectorAll('[data-dock-toggle]').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const dock = btn.closest('.totals-dock');
                if (!dock) return;
                setDockCollapsed(dock, !dock.classList.contains('is-collapsed'));
            });
        });
        document.querySelectorAll('[data-dock-close]').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                closeTotalsDockPanels();
            });
        });
        document.querySelectorAll('.totals-dock-btn.kpi-mode-btn, .totals-dock-btn[data-grupos-view], .totals-dock-btn[data-publisher-view]').forEach(btn => {
            btn.addEventListener('click', () => closeDockPanelsIn(btn.closest('.totals-dock')));
        });
        document.querySelectorAll('[data-spark-metric]').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                setSparkMetric(btn.dataset.sparkMetric);
            });
        });
        document.querySelectorAll('[data-spark-visible-toggle]').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                setSparkVisible(!sparkVisible);
            });
        });
        document.addEventListener('pointerdown', e => {
            if (e.target.closest?.('.totals-dock') || e.target.closest?.('#btn-toggle-totals-dock')) return;
            if (e.target.closest?.('option')) return;
            const selectWasOpen = isTotalsDockSelectActive();
            window.setTimeout(() => {
                if (selectWasOpen && isTotalsDockSelectActive()) return;
                closeTotalsDockPanels();
            }, 0);
        });
        document.querySelectorAll('.totals-dock[id]').forEach(dock => {
            const key = dockCollapseKey(dock.id);
            if (key && localStorage.getItem(key) === '0') dock.classList.add('is-collapsed');
        });
        btnToggleTotalsDock?.addEventListener('click', e => {
            e.stopPropagation();
            setTotalsDockUserVisible(!totalsDockUserVisible);
        });
        if (!SPARK_METRICS.includes(sparkMetric)) sparkMetric = 'horas';
        syncSparkDockMarks();
        syncTotalsDockMarks();
        syncTotalsViewChecks();
        syncTotalsGroupSelects();
        syncTotalsDockChrome();
    }

    function isTotalsDockSelectActive() {
        const active = document.activeElement;
        if (!active) return false;
        return Boolean(active.closest?.('.totals-dock'));
    }

    function syncTotalsGroupSelects() {
        const g1 = group1?.value || '';
        const g2 = group2?.value || '';
        group1?.querySelectorAll('option').forEach(opt => {
            opt.disabled = Boolean(g2) && opt.value === g2;
        });
        group2?.querySelectorAll('option').forEach(opt => {
            if (!opt.value) return;
            opt.disabled = Boolean(g1) && opt.value === g1;
        });
    }

    function currentToolsSection() {
        if (!packages.length) return null;
        if (dashboardContent?.hidden || dashboardContent?.classList.contains('hidden')) return null;
        if (layoutMode === 'single') return singleActiveSection || 'kpi';
        return getCurrentNavTarget() || 'kpi';
    }

    function isTotalsSectionOpen() {
        return currentToolsSection() === 'table';
    }

    function setTotalsDockUserVisible(visible) {
        totalsDockUserVisible = Boolean(visible);
        localStorage.setItem(TOOLS_DOCK_VISIBLE_KEY, totalsDockUserVisible ? '1' : '0');
        if (!totalsDockUserVisible) closeTotalsDockPanels();
        syncTotalsDockChrome();
    }

    function syncTotalsDockChrome() {
        const section = currentToolsSection();
        const hasSectionDock = Boolean(section && SECTION_DOCKS[section]);
        const showTools = hasSectionDock && totalsDockUserVisible;
        document.body.classList.toggle('tools-dock-hidden', !showTools);
        if (btnToggleTotalsDock) {
            btnToggleTotalsDock.classList.toggle('hidden', !hasSectionDock);
            btnToggleTotalsDock.hidden = !hasSectionDock;
            btnToggleTotalsDock.setAttribute('aria-pressed', totalsDockUserVisible ? 'true' : 'false');
            const label = totalsDockUserVisible ? 'Ocultar filtros' : 'Mostrar filtros';
            btnToggleTotalsDock.setAttribute('aria-label', label);
            btnToggleTotalsDock.title = label;
        }
        const toolsId = !showTools ? null
            : section === 'table' ? 'totals-dock-right'
            : section === 'grupos' ? 'grupos-dock'
            : section === 'publishers' ? 'publishers-dock'
            : null;
        document.querySelectorAll('.totals-dock.totals-dock--floating').forEach(dock => {
            const on = dock.id === toolsId;
            dock.hidden = !on;
            dock.classList.toggle('hidden', !on);
            if (!on) closeDockPanelsIn(dock);
        });
    }

    function syncTotalsDockMarks() {
        const periodoBtn = document.querySelector('.totals-dock-btn[data-dock-panel="periodo"]');
        const recorteBtn = document.querySelector('.totals-dock-btn[data-dock-panel="recorte"]');
        const agruparBtn = document.querySelector('.totals-dock-btn[data-dock-panel="agrupar"]');
        periodoBtn?.classList.toggle('has-value', totalsScope !== 'year' || !isTotalsFullYearRange());
        recorteBtn?.classList.toggle('has-value', chartExcludeMonths > 0);
        agruparBtn?.classList.toggle('has-value', Boolean(group2?.value));
        totalsDockBtnEjes?.classList.toggle('has-value', totalsDimensionSwapped);
        totalsDockBtnEjes?.setAttribute('aria-pressed', totalsDimensionSwapped ? 'true' : 'false');
        syncTotalsSegToggle(totalsTrimModeToggle, 'data-trim-mode', chartTrimMode);
        syncTotalsSegToggle(totalsTrimSideToggle, 'data-trim-side', chartTrimSide);
    }

    function syncTotalsViewChecks() {
        const table = totalsLayoutToggle?.querySelector('[data-totals-view="table"]');
        const charts = totalsLayoutToggle?.querySelector('[data-totals-view="charts"]');
        if (table) table.checked = totalsLayoutMode !== 'charts';
        if (charts) charts.checked = totalsLayoutMode !== 'table';
        const bar = totalsChartModeToggle?.querySelector('[data-totals-chart="bar"]');
        const line = totalsChartModeToggle?.querySelector('[data-totals-chart="line"]');
        if (bar) bar.checked = totalsChartMode !== 'line';
        if (line) line.checked = totalsChartMode !== 'bar';
    }

    function onTotalsViewCheck(e) {
        const table = totalsLayoutToggle?.querySelector('[data-totals-view="table"]');
        const charts = totalsLayoutToggle?.querySelector('[data-totals-view="charts"]');
        if (!table || !charts) return;
        if (!table.checked && !charts.checked) {
            e.target.checked = true;
            return;
        }
        setTotalsLayoutMode(table.checked && charts.checked ? 'both' : table.checked ? 'table' : 'charts');
    }

    function onTotalsChartCheck(e) {
        const bar = totalsChartModeToggle?.querySelector('[data-totals-chart="bar"]');
        const line = totalsChartModeToggle?.querySelector('[data-totals-chart="line"]');
        if (!bar || !line) return;
        if (!bar.checked && !line.checked) {
            e.target.checked = true;
            return;
        }
        setTotalsChartMode(bar.checked && line.checked ? 'together' : bar.checked ? 'bar' : 'line');
    }

    function syncTotalsLayout() {
        const showTable = totalsLayoutMode !== 'charts';
        const showCharts = totalsLayoutMode !== 'table';
        const showMetricBar = showCharts || isTotalsReportMode();
        totalsChartsBlock?.classList.toggle('hidden', !showCharts);
        totalsChartsBlock?.classList.toggle('totals-charts-block--metric-only', false);
        chartGrid?.classList.toggle('hidden', !showCharts);
        totalsTableBlock?.classList.toggle('hidden', !showTable);
        totalsTableWrap?.classList.toggle('hidden', !showTable);
        if (!showTable) totalsMatrixSummary?.classList.add('hidden');
        totalsChartModeField?.classList.toggle('hidden', !showCharts);
        totalsDockBtnGrafico?.classList.toggle('hidden', !showCharts);
        totalsMetricField?.classList.toggle('hidden', !showMetricBar);
        if (!showCharts) {
            const graficoPanel = document.getElementById('totals-dock-panel-grafico');
            if (graficoPanel?.classList.contains('is-open')) closeTotalsDockPanels();
        }
        syncTotalsViewChecks();
        syncTotalsDockMarks();
        if (showCharts) scheduleChartResize();
    }

    function setTotalsLayoutMode(mode) {
        if (mode !== 'table' && mode !== 'charts' && mode !== 'both') return;
        if (totalsLayoutMode === mode) return;
        totalsLayoutMode = mode;
        localStorage.setItem(TOTALS_LAYOUT_KEY, mode);
        syncTotalsLayout();
        if (mode !== 'table') {
            refreshCharts();
            scheduleChartResize();
        }
    }

    function setTotalsChartMode(mode) {
        if (mode !== 'together' && mode !== 'bar' && mode !== 'line') return;
        if (totalsChartMode === mode) return;
        totalsChartMode = mode;
        localStorage.setItem(TOTALS_CHART_MODE_KEY, mode);
        syncTotalsViewChecks();
        refreshCharts();
        scheduleChartResize();
    }

    function syncTotalsReportLayout() {
        const reportMode = isTotalsReportMode();
        if (!reportMode) {
            totalsDimensionSwapped = false;
            totalsMatrixSummary?.classList.add('hidden');
        }
        totalsBody?.classList.toggle('totals-body--report', reportMode);
        totalsDockBtnEjes?.classList.toggle('hidden', !reportMode);
        pivotTable?.classList.toggle('totals-table--matrix', reportMode);
        syncTotalsLayout();
    }

    function setTotalsDimensionSwapped(swapped) {
        if (!isTotalsReportMode() || totalsDimensionSwapped === swapped) return;
        totalsDimensionSwapped = swapped;
        syncTotalsReportLayout();
        refresh();
    }

    function onTotalsGroupingChange() {
        if (group2?.value && group2.value === group1?.value) group2.value = '';
        totalsDimensionSwapped = false;
        syncTotalsGroupSelects();
        syncTotalsReportLayout();
        refresh();
    }

    function formatMatrixCellValue(val, metricId) {
        const n = Number(val) || 0;
        if (n === 0) return '—';
        const spec = D.S21_CHART_METRICS.find(m => m.id === metricId);
        if (spec?.aggregation === 'avg') {
            return n.toLocaleString('es', { maximumFractionDigits: 1 });
        }
        return formatNum(n);
    }

    function formatStackTotalLabel(sum, metricId) {
        const spec = D.S21_CHART_METRICS.find(m => m.id === metricId);
        if (spec?.aggregation === 'avg') {
            return sum.toLocaleString('es', { maximumFractionDigits: 1 });
        }
        return formatNum(sum);
    }

    function getMatrixMetricId() {
        const ids = getTotalsMetricIds();
        const chartToTable = {
            publicadores_con_cursos: 'publicadores',
            publicadores_sin_cursos: 'publicadores',
            inactivos: 'inactivos',
            precursor_auxiliar: 'precursor_auxiliar',
        };
        const fromChart = chartToTable[metricSelect?.value] || metricSelect?.value;
        if (ids.includes(fromChart)) return fromChart;
        if (ids.includes(sortState.column)) return sortState.column;
        return ids[0] || 'horas';
    }

    function findAggregatedRow(rows, groupFields, values) {
        return rows.find(row =>
            groupFields.every((field, i) => String(row.keys[i]?.value ?? '—') === String(values[i] ?? '—'))
        ) || null;
    }

    function chartSubgroupPalette() {
        return CHART_SUBGROUP_COLORS;
    }

    function totalsFieldKeyIndex(field, groupFields = getTotalsGroupFields()) {
        const idx = groupFields.indexOf(field);
        return idx >= 0 ? idx : 0;
    }

    function buildGroupedBarChartData(barRows, displayFields, metricId, groupFields = getTotalsGroupFields()) {
        const primaryField = displayFields[0];
        const secondaryField = displayFields.length > 1 ? displayFields[1] : null;
        const primIdx = totalsFieldKeyIndex(primaryField, groupFields);
        const secIdx = secondaryField ? totalsFieldKeyIndex(secondaryField, groupFields) : -1;
        const chartLabel = D.chartMetricLabel(metricId);
        const palette = chartPalette();

        if (!secondaryField) {
            const sorted = D.sortRowsForBarChart(barRows, displayFields, metricId);
            const top = sorted.slice(0, 16);
            return {
                mode: 'simple',
                labels: top.map(r => formatAggRowLabel(r)),
                datasets: [{
                    label: chartLabel,
                    data: top.map(r => D.chartMetricValue(r, metricId)),
                    backgroundColor: palette.barBg,
                    borderColor: palette.barBorder,
                    borderWidth: 1,
                    borderRadius: 4,
                }],
                clickRows: top,
            };
        }

        const rowLookup = new Map();
        barRows.forEach(row => {
            const primVal = row.keys[primIdx]?.value ?? '—';
            const secVal = row.keys[secIdx]?.value ?? '—';
            rowLookup.set(`${primVal}\0${secVal}`, row);
        });

        const primaryValuesAll = D.sortGroupValues(primaryField, barRows.map(r => r.keys[primIdx]?.value));
        const secondaryValues = D.sortGroupValues(secondaryField, barRows.map(r => r.keys[secIdx]?.value));
        const primaryTotals = new Map();
        barRows.forEach(row => {
            const key = row.keys[primIdx]?.value ?? '—';
            primaryTotals.set(key, (primaryTotals.get(key) || 0) + D.chartMetricValue(row, metricId));
        });
        const topPrimary = primaryValuesAll
            .slice()
            .sort((a, b) => (primaryTotals.get(b) || 0) - (primaryTotals.get(a) || 0))
            .slice(0, 12);

        const colors = chartSubgroupPalette();
        const datasets = secondaryValues.map((secVal, i) => {
            const tone = colors[i % colors.length];
            const isTop = i === secondaryValues.length - 1;
            return {
                label: displayGroupValue(secondaryField, secVal),
                data: topPrimary.map(primVal => {
                    const row = rowLookup.get(`${primVal}\0${secVal}`);
                    return row ? D.chartMetricValue(row, metricId) : 0;
                }),
                backgroundColor: tone.bg,
                borderColor: tone.border,
                borderWidth: 1,
                borderRadius: isTop ? { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 } : 0,
                borderSkipped: false,
                secondaryValue: secVal,
            };
        });

        return {
            mode: 'stacked',
            labels: topPrimary.map(v => displayGroupValue(primaryField, v)),
            datasets,
            primaryValues: topPrimary,
            rowLookup,
        };
    }

    function createStackTotalsPlugin(metricId) {
        return {
            id: 'stackTotals',
            afterDatasetsDraw(chart) {
                const stacked = chart.options.scales?.x?.stacked || chart.options.scales?.y?.stacked;
                if (!stacked || !chart.data.datasets.length) return;
                const horizontal = chart.options.indexAxis === 'y';
                const valueScale = horizontal ? chart.scales.x : chart.scales.y;
                const c = chartPalette();
                const { ctx, data, chartArea } = chart;
                ctx.save();
                ctx.font = '600 11px var(--font-mono, ui-monospace, monospace)';
                ctx.fillStyle = c.tick;
                ctx.textBaseline = horizontal ? 'middle' : 'bottom';
                data.labels.forEach((_, i) => {
                    let sum = 0;
                    data.datasets.forEach(ds => { sum += Number(ds.data[i]) || 0; });
                    if (sum <= 0) return;
                    const label = formatStackTotalLabel(sum, metricId);
                    const meta = chart.getDatasetMeta(0);
                    const bar = meta?.data?.[i];
                    if (!bar) return;
                    if (horizontal) {
                        ctx.textAlign = 'left';
                        const x = valueScale.getPixelForValue(sum);
                        ctx.fillText(label, Math.min(x + 6, chartArea.right - 2), bar.y);
                    } else {
                        ctx.textAlign = 'center';
                        const y = valueScale.getPixelForValue(sum);
                        ctx.fillText(label, bar.x, Math.max(y - 6, chartArea.top + 10));
                    }
                });
                ctx.restore();
            },
        };
    }

    function handleBarChartClick(elements) {
        if (!elements.length || !chartBarClickContext) return;
        const { datasetIndex, index } = elements[0];
        if (chartBarClickContext.mode === 'simple') {
            const row = chartBarClickContext.clickRows[index];
            if (row) applyDetailFilterFromBar(row);
            return;
        }
        const primVal = chartBarClickContext.primaryValues[index];
        const secVal = chartBarClickContext.datasets[datasetIndex]?.secondaryValue;
        const row = chartBarClickContext.rowLookup.get(`${primVal}\0${secVal}`);
        if (row) applyDetailFilterFromBar(row);
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
        layoutMode = 'single';
        singleActiveSection = getCurrentNavTarget() || 'kpi';
        applyLayoutMode();
        window.S21DashboardPreferences?.setLayoutMode?.('single');
        window.addEventListener('s21-prefs-changed', () => {
            if (layoutMode === 'single') return;
            layoutMode = 'single';
            applyLayoutMode();
        });
    }

    function syncLayoutModeButton() {
        /* Vista continua retirada: la app usa solo vista por sección. */
    }

    function applyLayoutMode() {
        layoutMode = 'single';
        document.body.classList.add('dashboard-layout-single');
        document.documentElement.dataset.dashboardLayout = 'single';
        applySingleSectionView(singleActiveSection);
        syncTotalsDockChrome();
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
        syncTotalsDockChrome();
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
        if (targetId === 'table') {
            scheduleChartResize();
            syncTotalsDockChrome();
        }
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
                if (id === 'table') {
                    if (!willCollapse) scheduleChartResize();
                    syncTotalsDockChrome();
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
        if (id === 'table') {
            scheduleChartResize();
            syncTotalsDockChrome();
        }
    }

    function prefersHorizontalBarChart(options = {}) {
        // Con subagrupación (apilada o agrupada), barras verticales.
        if (options.stacked || options.grouped) return false;
        return window.matchMedia('(max-width: 640px)').matches;
    }

    function isBarChartStacked() {
        return chartBarClickContext?.mode === 'stacked'
            || chartBarClickContext?.mode === 'grouped';
    }

    function prefersMobileLayout() {
        return window.matchMedia('(max-width: 640px)').matches;
    }

    let chartResizeRaf = 0;
    let chartResizeTimer = 0;
    let chartResizing = false;

    function scheduleChartResize() {
        if (chartResizeRaf) cancelAnimationFrame(chartResizeRaf);
        chartResizeRaf = requestAnimationFrame(() => {
            chartResizeRaf = 0;
            resizeDashboardCharts();
        });
        clearTimeout(chartResizeTimer);
        chartResizeTimer = window.setTimeout(resizeDashboardCharts, 200);
    }

    function resizeDashboardCharts() {
        if (chartResizing) return;
        chartResizing = true;
        try {
            refreshChartScrollWidths();
            barChart?.resize();
            lineChart?.resize();
            publisherDetailChart?.resize();
        } finally {
            chartResizing = false;
        }
    }

    function syncChartScrollWidth(_scrollEl, innerEl) {
        if (!innerEl) return;
        innerEl.style.width = '100%';
        innerEl.style.minWidth = '0';
        innerEl.style.maxWidth = '100%';
    }

    function syncBarChartDimensions(scrollEl, innerEl, itemCount, clusterSize = 1, stacked = false) {
        if (!innerEl) return;
        const grouped = clusterSize > 1;
        const horizontal = prefersHorizontalBarChart({ stacked, grouped });
        scrollEl?.classList.toggle('chart-scroll-wrap--vertical', horizontal);
        if (!itemCount) {
            innerEl.style.width = '100%';
            innerEl.style.minWidth = '100%';
            innerEl.style.height = horizontal ? '160px' : (stacked ? '260px' : '210px');
            innerEl.style.minHeight = horizontal ? '160px' : (stacked ? '260px' : '210px');
            return;
        }
        if (horizontal) {
            innerEl.style.width = '100%';
            innerEl.style.minWidth = '100%';
            const band = grouped ? 38 + clusterSize * 10 : 34;
            const minHeight = Math.max(180, itemCount * band + 36);
            innerEl.style.height = `${minHeight}px`;
            innerEl.style.minHeight = `${minHeight}px`;
            return;
        }
        innerEl.style.height = stacked ? '260px' : (grouped ? '240px' : '210px');
        innerEl.style.minHeight = stacked ? '260px' : (grouped ? '240px' : '210px');
        syncChartScrollWidth(scrollEl, innerEl);
    }

    function refreshChartScrollWidths() {
        const stacked = isBarChartStacked();
        const barDatasets = barChart?.data?.datasets?.length || 0;
        syncBarChartDimensions(
            document.getElementById('chart-bar-scroll'),
            document.getElementById('chart-bar-wrap'),
            barChart?.data?.labels?.length || 0,
            stacked ? 1 : (barDatasets > 1 ? barDatasets : 1),
            stacked
        );
        syncChartScrollWidth(
            document.getElementById('chart-line-scroll'),
            document.getElementById('chart-line-wrap')
        );
    }

    function onPivotBodyClick(e) {
        const td = e.target.closest('td.num.drillable');
        if (!td) return;
        const colId = td.dataset.colId;
        if (!colId) return;
        if (td.dataset.matrixKey) {
            const cell = matrixCellCache.get(td.dataset.matrixKey);
            if (cell?.row) applyDetailFilterFromTable(cell.row, colId);
            return;
        }
        const tr = td.closest('tr[data-row-index]');
        if (!tr) return;
        const rowIdx = Number(tr.dataset.rowIndex);
        const row = tableRowsCache[rowIdx];
        if (!row) return;
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
            if (!selected.length) continue;
            const label = FILTER_SHORT_LABELS[field] || D.S21_GROUP_FIELDS.find(g => g.id === field)?.label || field;
            if (FILTER_SWITCH_FIELDS.has(field)) {
                parts.push(`${prefix}${label}`);
            } else if (FILTER_EXCLUSIVE_FIELDS.has(field)) {
                parts.push(`${prefix}${filterValueLabel(field, selected[0])}`);
            } else if (field === 'grupo') {
                parts.push(`${prefix}G ${selected.map(v => filterValueLabel(field, v)).join(',')}`);
            } else {
                parts.push(`${prefix}${label} (${selected.length})`);
            }
        }
        filtersSummary.textContent = parts.length ? parts.join(' · ') : 'Sin restricciones';
        const filtrosBtn = document.querySelector('#publishers-dock .totals-dock-btn[data-dock-panel="publishers-filtros"]');
        filtrosBtn?.classList.toggle('has-value', parts.length > 0 || publisherGroupFilter !== '');
    }

    function initFiltersCollapsed() {
        if (!filtersPanel) return;
        if (filtersPanel.closest('.totals-dock')) {
            filtersPanel.classList.remove('collapsed');
            btnToggleFilters?.setAttribute('aria-expanded', 'true');
            if (filtersChevron) filtersChevron.textContent = '▾';
            return;
        }
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
        const scopedMensual = getTotalsMensual(flat.mensual);
        totalsMensualCache = scopedMensual;
        const pubsForTotals = D.publicadoresEnMensual(scopedMensual, filterPublicadoresForCharts());

        aggregated = D.aggregateRows(scopedMensual, groupFields, pubsForTotals);
        syncTotalsReportLayout();
        renderTable(aggregated, groupFields);
        syncTotalsLayout();
        try {
            renderCharts(aggregated, scopedMensual, metricSelect.value, groupFields);
        } catch (err) {
            console.error('No se pudieron renderizar los gráficos de Totales', err);
            destroyCharts();
        }
        refreshPublishersSection();
    }

    function refreshCharts() {
        const g1 = group1.value;
        const g2 = group2.value;
        const groupFields = [g1, g2].filter((v, i, arr) => v && arr.indexOf(v) === i);
        const scopedMensual = getTotalsMensual(flat.mensual);
        renderCharts(aggregated, scopedMensual, metricSelect.value, groupFields);
    }

    function setChartExcludeMonths(n) {
        const months = Math.max(0, Math.min(11, Number(n) || 0));
        if (months === chartExcludeMonths) return;
        chartExcludeMonths = months;
        persistTotalsTimePrefs();
        if (totalsExcludeSelect) totalsExcludeSelect.value = String(months);
        refresh();
    }

    function setTotalsTrimMode(mode) {
        if (mode !== 'omit' && mode !== 'keep') return;
        if (chartTrimMode === mode) return;
        chartTrimMode = mode;
        persistTotalsTimePrefs();
        refresh();
    }

    function setTotalsTrimSide(side) {
        if (side !== 'first' && side !== 'last') return;
        if (chartTrimSide === side) return;
        chartTrimSide = side;
        persistTotalsTimePrefs();
        refresh();
    }

    function totalsTimeHintHtml() {
        const parts = [];
        if (!isTotalsFullYearRange()) {
            parts.push(`${D.mesLabel(totalsMonthFrom, 'corto')}–${D.mesLabel(totalsMonthTo, 'corto')}`);
        }
        if (chartExcludeMonths) {
            const hint = D.monthTrimHint(getTotalsTrimOpts());
            if (hint) parts.push(hint.toLowerCase());
        }
        if (!parts.length) return '';
        return `<span class="chart-title-note">(${escapeHtml(parts.join(' · '))})</span>`;
    }

    function totalsTimeFilterLabel() {
        const bits = [];
        if (!isTotalsFullYearRange()) {
            bits.push(`${D.mesLabel(totalsMonthFrom, 'corto')}–${D.mesLabel(totalsMonthTo, 'corto')}`);
        }
        if (chartExcludeMonths) {
            const hint = D.monthTrimHint(getTotalsTrimOpts());
            if (hint) bits.push(hint);
        }
        return bits.join(' · ');
    }

    function chartBarTitleText(metricId, groupFields) {
        const metric = D.S21_CHART_METRICS.find(m => m.id === metricId);
        const metricLabel = metric?.label || metricId;
        const labels = groupFields.filter(Boolean).map(f => D.groupFieldLabel(f));
        const groupPart = labels.length ? labels.join(' · ') : 'Grupo';
        return `${metricLabel} por ${groupPart}`;
    }

    function publicadoresForBarChart(mensualScoped) {
        const byProfile = filterPublicadoresForCharts();
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
        syncPublisherViewModeUi();
        if (publisherViewMode === 'month') {
            renderPublisherMonthView();
            return;
        }
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

    function refreshPublisherViews() {
        if (publisherViewMode === 'month') {
            renderPublisherMonthView();
            return;
        }
        renderPublisherList();
    }

    function setPublisherViewMode(mode) {
        if (mode !== 'list' && mode !== 'month') return;
        if (publisherViewMode === mode) return;
        publisherViewMode = mode;
        if (mode === 'month') {
            publisherDetailReturn = null;
            selectedPublisherKey = '';
            renderPublisherDetail();
        }
        renderPublishersSection();
    }

    function syncPublisherViewModeUi() {
        document.querySelectorAll('#publishers-dock [data-publisher-view]').forEach(btn => {
            const active = btn.dataset.publisherView === publisherViewMode;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        const isMonth = publisherViewMode === 'month';
        if (publisherLayout) {
            publisherLayout.classList.toggle('hidden', isMonth);
            publisherLayout.hidden = isMonth;
        }
        if (publisherMonthView) {
            publisherMonthView.classList.toggle('hidden', !isMonth);
            publisherMonthView.hidden = !isMonth;
        }
    }

    function ensurePublisherMonthFocus() {
        if (D.S21_MESES.includes(publisherMonthFocus)) return publisherMonthFocus;
        const focus = detailFocusMes();
        if (focus && D.S21_MESES.includes(focus)) {
            publisherMonthFocus = focus;
            return publisherMonthFocus;
        }
        publisherMonthFocus = D.S21_MESES[0];
        return publisherMonthFocus;
    }

    function setPublisherMonthFocus(mes) {
        if (!D.S21_MESES.includes(mes) || publisherMonthFocus === mes) return;
        publisherMonthFocus = mes;
        renderPublisherMonthView();
    }

    function publisherMonthMetricsTotalPx() {
        return PUBLISHER_MONTH_METRIC_PX * PUBLISHER_MONTH_METRIC_IDS.length;
    }

    function publisherMonthFlexShare() {
        const name = Math.max(32, Math.min(78, Number(publisherMonthNameFlexPct) || 58));
        return { name, comment: 100 - name };
    }

    function applyPublisherMonthColWidths(table) {
        if (!table) return;
        const wrap = table.closest('.publisher-month-table-wrap');
        const tableW = Math.max(
            0,
            wrap?.clientWidth || table.getBoundingClientRect().width || table.parentElement?.clientWidth || 0
        );
        if (tableW < 80) return;

        const metricsTotal = publisherMonthMetricsTotalPx();
        const flexW = Math.max(120, tableW - metricsTotal);
        const share = publisherMonthFlexShare();
        const namePx = Math.round((flexW * share.name) / 100);
        const commentPx = Math.max(60, flexW - namePx);

        table.style.width = `${tableW}px`;
        table.querySelectorAll('col[data-col]').forEach(col => {
            const id = col.dataset.col;
            if (id === 'nombre') col.style.width = `${namePx}px`;
            else if (id === 'comentarios') col.style.width = `${commentPx}px`;
            else col.style.width = `${PUBLISHER_MONTH_METRIC_PX}px`;
        });
        table.querySelectorAll('th[data-col]').forEach(th => {
            const id = th.dataset.col;
            if (id === 'nombre') th.style.width = `${namePx}px`;
            else if (id === 'comentarios') th.style.width = `${commentPx}px`;
            else th.style.width = `${PUBLISHER_MONTH_METRIC_PX}px`;
        });
    }

    function publisherMonthHeadHtml(col) {
        const sortClass = publisherMonthSortState.column === col.id
            ? (publisherMonthSortState.direction === 'asc' ? 'sort-asc' : 'sort-desc')
            : '';
        let mark = '';
        if (col.id === 'nombre') {
            mark = Icons?.metricIcon('publicadores') || '';
        } else if (col.id === 'comentarios') {
            mark = PUBLISHER_MONTH_COMMENT_ICON;
        } else {
            mark = Icons?.metricIcon(col.id) || '';
        }
        const isMetric = PUBLISHER_MONTH_METRIC_IDS.includes(col.id);
        const resizer = (col.id === 'nombre' || col.id === 'comentarios')
            ? `<span class="pub-month-col-resizer" data-resize-side="${col.id}" title="Redimensionar columnas"></span>`
            : '';
        return `<th class="sortable publisher-month-th${isMetric ? ' is-metric' : ''} ${sortClass}" data-col="${col.id}" scope="col" title="${escapeAttr(col.label)}" aria-label="${escapeAttr(col.label)}">
            <span class="th-label">${mark}</span><span class="sort-icon" aria-hidden="true"></span>${resizer}
        </th>`;
    }

    function publisherMonthBinaryHtml(on, options = {}) {
        const miss = Boolean(options.missWhenOff) && !on;
        const stateClass = on ? 'is-on' : (miss ? 'is-miss' : 'is-off');
        const label = on ? 'Sí' : 'No';
        return `<td class="num pub-month-binary">
            <span class="status-mark ${stateClass}" aria-label="${label}" title="${label}">${on ? PUBLISHER_MONTH_CHECK_ICON : PUBLISHER_MONTH_FAIL_ICON}</span>
        </td>`;
    }

    function publisherMonthCommentHtml(notas) {
        const full = String(notas ?? '').trim();
        if (!full) {
            return `<td class="comment comment-empty">—</td>`;
        }
        return `<td class="comment pub-month-comment">
            <span class="pub-month-comment-text">${escapeHtml(full)}</span>
            <button type="button" class="pub-month-comment-more hidden" hidden>Ver más</button>
        </td>`;
    }

    function publisherMonthCellHtml(colId, row) {
        if (colId === 'nombre') {
            return `<td class="pub-cell-name pub-cell-tap" title="${escapeAttr(row.nombre)}" role="button" tabindex="0"><span class="person-name pub-month-name">${escapeHtml(row.nombre)}</span></td>`;
        }
        if (colId === 'horas' || colId === 'cursos') {
            const empty = !row.hasReport && !Number(row[colId]);
            return `<td class="num pub-month-metric${empty ? ' pub-month-empty' : ''}">${empty ? '—' : formatNum(row[colId])}</td>`;
        }
        if (colId === 'participacion') {
            return publisherMonthBinaryHtml(Boolean(row.participacion), { missWhenOff: true });
        }
        if (colId === 'precursor_auxiliar') {
            return publisherMonthBinaryHtml(Boolean(row.precursor_auxiliar));
        }
        if (colId === 'comentarios') {
            return publisherMonthCommentHtml(row.notas);
        }
        return `<td>—</td>`;
    }

    function syncPublisherMonthCommentOverflow(root) {
        root?.querySelectorAll('.pub-month-comment').forEach(cell => {
            const text = cell.querySelector('.pub-month-comment-text');
            const btn = cell.querySelector('.pub-month-comment-more');
            if (!text || !btn) return;
            if (cell.classList.contains('is-expanded')) {
                btn.hidden = false;
                btn.classList.remove('hidden');
                btn.textContent = 'Ver menos';
                return;
            }
            const overflows = text.scrollWidth > text.clientWidth + 1;
            btn.hidden = !overflows;
            btn.classList.toggle('hidden', !overflows);
            btn.textContent = 'Ver más';
        });
    }

    function bindPublisherMonthCommentToggles(root) {
        root?.querySelectorAll('.pub-month-comment-more').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const cell = btn.closest('.pub-month-comment');
                const text = cell?.querySelector('.pub-month-comment-text');
                if (!cell || !text) return;
                const expanded = cell.classList.toggle('is-expanded');
                btn.textContent = expanded ? 'Ver menos' : 'Ver más';
                if (!expanded) {
                    requestAnimationFrame(() => syncPublisherMonthCommentOverflow(root));
                }
            });
        });
    }

    function bindPublisherMonthColResize(root) {
        const table = root?.querySelector('.publisher-month-table');
        const wrap = root?.querySelector('.publisher-month-table-wrap');
        if (!table || !wrap) return;
        let suppressSortClick = false;

        applyPublisherMonthColWidths(table);

        if (publisherMonthResizeObserver) {
            publisherMonthResizeObserver.disconnect();
            publisherMonthResizeObserver = null;
        }
        if (typeof ResizeObserver !== 'undefined') {
            publisherMonthResizeObserver = new ResizeObserver(() => {
                applyPublisherMonthColWidths(table);
                syncPublisherMonthCommentOverflow(root);
            });
            publisherMonthResizeObserver.observe(wrap);
        }

        table.querySelectorAll('.pub-month-col-resizer').forEach(handle => {
            handle.addEventListener('pointerdown', e => {
                e.preventDefault();
                e.stopPropagation();
                const pointerId = e.pointerId;
                try { handle.setPointerCapture(pointerId); } catch (_) { /* ignore */ }

                applyPublisherMonthColWidths(table);
                const startX = e.clientX;
                const nameCol = table.querySelector('col[data-col="nombre"]');
                const commentCol = table.querySelector('col[data-col="comentarios"]');
                const nameW = parseFloat(nameCol?.style.width) || table.querySelector('th[data-col="nombre"]')?.getBoundingClientRect().width || 0;
                const commentW = parseFloat(commentCol?.style.width) || table.querySelector('th[data-col="comentarios"]')?.getBoundingClientRect().width || 0;
                const flexW = Math.max(120, nameW + commentW);
                const side = handle.dataset.resizeSide;
                let moved = false;

                const onMove = ev => {
                    const dx = ev.clientX - startX;
                    if (Math.abs(dx) > 2) moved = true;
                    const signed = side === 'comentarios' ? -dx : dx;
                    const nextNamePx = Math.max(flexW * 0.32, Math.min(flexW * 0.78, nameW + signed));
                    publisherMonthNameFlexPct = (nextNamePx / flexW) * 100;
                    applyPublisherMonthColWidths(table);
                    syncPublisherMonthCommentOverflow(root);
                };
                const onUp = () => {
                    handle.removeEventListener('pointermove', onMove);
                    handle.removeEventListener('pointerup', onUp);
                    handle.removeEventListener('pointercancel', onUp);
                    try { handle.releasePointerCapture(pointerId); } catch (_) { /* ignore */ }
                    document.body.classList.remove('is-col-resizing');
                    if (moved) {
                        suppressSortClick = true;
                        requestAnimationFrame(() => { suppressSortClick = false; });
                    }
                };
                document.body.classList.add('is-col-resizing');
                handle.addEventListener('pointermove', onMove);
                handle.addEventListener('pointerup', onUp);
                handle.addEventListener('pointercancel', onUp);
            });
        });

        table.querySelectorAll('th.sortable').forEach(th => {
            th.addEventListener('click', e => {
                if (suppressSortClick || e.target.closest?.('.pub-month-col-resizer')) return;
                onPublisherMonthSortColumn(th.dataset.col);
            });
        });
    }

    function onPublisherMonthSortColumn(columnId) {
        if (publisherMonthSortState.column === columnId) {
            publisherMonthSortState.direction = publisherMonthSortState.direction === 'asc' ? 'desc' : 'asc';
        } else {
            publisherMonthSortState.column = columnId;
            publisherMonthSortState.direction = 'asc';
        }
        renderPublisherMonthView();
    }

    function renderPublisherMonthView() {
        if (!publisherMonthView) return;

        const pubs = publishersForMonthDisplay();
        updatePublisherVisibleCount(pubs);
        const mes = ensurePublisherMonthFocus();

        if (!pubs.length) {
            publisherMonthView.innerHTML = `<p class="publisher-list-empty">Sin publicadores con los filtros actuales.</p>`;
            return;
        }

        const mensual = filteredMensualCache.length ? filteredMensualCache : flat.mensual;
        const monthIndex = new Map();
        for (const row of mensual) {
            if (!row?.mes) continue;
            monthIndex.set(`${D.personKey(row)}|${row.mes}`, row);
        }

        let rows = pubs.map(pub => {
            const key = D.personKey(pub);
            const m = monthIndex.get(`${key}|${mes}`);
            return {
                key,
                nombre: pub.nombre,
                horas: Number(m?.horas) || 0,
                cursos: Number(m?.cursos) || 0,
                participacion: m?.participacion ? 1 : 0,
                precursor_auxiliar: m?.precursor_auxiliar ? 1 : 0,
                notas: m?.notas || '',
                hasReport: Boolean(D.monthHasReport?.(m)),
            };
        });
        rows = sortPublisherMonthRows(rows);

        const monthTabs = D.S21_MESES.map(m => {
            const active = m === mes;
            const label = D.mesLabel(m, 'corto');
            return `<button type="button" class="publisher-month-tab${active ? ' active' : ''}" data-mes="${escapeAttr(m)}" role="tab" aria-selected="${active ? 'true' : 'false'}" title="${escapeAttr(D.mesLabel(m, 'completo'))}">${escapeHtml(label)}</button>`;
        }).join('');

        const colgroup = PUBLISHER_MONTH_COLUMNS.map(col =>
            `<col data-col="${col.id}">`
        ).join('');

        const head = PUBLISHER_MONTH_COLUMNS.map(col => publisherMonthHeadHtml(col)).join('');
        const body = rows.map(row =>
            `<tr data-publisher-key="${escapeAttr(row.key)}" class="publisher-month-row${row.hasReport ? '' : ' is-empty'}">
                ${PUBLISHER_MONTH_COLUMNS.map(col => publisherMonthCellHtml(col.id, row)).join('')}
            </tr>`
        ).join('');

        publisherMonthView.innerHTML = `<section class="publisher-month-block" data-mes="${escapeAttr(mes)}">
            <div class="publisher-month-tabs" role="tablist" aria-label="Mes">${monthTabs}</div>
            <div class="table-wrap table-wrap--responsive publisher-month-table-wrap">
                <table class="data-table publisher-month-table">
                    <colgroup>${colgroup}</colgroup>
                    <thead><tr>${head}</tr></thead>
                    <tbody>${body}</tbody>
                </table>
            </div>
        </section>`;

        publisherMonthView.querySelectorAll('.publisher-month-tab').forEach(btn => {
            btn.addEventListener('click', () => setPublisherMonthFocus(btn.dataset.mes));
        });
        bindPublisherMonthCommentToggles(publisherMonthView);
        bindPublisherMonthColResize(publisherMonthView);
        requestAnimationFrame(() => {
            const table = publisherMonthView.querySelector('.publisher-month-table');
            applyPublisherMonthColWidths(table);
            syncPublisherMonthCommentOverflow(publisherMonthView);
        });
        publisherMonthView.querySelectorAll('.pub-cell-tap').forEach(cell => {
            const open = () => {
                const tr = cell.closest('tr[data-publisher-key]');
                if (tr) openPublisherFromList(tr.dataset.publisherKey, { fromMonth: true });
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
        if (D.uniquePublishers) rows = D.uniquePublishers(rows);
        if (selectedPublisherKey && !rows.some(p => D.personKey(p) === selectedPublisherKey)) {
            const pub = flat.publicadores.find(p => D.personKey(p) === selectedPublisherKey);
            if (pub) rows = [...rows, pub];
        }
        return sortPublisherRows(rows);
    }

    function publishersForMonthDisplay() {
        let rows = filterPublishersForList(filteredPubCache);
        if (D.uniquePublishers) rows = D.uniquePublishers(rows);
        return D.sortPublishers ? D.sortPublishers(rows) : rows;
    }

    function updatePublisherVisibleCount(pubs) {
        if (!publisherCount) return;
        const n = pubs.length;
        const numEl = document.getElementById('publisher-count-num');
        if (numEl) numEl.textContent = String(n);
        else publisherCount.textContent = String(n);
        publisherCount.title = `${n} publicador${n === 1 ? '' : 'es'}`;
        publisherCount.setAttribute('aria-label', `${n} publicador${n === 1 ? '' : 'es'}`);
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

    function sortPublisherMonthRows(rows) {
        const col = PUBLISHER_MONTH_COLUMNS.find(c => c.id === publisherMonthSortState.column);
        if (!col) return rows;
        const dir = publisherMonthSortState.direction === 'asc' ? 1 : -1;
        return [...rows].sort((a, b) => {
            const va = col.getValue(a);
            const vb = col.getValue(b);
            if (col.type === 'number') {
                return (Number(va) - Number(vb)) * dir;
            }
            return String(va || '').localeCompare(String(vb || ''), 'es') * dir;
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
                <td class="pub-cell-name pub-cell-tap" title="${escapeAttr(pub.nombre)}" role="button" tabindex="0"><span class="person-name">${personNameWithSparkHtml(pub)}</span></td>
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
        } else if (options.fromList || options.fromMonth) {
            if (options.fromMonth) {
                publisherViewMode = 'list';
                syncPublisherViewModeUi();
            }
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
                <h4 class="publisher-name person-name">${personNameWithSparkHtml(pub)}</h4>
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
        const wrap = publisherDetailContent?.querySelector('.publisher-chart-wrap');
        const canvas = publisherDetailContent?.querySelector('#publisher-detail-chart');
        if (!wrap || !monthly.length) return;

        const spec = publisherMetricSpec(metricId);
        syncPublisherChartTitle(metricId);
        const focusMes = detailFocusMes();

        if (D.isBinaryMetric(metricId)) {
            if (canvas) canvas.classList.add('hidden');
            wrap.querySelector('.status-chart')?.remove();
            wrap.insertAdjacentHTML('beforeend', binaryStatusChartHtml(monthly, metricId, focusMes));
            return;
        }

        wrap.querySelector('.status-chart')?.remove();
        if (!canvas) return;
        canvas.classList.remove('hidden');
        const labels = monthly.map(r => r.mes_corto || D.mesLabel(r.mes, 'corto'));
        const data = monthly.map(r => publisherMetricValue(r, metricId));
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
                        ticks: {
                            color: c.tick,
                            font: { size: 10 },
                        },
                        grid: { color: c.grid },
                    },
                },
            },
        });
    }

    function binaryStatusChartHtml(monthly, metricId, focusMes) {
        const check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        const fail = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        const cells = monthly.map(row => {
            const on = publisherMetricValue(row, metricId) > 0;
            const focus = focusMes && row.mes === focusMes;
            const label = row.mes_corto || D.mesLabel(row.mes, 'corto');
            return `<div class="status-cell${on ? ' is-on' : ' is-off'}${focus ? ' is-focus' : ''}" title="${escapeAttr(`${label}: ${on ? 'Sí' : 'No'}`)}">
                <span class="status-mark" aria-hidden="true">${on ? check : fail}</span>
                <span class="status-month">${escapeHtml(label)}</span>
            </div>`;
        }).join('');
        return `<div class="status-chart" role="img" aria-label="${escapeAttr(publisherMetricChartTitle(metricId))}"><div class="status-chart-track">${cells}</div></div>`;
    }

    function destroyPublisherDetailChart() {
        if (publisherDetailChart) {
            publisherDetailChart.destroy();
            publisherDetailChart = null;
        }
        publisherDetailContent?.querySelector('.status-chart')?.remove();
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
                return formatNum(totalsFooterPublisherCount());
            }
            if (col.id === 'inactivos') {
                return formatNum(totalsFooterInactivos(totals.inactivos));
            }
            return formatNum(totals[col.id] ?? 0);
        });

        const timeNote = totalsTimeFilterLabel();
        const groupFields = getTotalsGroupFields();
        const groupLabels = groupFields.map(f => D.groupFieldLabel(f));
        const included = groups.map(g => g.label).join(' · ');

        return {
            title: 'Totales',
            subtitle: `Alcance: ${totalsScopeLabel()} · Agrupado: ${groupLabels.join(' / ') || '—'}${timeNote ? ` · ${timeNote}` : ''} · ${included}`,
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
            label: D.groupFieldLabel(f),
            type: 'text',
            getValue: row => {
                const val = row.keys[i]?.value ?? '—';
                if (row.keys[i]?.field === 'mes') return D.mesLabel(val, 'completo');
                if (row.keys[i]?.field === 'origen') return displayPerfil(val);
                return val;
            },
        }));
        for (const metricId of getTotalsMetricIds()) {
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

    function matrixLookupValues(groupFields, rowField, rowVal, colField, colVal) {
        return groupFields.map(field => {
            if (field === rowField) return rowVal;
            if (field === colField) return colVal;
            return '—';
        });
    }

    function renderMatrixTable(rows, groupFields) {
        const dims = getTotalsDimensions();
        const rowField = dims.primary;
        const colField = dims.secondary;
        const rowIdxKey = totalsFieldKeyIndex(rowField, groupFields);
        const colIdxKey = totalsFieldKeyIndex(colField, groupFields);
        const metricId = getMatrixMetricId();
        const metricSpec = D.TOTALS_METRIC_COLUMNS[metricId];
        const reportMode = isTotalsReportMode();
        matrixCellCache = new Map();
        tableColumns = [{ id: metricId, label: metricSpec?.label || metricId, type: 'number' }];

        const rowValues = D.sortGroupValues(rowField, rows.map(r => r.keys[rowIdxKey]?.value));
        const colValues = D.sortGroupValues(colField, rows.map(r => r.keys[colIdxKey]?.value));
        const rowLabel = D.groupFieldLabel(rowField);
        const colLabel = D.groupFieldLabel(colField);
        const matrixCompact = Math.max(colValues.length, rowValues.length) > 7;
        pivotTable?.classList.toggle('totals-table--sparse-cols', colValues.length <= 8 && rowValues.length <= 8);
        pivotTable?.classList.toggle('totals-table--dense-cols', colValues.length > 9 || rowValues.length > 9);

        pivotHead.innerHTML = `<tr>
            <th scope="col" class="totals-matrix-corner">${matrixCompact ? formatTableHeaderHtml(rowLabel) : escapeHtml(rowLabel)}<br>\\ ${matrixCompact ? formatTableHeaderHtml(colLabel) : escapeHtml(colLabel)}</th>
            ${colValues.map(colVal =>
                `<th scope="col" class="totals-matrix-col-head">${formatMatrixAxisLabel(colField, colVal, matrixCompact)}</th>`
            ).join('')}
        </tr>`;

        tableRowsCache = [];
        pivotBody.innerHTML = rowValues.map((rowVal, rowIdx) => {
            const cells = colValues.map((colVal, colIdx) => {
                const lookup = matrixLookupValues(groupFields, rowField, rowVal, colField, colVal);
                const row = findAggregatedRow(rows, groupFields, lookup);
                const key = `${rowIdx}:${colIdx}`;
                matrixCellCache.set(key, { row, metricId });
                const val = row ? metricSpec.getValue(row) : 0;
                const text = formatMatrixCellValue(val, metricId);
                const zeroClass = val === 0 ? ' totals-matrix-cell--empty' : '';
                const label = `${displayGroupValue(colField, colVal)} · ${metricSpec.label}`;
                return `<td class="num drillable${zeroClass}" data-col-id="${metricId}" data-matrix-key="${key}" data-label="${escapeAttr(label)}" title="Filtrar detalle">${text}</td>`;
            }).join('');
            return `<tr data-matrix-row="${rowIdx}">
                <th scope="row" class="totals-matrix-row-head">${formatMatrixAxisLabel(rowField, rowVal, matrixCompact)}</th>
                ${cells}
            </tr>`;
        }).join('');

        const grandTotal = rows.reduce((sum, r) => sum + metricSpec.getValue(r), 0);

        if (reportMode) {
            pivotFoot.innerHTML = '';
            if (totalsMatrixSummary) {
                totalsMatrixSummary.innerHTML = `
                    <div class="totals-matrix-summary-row">
                        <span class="totals-matrix-summary-label">Total ${escapeHtml(metricSpec.label.toLowerCase())}</span>
                        <span class="totals-matrix-summary-value">${formatNum(grandTotal)}</span>
                    </div>`;
                totalsMatrixSummary.classList.remove('hidden');
            }
        } else {
            totalsMatrixSummary?.classList.add('hidden');
            const colTotals = colValues.map(colVal =>
                rows.filter(r => String(r.keys[colIdxKey]?.value ?? '—') === String(colVal)).reduce(
                    (sum, r) => sum + metricSpec.getValue(r), 0
                )
            );
            pivotFoot.innerHTML = `<tr>
                <th scope="row" class="totals-matrix-row-head">Total</th>
                ${colTotals.map(n => `<td class="num" data-label="${escapeAttr(metricSpec.label)}">${formatNum(n)}</td>`).join('')}
            </tr>`;
            pivotFoot.dataset.grandTotal = String(grandTotal);
        }
    }

    function renderTable(rows, groupFields) {
        if (isTotalsReportMode()) {
            renderMatrixTable(rows, groupFields);
            return;
        }
        totalsMatrixSummary?.classList.add('hidden');
        matrixCellCache = new Map();
        tableColumns = buildTableColumns(groupFields);
        tableRowsCache = sortRows(rows, tableColumns);
        const sorted = tableRowsCache;

        pivotTable?.classList.remove('totals-table--sparse-cols', 'totals-table--dense-cols');
        pivotHead.innerHTML = `<tr>${tableColumns.map(col => {
            const sortClass = sortState.column === col.id
                ? (sortState.direction === 'asc' ? 'sort-asc' : 'sort-desc')
                : '';
            const metricMark = D.TOTALS_METRIC_COLUMNS[col.id]
                ? (Icons?.metricIcon(col.id) || '')
                : '';
            return `<th class="sortable ${sortClass}" data-col="${col.id}" scope="col">
                <span class="th-label">${metricMark}<span>${formatTableColumnHeader(col.label, tableColumns.length)}</span></span><span class="sort-icon" aria-hidden="true"></span>
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

        pivotFoot.innerHTML = `<tr>${tableColumns.map(col => {
            const labelAttr = ` data-label="${escapeAttr(col.label)}"`;
            if (col.type !== 'number') {
                const isFirst = col.id === 'group_0';
                return `<td${labelAttr}>${isFirst ? 'Total' : ''}</td>`;
            }
            if (col.id === 'publicadores') {
                return `<td class="num"${labelAttr}>${formatNum(totalsFooterPublisherCount())}</td>`;
            }
            if (col.id === 'inactivos') {
                return `<td class="num"${labelAttr}>${formatNum(totalsFooterInactivos(totals.inactivos))}</td>`;
            }
            return `<td class="num"${labelAttr}>${formatNum(totals[col.id] ?? 0)}</td>`;
        }).join('')}</tr>`;
    }

    function kpiDetailScopeMonth(metricKey) {
        if (metricKey === 'inactivos' && kpiMode !== 'max') {
            return kpisCache.lastCompleteMonth || kpisCache.lastRegisteredMonth || null;
        }
        if (kpiMode === 'last') return kpisCache.lastRegisteredMonth || null;
        if (kpiMode === 'max' && D.monthlySeriesForKpi) {
            const series = D.monthlySeriesForKpi(flat.mensual, metricKey);
            let bestMes = null;
            let bestVal = -1;
            for (const slot of series) {
                if (slot.value >= bestVal) {
                    bestVal = slot.value;
                    bestMes = slot.mes;
                }
            }
            return bestMes;
        }
        return null;
    }

    function kpiDetailScopeLabel(metricKey) {
        const mes = kpiDetailScopeMonth(metricKey);
        if (metricKey === 'inactivos' && mes) {
            return `Regla S-21 a ${D.mesLabel(mes, 'completo')}`;
        }
        if (kpiMode === 'last' && mes) {
            return `Último mes con informes: ${D.mesLabel(mes, 'completo')}`;
        }
        if (kpiMode === 'max' && mes) {
            return `Mes del máximo: ${D.mesLabel(mes, 'completo')}`;
        }
        if (kpiMode === 'avg') {
            return 'Valores del año (el indicador muestra el promedio mensual)';
        }
        return 'Año de servicio';
    }

    function publisherMonthTotals(pub, mes) {
        const idKey = D.personIdentityKey?.(pub) || D.personKey(pub);
        const samePerson = row => (D.personIdentityKey?.(row) || D.personKey(row)) === idKey;
        if (mes) {
            const rows = flat.mensual.filter(r => samePerson(r) && r.mes === mes);
            const row = rows.find(r => D.monthHasReport?.(r))
                || rows.find(r => (r.horas || 0) > 0 || (r.cursos || 0) > 0 || r.precursor_auxiliar)
                || rows[0];
            return {
                horas: row?.horas || 0,
                cursos: row?.cursos || 0,
                participacion: row?.participacion ? 1 : 0,
                precursor_auxiliar: row?.precursor_auxiliar ? 1 : 0,
            };
        }
        return {
            horas: pub.total_horas || 0,
            cursos: pub.total_cursos || 0,
            participacion: pub.meses_participacion || 0,
            precursor_auxiliar: pub.meses_precursor_aux || 0,
        };
    }

    function kpiDetailNameHtml(pub) {
        return `<span class="person-name">${personNameWithSparkHtml(pub)}</span>`;
    }

    function kpiDetailWhyHtml(item) {
        const short = String(item.reasonShort || 'Ver detalle').trim();
        const full = String(item.reason || short).trim();
        if (!full || full === short) {
            return `<span class="kpi-detail-why-short">${escapeHtml(short)}</span>`;
        }
        return `<details class="kpi-detail-why-acc">
            <summary class="kpi-detail-why-summary">
                <span class="kpi-detail-why-short">${escapeHtml(short)}</span>
                <span class="kpi-detail-why-plus" aria-hidden="true">+</span>
            </summary>
            <p class="kpi-detail-why-full">${escapeHtml(full)}</p>
        </details>`;
    }

    function kpiDetailPrivilegeYes(val) {
        if (Icons?.isYes) return Icons.isYes(val);
        const s = String(val ?? '').trim().toLowerCase();
        return val === true || s === 'sí' || s === 'si' || s === 'yes' || s === 'true' || s === '1';
    }

    function kpiDetailIsUngido(pub) {
        return /ungid/i.test(String(pub?.esperanza || ''));
    }

    function kpiDetailIsOtrasOvejas(pub) {
        const e = String(pub?.esperanza || '');
        return /otras/i.test(e) || /ovejas?/i.test(e);
    }

    function kpiDetailIsNoBautizado(pub) {
        const baut = String(pub?.fecha_bautismo || '').trim();
        if (!baut || baut === '—' || baut === '-') return true;
        const blob = `${pub?.origen || ''} ${pub?.esperanza || ''}`;
        return /no\s*bautiz/i.test(blob);
    }

    function kpiDetailWasAuxLastMonth(pub, auxKeys) {
        return auxKeys.has(D.personIdentityKey?.(pub) || D.personKey(pub));
    }

    function kpiDetailAuxKeysLastMonth() {
        const keys = new Set();
        const mes = kpisCache.lastRegisteredMonth;
        if (!mes) return keys;
        for (const row of flat.mensual) {
            if (row.mes === mes && row.precursor_auxiliar) {
                keys.add(D.personIdentityKey?.(row) || D.personKey(row));
            }
        }
        return keys;
    }

    function publisherMatchesPrivilegeId(pub, id, auxKeys) {
        if (!id) return true;
        switch (id) {
            case 'anciano':
            case 'siervo_ministerial':
            case 'precursor_regular':
            case 'misionero':
            case 'precursor_especial':
                return kpiDetailPrivilegeYes(pub[id]);
            case 'precursor_auxiliar':
                return kpiDetailWasAuxLastMonth(pub, auxKeys);
            case 'hombre': {
                const sexo = String(pub.sexo || '').trim().toLowerCase();
                return sexo === 'hombre' || sexo === 'masculino';
            }
            case 'mujer': {
                const sexo = String(pub.sexo || '').trim().toLowerCase();
                return sexo === 'mujer' || sexo === 'femenino';
            }
            case 'ungidos':
                return kpiDetailIsUngido(pub);
            case 'otras_ovejas':
                return kpiDetailIsOtrasOvejas(pub);
            case 'no_bautizado':
                return kpiDetailIsNoBautizado(pub);
            default:
                return true;
        }
    }

    function publisherMatchesKpiPrivilegeFilters(pub, auxKeys) {
        return kpiDetailPrivilegeFilters.every(id => publisherMatchesPrivilegeId(pub, id, auxKeys));
    }

    function kpiPrivilegeFilterActive() {
        return kpiDetailPrivilegeFilters.some(Boolean);
    }

    function kpiPrivilegeOptionsHtml(selectedId) {
        const all = `<option value="">Todos</option>`;
        return all + KPI_PRIVILEGE_OPTIONS.map(item => {
            const sel = item.id === selectedId ? ' selected' : '';
            return `<option value="${escapeAttr(item.id)}"${sel}>${escapeHtml(item.label)}</option>`;
        }).join('');
    }

    function renderKpiDetailFilters() {
        if (!kpiDetailFilters) return;
        kpiDetailFilters.hidden = false;
        kpiDetailFilters.innerHTML = `<span class="kpi-detail-filters-label">Privilegios</span>
            <div class="kpi-detail-filter-row">
                <label class="kpi-detail-filter-field">
                    <span class="kpi-detail-filter-field-label">Filtro 1</span>
                    <select data-kpi-privilege-slot="0" aria-label="Privilegio, filtro 1">${kpiPrivilegeOptionsHtml(kpiDetailPrivilegeFilters[0])}</select>
                </label>
                <label class="kpi-detail-filter-field">
                    <span class="kpi-detail-filter-field-label">Filtro 2</span>
                    <select data-kpi-privilege-slot="1" aria-label="Privilegio, filtro 2">${kpiPrivilegeOptionsHtml(kpiDetailPrivilegeFilters[1])}</select>
                </label>
            </div>`;
    }

    function refreshKpiDetailTable() {
        if (!kpiDetailKey) return;
        const detail = buildKpiDetail(kpiDetailKey);
        if (kpiDetailLead) {
            if (kpiDetailKey === 'cursos' && detail.cursosTotal != null) {
                const n = detail.cursosTotal;
                kpiDetailLead.textContent = `${kpiDetailScopeLabel(kpiDetailKey)} · ${formatNum(n)} curso${n === 1 ? '' : 's'}`;
            } else {
                const n = detail.count;
                kpiDetailLead.textContent = `${kpiDetailScopeLabel(kpiDetailKey)} · ${n} publicador${n === 1 ? '' : 'es'}`;
            }
        }
        if (kpiDetailBody) {
            const empty = kpiPrivilegeFilterActive() && !detail.rowsHtml && !detail.sections?.some(s => s.rowsHtml)
                && !detail.withCourses?.rowsHtml && !detail.withoutCourses?.rowsHtml
                ? 'Ningún publicador coincide con la intersección de los filtros.'
                : detail.empty;
            if (detail.cursosTab) {
                const tab = kpiDetailCursosTab === 'without' ? 'without' : 'with';
                const list = tab === 'without' ? detail.withoutCourses : detail.withCourses;
                const withN = detail.withCourses?.count ?? 0;
                const withoutN = detail.withoutCourses?.count ?? 0;
                const toggle = `<div class="totals-view-toggle kpi-detail-cursos-toggle" role="tablist" aria-label="Cursos bíblicos">
                    <button type="button" class="totals-view-btn${tab === 'with' ? ' active' : ''}" data-kpi-cursos-tab="with" role="tab" aria-selected="${tab === 'with' ? 'true' : 'false'}">Con cursos (${withN})</button>
                    <button type="button" class="totals-view-btn${tab === 'without' ? ' active' : ''}" data-kpi-cursos-tab="without" role="tab" aria-selected="${tab === 'without' ? 'true' : 'false'}">Sin cursos (${withoutN})</button>
                </div>`;
                kpiDetailBody.innerHTML = toggle + renderKpiDetailTable(
                    list?.headers || [],
                    list?.rowsHtml || '',
                    list?.empty || empty
                );
            } else if (detail.sections?.length) {
                const note = detail.note
                    ? `<p class="kpi-detail-note">${escapeHtml(detail.note)}</p>`
                    : '';
                kpiDetailBody.innerHTML = note + detail.sections.map(sec => {
                    const title = `${sec.title} (${sec.count ?? 0})`;
                    const hint = sec.hint
                        ? `<p class="kpi-detail-section-hint">${escapeHtml(sec.hint)}</p>`
                        : '';
                    return `<section class="kpi-detail-section">
                        <h4 class="kpi-detail-section-title">${escapeHtml(title)}</h4>
                        ${hint}
                        ${renderKpiDetailTable(sec.headers, sec.rowsHtml, sec.empty || empty)}
                    </section>`;
                }).join('');
            } else {
                kpiDetailBody.innerHTML = renderKpiDetailTable(detail.headers, detail.rowsHtml, empty);
            }
        }
    }

    function renderKpiDetailTable(headers, rowsHtml, emptyText) {
        if (!rowsHtml) {
            return `<p class="kpi-detail-empty">${escapeHtml(emptyText)}</p>`;
        }
        return `<div class="kpi-detail-table-wrap"><table class="kpi-detail-table">
            <thead><tr>${headers.map(h => {
                const id = h.id || h.label;
                const active = kpiDetailSort.column === id;
                const sortClass = active
                    ? (kpiDetailSort.direction === 'asc' ? 'sort-asc' : 'sort-desc')
                    : '';
                const ariaSort = !active
                    ? 'none'
                    : (kpiDetailSort.direction === 'asc' ? 'ascending' : 'descending');
                const nextHint = active && kpiDetailSort.direction === 'asc' ? 'Z-A' : 'A-Z';
                const numClass = h.numeric ? ' num' : '';
                return `<th class="sortable${numClass} ${sortClass}" data-col="${escapeAttr(id)}" scope="col" aria-sort="${ariaSort}" title="Ordenar ${nextHint}">
                    <span class="th-label">${escapeHtml(h.label)}</span><span class="sort-icon" aria-hidden="true"></span>
                </th>`;
            }).join('')}</tr></thead>
            <tbody>${rowsHtml}</tbody>
        </table></div>`;
    }

    function compareKpiDetailSortValues(a, b, col) {
        if (col.numeric || col.id === 'status') {
            return (Number(a.value) || 0) - (Number(b.value) || 0);
        }
        if (col.id === 'origen') {
            return String(a.origen || '').localeCompare(String(b.origen || ''), 'es', { sensitivity: 'base' });
        }
        if (col.id === 'detalle') {
            return String(a.detalle || '').localeCompare(String(b.detalle || ''), 'es', { sensitivity: 'base' });
        }
        return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es', { sensitivity: 'base' });
    }

    function sortKpiDetailRows(rows, headers = [], numericKey) {
        const col = headers.find(h => h.id === kpiDetailSort.column);
        const dir = kpiDetailSort.direction === 'desc' ? -1 : 1;
        return [...rows].sort((a, b) => {
            if (col) {
                const cmp = compareKpiDetailSortValues(a, b, col);
                if (cmp) return cmp * dir;
            } else if (numericKey) {
                const diff = (Number(b[numericKey]) || 0) - (Number(a[numericKey]) || 0);
                if (diff) return diff;
            }
            const byName = String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es');
            if (byName) return byName;
            return String(a.origen || '').localeCompare(String(b.origen || ''), 'es');
        });
    }

    function onKpiDetailSortColumn(columnId) {
        if (!columnId) return;
        if (kpiDetailSort.column === columnId) {
            kpiDetailSort.direction = kpiDetailSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            kpiDetailSort.column = columnId;
            kpiDetailSort.direction = 'asc';
        }
        refreshKpiDetailTable();
    }

    function buildKpiDetail(metricKey) {
        const auxKeys = kpiDetailAuxKeysLastMonth();
        const sourcePubs = D.uniquePublishers
            ? D.uniquePublishers(flat.publicadores || [])
            : (flat.publicadores || []);
        const pubs = D.sortPublishers(sourcePubs)
            .filter(pub => publisherMatchesKpiPrivilegeFilters(pub, auxKeys));
        const mes = kpiDetailScopeMonth(metricKey);
        const withTotals = pubs.map(pub => ({ pub, ...publisherMonthTotals(pub, mes) }));

        if (metricKey === 'publicadores') {
            const headers = [
                { id: 'nombre', label: 'Nombre' },
                { id: 'origen', label: 'Perfil' },
            ];
            const rows = sortKpiDetailRows(pubs.map(pub => ({
                nombre: pub.nombre,
                origen: pub.origen,
                html: `<tr>
                    <td>${kpiDetailNameHtml(pub)}</td>
                    <td>${escapeHtml(displayPerfil(pub.origen))}</td>
                </tr>`,
            })), headers);
            return {
                headers,
                rowsHtml: rows.map(r => r.html).join(''),
                count: rows.length,
                empty: 'No hay publicadores.',
            };
        }

        if (metricKey === 'cursos') {
            const withHeaders = [
                { id: 'nombre', label: 'Nombre' },
                { id: 'origen', label: 'Perfil' },
                { id: 'value', label: 'Cursos', numeric: true },
            ];
            const withoutHeaders = [
                { id: 'nombre', label: 'Nombre' },
                { id: 'origen', label: 'Perfil' },
            ];
            const withCourses = sortKpiDetailRows(withTotals
                .filter(item => item.cursos > 0)
                .map(({ pub, cursos }) => ({
                    nombre: pub.nombre,
                    origen: pub.origen,
                    value: cursos,
                    html: `<tr>
                        <td>${kpiDetailNameHtml(pub)}</td>
                        <td>${escapeHtml(displayPerfil(pub.origen))}</td>
                        <td class="num">${formatNum(cursos)}</td>
                    </tr>`,
                })), withHeaders, 'value');
            const withoutCourses = sortKpiDetailRows(withTotals
                .filter(item => item.cursos <= 0)
                .map(({ pub }) => ({
                    nombre: pub.nombre,
                    origen: pub.origen,
                    html: `<tr>
                        <td>${kpiDetailNameHtml(pub)}</td>
                        <td>${escapeHtml(displayPerfil(pub.origen))}</td>
                    </tr>`,
                })), withoutHeaders);
            const cursosTotal = withTotals.reduce((sum, item) => sum + (item.cursos || 0), 0);
            return {
                count: withTotals.length,
                cursosTotal,
                cursosTab: true,
                empty: 'No hay publicadores.',
                withCourses: {
                    headers: withHeaders,
                    rowsHtml: withCourses.map(r => r.html).join(''),
                    count: withCourses.length,
                    empty: 'Nadie tuvo cursos bíblicos en este periodo.',
                },
                withoutCourses: {
                    headers: withoutHeaders,
                    rowsHtml: withoutCourses.map(r => r.html).join(''),
                    count: withoutCourses.length,
                    empty: 'Todos tuvieron cursos bíblicos.',
                },
            };
        }

        if (metricKey === 'horas') {
            const headers = [
                { id: 'nombre', label: 'Nombre' },
                { id: 'value', label: 'Horas', numeric: true },
            ];
            const rows = sortKpiDetailRows(withTotals.map(({ pub, horas }) => ({
                nombre: pub.nombre,
                origen: pub.origen,
                value: horas,
                html: `<tr>
                    <td>${kpiDetailNameHtml(pub)}</td>
                    <td class="num">${formatNum(horas)}</td>
                </tr>`,
            })), headers, 'value');
            return {
                headers,
                rowsHtml: rows.map(r => r.html).join(''),
                count: rows.length,
                empty: 'No hay publicadores.',
            };
        }

        if (metricKey === 'participacion') {
            const headers = [
                { id: 'nombre', label: 'Nombre' },
                { id: 'origen', label: 'Perfil' },
                { id: 'status', label: 'Participó' },
            ];
            const rows = sortKpiDetailRows(withTotals.map(({ pub, participacion }) => {
                const yes = mes ? participacion > 0 : participacion > 0;
                return {
                    nombre: pub.nombre,
                    origen: pub.origen,
                    value: yes ? 1 : 0,
                    html: `<tr>
                        <td>${kpiDetailNameHtml(pub)}</td>
                        <td>${escapeHtml(displayPerfil(pub.origen))}</td>
                        <td class="${yes ? 'kpi-detail-yes' : 'kpi-detail-no'}">${yes ? 'Sí' : 'No'}</td>
                    </tr>`,
                };
            }), headers, 'value');
            return {
                headers,
                rowsHtml: rows.map(r => r.html).join(''),
                count: rows.length,
                empty: 'No hay publicadores.',
            };
        }

        if (metricKey === 'precursor_aux') {
            const headers = mes
                ? [{ id: 'nombre', label: 'Nombre' }]
                : [
                    { id: 'nombre', label: 'Nombre' },
                    { id: 'value', label: 'Meses', numeric: true },
                ];
            const rows = sortKpiDetailRows(withTotals
                .filter(item => item.precursor_auxiliar > 0)
                .map(({ pub, precursor_auxiliar }) => ({
                    nombre: pub.nombre,
                    origen: pub.origen,
                    value: precursor_auxiliar,
                    html: mes
                        ? `<tr><td>${kpiDetailNameHtml(pub)}</td></tr>`
                        : `<tr>
                            <td>${kpiDetailNameHtml(pub)}</td>
                            <td class="num">${formatNum(precursor_auxiliar)}</td>
                        </tr>`,
                })), headers, 'value');
            return {
                headers,
                rowsHtml: rows.map(r => r.html).join(''),
                count: rows.length,
                empty: 'Ningún publicador sirvió de precursor auxiliar en este periodo.',
            };
        }

        if (metricKey === 'inactivos') {
            const refMes = mes || kpisCache.lastCompleteMonth || kpisCache.lastRegisteredMonth;
            const classified = D.classifyPublishersActivity(pubs, flat.mensual, refMes);
            const rowHtml = item => `<tr>
                <td>${kpiDetailNameHtml(item.pub)}</td>
                <td>${escapeHtml(displayPerfil(item.pub.origen))}</td>
                <td class="kpi-detail-why">${kpiDetailWhyHtml(item)}</td>
            </tr>`;
            const headers = [
                { id: 'nombre', label: 'Nombre' },
                { id: 'origen', label: 'Perfil' },
                { id: 'detalle', label: 'Detalle' },
            ];
            const toRow = item => ({
                nombre: item.pub.nombre,
                origen: item.pub.origen,
                detalle: String(item.reasonShort || item.reason || ''),
                html: rowHtml(item),
            });
            const inactivos = sortKpiDetailRows(
                classified.filter(item => item.status === 'inactivo').map(toRow),
                headers
            );
            const irregulares = sortKpiDetailRows(
                classified.filter(item => item.status === 'irregular').map(toRow),
                headers
            );
            const carpeta = sortKpiDetailRows(
                classified.filter(item => item.inFolder && item.status === 'ok').map(toRow),
                headers
            );
            const sections = [
                {
                    title: 'Inactivos',
                    hint: 'Sin participación 6 meses seguidos o más (regla S-21).',
                    headers,
                    rowsHtml: inactivos.map(r => r.html).join(''),
                    count: inactivos.length,
                    empty: 'Nadie cumple la regla de inactivo.',
                },
                {
                    title: 'Irregulares',
                    hint: 'Sin participación en alguno de los últimos 6 meses, sin llegar a 6 seguidos.',
                    headers,
                    rowsHtml: irregulares.map(r => r.html).join(''),
                    count: irregulares.length,
                    empty: 'Nadie es irregular en este periodo.',
                },
            ];
            if (carpeta.length) {
                sections.push({
                    title: 'En carpeta Inactivos (no por la regla)',
                    hint: 'Están en el perfil Inactivos, pero informaron hace menos de 6 meses.',
                    headers,
                    rowsHtml: carpeta.map(r => r.html).join(''),
                    count: carpeta.length,
                    empty: '',
                });
            }
            return {
                count: inactivos.length + irregulares.length,
                empty: 'Nadie es inactivo ni irregular según la regla S-21.',
                note: 'La cifra cuenta inactivos e irregulares por la regla de 6 meses. Estar en la carpeta Inactivos es una nota aparte.',
                sections,
            };
        }

        return { headers: [], rowsHtml: '', count: 0, empty: 'Sin detalle.' };
    }

    function bindKpiDetailModal() {
        kpiGrid?.addEventListener('click', e => {
            const card = e.target.closest('[data-kpi-key]');
            if (!card || !kpiGrid.contains(card)) return;
            openKpiDetail(card.dataset.kpiKey);
        });
        kpiDetailModal?.querySelectorAll('[data-kpi-detail-close]').forEach(el => {
            el.addEventListener('click', closeKpiDetail);
        });
        kpiDetailFilters?.addEventListener('change', e => {
            const sel = e.target.closest('[data-kpi-privilege-slot]');
            if (!sel || !kpiDetailFilters.contains(sel)) return;
            const slot = Number(sel.dataset.kpiPrivilegeSlot);
            if (slot !== 0 && slot !== 1) return;
            kpiDetailPrivilegeFilters[slot] = sel.value || '';
            refreshKpiDetailTable();
        });
        kpiDetailBody?.addEventListener('click', e => {
            const th = e.target.closest('th.sortable');
            if (th && kpiDetailBody.contains(th)) {
                onKpiDetailSortColumn(th.dataset.col);
                return;
            }
            const btn = e.target.closest('[data-kpi-cursos-tab]');
            if (!btn || !kpiDetailBody.contains(btn)) return;
            const tab = btn.dataset.kpiCursosTab;
            if (tab !== 'with' && tab !== 'without') return;
            if (kpiDetailCursosTab === tab) return;
            kpiDetailCursosTab = tab;
            refreshKpiDetailTable();
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && kpiDetailModal?.classList.contains('is-open')) {
                closeKpiDetail();
            }
        });
    }

    function closeKpiDetail() {
        kpiDetailKey = '';
        kpiDetailPrivilegeFilters = ['', ''];
        kpiDetailCursosTab = 'with';
        kpiDetailSort = { column: '', direction: 'asc' };
        if (kpiDetailFilters) {
            kpiDetailFilters.innerHTML = '';
            kpiDetailFilters.hidden = true;
        }
        window.S21Motion?.setOpen(kpiDetailModal, false, { from: 'scale' });
        document.body.classList.remove('kpi-detail-open');
    }

    function openKpiDetail(metricKey) {
        const item = KPI_ITEMS.find(k => k.key === metricKey);
        if (!item || !flat.publicadores?.length) return;
        kpiDetailKey = metricKey;
        kpiDetailCursosTab = 'with';
        kpiDetailSort = { column: '', direction: 'asc' };
        if (kpiDetailTitle) kpiDetailTitle.textContent = item.label;
        renderKpiDetailFilters();
        syncSparkVisibilityButtons();
        refreshKpiDetailTable();
        window.S21Motion?.setOpen(kpiDetailModal, true, { from: 'scale' });
        document.body.classList.add('kpi-detail-open');
    }

    function setKpiMode(mode) {
        if (!['total', 'max', 'avg', 'last'].includes(mode) || mode === kpiMode) return;
        kpiMode = mode;
        kpiModeBtns.forEach(btn => {
            const active = btn.dataset.kpiMode === mode;
            btn.classList.toggle('active', active);
            btn.classList.toggle('is-open', active);
            btn.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        renderKpis(kpisCache);
        if (kpiDetailKey && kpiDetailModal?.classList.contains('is-open')) {
            refreshKpiDetailTable();
        }
    }

    function renderKpis(kpis) {
        if (!kpis?.metrics) {
            kpiGrid.innerHTML = '';
            if (kpiNowLabel) {
                kpiNowLabel.hidden = true;
                kpiNowLabel.textContent = '';
            }
            return;
        }
        const lastHint = kpis.lastRegisteredMonthShort && kpis.lastRegisteredMonthShort !== '—'
            ? kpis.lastRegisteredMonthShort
            : '';
        const lastFull = kpis.lastRegisteredMonthLabel && kpis.lastRegisteredMonthLabel !== '—'
            ? kpis.lastRegisteredMonthLabel
            : '';
        if (kpiNowLabel) {
            if (lastFull) {
                kpiNowLabel.hidden = false;
                kpiNowLabel.textContent = `Mes de cierre: ${lastFull}`;
            } else {
                kpiNowLabel.hidden = true;
                kpiNowLabel.textContent = '';
            }
        }
        if (kpiSectionSub) {
            kpiSectionSub.textContent = lastFull
                ? `Indicadores a ${lastFull} (último mes con informes)`
                : 'Indicadores del último mes con informes';
        }
        const lastBtn = document.querySelector('.kpi-mode-btn[data-kpi-mode="last"]');
        if (lastBtn) lastBtn.textContent = lastHint ? `Último · ${lastHint}` : 'Último';
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
                if (key === 'inactivos') {
                    const s21 = kpis.lastCompleteMonthShort && kpis.lastCompleteMonthShort !== '—'
                        ? kpis.lastCompleteMonthShort
                        : lastHint;
                    hint = s21 ? `${s21} · S-21` : 'S-21';
                } else if (lastHint) hint = lastHint;
            } else {
                valueHtml = formatNum(m.total);
                if (key === 'inactivos') hint = 'S-21';
            }
            const valueClass = 'kpi-value';
            return `<button type="button" class="kpi-card kpi-card--${key}" data-kpi-key="${escapeAttr(key)}" aria-haspopup="dialog" aria-controls="kpi-detail-modal" title="Ver detalle">
                <span class="kpi-card-icon" aria-hidden="true">${Icons?.metricIcon(key) || ''}</span>
                <span class="${valueClass}">${valueHtml}</span>
                <span class="kpi-label">${label}</span>
                ${hint ? `<span class="kpi-hint">${escapeHtml(hint)}</span>` : ''}
            </button>`;
        }).join('');
    }

    function totalsAllowedMonths() {
        const ranged = D.filterMensualByMonthRange(
            D.S21_MESES.map(mes => ({ mes })),
            totalsMonthFrom,
            totalsMonthTo
        );
        return new Set(
            D.filterMensualByExcludedMonths(ranged, getTotalsTrimOpts()).map(r => r.mes)
        );
    }

    function applyTotalsTimeToTrend(trend) {
        const allowed = totalsAllowedMonths();
        return (trend || []).filter(t => allowed.has(t.mes));
    }

    function renderCharts(aggRows, filteredMensual, metricId, groupFields) {
        if (totalsLayoutMode === 'table') {
            destroyCharts();
            chartBarRowsCache = [];
            chartLineTrendCache = [];
            return;
        }

        const dims = getTotalsDimensions();
        const fields = dims.fields.length ? dims.fields : (groupFields || []);
        const hideBar = totalsChartMode === 'line';
        const hideLine = totalsChartMode === 'bar';

        if (chartBarCard) chartBarCard.classList.toggle('hidden', hideBar);
        if (chartLineCard) chartLineCard.classList.toggle('hidden', hideLine);
        if (chartGrid) chartGrid.classList.toggle('single-chart', hideBar || hideLine);

        const mensualForBar = filteredMensual;
        const barRows = D.aggregateRows(
            mensualForBar,
            fields,
            publicadoresForBarChart(mensualForBar)
        );
        const trend = applyTotalsTimeToTrend(
            D.aggregateMonthlyTrend(getTotalsMensual(flat.mensual, { applyScope: false }), metricId)
        );
        const focusMes = totalsScope !== 'year' ? totalsScope : null;
        const lineStyles = buildLineChartFocusStyles(trend, focusMes);
        const timeHint = totalsTimeHintHtml();
        const lineLabels = trend.map(t => t.mes_label);
        const lineData = trend.map(t => t.value);
        const chartLabel = D.chartMetricLabel(metricId);

        destroyCharts();
        if (typeof Chart === 'undefined') return;

        if (!hideBar) {
            const barChartData = buildGroupedBarChartData(barRows, fields, metricId, fields);
            chartBarClickContext = barChartData;
            chartBarRowsCache = barChartData.mode === 'simple' ? barChartData.clickRows : [];
            const stacked = barChartData.mode === 'stacked';

            if (chartBarTitle) {
                const titleFields = stacked ? [fields[0]] : fields;
                const subgroupHint = stacked
                    ? chartTitleNoteHtml(D.groupFieldLabel(fields[1]))
                    : '';
                setChartTitle(
                    chartBarTitle,
                    escapeHtml(chartBarTitleText(metricId, titleFields)),
                    chartScopeHintHtml(),
                    timeHint,
                    subgroupHint
                );
            }

            const barCanvas = document.getElementById('chart-bar');
            if (barCanvas) {
                barChart = new Chart(barCanvas, {
                    type: 'bar',
                    data: {
                        labels: barChartData.labels,
                        datasets: barChartData.datasets,
                    },
                    options: {
                        ...chartBarOptions(metricId, stacked, barChartData.labels.length),
                        onClick: (_evt, elements) => handleBarChartClick(elements),
                    },
                    plugins: stacked ? [createStackTotalsPlugin(metricId)] : [],
                });
                scheduleChartResize();
            }
        } else {
            chartBarRowsCache = [];
            syncBarChartDimensions(
                document.getElementById('chart-bar-scroll'),
                document.getElementById('chart-bar-wrap'),
                0
            );
        }

        chartLineTrendCache = hideLine ? [] : trend;
        const lineCardTitle = document.querySelector('#chart-line-card h3');
        if (lineCardTitle) {
            const focusHint = focusMes
                ? chartTitleNoteHtml(`foco: ${D.mesLabel(focusMes, 'completo')}`)
                : '';
            setChartTitle(lineCardTitle, 'Tendencia mensual', timeHint, focusHint);
        }

        if (hideLine) return;

        const lineCanvas = document.getElementById('chart-line');
        if (!lineCanvas) return;
        lineChart = new Chart(lineCanvas, {
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
                ...chartLineOptions(metricId, trend, focusMes, lineLabels.length),
                onClick: (_evt, elements) => {
                    if (!elements.length) return;
                    const point = chartLineTrendCache[elements[0].index];
                    if (point) applyDetailFilterFromLinePoint(point);
                },
            },
        });
        scheduleChartResize();
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

    function chartLineOptions(metricId, trend, focusMes, categoryCount = 0) {
        const base = chartOptions(metricId, categoryCount);
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
                            const dense = categoryCount > 8;
                            return { size: dense ? 9 : 10, weight: mes === focusMes ? '700' : '400' };
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

    function chartBarOptions(metricId, stacked = false, categoryCount = 0) {
        const horizontal = prefersHorizontalBarChart({ stacked });
        const base = chartOptions(metricId, categoryCount);
        const dense = categoryCount > 8;
        const c = chartPalette();
        const multi = stacked;
        const interaction = {
            mode: multi ? 'index' : 'nearest',
            axis: horizontal ? 'y' : 'x',
            intersect: false,
        };
        const legendPlugin = multi ? {
            display: true,
            position: 'bottom',
            labels: {
                boxWidth: 10,
                boxHeight: 10,
                color: c.tick,
                font: { size: 10 },
                padding: 12,
            },
        } : { display: false };
        const barLayout = {
            categoryPercentage: stacked ? 0.62 : 0.82,
            barPercentage: stacked ? 0.88 : 0.88,
        };
        const stackPatch = stacked ? { stacked: true } : {};

        if (!horizontal) {
            return {
                ...base,
                interaction,
                datasets: { bar: barLayout },
                layout: stacked ? { padding: { top: 22 } } : undefined,
                plugins: {
                    ...base.plugins,
                    legend: legendPlugin,
                    tooltip: multi ? {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label(ctx) {
                                return chartValueTooltipLabel(ctx, metricId);
                            },
                        },
                    } : base.plugins.tooltip,
                },
                scales: {
                    x: {
                        ...base.scales.x,
                        ...stackPatch,
                        ticks: {
                            ...base.scales.x.ticks,
                            maxRotation: 0,
                            minRotation: 0,
                            autoSkip: categoryCount > 16,
                            callback: chartAxisTickCallback,
                        },
                    },
                    y: {
                        ...base.scales.y,
                        ...stackPatch,
                    },
                },
            };
        }

        const spec = D.S21_CHART_METRICS.find(m => m.id === metricId);
        const isCount = spec?.aggregation === 'count';
        return {
            ...base,
            indexAxis: 'y',
            interaction,
            datasets: { bar: barLayout },
            plugins: {
                ...base.plugins,
                legend: legendPlugin,
                tooltip: {
                    mode: multi ? 'index' : 'nearest',
                    intersect: false,
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
                    stacked,
                    ticks: {
                        color: c.tick,
                        font: { size: 10 },
                        precision: isCount ? 0 : undefined,
                    },
                    grid: { color: c.grid },
                },
                y: {
                    stacked,
                    ticks: {
                        color: c.tick,
                        font: { size: 10 },
                        autoSkip: false,
                        callback: chartAxisTickCallback,
                    },
                    grid: { display: false },
                },
            },
        };
    }

    function chartOptions(metricId, categoryCount = 0) {
        const spec = D.S21_CHART_METRICS.find(m => m.id === metricId);
        const isAvg = spec?.aggregation === 'avg';
        const interaction = {
            mode: 'nearest',
            axis: 'x',
            intersect: false,
        };
        const isCount = spec?.aggregation === 'count';
        const c = chartPalette();
        const dense = categoryCount > 8;
        return {
            responsive: true,
            maintainAspectRatio: false,
            resizeDelay: 0,
            animation: { duration: 400 },
            transitions: { resize: { animation: { duration: 0 } } },
            interaction,
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
                    ticks: {
                        color: c.tick,
                        maxRotation: 0,
                        minRotation: 0,
                        font: { size: dense ? 9 : 10 },
                        autoSkip: categoryCount > 16,
                        callback: chartAxisTickCallback,
                    },
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
