(function () {
    const Storage = window.S21DashboardStorage;
    const D = () => window.S21DashboardData;

    let callbacks = {};
    let pendingSave = null;
    let pendingSaveResolve = null;

    function $(id) {
        return document.getElementById(id);
    }

    function Motion() {
        return window.S21Motion;
    }

    function sheetFrom() {
        return window.matchMedia('(max-width: 640px)').matches ? 'bottom' : 'right';
    }

    function overlayOpen(el, from) {
        if (!el) return Promise.resolve();
        const motion = Motion();
        if (!motion?.setOpen) {
            el.classList.remove('hidden');
            el.hidden = false;
            return Promise.resolve();
        }
        return motion.setOpen(el, true, { from });
    }

    function overlayClose(el, from) {
        if (!el) return Promise.resolve();
        const motion = Motion();
        if (!motion?.setOpen) {
            el.classList.add('hidden');
            el.hidden = true;
            return Promise.resolve();
        }
        return motion.setOpen(el, false, { from });
    }

    function overlayVisible(el) {
        if (!el) return false;
        if (Motion()?.isOpen(el) || el.classList.contains('is-closing')) return true;
        return !el.hidden && !el.classList.contains('hidden');
    }

    function escapeHtml(s) {
        return String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatSavedAt(ts) {
        if (!ts) return '';
        try {
            return new Date(ts).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
        } catch {
            return '';
        }
    }

    function autoDatasetName(serviceYear, profileSummary) {
        const year = serviceYear ? ` ${serviceYear}` : '';
        if (!profileSummary?.length) return `Carga${year}`.trim();
        if (profileSummary.length === 1) return `${profileSummary[0].titulo || profileSummary[0].origen}${year}`.trim();
        return `${profileSummary.length} perfiles${year}`.trim();
    }

    function buildDatasetFromPackages(packages, meta = {}, existingId = null) {
        const flat = D().flattenPackages(packages);
        const analysis = D().analyzePackageYears(packages);
        const origins = D().uniqueValues(flat.publicadores, 'origen');
        const profileSummary = origins.map(origen => {
            const pkg = packages.find(p => p.origen === origen);
            return {
                origen,
                titulo: pkg?.titulo || origen,
                count: flat.publicadores.filter(p => p.origen === origen).length,
            };
        });
        const serviceYear = analysis.years.length === 1
            ? analysis.years[0]
            : (meta.añoMeta?.valor ?? null);

        return {
            id: existingId || crypto.randomUUID(),
            name: meta.name || autoDatasetName(serviceYear, profileSummary),
            packages,
            meta: {
                label: meta.label || '',
                folderLabel: meta.folderLabel || '',
                añoMeta: meta.añoMeta || null,
            },
            savedAt: Date.now(),
            serviceYear,
            packageCount: packages.length,
            publisherCount: flat.publicadores.length,
            profileSummary,
            isBundle: packages.length > 1,
            persistGrupos: false,
            gruposConfig: null,
        };
    }

    function findDuplicateConflicts(packages, datasets) {
        const flat = D().flattenPackages(packages);
        const newOrigens = new Set(D().uniqueValues(flat.publicadores, 'origen'));
        const analysis = D().analyzePackageYears(packages);
        const newYear = analysis.years.length === 1 ? analysis.years[0] : null;

        return datasets.map(ds => {
            const overlap = (ds.profileSummary || []).filter(p => newOrigens.has(p.origen));
            if (!overlap.length) return null;
            const sameYear = !newYear || !ds.serviceYear || newYear === ds.serviceYear;
            if (!sameYear) return null;
            return { dataset: ds, overlap };
        }).filter(Boolean);
    }

    async function openPanel() {
        const panel = $('datos-panel');
        if (!panel) return;
        document.body.classList.add('datos-panel-open');
        overlayOpen(panel, sheetFrom());
        await callbacks.onPanelOpen?.();
        await renderHistory();
    }

    function closePanel() {
        const panel = $('datos-panel');
        if (!panel) return;
        overlayClose(panel, sheetFrom()).then(() => {
            if (Motion()?.isOpen(panel)) return;
            document.body.classList.remove('datos-panel-open');
        });
    }

    const PANEL_TITLES = { datos: 'Datos', apariencia: 'Apariencia' };

    function setSettingsTab(tabId) {
        if (!PANEL_TITLES[tabId]) return;
        const sheet = $('datos-panel');
        const instant = !overlayVisible(sheet);
        const tabs = document.querySelectorAll('.settings-tab');
        const panels = document.querySelectorAll('.settings-tab-panel');
        tabs.forEach(tab => {
            const active = tab.dataset.settingsTab === tabId;
            tab.classList.toggle('active', active);
            tab.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        panels.forEach(panel => {
            const show = panel.id === `settings-panel-${tabId}`;
            panel.classList.add('motion-root');
            const motion = Motion();
            if (motion?.setOpen) {
                motion.setOpen(panel, show, { from: 'fade', instant });
            } else {
                panel.classList.toggle('hidden', !show);
                panel.hidden = !show;
                panel.classList.toggle('is-open', show);
            }
        });
        const titleEl = $('datos-panel-title');
        if (titleEl && PANEL_TITLES[tabId]) titleEl.textContent = PANEL_TITLES[tabId];
    }

    function bindPanelEvents() {
        $('btn-open-datos-panel')?.addEventListener('click', () => {
            setSettingsTab('datos');
            openPanel();
        });
        $('btn-open-apariencia-panel')?.addEventListener('click', () => {
            setSettingsTab('apariencia');
            openPanel();
        });
        $('datos-panel-close')?.addEventListener('click', closePanel);
        $('datos-panel-backdrop')?.addEventListener('click', closePanel);

        $('btn-datos-new-load')?.addEventListener('click', () => {
            window.S21DashboardWizard?.showWizard();
            $('datos-wizard-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        $('btn-datos-clear-link')?.addEventListener('click', () => openClearModal());

        $('datos-save-cancel')?.addEventListener('click', () => closeSaveModal(null));
        $('datos-save-add')?.addEventListener('click', () => closeSaveModal('add'));
        $('datos-save-replace')?.addEventListener('click', () => closeSaveModal('replace'));

        $('datos-clear-cancel')?.addEventListener('click', () => closeClearModal(false));
        $('datos-clear-confirm')?.addEventListener('click', () => confirmClearModal());

        document.addEventListener('keydown', e => {
            if (e.key !== 'Escape') return;
            if (overlayVisible($('datos-save-modal'))) closeSaveModal(null);
            else if (overlayVisible($('datos-clear-modal'))) closeClearModal(false);
            else if (overlayVisible($('datos-panel'))) closePanel();
        });
    }

    async function renderHistory() {
        const listEl = $('dataset-history-list');
        const dupEl = $('dataset-duplicate-hint');
        if (!listEl || !Storage?.isAvailable()) return;

        const datasets = await Storage.listDatasets();
        const activeId = await Storage.getActiveDatasetId();
        const conflicts = findInternalDuplicates(datasets);

        if (dupEl) {
            if (conflicts.length) {
                dupEl.classList.remove('hidden');
                dupEl.innerHTML = `<strong>Duplicados detectados:</strong> ${conflicts.map(c =>
                    `«${escapeHtml(c.a.name)}» y «${escapeHtml(c.b.name)}» comparten perfiles del año ${c.year}`
                ).join('; ')}. Borre cargas redundantes para evitar confusiones.`;
            } else {
                dupEl.classList.add('hidden');
                dupEl.innerHTML = '';
            }
        }

        if (!datasets.length) {
            listEl.innerHTML = '<p class="datos-muted">Sin cargas guardadas. Use «Nueva carga» para añadir JSON.</p>';
            return;
        }

        listEl.innerHTML = datasets.map(ds => {
            const active = ds.id === activeId;
            const profiles = (ds.profileSummary || [])
                .map(p => escapeHtml(p.titulo || p.origen))
                .slice(0, 4)
                .join(', ');
            const more = (ds.profileSummary?.length || 0) > 4 ? '…' : '';
            const openLabel = active ? 'Abrir' : 'Activar';
            return `<article class="dataset-card${active ? ' is-active' : ''}" data-dataset-id="${escapeHtml(ds.id)}">
                <button type="button" class="dataset-card-main btn-dataset-open" data-id="${escapeHtml(ds.id)}" aria-label="${openLabel} carga ${escapeHtml(ds.name)}">
                    <strong class="dataset-card-name">${escapeHtml(ds.name)}</strong>
                    <span class="dataset-card-meta">${ds.packageCount} JSON · ${ds.publisherCount} pub.${ds.serviceYear ? ` · ${ds.serviceYear}` : ''}</span>
                    <span class="dataset-card-profiles">${profiles}${more}</span>
                    <span class="dataset-card-date">${formatSavedAt(ds.savedAt)}</span>
                </button>
                <div class="dataset-card-actions">
                    ${active ? '<span class="dataset-active-badge">Activa</span>' : ''}
                    <button type="button" class="btn-primary btn-compact btn-dataset-open" data-id="${escapeHtml(ds.id)}">${openLabel}</button>
                    <button type="button" class="btn-ghost btn-compact btn-dataset-delete" data-id="${escapeHtml(ds.id)}" title="Eliminar esta carga">✕</button>
                </div>
            </article>`;
        }).join('');

        listEl.querySelectorAll('.btn-dataset-open').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                activateDataset(btn.dataset.id);
            });
        });
        listEl.querySelectorAll('.btn-dataset-delete').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                deleteDatasetById(btn.dataset.id);
            });
        });
    }

    function findInternalDuplicates(datasets) {
        const pairs = [];
        for (let i = 0; i < datasets.length; i++) {
            for (let j = i + 1; j < datasets.length; j++) {
                const a = datasets[i];
                const b = datasets[j];
                if (a.serviceYear && b.serviceYear && a.serviceYear !== b.serviceYear) continue;
                const aOrig = new Set((a.profileSummary || []).map(p => p.origen));
                const overlap = (b.profileSummary || []).filter(p => aOrig.has(p.origen));
                if (overlap.length) pairs.push({ a, b, year: a.serviceYear || b.serviceYear || '—', overlap });
            }
        }
        return pairs;
    }

    async function activateDataset(id) {
        const ds = await Storage.getDataset(id);
        if (!ds) {
            alert('No se encontró esa carga en el dispositivo.');
            await renderHistory();
            return;
        }
        if (!ds.packages?.length) {
            alert(`La carga «${ds.name}» no tiene datos JSON guardados.\n\nElimínela y vuelva a cargar los archivos con «Nueva carga».`);
            return;
        }
        await Storage.setActiveDatasetId(id);
        await callbacks.onDatasetActivated?.(ds.packages, {
            label: ds.meta?.label || ds.name,
            folderLabel: ds.meta?.folderLabel,
            añoMeta: ds.meta?.añoMeta,
            datasetId: ds.id,
            skipSavePrompt: true,
        });
        await renderHistory();
        closePanel();
    }

    async function deleteDatasetById(id) {
        const ds = await Storage.getDataset(id);
        if (!ds) return;
        const ok = confirm(`¿Eliminar la carga «${ds.name}»?\n\nSe borrará del dispositivo (no afecta archivos originales).`);
        if (!ok) return;
        const activeId = await Storage.getActiveDatasetId();
        await Storage.deleteDataset(id);
        if (activeId === id) {
            const remaining = await Storage.listDatasets();
            if (remaining.length) await activateDataset(remaining[0].id);
            else callbacks.onAllDatasetsCleared?.();
        }
        await renderHistory();
    }

    function openSaveModal(packages, meta, conflicts, atMax) {
        pendingSave = { packages, meta };
        const modal = $('datos-save-modal');
        const body = $('datos-save-modal-body');
        const addBtn = $('datos-save-add');
        const replaceBtn = $('datos-save-replace');

        let html = '<p>¿Cómo desea guardar esta carga en el dispositivo?</p>';
        if (conflicts.length) {
            html += '<div class="datos-warn-box"><strong>Posible duplicado</strong><ul>';
            conflicts.forEach(c => {
                const names = c.overlap.map(o => escapeHtml(o.titulo || o.origen)).join(', ');
                html += `<li>Coincide con «${escapeHtml(c.dataset.name)}» (${names}). Mantener ambas puede mostrar datos redundantes.</li>`;
            });
            html += '</ul></div>';
        }
        if (atMax) {
            html += '<p class="datos-warn-box">Ha alcanzado el máximo de 15 cargas. Use «Reemplazar activa» o borre cargas antiguas.</p>';
            addBtn.disabled = true;
        } else {
            addBtn.disabled = false;
        }

        if (body) body.innerHTML = html;
        overlayOpen(modal, 'scale');
        replaceBtn?.focus();
    }

    function closeSaveModal(action) {
        overlayClose($('datos-save-modal'), 'scale');
        pendingSave = null;
        const resolve = pendingSaveResolve;
        pendingSaveResolve = null;
        resolve?.(action || null);
    }

    async function promptSaveAction(packages, meta) {
        if (!Storage?.isAvailable()) return 'add';
        const datasets = await Storage.listDatasets();
        if (!datasets.length) return 'add';

        const conflicts = findDuplicateConflicts(packages, datasets);
        const atMax = datasets.length >= Storage.MAX_DATASETS;

        return new Promise(resolve => {
            pendingSaveResolve = resolve;
            pendingSave = { packages, meta };
            openSaveModal(packages, meta, conflicts, atMax);
        });
    }

    async function persistSave(action, packages, meta) {
        const activeId = await Storage.getActiveDatasetId();
        let dataset;

        if (action === 'replace' && activeId) {
            const existing = await Storage.getDataset(activeId);
            dataset = buildDatasetFromPackages(packages, meta, activeId);
            dataset.name = meta.name || existing?.name || dataset.name;
            dataset.persistGrupos = existing?.persistGrupos ?? false;
            dataset.gruposConfig = existing?.persistGrupos ? (existing.gruposConfig || null) : null;
        } else {
            dataset = buildDatasetFromPackages(packages, meta);
        }

        await Storage.putDataset(dataset);
        await Storage.setActiveDatasetId(dataset.id);
        await Storage.enforceMaxDatasets();
        await renderHistory();
        callbacks.onDatasetSaved?.(dataset);
    }

    function openClearModal() {
        const modal = $('datos-clear-modal');
        const input = $('datos-clear-confirm-input');
        if (input) input.value = '';
        $('datos-clear-grupos') && ($('datos-clear-grupos').checked = false);
        overlayOpen(modal, 'scale');
    }

    function closeClearModal() {
        overlayClose($('datos-clear-modal'), 'scale');
    }

    function confirmClearModal() {
        const input = $('datos-clear-confirm-input');
        if (input?.value?.trim().toUpperCase() !== 'BORRAR') {
            alert('Escriba BORRAR para confirmar.');
            return;
        }
        const alsoGrupos = $('datos-clear-grupos')?.checked;
        closeClearModal();
        callbacks.onClearAll?.(alsoGrupos);
    }

    async function getActiveGruposMeta() {
        const ds = await Storage?.getActiveDataset?.();
        if (!ds) return { persistGrupos: false, gruposConfig: null };
        return {
            persistGrupos: !!ds.persistGrupos,
            gruposConfig: ds.gruposConfig || null,
        };
    }

    async function syncActiveDatasetGrupos({ persistGrupos, gruposConfig }) {
        if (!Storage?.isAvailable()) return;
        const id = await Storage.getActiveDatasetId();
        if (!id) return;
        const ds = await Storage.getDataset(id);
        if (!ds) return;
        ds.persistGrupos = !!persistGrupos;
        ds.gruposConfig = persistGrupos ? (gruposConfig || null) : null;
        await Storage.putDataset(ds);
    }

    async function init(options) {
        callbacks = options || {};
        bindPanelEvents();

        if (Storage?.isAvailable()) {
            const existing = await Storage.listDatasets();
            if (!existing.length) {
                await Storage.migrateLegacyCache((packages, meta) =>
                    buildDatasetFromPackages(packages, meta));
            }
        }
    }

    window.S21DashboardDatos = {
        init,
        openPanel,
        closePanel,
        renderHistory,
        promptSaveAction,
        persistSave,
        buildDatasetFromPackages,
        findDuplicateConflicts,
        formatSavedAt,
        setSettingsTab,
        getActiveGruposMeta,
        syncActiveDatasetGrupos,
    };
})();
