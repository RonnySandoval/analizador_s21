/**
 * Restaurar formularios S-21: limpia celdas del registro vía /api/restaurar.
 */
(function () {
    const GROUP_META = [
        { id: 'registro', label: 'Registro mensual', hint: 'Participación, cursos, horas, notas (meses)', defaultOn: true },
        { id: 'totales', label: 'Totales del registro', hint: 'Fila de totales (horas / notas)', defaultOn: true },
        { id: 'identidad', label: 'Identidad', hint: 'Nombre, nacimiento, bautismo', defaultOn: false },
        { id: 'sexo', label: 'Sexo', hint: 'Casillas hombre / mujer', defaultOn: false },
        { id: 'esperanza', label: 'Esperanza', hint: 'Otras ovejas / ungido', defaultOn: false },
        { id: 'privilegios', label: 'Privilegios', hint: 'Anciano, siervo, precursor, misionero', defaultOn: false },
        { id: 'año', label: 'Año de servicio (vaciar)', hint: 'Solo si no reemplaza el año abajo', defaultOn: false },
    ];

    const $ = (id) => document.getElementById(id);
    const soportaDirectoryPicker = typeof window.showDirectoryPicker === 'function';

    let carpetas = [];
    let nextFolderId = 1;
    let running = false;

    function escapeHtml(s) {
        return String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function setStatus(text, kind = '') {
        const el = $('restaurar-status');
        if (!el) return;
        el.textContent = text || '';
        el.classList.toggle('warn', kind === 'warn');
        el.classList.toggle('ok', kind === 'ok');
        el.classList.toggle('hidden', !text);
    }

    function openModal() {
        const modal = $('restaurar-modal');
        if (!modal) return;
        window.S21DashboardDatos?.closePanel?.();
        syncGroupDefaults();
        setStatus('');
        window.S21Motion?.setOpen(modal, true, { from: 'scale' });
    }

    function closeModal() {
        const modal = $('restaurar-modal');
        if (!modal) return;
        window.S21Motion?.setOpen(modal, false, { from: 'scale' });
    }

    function syncGroupDefaults() {
        GROUP_META.forEach(g => {
            const input = document.querySelector(`[data-restaurar-group="${g.id}"]`);
            if (input) input.checked = g.defaultOn;
        });
        const yearOn = $('restaurar-replace-year-on');
        const yearInput = $('restaurar-replace-year');
        if (yearOn) yearOn.checked = false;
        if (yearInput) {
            const now = new Date();
            yearInput.value = String(now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear());
            yearInput.disabled = true;
        }
        const dry = $('restaurar-dry-run');
        if (dry) dry.checked = true;
        const modeOut = document.querySelector('input[name="restaurar_mode"][value="out"]');
        if (modeOut) modeOut.checked = true;
    }

    function getClearGroups() {
        return GROUP_META
            .map(g => document.querySelector(`[data-restaurar-group="${g.id}"]`))
            .filter(el => el?.checked)
            .map(el => el.dataset.restaurarGroup);
    }

    function getReplaceYear() {
        if (!$('restaurar-replace-year-on')?.checked) return null;
        const n = Number($('restaurar-replace-year')?.value);
        return Number.isFinite(n) && n >= 2010 ? n : null;
    }

    function getMode() {
        return document.querySelector('input[name="restaurar_mode"]:checked')?.value || 'out';
    }

    function renderFolders() {
        const list = $('restaurar-folder-list');
        const empty = $('restaurar-folder-empty');
        if (!list) return;
        if (!carpetas.length) {
            list.innerHTML = '';
            empty?.classList.remove('hidden');
            return;
        }
        empty?.classList.add('hidden');
        list.innerHTML = carpetas.map(c =>
            `<li data-id="${c.id}"><strong>${escapeHtml(c.name)}</strong> · ${c.pdfCount ?? '…'} PDF</li>`
        ).join('');
        list.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', () => {
                list.querySelectorAll('li').forEach(x => x.classList.remove('selected'));
                li.classList.add('selected');
            });
        });
    }

    async function elegirCarpeta(escritura) {
        if (escritura) {
            try {
                return await window.showDirectoryPicker({ mode: 'readwrite' });
            } catch (e) {
                if (e.name === 'AbortError') throw e;
            }
        }
        return window.showDirectoryPicker({ mode: 'read' });
    }

    async function asegurarPermisoEscritura(dirHandle) {
        const opts = { mode: 'readwrite' };
        let permiso = await dirHandle.queryPermission(opts);
        if (permiso !== 'granted') permiso = await dirHandle.requestPermission(opts);
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
            if (pdfs.length > 0) subs.push({ name, handle: entry, pdfCount: pdfs.length });
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
        entry.pdfCount = pdfCount ?? (await getPdfEntriesFromHandle(handle)).length;
        renderFolders();
    }

    async function onAddFolder() {
        const btn = $('btn-restaurar-add-folder');
        try {
            if (btn) btn.disabled = true;
            if (!soportaDirectoryPicker) {
                $('restaurar-fallback-folder')?.click();
                return;
            }
            const handle = await elegirCarpeta(getMode() === 'inplace');
            const subdirs = await getSubdirsWithPdfs(handle);
            const directPdfs = await getPdfEntriesFromHandle(handle);
            if (subdirs.length > 0) {
                for (const sub of subdirs) await pushCarpetaEntry(sub.handle, sub.name, sub.pdfCount);
                if (directPdfs.length > 0) await pushCarpetaEntry(handle, handle.name, directPdfs.length);
            } else if (directPdfs.length > 0) {
                await pushCarpetaEntry(handle, handle.name, directPdfs.length);
            } else {
                throw new Error('No se encontraron PDFs en la carpeta ni en subcarpetas.');
            }
        } catch (e) {
            if (e.name !== 'AbortError') alert(e.message || 'No se pudo abrir el selector de carpetas.');
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    function onFallbackFolders() {
        const input = $('restaurar-fallback-folder');
        try {
            const files = Array.from(input?.files || []);
            const porCarpeta = new Map();
            for (const file of files) {
                if (!file.name.toLowerCase().endsWith('.pdf')) continue;
                const parts = (file.webkitRelativePath || file.name).split('/');
                const root = parts.length > 1 ? parts[0] : 'Carpeta';
                if (!porCarpeta.has(root)) porCarpeta.set(root, []);
                porCarpeta.get(root).push(file);
            }
            if (!porCarpeta.size) throw new Error('No se encontraron archivos PDF.');
            for (const [name, pdfs] of porCarpeta) {
                carpetas.push({
                    id: nextFolderId++,
                    name: makeUniqueFolderName(name),
                    files: pdfs,
                    pdfCount: pdfs.length,
                });
            }
            renderFolders();
        } catch (e) {
            alert(e.message || 'No se pudieron cargar las carpetas.');
        }
        if (input) input.value = '';
    }

    function onRemoveFolder() {
        const sel = $('restaurar-folder-list')?.querySelector('li.selected');
        if (!sel) return;
        const id = Number(sel.dataset.id);
        carpetas = carpetas.filter(c => c.id !== id);
        renderFolders();
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

    function base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
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

    async function escribirEnCarpeta(dirHandle, nombre, bytes, { backup }) {
        await asegurarPermisoEscritura(dirHandle);
        if (backup) {
            try {
                await dirHandle.getFileHandle(nombre);
                const bakName = `${nombre}.bak.pdf`;
                try {
                    await dirHandle.getFileHandle(bakName);
                } catch {
                    const original = await (await dirHandle.getFileHandle(nombre)).getFile();
                    const bakHandle = await dirHandle.getFileHandle(bakName, { create: true });
                    const w = await bakHandle.createWritable();
                    await w.write(await original.arrayBuffer());
                    await w.close();
                }
            } catch {
                /* archivo nuevo: sin backup */
            }
        }
        const fileHandle = await dirHandle.getFileHandle(nombre, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(bytes);
        await writable.close();
    }

    async function guardarResultados(res, { outHandle = null } = {}) {
        const archivos = res.archivos_contenido || [];
        if (!archivos.length) return { saved: 0, mode: 'none' };

        const mode = getMode();
        if (mode === 'inplace') {
            const byFolder = new Map(carpetas.filter(c => c.handle).map(c => [c.name, c]));
            let saved = 0;
            for (const archivo of archivos) {
                const carpeta = byFolder.get(archivo.subcarpeta);
                if (!carpeta?.handle) {
                    throw new Error(
                        `No se puede sobrescribir «${archivo.subcarpeta}»: use carpetas con permiso de escritura (Chrome/Edge).`
                    );
                }
                await escribirEnCarpeta(
                    carpeta.handle,
                    archivo.nombre,
                    base64ToArrayBuffer(archivo.datos),
                    { backup: true }
                );
                saved += 1;
            }
            return { saved, mode: 'inplace' };
        }

        if (!outHandle) {
            throw new Error('Falta la carpeta de salida. Vuelva a pulsar Ejecutar y elíjala al inicio.');
        }
        let saved = 0;
        for (const archivo of archivos) {
            let dir = outHandle;
            if (archivo.subcarpeta) {
                dir = await outHandle.getDirectoryHandle(archivo.subcarpeta, { create: true });
            }
            await escribirEnCarpeta(dir, archivo.nombre, base64ToArrayBuffer(archivo.datos), { backup: false });
            saved += 1;
        }
        return { saved, mode: 'out', folder: outHandle.name };
    }

    /**
     * Chrome exige gesto de usuario para showDirectoryPicker / requestPermission.
     * Hay que pedir carpetas/permisos ANTES de leer PDFs o llamar a la API.
     */
    async function prepareWriteTargets(mode) {
        if (mode === 'out') {
            if (!soportaDirectoryPicker) {
                throw new Error('Este navegador no permite elegir carpeta de salida. Use Chrome o Edge.');
            }
            setStatus('Elija la carpeta donde guardar los PDF limpios…');
            const outHandle = await elegirCarpeta(true);
            await asegurarPermisoEscritura(outHandle);
            return { outHandle };
        }

        const sinHandle = carpetas.filter(c => !c.handle);
        if (sinHandle.length) {
            throw new Error(
                'Para sobrescribir, agregue las carpetas con el selector moderno (Chrome/Edge), no con el fallback de archivos.'
            );
        }
        setStatus('Confirmando permiso de escritura en las carpetas…');
        for (const c of carpetas) {
            await asegurarPermisoEscritura(c.handle);
        }
        return { outHandle: null };
    }

    async function runRestore() {
        if (running) return;
        const clearGroups = getClearGroups();
        if (!clearGroups.length && getReplaceYear() == null) {
            setStatus('Marque al menos un grupo a borrar o active reemplazar año.', 'warn');
            return;
        }
        if (!carpetas.length) {
            setStatus('Agregue al menos una carpeta con PDF.', 'warn');
            return;
        }

        const dryRun = !!$('restaurar-dry-run')?.checked;
        const mode = getMode();
        const btn = $('btn-restaurar-run');
        running = true;
        if (btn) btn.disabled = true;
        $('restaurar-spinner')?.classList.remove('hidden');

        let outHandle = null;
        try {
            // Primero el picker/permisos (gesto de usuario), luego el trabajo largo.
            if (!dryRun) {
                const targets = await prepareWriteTargets(mode);
                outHandle = targets.outHandle;
            }

            setStatus('Leyendo PDFs…');
            const grupos = [];
            for (const carpeta of carpetas) {
                setStatus(`Leyendo «${carpeta.name}»…`);
                const archivos = await leerPdfsDeCarpeta(carpeta);
                if (!archivos.length) throw new Error(`«${carpeta.name}» no contiene PDFs.`);
                grupos.push({ nombre: carpeta.name, archivos });
            }

            setStatus(dryRun ? 'Simulando limpieza en el servidor…' : 'Limpiando formularios en el servidor…');
            const response = await fetch(window.s21Url('api/restaurar'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grupos,
                    clear_groups: clearGroups,
                    replace_year: getReplaceYear(),
                    dry_run: dryRun,
                }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Error al restaurar.');
            }
            const res = data.result;

            if (dryRun) {
                setStatus(
                    `Simulación: ${res.ok} PDF ok, ${res.failed} fallidos · borraría ${res.campos_borrados} campos` +
                    (res.campos_reemplazados ? `, reemplazaría ${res.campos_reemplazados}` : '') +
                    '. Desmarque «Solo simular» para escribir.',
                    res.failed ? 'warn' : 'ok'
                );
                return;
            }

            setStatus('Guardando PDF limpios…');
            const save = await guardarResultados(res, { outHandle });
            const where = save.mode === 'inplace'
                ? 'en las carpetas originales (con .bak.pdf si existían)'
                : `en «${save.folder || 'carpeta elegida'}»`;
            setStatus(
                `Listo: ${res.ok} PDF · ${save.saved} guardados ${where}` +
                (res.failed ? ` · ${res.failed} con error` : '') +
                (res.campos_solo_lectura ? ` · ${res.campos_solo_lectura} campos solo lectura` : ''),
                res.failed ? 'warn' : 'ok'
            );
        } catch (e) {
            if (e?.name === 'AbortError') {
                setStatus('Cancelado: no se eligió carpeta.', 'warn');
            } else {
                const msg = String(e?.message || e || 'Error al restaurar.');
                const hint = /failed to fetch|networkerror|load failed/i.test(msg)
                    ? ' Compruebe que el servidor Python esté en marcha (python server.py) y recargue con Ctrl+F5.'
                    : '';
                setStatus(msg + hint, 'warn');
            }
        } finally {
            running = false;
            if (btn) btn.disabled = false;
            $('restaurar-spinner')?.classList.add('hidden');
        }
    }

    function renderGroupList() {
        const host = $('restaurar-groups');
        if (!host) return;
        host.innerHTML = GROUP_META.map(g => `
            <label class="restaurar-group-row">
                <input type="checkbox" data-restaurar-group="${g.id}" ${g.defaultOn ? 'checked' : ''}>
                <span class="restaurar-group-text">
                    <strong>${escapeHtml(g.label)}</strong>
                    <span class="restaurar-group-hint">${escapeHtml(g.hint)}</span>
                </span>
            </label>
        `).join('');
    }

    function bind() {
        renderGroupList();
        renderFolders();

        $('btn-datos-restaurar')?.addEventListener('click', openModal);
        $('btn-wizard-restaurar')?.addEventListener('click', openModal);
        document.querySelectorAll('[data-restaurar-close]').forEach(el => {
            el.addEventListener('click', closeModal);
        });
        $('btn-restaurar-add-folder')?.addEventListener('click', onAddFolder);
        $('btn-restaurar-remove-folder')?.addEventListener('click', onRemoveFolder);
        $('btn-restaurar-clear-folders')?.addEventListener('click', () => {
            carpetas = [];
            renderFolders();
        });
        $('restaurar-fallback-folder')?.addEventListener('change', onFallbackFolders);
        $('restaurar-replace-year-on')?.addEventListener('change', e => {
            const input = $('restaurar-replace-year');
            if (input) input.disabled = !e.target.checked;
        });
        $('btn-restaurar-run')?.addEventListener('click', runRestore);
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && $('restaurar-modal')?.classList.contains('is-open')) {
                closeModal();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind);
    } else {
        bind();
    }

    window.S21DashboardRestaurar = { open: openModal, close: closeModal };
})();
