(function () {
    const MAX_IMAGE_ROWS = 150;
    let renderHost = null;

    function escapeHtml(s) {
        return String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function todayStamp() {
        return new Date().toISOString().slice(0, 10);
    }

    function ensureRenderHost() {
        if (renderHost) return renderHost;
        renderHost = document.createElement('div');
        renderHost.id = 'export-render-host';
        renderHost.setAttribute('aria-hidden', 'true');
        document.body.appendChild(renderHost);
        return renderHost;
    }

    function buildTableHtml(spec) {
        const { title, subtitle, headers, rows, footerRow } = spec;
        const head = headers.map(h => `<th scope="col">${escapeHtml(h)}</th>`).join('');
        const body = rows.map(row =>
            `<tr>${row.map((cell, i) => {
                const align = spec.numericColumns?.has(i) ? ' class="num"' : '';
                return `<td${align}>${escapeHtml(cell)}</td>`;
            }).join('')}</tr>`
        ).join('');
        const foot = footerRow?.length
            ? `<tfoot><tr>${footerRow.map((cell, i) => {
                const align = spec.numericColumns?.has(i) ? ' class="num"' : '';
                return `<td${align}>${escapeHtml(cell)}</td>`;
            }).join('')}</tr></tfoot>`
            : '';
        const generated = new Date().toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
        return `
            <div class="export-sheet">
                <header class="export-sheet-head">
                    <h1 class="export-sheet-title">${escapeHtml(title)}</h1>
                    ${subtitle ? `<p class="export-sheet-sub">${escapeHtml(subtitle)}</p>` : ''}
                </header>
                <div class="export-sheet-table-wrap">
                    <table class="export-sheet-table">
                        <thead><tr>${head}</tr></thead>
                        <tbody>${body}</tbody>
                        ${foot}
                    </table>
                </div>
                <p class="export-sheet-meta">Generado ${escapeHtml(generated)}</p>
            </div>`;
    }

    function renderSheet(spec) {
        const host = ensureRenderHost();
        host.innerHTML = buildTableHtml(spec);
        return host.querySelector('.export-sheet');
    }

    function downloadBlob(blob, filename) {
        const a = document.createElement('a');
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    async function shareOrDownload(blob, filename, title) {
        const file = new File([blob], filename, { type: blob.type });
        if (navigator.canShare?.({ files: [file] })) {
            try {
                await navigator.share({ title: title || filename, files: [file] });
                return 'shared';
            } catch (err) {
                if (err?.name === 'AbortError') return 'cancelled';
            }
        }
        downloadBlob(blob, filename);
        return 'downloaded';
    }

    async function exportTableImage(spec) {
        if (!window.html2canvas) throw new Error('html2canvas no está disponible');
        if ((spec.rows?.length || 0) > MAX_IMAGE_ROWS) {
            throw new Error(`Demasiadas filas para imagen (máx. ${MAX_IMAGE_ROWS}). Use PDF.`);
        }
        const sheet = renderSheet(spec);
        const canvas = await html2canvas(sheet, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true,
            logging: false,
            windowWidth: sheet.scrollWidth + 48,
            windowHeight: sheet.scrollHeight + 48,
        });
        const blob = await new Promise((resolve, reject) => {
            canvas.toBlob(b => (b ? resolve(b) : reject(new Error('No se pudo crear la imagen'))), 'image/png', 0.92);
        });
        const filename = `${spec.filenameBase || 'reporte'}_${todayStamp()}.png`;
        return shareOrDownload(blob, filename, spec.title);
    }

    async function exportTablePdf(spec) {
        const jsPDF = window.jspdf?.jsPDF;
        if (!jsPDF || typeof jsPDF.prototype.autoTable !== 'function') {
            throw new Error('jsPDF / autoTable no está disponible');
        }
        const landscape = (spec.headers?.length || 0) > 6;
        const doc = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
        const margin = 12;
        let y = margin;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(spec.title || 'Reporte', margin, y);
        y += 7;

        if (spec.subtitle) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            const subLines = doc.splitTextToSize(spec.subtitle, landscape ? 270 : 185);
            doc.text(subLines, margin, y);
            y += subLines.length * 4 + 2;
        }

        doc.autoTable({
            head: [spec.headers],
            body: spec.rows,
            foot: spec.footerRow?.length ? [spec.footerRow] : undefined,
            startY: y,
            margin: { left: margin, right: margin },
            styles: {
                fontSize: landscape ? 7 : 8,
                cellPadding: 1.8,
                overflow: 'linebreak',
                textColor: [30, 41, 59],
            },
            headStyles: {
                fillColor: [14, 116, 144],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
            },
            footStyles: {
                fillColor: [241, 245, 249],
                textColor: [30, 41, 59],
                fontStyle: 'bold',
            },
            alternateRowStyles: { fillColor: [248, 250, 252] },
        });

        const filename = `${spec.filenameBase || 'reporte'}_${todayStamp()}.pdf`;
        const blob = doc.output('blob');
        return shareOrDownload(blob, filename, spec.title);
    }

    window.S21DashboardExport = {
        exportTableImage,
        exportTablePdf,
        shareOrDownload,
        downloadBlob,
        MAX_IMAGE_ROWS,
    };
})();
