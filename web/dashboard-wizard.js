(function () {
    const D = window.S21DashboardData;
    const LAST_RUN_KEY = 's21_dashboard_last';

    let callbacks = {};
    let currentStep = 'choose';
    let path = null;
    let defaultOutputDir = 'resultados';

    let carpetas = [];
    let nextFolderId = 1;
    let outputDirHandle = null;
    let serverInfo = null;

    let jsonSources = [];
    let selectedJsonRutas = new Set();
    let pendingPackages = [];

    const soportaDirectoryPicker = typeof window.showDirectoryPicker === 'function';

    const els = {};

    function $(id) {
        return document.getElementById(id);
    }

    function añoServicioActual() {
        return D.añoServicioVigente();
    }

    function init(options) {
        callbacks = options || {};
        cacheElements();
        bindEvents();
        fetchServerInfo();
        showStep('choose');
    }

    function cacheElements() {
        els.wizard = $('load-wizard');
        els.loadedPanel = $('load-loaded');
        els.steps = {};
        document.querySelectorAll('.wizard-step[data-step]').forEach(el => {
            els.steps[el.dataset.step] = el;
        });

        els.folderList = $('wizard-folder-list');
        els.folderEmpty = $('wizard-folder-empty');
        els.fallbackInput = $('wizard-fallback-folder');
        els.anioServicio = $('wizard-anio-servicio');
        els.anioHint = $('wizard-anio-hint');
        els.outputPreview = $('wizard-output-preview');
        els.carpetaDestino = $('wizard-carpeta-destino');
        els.nombreBase = $('wizard-nombre-base');
        els.enCarpetaAparte = $('wizard-en-carpeta-aparte');
        els.runStatus = $('wizard-run-status');
        els.runSpinner = $('wizard-run-spinner');
        els.jsonSourceList = $('wizard-json-source-list');
        els.jsonYearWarn = $('wizard-json-year-warn');
        els.jsonYearSelect = $('wizard-json-year-select');
        els.jsonYearPick = $('wizard-json-year-pick');
    }

    async function fetchServerInfo() {
        try {
            const res = await fetch('/api/info');
            if (res.ok) {
                serverInfo = await res.json();
                defaultOutputDir = (serverInfo.default_dashboard_dir || 'resultados').split(/[/\\]/).pop();
            }
        } catch {
            /* ignore */
        }
    }

    function bindEvents() {
        $('btn-wizard-analyze')?.addEventListener('click', () => {
            path = 'analyze';
            resetAnalyzeState();
            showStep('pdfs');
        });

        $('btn-wizard-load')?.addEventListener('click', async () => {
            path = 'json';
            await openJsonPickStep();
        });

        $('btn-wizard-add-folder')?.addEventListener('click', onAddFolder);
        $('btn-wizard-remove-folder')?.addEventListener('click', onRemoveFolder);
        $('btn-wizard-clear-folders')?.addEventListener('click', () => {
            carpetas = [];
            renderFolders();
        });
        els.fallbackInput?.addEventListener('change', onFallbackFolders);

        $('btn-wizard-pdfs-back')?.addEventListener('click', () => showStep('choose'));
        $('btn-wizard-pdfs-next')?.addEventListener('click', () => {
            if (!carpetas.length) {
                alert('Agregue al menos una carpeta con PDFs S-21.');
                return;
            }
            if (els.anioServicio && !els.anioServicio.value) {
                els.anioServicio.value = String(añoServicioActual());
            }
            updateAnioHint();
            showStep('year');
        });

        $('btn-wizard-year-back')?.addEventListener('click', () => showStep('pdfs'));
        $('btn-wizard-year-next')?.addEventListener('click', () => {
            const anio = Number(els.anioServicio?.value);
            if (!anio || anio < 2010 || anio > 2040) {
                alert('Indique un año de servicio válido (2010–2040).');
                return;
            }
            showStep('grouping');
        });

        $('btn-wizard-group-back')?.addEventListener('click', () => showStep('year'));
        $('btn-wizard-group-next')?.addEventListener('click', () => {
            const formatos = getFormatos();
            if (!formatos.length) {
                alert('Seleccione al menos un formato de salida.');
                return;
            }
            if (!formatos.includes('json')) {
                const ok = confirm('Sin JSON no podrá ver el dashboard. ¿Continuar solo con CSV?');
                if (!ok) return;
            }
            updateOutputPreview();
            showStep('output');
        });

        $('btn-wizard-output-back')?.addEventListener('click', () => showStep('grouping'));
        $('btn-wizard-execute')?.addEventListener('click', runAnalyzer);

        $('btn-wizard-browse-dest')?.addEventListener('click', onBrowseDest);

        ['wizard-nombre-base', 'wizard-carpeta-destino', 'wizard-en-carpeta-aparte'].forEach(id => {
            $(id)?.addEventListener('input', updateOutputPreview);
            $(id)?.addEventListener('change', updateOutputPreview);
        });
        document.querySelectorAll('input[name="wizard_modo_agrupacion"]').forEach(el => {
            el.addEventListener('change', updateOutputPreview);
        });

        $('btn-wizard-json-back')?.addEventListener('click', () => showStep('choose'));
        $('btn-wizard-json-pick')?.addEventListener('click', () => $('wizard-file-input')?.click());
        $('btn-wizard-json-select-all')?.addEventListener('click', () => {
            jsonSources.forEach(s => selectedJsonRutas.add(s.ruta));
            renderJsonSourceList();
        });
        $('btn-wizard-json-clear')?.addEventListener('click', () => {
            selectedJsonRutas.clear();
            renderJsonSourceList();
        });
        $('wizard-file-input')?.addEventListener('change', onManualJsonFiles);
        $('btn-wizard-json-next')?.addEventListener('click', onJsonSourcesNext);

        $('btn-wizard-json-year-back')?.addEventListener('click', () => showStep('json-pick'));
        $('btn-wizard-json-year-confirm')?.addEventListener('click', confirmJsonYearLoad);

        $('btn-new-load')?.addEventListener('click', () => {
            callbacks.onClear?.();
            resetAll();
            showWizard();
        });

        if (els.anioServicio && !els.anioServicio.value) {
            els.anioServicio.value = String(añoServicioActual());
        }

        $('btn-wizard-run-retry')?.addEventListener('click', () => {
            els.runStatus?.classList.remove('warn');
            $('btn-wizard-run-retry')?.classList.add('hidden');
            els.runSpinner?.classList.remove('hidden');
            showStep('output');
        });
    }

    function resetAnalyzeState() {
        carpetas = [];
        outputDirHandle = null;
        renderFolders();
        if (els.nombreBase) els.nombreBase.value = 'registros';
        if (els.carpetaDestino) els.carpetaDestino.value = '';
        if (els.enCarpetaAparte) els.enCarpetaAparte.checked = true;
        const destHint = $('wizard-dest-local-hint');
        if (destHint) {
            destHint.textContent = '';
            destHint.classList.add('hidden');
        }
    }

    function resetAll() {
        path = null;
        carpetas = [];
        jsonSources = [];
        selectedJsonRutas = new Set();
        pendingPackages = [];
        resetAnalyzeState();
        showStep('choose');
    }

    function showWizard() {
        els.wizard?.classList.remove('hidden');
        els.loadedPanel?.classList.add('hidden');
    }

    function showLoaded() {
        els.wizard?.classList.add('hidden');
        els.loadedPanel?.classList.remove('hidden');
    }

    function showStep(step) {
        currentStep = step;
        Object.entries(els.steps).forEach(([name, el]) => {
            el?.classList.toggle('hidden', name !== step);
            el?.classList.toggle('active', name === step);
        });
        if (step === 'output') updateOutputPreview();
        if (step === 'year') updateAnioHint();
    }

    function updateAnioHint() {
        if (!els.anioHint || !els.anioServicio) return;
        const anio = Number(els.anioServicio.value) || añoServicioActual();
        els.anioHint.textContent = `Período ${D.periodoServicioTexto(anio)}. Debe coincidir con las tarjetas PDF.`;
    }

    async function elegirCarpeta(preferWrite = false) {
        if (!soportaDirectoryPicker) {
            throw new Error('Use Chrome o Edge para seleccionar carpetas.');
        }
        if (preferWrite) {
            try {
                return await window.showDirectoryPicker({ mode: 'readwrite' });
            } catch (e) {
                if (e.name === 'AbortError') throw e;
            }
        }
        return window.showDirectoryPicker({ mode: 'read' });
    }

    async function asegurarPermisoEscritura(handle) {
        if (!handle?.requestPermission) return;
        const actual = await handle.queryPermission?.({ mode: 'readwrite' });
        if (actual === 'granted') return;
        const permiso = await handle.requestPermission({ mode: 'readwrite' });
        if (permiso !== 'granted') {
            throw new Error('Se necesita permiso de escritura en la carpeta seleccionada.');
        }
    }

    async function getPdfEntriesFromHandle(dirHandle) {
        const pdfs = [];
        for await (const [name, entry] of dirHandle.entries()) {
            if (entry.kind === 'file' && name.toLowerCase().endsWith('.pdf')) {
                pdfs.push({ name, handle: entry });
            }
        }
        return pdfs;
    }

    async function getSubdirsWithPdfs(parentHandle) {
        const subs = [];
        for await (const [name, entry] of parentHandle.entries()) {
            if (entry.kind !== 'directory') continue;
            const pdfs = await getPdfEntriesFromHandle(entry);
            if (pdfs.length > 0) {
                subs.push({ name, handle: entry, pdfCount: pdfs.length });
            }
        }
        return subs;
    }

    function makeUniqueFolderName(name) {
        if (!carpetas.some(c => c.name === name)) return name;
        let i = 2;
        while (carpetas.some(c => c.name === `${name} (${i})`)) i += 1;
        return `${name} (${i})`;
    }

    async function pushCarpetaEntry(handle, name, pdfCount = null) {
        const displayName = makeUniqueFolderName(name);
        const entry = { id: nextFolderId++, name: displayName, handle };
        carpetas.push(entry);
        renderFolders();
        entry.pdfCount = pdfCount ?? await contarPdfs(entry);
        renderFolders();
    }

    async function contarPdfs(carpeta) {
        if (carpeta.pdfCount != null) return carpeta.pdfCount;
        if (carpeta.files) {
            return carpeta.files.filter(f => f.name.toLowerCase().endsWith('.pdf')).length;
        }
        if (carpeta.handle) {
            return (await getPdfEntriesFromHandle(carpeta.handle)).length;
        }
        return 0;
    }

    async function agregarCarpetaModerna() {
        const handle = await elegirCarpeta(false);
        const subdirs = await getSubdirsWithPdfs(handle);
        const directPdfs = await getPdfEntriesFromHandle(handle);

        if (subdirs.length > 0) {
            for (const sub of subdirs) {
                await pushCarpetaEntry(sub.handle, sub.name, sub.pdfCount);
            }
            if (directPdfs.length > 0) {
                await pushCarpetaEntry(handle, handle.name, directPdfs.length);
            }
        } else if (directPdfs.length > 0) {
            await pushCarpetaEntry(handle, handle.name, directPdfs.length);
        } else {
            throw new Error('No se encontraron PDFs en la carpeta ni en subcarpetas.');
        }
    }

    function agregarCarpetaFallback(files) {
        const porCarpeta = new Map();
        for (const file of files) {
            if (!file.name.toLowerCase().endsWith('.pdf')) continue;
            const parts = (file.webkitRelativePath || file.name).split('/');
            const root = parts.length > 1 ? parts[0] : 'Carpeta';
            if (!porCarpeta.has(root)) porCarpeta.set(root, []);
            porCarpeta.get(root).push(file);
        }
        if (porCarpeta.size === 0) throw new Error('No se encontraron archivos PDF.');
        for (const [name, pdfs] of porCarpeta) {
            const displayName = makeUniqueFolderName(name);
            carpetas.push({ id: nextFolderId++, name: displayName, files: pdfs, pdfCount: pdfs.length });
        }
        renderFolders();
    }

    function renderFolders() {
        if (!els.folderList) return;
        if (!carpetas.length) {
            els.folderList.innerHTML = '';
            els.folderEmpty?.classList.remove('hidden');
            return;
        }
        els.folderEmpty?.classList.add('hidden');
        els.folderList.innerHTML = carpetas.map(c =>
            `<li data-id="${c.id}"><strong>${escapeHtml(c.name)}</strong> · ${c.pdfCount ?? '…'} PDF</li>`
        ).join('');
        els.folderList.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', () => {
                els.folderList.querySelectorAll('li').forEach(x => x.classList.remove('selected'));
                li.classList.add('selected');
            });
        });
    }

    async function onAddFolder() {
        const btn = $('btn-wizard-add-folder');
        try {
            btn.disabled = true;
            if (soportaDirectoryPicker) {
                await agregarCarpetaModerna();
            } else {
                els.fallbackInput?.click();
            }
        } catch (e) {
            if (e.name !== 'AbortError') alert(e.message || 'No se pudo abrir el selector de carpetas.');
        } finally {
            btn.disabled = false;
        }
    }

    function onRemoveFolder() {
        const sel = els.folderList?.querySelector('li.selected');
        if (!sel) return;
        const id = Number(sel.dataset.id);
        carpetas = carpetas.filter(c => c.id !== id);
        renderFolders();
    }

    function onFallbackFolders() {
        try {
            if (els.fallbackInput?.files?.length) {
                agregarCarpetaFallback(Array.from(els.fallbackInput.files));
            }
        } catch (e) {
            alert(e.message || 'No se pudieron cargar las carpetas.');
        }
        if (els.fallbackInput) els.fallbackInput.value = '';
    }

    async function onBrowseDest() {
        const btn = $('btn-wizard-browse-dest');
        const hint = $('wizard-dest-local-hint');
        try {
            btn.disabled = true;
            outputDirHandle = await elegirCarpeta(true);
            if (hint) {
                hint.textContent = `Copia local adicional: ${outputDirHandle.name}`;
                hint.classList.remove('hidden');
            }
        } catch (e) {
            if (e.name !== 'AbortError') alert(e.message || 'No se pudo abrir el selector.');
        } finally {
            btn.disabled = false;
        }
    }

    function getModoAgrupacion() {
        const el = document.querySelector('input[name="wizard_modo_agrupacion"]:checked');
        return el ? el.value : 'por_carpeta';
    }

    function getModoCsv() {
        const el = document.querySelector('input[name="wizard_modo_csv"]:checked');
        return el ? el.value : 'unificado';
    }

    function getFormatos() {
        const formatos = [];
        if ($('wizard-fmt-json')?.checked) formatos.push('json');
        if ($('wizard-fmt-csv')?.checked) formatos.push('csv');
        return formatos;
    }

    function resolveOutputBasePath() {
        const custom = els.carpetaDestino?.value.trim();
        const base = custom || defaultOutputDir;
        const nombreBase = els.nombreBase?.value.trim() || 'registros';
        if (els.enCarpetaAparte?.checked) {
            return `${base}/${nombreBase}`;
        }
        return base;
    }

    function updateOutputPreview() {
        if (!els.outputPreview) return;
        const modo = getModoAgrupacion();
        const formatos = getFormatos();
        const nombreBase = els.nombreBase?.value.trim() || 'registros';
        const outPath = resolveOutputBasePath();
        const lines = [];

        lines.push(`<p><strong>Carpeta de salida:</strong> ${escapeHtml(outPath)}</p>`);

        if (modo === 'integrado') {
            lines.push('<p><strong>Agrupación:</strong> un solo archivo con todas las carpetas de origen.</p>');
            if (formatos.includes('json')) {
                lines.push(`<p>· JSON: <code>${escapeHtml(nombreBase)}.json</code></p>`);
            }
            if (formatos.includes('csv')) {
                const csvMode = getModoCsv();
                if (csvMode === 'separado') {
                    lines.push(`<p>· CSV: <code>${escapeHtml(nombreBase)}_horas.csv</code>, <code>${escapeHtml(nombreBase)}_cursos.csv</code></p>`);
                } else {
                    lines.push(`<p>· CSV: <code>${escapeHtml(nombreBase)}.csv</code></p>`);
                }
            }
        } else {
            lines.push('<p><strong>Agrupación:</strong> un archivo por carpeta de origen.</p>');
            if (!carpetas.length) {
                lines.push('<p class="wizard-muted">Seleccione carpetas en el paso 1 para ver los nombres.</p>');
            } else {
                lines.push('<ul class="wizard-preview-list">');
                for (const c of carpetas) {
                    const nb = carpetas.length === 1 && nombreBase !== 'registros' ? nombreBase : c.name;
                    const sub = els.enCarpetaAparte?.checked ? `${outPath}/${escapeHtml(nb)}/` : `${outPath}/`;
                    lines.push(`<li><strong>${escapeHtml(c.name)}</strong> → ${sub}`);
                    const parts = [];
                    if (formatos.includes('json')) parts.push(`${escapeHtml(nb)}.json`);
                    if (formatos.includes('csv')) {
                        parts.push(getModoCsv() === 'separado'
                            ? `${escapeHtml(nb)}_horas.csv, ${escapeHtml(nb)}_cursos.csv`
                            : `${escapeHtml(nb)}.csv`);
                    }
                    lines.push(` (${parts.join(', ')})</li>`);
                }
                lines.push('</ul>');
            }
        }

        els.outputPreview.innerHTML = lines.join('');
    }

    function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
        }
        return btoa(binary);
    }

    async function leerPdfsDeCarpeta(carpeta) {
        const archivos = [];
        if (carpeta.files) {
            for (const file of carpeta.files) {
                if (!file.name.toLowerCase().endsWith('.pdf')) continue;
                archivos.push({ nombre: file.name, datos: arrayBufferToBase64(await file.arrayBuffer()) });
            }
            return archivos;
        }
        if (carpeta.handle) {
            for await (const [name, handle] of carpeta.handle.entries()) {
                if (handle.kind === 'file' && name.toLowerCase().endsWith('.pdf')) {
                    const file = await handle.getFile();
                    archivos.push({ nombre: name, datos: arrayBufferToBase64(await file.arrayBuffer()) });
                }
            }
        }
        return archivos;
    }

    function base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
    }

    async function getOrCreateSubdir(rootHandle, subPath) {
        if (!subPath) return rootHandle;
        let current = rootHandle;
        for (const part of subPath.split('/').filter(Boolean)) {
            current = await current.getDirectoryHandle(part, { create: true });
        }
        return current;
    }

    async function guardarArchivosLocal(rootHandle, archivos) {
        await asegurarPermisoEscritura(rootHandle);
        for (const archivo of archivos) {
            const dir = await getOrCreateSubdir(rootHandle, archivo.subcarpeta || '');
            const fileHandle = await dir.getFileHandle(archivo.nombre, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(base64ToArrayBuffer(archivo.datos));
            await writable.close();
        }
    }

    function guardarUltimaEjecucion(res) {
        const jsonRutas = res.json_dashboard || (res.archivos_generados || [])
            .filter(p => String(p).toLowerCase().endsWith('.json'));
        sessionStorage.setItem(LAST_RUN_KEY, JSON.stringify({
            timestamp: Date.now(),
            carpeta_salida: res.carpeta_salida,
            json_rutas: jsonRutas,
            total_procesados: res.total_procesados,
            total_carpetas: res.total_carpetas,
            año_servicio: res.año_servicio || null,
        }));
    }

    async function runAnalyzer() {
        showStep('run');
        if (els.runStatus) els.runStatus.textContent = 'Leyendo PDFs...';
        els.runSpinner?.classList.remove('hidden');
        $('btn-wizard-execute').disabled = true;

        try {
            const grupos = [];
            for (const carpeta of carpetas) {
                if (els.runStatus) els.runStatus.textContent = `Leyendo PDFs de «${carpeta.name}»...`;
                const archivos = await leerPdfsDeCarpeta(carpeta);
                if (!archivos.length) throw new Error(`«${carpeta.name}» no contiene PDFs.`);
                grupos.push({ nombre: carpeta.name, archivos });
            }

            const payload = {
                grupos,
                formatos: getFormatos(),
                nombre_base: els.nombreBase?.value.trim() || 'registros',
                año_servicio: Number(els.anioServicio?.value) || añoServicioActual(),
                carpeta_destino: els.carpetaDestino?.value.trim() || '',
                en_carpeta_aparte: !!els.enCarpetaAparte?.checked,
                modo_agrupacion: getModoAgrupacion(),
                modo_csv: getModoCsv(),
            };

            if (els.runStatus) els.runStatus.textContent = 'Analizando tarjetas en el servidor...';
            const response = await fetch('/api/ejecutar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Error al procesar.');
            }

            const res = data.result;
            res.total_carpetas = res.total_carpetas || carpetas.length;

            if (outputDirHandle && res.archivos_contenido?.length) {
                if (els.runStatus) els.runStatus.textContent = 'Guardando copia local...';
                await guardarArchivosLocal(outputDirHandle, res.archivos_contenido);
            }

            guardarUltimaEjecucion(res);

            const jsonRutas = res.json_dashboard || [];
            if (!jsonRutas.length) {
                throw new Error('No se generaron JSON. Active el formato JSON para usar el dashboard.');
            }

            if (els.runStatus) els.runStatus.textContent = 'Cargando resultados en el dashboard...';
            await loadFromServer(jsonRutas, 'Análisis recién ejecutado', res.carpeta_salida, res.año_servicio);
        } catch (e) {
            if (els.runStatus) {
                els.runStatus.textContent = `Error: ${e.message}`;
                els.runStatus.classList.add('warn');
            }
            els.runSpinner?.classList.add('hidden');
            $('btn-wizard-run-retry')?.classList.remove('hidden');
        } finally {
            $('btn-wizard-execute').disabled = false;
        }
    }

    async function openJsonPickStep() {
        showStep('json-pick');
        if (els.jsonSourceList) {
            els.jsonSourceList.innerHTML = '<p class="wizard-muted">Buscando JSON en el servidor...</p>';
        }
        try {
            const res = await fetch('/api/dashboard/fuentes');
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'No se pudo listar JSON.');
            jsonSources = data.archivos || [];
            selectedJsonRutas = new Set(jsonSources.map(s => s.ruta));
            renderJsonSourceList();
        } catch (e) {
            jsonSources = [];
            if (els.jsonSourceList) {
                els.jsonSourceList.innerHTML = `<p class="wizard-warn">${escapeHtml(e.message)}</p>`;
            }
        }
    }

    function renderJsonSourceList() {
        if (!els.jsonSourceList) return;
        if (!jsonSources.length) {
            els.jsonSourceList.innerHTML = '<p class="wizard-muted">No hay JSON en la carpeta del servidor. Analice PDFs o use «Abrir archivos».</p>';
            return;
        }

        const yearInfo = D.analyzeSourceYears(jsonSources);
        let header = `<p class="wizard-muted">${jsonSources.length} archivo(s) en <strong>${escapeHtml(defaultOutputDir)}</strong></p>`;
        if (yearInfo.years.length > 1) {
            header += `<p class="wizard-warn">Hay JSON de ${yearInfo.years.length} años de servicio distintos. En el siguiente paso deberá elegir uno.</p>`;
        } else if (yearInfo.years.length === 1) {
            header += `<p class="wizard-ok">Año detectado: ${yearInfo.years[0]} (${D.periodoServicioTexto(yearInfo.years[0])})</p>`;
        }
        if (yearInfo.sinAnio) {
            header += `<p class="wizard-warn">${yearInfo.sinAnio} archivo(s) sin año de servicio en metadatos.</p>`;
        }

        els.jsonSourceList.innerHTML = header + `<ul class="wizard-json-list">${jsonSources.map(src => {
            const y = src.año_servicio?.valor;
            const checked = selectedJsonRutas.has(src.ruta) ? 'checked' : '';
            return `<li>
                <label>
                    <input type="checkbox" data-ruta="${escapeHtml(src.ruta)}" ${checked}>
                    <span><strong>${escapeHtml(src.titulo || src.nombre)}</strong>
                    ${y ? ` · ${y}` : ' · sin año'} · ${src.cantidad} reg.</span>
                </label>
            </li>`;
        }).join('')}</ul>`;

        els.jsonSourceList.querySelectorAll('input[type=checkbox]').forEach(cb => {
            cb.addEventListener('change', () => {
                if (cb.checked) selectedJsonRutas.add(cb.dataset.ruta);
                else selectedJsonRutas.delete(cb.dataset.ruta);
            });
        });
    }

    async function onManualJsonFiles() {
        const input = $('wizard-file-input');
        const files = Array.from(input?.files || []).filter(f => f.name.toLowerCase().endsWith('.json'));
        if (!files.length) return;

        const packages = [];
        for (const file of files) {
            try {
                packages.push(D.parseJsonPackage(await file.text(), file.name));
            } catch (e) {
                alert(`Error en ${file.name}: ${e.message}`);
            }
        }
        if (!packages.length) return;
        input.value = '';

        const analysis = D.analyzePackageYears(packages);
        if (analysis.years.length > 1) {
            showJsonYearStep({
                years: analysis.years,
                sinAnio: analysis.sinAnio,
                byYear: new Map([...analysis.byYear.entries()].map(([y, pkgs]) => [y, pkgs.map(p => ({
                    titulo: p.titulo,
                    nombre: p.fileName,
                }))])),
            }, null, null);
            pendingPackages = { label: 'Archivos locales', packagesRaw: packages };
            return;
        }

        let filtered = packages;
        if (analysis.years.length === 1 && analysis.sinAnio > 0) {
            const ok = confirm(`${analysis.sinAnio} archivo(s) sin año de servicio. ¿Cargar solo los de ${analysis.years[0]}?`);
            if (!ok) return;
            filtered = D.filterPackagesByYear(packages, analysis.years[0]);
        }

        await finishJsonLoad(filtered, 'Archivos locales', null,
            analysis.years.length === 1 ? { valor: analysis.years[0] } : null);
    }

    async function onJsonSourcesNext() {
        const rutas = [...selectedJsonRutas];
        if (!rutas.length) {
            alert('Seleccione al menos un archivo JSON.');
            return;
        }

        const selectedMeta = jsonSources.filter(s => rutas.includes(s.ruta));
        const yearMeta = D.analyzeSourceYears(selectedMeta);

        if (yearMeta.years.length > 1) {
            showJsonYearStep(yearMeta, rutas, null);
            return;
        }

        if (yearMeta.years.length === 1 && yearMeta.sinAnio > 0) {
            const ok = confirm(`${yearMeta.sinAnio} archivo(s) no tienen año de servicio. ¿Cargar solo los de ${yearMeta.years[0]}?`);
            if (!ok) return;
        }

        await loadFromServer(rutas, 'Carpeta del servidor', null, null);
    }

    function showJsonYearStep(yearMeta, rutas, carpetaDefault) {
        if (rutas) {
            pendingPackages = {
                rutas,
                carpetaDefault,
                label: 'Carpeta del servidor',
            };
        }
        if (els.jsonYearWarn) {
            els.jsonYearWarn.innerHTML = yearMeta.sinAnio
                ? `<p class="wizard-warn">${yearMeta.sinAnio} archivo(s) sin año de servicio serán excluidos al filtrar.</p>`
                : '';
        }
        if (els.jsonYearSelect) {
            els.jsonYearSelect.innerHTML = yearMeta.years.map(y => {
                const count = yearMeta.byYear.get(y)?.length || 0;
                return `<option value="${y}">${y} (${D.periodoServicioTexto(y)}) · ${count} archivo(s)</option>`;
            }).join('');
        }
        if (els.jsonYearPick) {
            els.jsonYearPick.innerHTML = yearMeta.years.map(y => {
                const items = (yearMeta.byYear.get(y) || []).map(s =>
                    `<li>${escapeHtml(s.titulo || s.nombre)}</li>`
                ).join('');
                return `<div class="wizard-year-block"><strong>${y}</strong><ul>${items}</ul></div>`;
            }).join('');
        }
        showStep('json-year');
    }

    async function confirmJsonYearLoad() {
        const year = Number(els.jsonYearSelect?.value);
        if (!year) {
            alert('Seleccione un año de servicio.');
            return;
        }

        if (pendingPackages?.packagesRaw) {
            const filtered = D.filterPackagesByYear(pendingPackages.packagesRaw, year);
            if (!filtered.length) {
                alert('Ningún archivo coincide con el año seleccionado.');
                return;
            }
            const folderLabel = pendingPackages.carpetaDefault
                ? pendingPackages.carpetaDefault.split(/[/\\]/).pop()
                : null;
            await finishJsonLoad(filtered, pendingPackages.label || 'Archivos locales', folderLabel, { valor: year });
        } else if (pendingPackages?.rutas) {
            await loadFromServer(pendingPackages.rutas, pendingPackages.label, pendingPackages.carpetaDefault, { valor: year }, year);
        }
    }

    async function loadFromServer(rutas, label, carpetaSalida, añoMeta, filterYear = null) {
        if (els.runStatus) els.runStatus.textContent = 'Cargando JSON...';
        showStep('run');
        els.runSpinner?.classList.remove('hidden');

        try {
            const response = await fetch('/api/dashboard/cargar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rutas, fuente: 'wizard' }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.error || 'Error al cargar.');

            let packages = data.paquetes.map(p => D.parseJsonPackage(p.contenido, p.fileName));
            const analysis = D.analyzePackageYears(packages);

            if (filterYear != null) {
                packages = D.filterPackagesByYear(packages, filterYear);
            } else if (analysis.years.length > 1) {
                showJsonYearStep(analysis.byYear.size ? {
                    years: analysis.years,
                    sinAnio: analysis.sinAnio,
                    byYear: new Map([...analysis.byYear.entries()].map(([y, pkgs]) => [y, pkgs.map(p => ({
                        titulo: p.titulo,
                        nombre: p.fileName,
                        ruta: p.fileName,
                    }))])),
                } : analysis, rutas, data.carpeta_default);
                pendingPackages = { rutas, carpetaDefault: data.carpeta_default, label, packagesRaw: packages };
                els.runSpinner?.classList.add('hidden');
                return;
            }

            if (!packages.length) throw new Error('No quedaron JSON válidos tras filtrar por año.');

            const folderLabel = carpetaSalida
                ? String(carpetaSalida).split(/[/\\]/).pop()
                : (data.carpeta_default ? data.carpeta_default.split(/[/\\]/).pop() : defaultOutputDir);

            await finishJsonLoad(packages, label, folderLabel, añoMeta || (analysis.years.length === 1 ? { valor: analysis.years[0] } : null));
        } catch (e) {
            if (els.runStatus) {
                els.runStatus.textContent = `Error: ${e.message}`;
                els.runStatus.classList.add('warn');
            }
            els.runSpinner?.classList.add('hidden');
            showStep(path === 'json' ? 'json-pick' : 'choose');
        }
    }

    async function finishJsonLoad(packages, label, folderLabel, añoMeta = null) {
        els.runSpinner?.classList.add('hidden');
        if (els.runStatus) {
            els.runStatus.textContent = '';
            els.runStatus.classList.remove('warn');
        }

        let statusText = `${packages.length} JSON · ${label}`;
        if (folderLabel) statusText += ` · ${folderLabel}`;
        if (añoMeta?.valor) statusText += ` · Año ${añoMeta.valor}`;
        if (añoMeta?.advertencia) statusText += ` · ${añoMeta.advertencia}`;

        callbacks.setLoadStatus?.(statusText, false);
        callbacks.onPackagesLoaded?.(packages, { label, folderLabel, añoMeta });
        showLoaded();
    }

    function escapeHtml(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    window.S21DashboardWizard = {
        init,
        showWizard,
        showLoaded,
        resetAll,
    };
})();
