/** Iconos SVG del dashboard: métricas y jerarquía de personas. */
(function (global) {
    const ROLE_LABELS = {
        misionero: 'Misionero',
        precursor_especial: 'Precursor especial',
        precursor_regular: 'Precursor regular',
        anciano: 'Anciano',
        siervo: 'Siervo ministerial',
        publicador: 'Publicador',
    };

    function escapeXml(s) {
        return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function isYes(val) {
        const s = String(val ?? '').trim().toLowerCase();
        return val === true || s === 'sí' || s === 'si' || s === 'yes' || s === 'true' || s === '1';
    }

    function isFemale(pub) {
        return String(pub?.sexo || '').trim().toLowerCase() === 'mujer';
    }

    function isMale(pub) {
        return String(pub?.sexo || '').trim().toLowerCase() === 'hombre';
    }

    function personShapeRole(pub) {
        if (isYes(pub?.misionero)) return 'misionero';
        if (isYes(pub?.precursor_especial)) return 'precursor_especial';
        if (isYes(pub?.precursor_regular)) return 'precursor_regular';
        if (isYes(pub?.anciano)) return 'anciano';
        if (isYes(pub?.siervo_ministerial)) return 'siervo';
        return 'publicador';
    }

    function personColorRole(pub) {
        if (isYes(pub?.anciano)) return 'anciano';
        if (isYes(pub?.siervo_ministerial)) return 'siervo';
        return 'publicador';
    }

    function personTitle(pub) {
        const parts = [];
        if (isFemale(pub)) parts.push('Mujer');
        else if (isMale(pub)) parts.push('Hombre');
        const shape = personShapeRole(pub);
        if (shape !== 'publicador') parts.push(ROLE_LABELS[shape]);
        if (isYes(pub?.anciano) && shape !== 'anciano') parts.push('Anciano');
        if (isYes(pub?.siervo_ministerial) && shape !== 'siervo') parts.push('Siervo ministerial');
        return parts.join(' · ') || ROLE_LABELS.publicador;
    }

    function svg(inner, className, title) {
        const label = title ? ` role="img" aria-label="${escapeXml(title)}"` : ' aria-hidden="true"';
        const titleEl = title ? `<title>${escapeXml(title)}</title>` : '';
        return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"${label}>${titleEl}${inner}</svg>`;
    }

    function personSvg(inner, className, title) {
        const label = title ? ` role="img" aria-label="${escapeXml(title)}"` : ' aria-hidden="true"';
        const titleEl = title ? `<title>${escapeXml(title)}</title>` : '';
        return `<svg class="${className}" viewBox="0 0 24 24"${label}>${titleEl}${inner}</svg>`;
    }

    const BUST_FEMALE = 'M12 3.1C10.15 3.1 8.55 3.55 7.65 4.55C6.8 5.5 6.5 6.85 6.45 8.5C6.4 10.55 6.55 12.35 6.95 13.55C6.55 14.15 6.05 14.75 5.85 15.45C5.7 15.9 6.05 16.15 6.5 16.05L8.95 15.35C8.55 15.9 8.25 16.55 8.2 17.25C5.95 17.9 4.8 19.25 4.5 20.85C4.35 21.5 4.9 22 5.65 22H18.35C19.1 22 19.65 21.5 19.5 20.85C19.2 19.25 18.05 17.9 15.8 17.25C15.75 16.55 15.45 15.9 15.05 15.35L17.5 16.05C17.95 16.15 18.3 15.9 18.15 15.45C17.95 14.75 17.45 14.15 17.05 13.55C17.45 12.35 17.6 10.55 17.55 8.5C17.5 6.85 17.2 5.5 16.35 4.55C15.45 3.55 13.85 3.1 12 3.1Z';

    function personBust(female) {
        if (female) {
            return `<path class="person-bust" fill="currentColor" stroke="none" d="${BUST_FEMALE}"/>`;
        }
        return [
            '<circle class="person-bust" cx="12" cy="8.15" r="3.7" fill="currentColor" stroke="none"/>',
            '<path class="person-bust" fill="currentColor" stroke="none" d="M5.15 21.85c.28-3.65 3.2-9.15 6.85-9.15s6.57 5.5 6.85 9.15z"/>',
        ].join('');
    }

    function shoulderMark(shape) {
        const letter = shape === 'precursor_regular' ? 'R'
            : shape === 'precursor_especial' ? 'E'
            : shape === 'misionero' ? 'M'
            : '';
        if (!letter) return '';
        return `<text class="person-mark" x="19.2" y="18.2" text-anchor="middle" fill="currentColor" stroke="none" font-size="7" font-weight="800" font-family="Outfit, system-ui, sans-serif">${letter}</text>`;
    }

    function personIconHtml(pub, options) {
        const shape = personShapeRole(pub);
        const color = personColorRole(pub);
        const inner = personBust(isFemale(pub)) + shoulderMark(shape);
        const title = options?.decorative ? '' : personTitle(pub);
        return personSvg(inner, `person-icon person-icon--${color}`, title);
    }

    function personNameInnerHtml(pub, escapedName) {
        return `${personIconHtml(pub, { decorative: true })}<span class="person-name-text">${escapedName}</span>`;
    }

    const METRIC_PATHS = {
        publicadores: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        horas: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.5l3.2 1.8"/>',
        cursos: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h8M8 11h5"/>',
        participacion: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/>',
        precursor_aux: '<circle cx="9" cy="7" r="3.2"/><path d="M3.5 20.5v-.8c0-3 2.5-5.1 5.5-5.1 1.1 0 2.1.3 3 .8"/><circle cx="17.5" cy="16.5" r="4"/><path d="M17.5 14.6v2.1l1.4.8"/>',
        con_cursos: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h8M8 11h5"/><path d="M16 16l2 2 4-4"/>',
        publicadores_con_cursos: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M16 5h6v8h-6z"/><path d="M16 9h6"/>',
        publicadores_sin_cursos: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M17 7h6M20 4v6"/>',
        precursor_auxiliar: '<circle cx="9" cy="7" r="3.2"/><path d="M3.5 20.5v-.8c0-3 2.5-5.1 5.5-5.1 1.1 0 2.1.3 3 .8"/><circle cx="17.5" cy="16.5" r="4"/><path d="M17.5 14.6v2.1l1.4.8"/>',
    };

    function metricIcon(id) {
        const key = id === 'precursor_auxiliar' ? 'precursor_aux' : id;
        const inner = METRIC_PATHS[key] || METRIC_PATHS.horas;
        return svg(inner, `metric-icon metric-icon--${key}`);
    }

    global.S21DashboardIcons = {
        isYes,
        isFemale,
        personShapeRole,
        personColorRole,
        personTitle,
        personIconHtml,
        personNameInnerHtml,
        metricIcon,
        ROLE_LABELS,
    };
})(window);
