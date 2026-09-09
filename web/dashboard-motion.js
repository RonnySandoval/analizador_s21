(function (global) {
    const MOTION_CHILDREN = '.motion-backdrop, .motion-sheet, .motion-card, .motion-view';
    const pending = new WeakMap();
    const generation = new WeakMap();

    function prefersReduced() {
        return Boolean(global.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
    }

    function scrollBehavior() {
        return prefersReduced() ? 'auto' : 'smooth';
    }

    function parseCssTime(value) {
        if (!value) return 0;
        return String(value).split(',').reduce((max, part) => {
            const p = part.trim();
            let ms = 0;
            if (p.endsWith('ms')) ms = parseFloat(p) || 0;
            else if (p.endsWith('s')) ms = (parseFloat(p) || 0) * 1000;
            return Math.max(max, ms);
        }, 0);
    }

    function nodeTransitionMs(node) {
        const cs = global.getComputedStyle(node);
        const duration = parseCssTime(cs.transitionDuration);
        if (duration < 8) return 0;
        return duration + parseCssTime(cs.transitionDelay);
    }

    function measureTransitionMs(el) {
        let max = nodeTransitionMs(el);
        el.querySelectorAll(MOTION_CHILDREN).forEach(node => {
            max = Math.max(max, nodeTransitionMs(node));
        });
        return max;
    }

    function nextToken(el) {
        const token = (generation.get(el) || 0) + 1;
        generation.set(el, token);
        return token;
    }

    function abortPending(el) {
        const state = pending.get(el);
        if (!state) return;
        state.cancelled = true;
        if (state.timeoutId) global.clearTimeout(state.timeoutId);
        el.removeEventListener('transitionend', state.onEnd, true);
        pending.delete(el);
        state.resolve();
    }

    function waitForTransition(el, durationMs) {
        return new Promise(resolve => {
            const state = { cancelled: false, done: false, timeoutId: 0, onEnd: null, resolve };
            const finish = () => {
                if (state.done || state.cancelled) return;
                state.done = true;
                el.removeEventListener('transitionend', state.onEnd, true);
                global.clearTimeout(state.timeoutId);
                pending.delete(el);
                resolve();
            };
            state.onEnd = event => {
                if (!el.contains(event.target)) return;
                finish();
            };
            pending.set(el, state);
            el.addEventListener('transitionend', state.onEnd, true);
            state.timeoutId = global.setTimeout(finish, durationMs + 50);
        });
    }

    function finishClosed(el) {
        el.classList.remove('is-open', 'is-closing');
        el.classList.add('hidden');
        el.hidden = true;
    }

    function isOpen(el) {
        return Boolean(el && el.classList.contains('is-open') && !el.classList.contains('is-closing') && !el.hidden);
    }

    /**
     * Show or hide an overlay/view with CSS transitions.
     * Requires opt-in classes: .motion-root plus .motion-backdrop / .motion-sheet /
     * .motion-card / .motion-view on the animated children.
     * @param {Element} el
     * @param {boolean} open
     * @param {{ from?: 'right'|'left'|'bottom'|'fade'|'scale', instant?: boolean }} [options]
     * @returns {Promise<void>}
     */
    function setOpen(el, open, options) {
        if (!el) return Promise.resolve();
        const opts = options || {};
        if (opts.from) el.dataset.motionFrom = opts.from;

        abortPending(el);
        const token = nextToken(el);
        const stillCurrent = () => generation.get(el) === token;

        const instant = prefersReduced() || opts.instant === true;

        if (open) {
            el.classList.remove('hidden', 'is-closing');
            el.hidden = false;
            if (instant || el.classList.contains('is-open')) {
                el.classList.add('is-open');
                return Promise.resolve();
            }
            void el.offsetWidth;
            el.classList.add('is-open');
            const ms = measureTransitionMs(el);
            if (ms < 8) return Promise.resolve();
            return waitForTransition(el, ms);
        }

        const alreadyClosed = (el.hidden || el.classList.contains('hidden'))
            && !el.classList.contains('is-closing');
        if (alreadyClosed) {
            finishClosed(el);
            return Promise.resolve();
        }
        if (instant || !el.classList.contains('is-open')) {
            finishClosed(el);
            return Promise.resolve();
        }

        el.classList.add('is-closing');
        el.classList.remove('is-open');
        const ms = measureTransitionMs(el);
        if (ms < 8) {
            finishClosed(el);
            return Promise.resolve();
        }
        return waitForTransition(el, ms).then(() => {
            if (!stillCurrent()) return;
            finishClosed(el);
        });
    }

    global.S21Motion = {
        prefersReduced,
        scrollBehavior,
        measureTransitionMs,
        isOpen,
        setOpen,
    };
})(window);
