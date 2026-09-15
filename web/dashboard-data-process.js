(function () {
    const IMPORT_STEPS = [
        { id: 'reading', label: 'Leyendo copia' },
        { id: 'validating', label: 'Validando integridad' },
        { id: 'restoring', label: 'Restaurando datos' },
        { id: 'done', label: 'Listo' },
    ];

    const EXPORT_STEPS = [
        { id: 'preparing', label: 'Preparando datos' },
        { id: 'compressing', label: 'Comprimiendo' },
        { id: 'done', label: 'Listo' },
    ];

    const GMAIL_UPLOAD_STEPS = [
        { id: 'preparing', label: 'Conectando' },
        { id: 'compressing', label: 'Comprimiendo' },
        { id: 'uploading', label: 'Subiendo a Gmail' },
        { id: 'done', label: 'Listo' },
    ];

    const GMAIL_RESTORE_STEPS = [
        { id: 'downloading', label: 'Descargando' },
        { id: 'validating', label: 'Validando' },
        { id: 'restoring', label: 'Restaurando' },
        { id: 'done', label: 'Listo' },
    ];

    let state = {
        open: false,
        title: '',
        steps: [],
        stepIndex: 0,
        progress: 0,
        phase: 'idle', // idle | running | completing | outcome
        outcomeOk: true,
        outcomeMessage: '',
        autoCloseTimer: null,
    };

    function $(id) {
        return document.getElementById(id);
    }

    function Motion() {
        return window.S21Motion;
    }

    function ensureOverlay() {
        let el = $('s21-data-process-overlay');
        if (el) return el;
        el = document.createElement('div');
        el.id = 's21-data-process-overlay';
        el.className = 'datos-modal motion-root s21-process-overlay hidden';
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-modal', 'true');
        el.hidden = true;
        el.innerHTML = `
            <div class="datos-modal-backdrop motion-backdrop s21-process-backdrop"></div>
            <div class="datos-modal-card motion-card s21-process-card">
                <h3 id="s21-process-title" class="datos-modal-title"></h3>
                <div id="s21-process-running" class="s21-process-running">
                    <div class="s21-process-bar-track"><div id="s21-process-bar" class="s21-process-bar"></div></div>
                    <ol id="s21-process-steps" class="s21-process-steps"></ol>
                </div>
                <div id="s21-process-outcome" class="s21-process-outcome hidden" hidden>
                    <div id="s21-process-outcome-icon" class="s21-process-outcome-icon" aria-hidden="true"></div>
                    <p id="s21-process-outcome-msg" class="s21-process-outcome-msg"></p>
                    <button type="button" id="s21-process-outcome-ok" class="btn-primary">Entendido</button>
                </div>
            </div>`;
        document.body.appendChild(el);
        $('s21-process-outcome-ok')?.addEventListener('click', () => close());
        return el;
    }

    function render() {
        const el = ensureOverlay();
        const title = $('s21-process-title');
        const running = $('s21-process-running');
        const outcome = $('s21-process-outcome');
        const bar = $('s21-process-bar');
        const stepsEl = $('s21-process-steps');
        const icon = $('s21-process-outcome-icon');
        const msg = $('s21-process-outcome-msg');

        if (title) title.textContent = state.title;
        const showOutcome = state.phase === 'outcome';
        if (running) {
            running.classList.toggle('hidden', showOutcome);
            running.hidden = showOutcome;
        }
        if (outcome) {
            outcome.classList.toggle('hidden', !showOutcome);
            outcome.hidden = !showOutcome;
        }
        if (bar) bar.style.width = `${Math.min(100, Math.max(0, state.progress))}%`;
        if (stepsEl) {
            stepsEl.innerHTML = state.steps.map((s, i) => {
                let cls = '';
                if (i < state.stepIndex) cls = 'is-done';
                else if (i === state.stepIndex) cls = 'is-active';
                return `<li class="${cls}">${escapeHtml(s.label)}</li>`;
            }).join('');
        }
        if (icon) icon.textContent = state.outcomeOk ? '✓' : '✕';
        if (icon) icon.classList.toggle('is-error', !state.outcomeOk);
        if (msg) msg.textContent = state.outcomeMessage || '';
        return el;
    }

    function escapeHtml(s) {
        return String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function openOverlay() {
        const el = render();
        const motion = Motion();
        if (motion?.setOpen) motion.setOpen(el, true, { from: 'scale' });
        else {
            el.classList.remove('hidden');
            el.hidden = false;
        }
        state.open = true;
    }

    function close() {
        if (state.autoCloseTimer) {
            clearTimeout(state.autoCloseTimer);
            state.autoCloseTimer = null;
        }
        const el = $('s21-data-process-overlay');
        if (!el) return;
        const motion = Motion();
        if (motion?.setOpen) motion.setOpen(el, false, { from: 'scale' });
        else {
            el.classList.add('hidden');
            el.hidden = true;
        }
        state.open = false;
        state.phase = 'idle';
    }

    function setStep(idOrIndex) {
        if (typeof idOrIndex === 'number') {
            state.stepIndex = idOrIndex;
        } else {
            const idx = state.steps.findIndex(s => s.id === idOrIndex);
            if (idx >= 0) state.stepIndex = idx;
        }
        const n = Math.max(1, state.steps.length);
        state.progress = Math.min(92, ((state.stepIndex + 0.35) / n) * 100);
        render();
    }

    function setProgress(pct) {
        state.progress = pct;
        render();
    }

    async function run({ title, steps, work, successMessage, autoCloseMs = 3400 }) {
        state.title = title || 'Procesando';
        state.steps = steps || [];
        state.stepIndex = 0;
        state.progress = 8;
        state.phase = 'running';
        state.outcomeOk = true;
        state.outcomeMessage = '';
        openOverlay();

        const api = {
            setStep,
            setProgress,
            steps: state.steps,
        };

        try {
            const result = await work(api);
            state.phase = 'completing';
            state.progress = 100;
            state.stepIndex = Math.max(0, state.steps.length - 1);
            render();
            await wait(280);
            state.phase = 'outcome';
            state.outcomeOk = true;
            state.outcomeMessage = successMessage || 'Completado';
            render();
            if (autoCloseMs > 0) {
                state.autoCloseTimer = setTimeout(() => close(), autoCloseMs);
            }
            return result;
        } catch (err) {
            state.phase = 'outcome';
            state.outcomeOk = false;
            state.outcomeMessage = err?.message || String(err) || 'Error';
            state.progress = 100;
            render();
            throw err;
        }
    }

    function wait(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    window.S21DataProcess = {
        run,
        close,
        setStep,
        IMPORT_STEPS,
        EXPORT_STEPS,
        GMAIL_UPLOAD_STEPS,
        GMAIL_RESTORE_STEPS,
    };
})();
