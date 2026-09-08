document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('analyzer-form');
    const folderList = document.getElementById('folder-list');
    const folderEmpty = document.getElementById('folder-empty');
    const btnAddFolder = document.getElementById('btn-add-folder');
    const btnRemoveFolder = document.getElementById('btn-remove-folder');
    const btnClearFolders = document.getElementById('btn-clear-folders');
    const fallbackInput = document.getElementById('fallback-folder-input');
    const inputNombreBase = document.getElementById('nombre_base');
    const inputAnioServicio = document.getElementById('anio_servicio');
    const inputCarpetaDestino = document.getElementById('carpeta_destino');
    const btnBrowseDest = document.getElementById('btn-browse-dest');
    const destLocalHint = document.getElementById('dest-local-hint');
    const chkEnCarpetaAparte = document.getElementById('en_carpeta_aparte');
    const btnEjecutar = document.getElementById('btn-ejecutar');

    const resultsSection = document.getElementById('results-section');
    const statusTitle = document.getElementById('status-title');
    const statusBox = document.getElementById('status-box');
    const spinner = document.getElementById('spinner');
    const statusMessage = document.getElementById('status-message');
    const outputDetails = document.getElementById('output-details');
    const totalCount = document.getElementById('total-count');
    const outputFolder = document.getElementById('output-folder');
    const filesList = document.getElementById('files-list');
    const resultsByFolder = document.getElementById('results-by-folder');
    const dashboardActionRow = document.getElementById('dashboard-action-row');

    const LAST_RUN_KEY = 's21_dashboard_last';

    function añoServicioActual(fecha = new Date()) {
        return fecha.getMonth() >= 8 ? fecha.getFullYear() + 1 : fecha.getFullYear();
    }

    if (inputAnioServicio && !inputAnioServicio.value) {
        inputAnioServicio.value = String(añoServicioActual());
    }

    /** @type {{ id: number, name: string, handle?: FileSystemDirectoryHandle, files?: File[] }[]} */
    let carpetas = [];
    /** @type {FileSystemDirectoryHandle | null} */
    let outputDirHandle = null;
    let nextId = 1;
    const soportaDirectoryPicker = typeof window.showDirectoryPicker === 'function';

    async function elegirCarpeta(preferWrite = false) {
        if (!soportaDirectoryPicker) {
            throw new Error('Su navegador no soporta el selector de carpetas. Use Chrome o Edge.');
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

    function getModoAgrupacion() {
        const el = document.querySelector('input[name="modo_agrupacion"]:checked');
        return el ? el.value : 'por_carpeta';
    }

    function getModoCsv() {
        const el = document.querySelector('input[name="modo_csv"]:checked');
        return el ? el.value : 'unificado';
    }

    function renderFolders() {
        folderList.innerHTML = '';
        if (carpetas.length === 0) {
            folderEmpty.classList.remove('hidden');
            return;
        }
        folderEmpty.classList.add('hidden');
        carpetas.forEach((c) => {
            const li = document.createElement('li');
            li.dataset.id = String(c.id);
            const count = c.pdfCount ?? (c.files ? c.files.length : '…');
            li.innerHTML = `<span class="folder-name">${c.name}</span><span class="folder-meta">${count} PDF(s)</span>`;
            li.addEventListener('click', () => {
                folderList.querySelectorAll('li').forEach(el => el.classList.remove('selected'));
                li.classList.add('selected');
            });
            folderList.appendChild(li);
        });
    }

    async function contarPdfs(carpeta) {
        if (carpeta.files) return carpeta.files.length;
        if (!carpeta.handle) return 0;
        const entries = await getPdfEntriesFromHandle(carpeta.handle);
        return entries.length;
    }

    async function getPdfEntriesFromHandle(dirHandle) {
        const entries = [];
        for await (const [name, entry] of dirHandle.entries()) {
            if (entry.kind === 'file' && name.toLowerCase().endsWith('.pdf')) {
                entries.push({ name, handle: entry });
            }
        }
        return entries;
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
        const entry = { id: nextId++, name: displayName, handle };
        carpetas.push(entry);
        renderFolders();
        if (pdfCount !== null) {
            entry.pdfCount = pdfCount;
        } else {
            entry.pdfCount = await contarPdfs(entry);
        }
        renderFolders();
        return true;
    }

    async function agregarCarpetaModerna() {
        const handle = await elegirCarpeta(false);
        const subdirs = await getSubdirsWithPdfs(handle);
        const directPdfs = await getPdfEntriesFromHandle(handle);

        let added = 0;

        if (subdirs.length > 0) {
            for (const sub of subdirs) {
                await pushCarpetaEntry(sub.handle, sub.name, sub.pdfCount);
                added += 1;
            }
            if (directPdfs.length > 0) {
                await pushCarpetaEntry(handle, handle.name, directPdfs.length);
                added += 1;
            }
        } else if (directPdfs.length > 0) {
            await pushCarpetaEntry(handle, handle.name, directPdfs.length);
            added += 1;
        } else {
            throw new Error('No se encontraron PDFs en la carpeta ni en sus subcarpetas.');
        }

        return added;
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

        if (porCarpeta.size === 0) {
            throw new Error('No se encontraron archivos PDF.');
        }

        let added = 0;
        for (const [name, pdfs] of porCarpeta) {
            const displayName = makeUniqueFolderName(name);
            carpetas.push({ id: nextId++, name: displayName, files: pdfs, pdfCount: pdfs.length });
            added += 1;
        }
        renderFolders();
        return added;
    }

    btnAddFolder.addEventListener('click', async () => {
        try {
            btnAddFolder.disabled = true;
            if (soportaDirectoryPicker) {
                await agregarCarpetaModerna();
            } else {
                fallbackInput.click();
            }
        } catch (e) {
            if (e.name !== 'AbortError') {
                console.error(e);
                alert(e.message || 'No se pudo abrir el selector de carpetas del navegador.');
            }
        } finally {
            btnAddFolder.disabled = false;
        }
    });

    fallbackInput.addEventListener('change', () => {
        try {
            if (fallbackInput.files?.length) {
                agregarCarpetaFallback(Array.from(fallbackInput.files));
            }
        } catch (e) {
            alert(e.message || 'No se pudieron cargar las carpetas.');
        }
        fallbackInput.value = '';
    });

    btnRemoveFolder.addEventListener('click', () => {
        const sel = folderList.querySelector('li.selected');
        if (!sel) return;
        const id = Number(sel.dataset.id);
        carpetas = carpetas.filter(c => c.id !== id);
        renderFolders();
    });

    btnClearFolders.addEventListener('click', () => {
        carpetas = [];
        renderFolders();
    });

    if (btnBrowseDest) {
        btnBrowseDest.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
                btnBrowseDest.disabled = true;
                outputDirHandle = await elegirCarpeta(true);
                if (destLocalHint) {
                    destLocalHint.textContent = `Guardar en: ${outputDirHandle.name}`;
                    destLocalHint.classList.remove('hidden');
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error(err);
                    alert(err.message || 'No se pudo abrir el selector de carpetas.');
                }
            } finally {
                btnBrowseDest.disabled = false;
            }
        });
    }

    function base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
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
                const buffer = await file.arrayBuffer();
                archivos.push({ nombre: file.name, datos: arrayBufferToBase64(buffer) });
            }
            return archivos;
        }
        if (carpeta.handle) {
            for await (const [name, handle] of carpeta.handle.entries()) {
                if (handle.kind === 'file' && name.toLowerCase().endsWith('.pdf')) {
                    const file = await handle.getFile();
                    const buffer = await file.arrayBuffer();
                    archivos.push({ nombre: name, datos: arrayBufferToBase64(buffer) });
                }
            }
        }
        return archivos;
    }

    function guardarUltimaEjecucionDashboard(res) {
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

    function mostrarResultados(res, carpetaLocal) {
        statusTitle.innerHTML = '<span class="status-indicator success"></span> ¡Proceso Completado!';
        spinner.classList.add('hidden');
        let msg = `Se procesaron ${res.total_procesados} registros de ${res.total_carpetas || 1} carpeta(s).`;
        if (res.año_servicio?.valor) {
            msg += ` Año de servicio ${res.año_servicio.valor} (${res.año_servicio.periodo_texto || 'sept–ago'}).`;
            if (res.año_servicio.advertencia) {
                msg += ` ${res.año_servicio.advertencia}`;
            }
        }
        if (carpetaLocal) {
            msg += ` Archivos guardados también en "${carpetaLocal}".`;
        }
        statusMessage.textContent = msg;
        statusBox.style.borderColor = 'var(--success)';
        totalCount.textContent = res.total_procesados;
        outputFolder.textContent = carpetaLocal
            ? `${res.carpeta_salida} · Local: ${carpetaLocal}`
            : res.carpeta_salida;
        filesList.innerHTML = '';
        (res.archivos_generados || []).forEach(filepath => {
            const li = document.createElement('li');
            li.textContent = filepath;
            filesList.appendChild(li);
        });
        if (resultsByFolder) {
            resultsByFolder.innerHTML = '';
            const detalles = res.resultados || [];
            if (detalles.length > 1 || (res.errores && res.errores.length > 0)) {
                resultsByFolder.classList.remove('hidden');
                detalles.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'folder-result-item';
                    const origen = item.carpeta_origen || item.nombre_base || 'Consolidado';
                    div.innerHTML = `<strong>${origen}</strong> · ${item.total_procesados} registros`;
                    resultsByFolder.appendChild(div);
                });
                (res.errores || []).forEach(err => {
                    const div = document.createElement('div');
                    div.className = 'folder-result-item error';
                    div.textContent = `Error en ${err.carpeta}: ${err.error}`;
                    resultsByFolder.appendChild(div);
                });
            } else {
                resultsByFolder.classList.add('hidden');
            }
        }
        outputDetails.classList.remove('hidden');

        const jsonRutas = res.json_dashboard || [];
        if (dashboardActionRow) {
            if (jsonRutas.length > 0) {
                dashboardActionRow.classList.remove('hidden');
                guardarUltimaEjecucionDashboard(res);
            } else {
                dashboardActionRow.classList.add('hidden');
            }
        } else if (jsonRutas.length > 0) {
            guardarUltimaEjecucionDashboard(res);
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (carpetas.length === 0) {
            alert('Agregue al menos una carpeta con PDFs S-21.');
            return;
        }

        const formatos = [];
        if (document.getElementById('fmt-json').checked) formatos.push('json');
        if (document.getElementById('fmt-csv').checked) formatos.push('csv');
        if (formatos.length === 0) {
            alert('Seleccione al menos un formato de salida.');
            return;
        }
        if (!formatos.includes('json')) {
            const ok = confirm('Sin formato JSON no podrá usar el dashboard Análisis de Servicio. ¿Desea continuar solo con CSV?');
            if (!ok) return;
        }

        resultsSection.classList.remove('hidden');
        outputDetails.classList.add('hidden');
        if (resultsByFolder) resultsByFolder.classList.add('hidden');
        statusTitle.innerHTML = '<span class="status-indicator processing"></span> Procesando tarjetas...';
        statusBox.style.borderColor = 'var(--card-border)';
        spinner.classList.remove('hidden');
        statusMessage.textContent = 'Leyendo PDFs y enviando al analizador...';
        btnEjecutar.disabled = true;

        try {
            const grupos = [];
            for (const carpeta of carpetas) {
                statusMessage.textContent = `Leyendo PDFs de "${carpeta.name}"...`;
                const archivos = await leerPdfsDeCarpeta(carpeta);
                if (archivos.length === 0) {
                    throw new Error(`La carpeta "${carpeta.name}" no contiene archivos PDF.`);
                }
                grupos.push({ nombre: carpeta.name, archivos });
            }

            const payload = {
                grupos,
                formatos,
                nombre_base: inputNombreBase.value.trim() || 'registros',
                año_servicio: Number(inputAnioServicio?.value) || añoServicioActual(),
                carpeta_destino: inputCarpetaDestino.value.trim(),
                en_carpeta_aparte: chkEnCarpetaAparte.checked,
                modo_agrupacion: getModoAgrupacion(),
                modo_csv: getModoCsv(),
            };

            statusMessage.textContent = 'Analizando tarjetas S-21 en el servidor...';
            const response = await fetch('/api/ejecutar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (response.ok && data.success) {
                const res = data.result;
                res.total_carpetas = res.total_carpetas || carpetas.length;

                let carpetaLocal = null;
                if (outputDirHandle && res.archivos_contenido?.length) {
                    statusMessage.textContent = `Guardando ${res.archivos_contenido.length} archivo(s) en carpeta local...`;
                    await guardarArchivosLocal(outputDirHandle, res.archivos_contenido);
                    carpetaLocal = outputDirHandle.name;
                }

                mostrarResultados(res, carpetaLocal);
            } else {
                throw new Error(data.error || 'Error al procesar los archivos.');
            }
        } catch (error) {
            statusTitle.innerHTML = '<span class="status-indicator error"></span> Error en la ejecución';
            spinner.classList.add('hidden');
            statusMessage.textContent = `Error: ${error.message}`;
            statusBox.style.borderColor = 'var(--error)';
        } finally {
            btnEjecutar.disabled = false;
        }
    });

    renderFolders();
});
