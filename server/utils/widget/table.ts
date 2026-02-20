function escapeHtml(unsafe: string): string {
    if (unsafe === null || unsafe === undefined) return ''
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}

function formatValue(col: any, val: any): string {
    if (val === null || val === undefined) return '-'

    if (col.format === 'number') {
        const precision = col.precision || 0
        const num = Number(val)
        if (isNaN(num)) 
            return escapeHtml(String(val))
        return num.toLocaleString('en-US', {
            minimumFractionDigits: precision,
            maximumFractionDigits: precision
        })
    }

    if (col.format === 'date' || col.format === 'datetime') {
        try {
            const d = new Date(val)
            const datePart = d.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: '2-digit'
            }).replace(/ /g, '-')
            if (col.format === 'datetime') {
                const timePart = d.toLocaleDateString('en-GB', {
                    hour12: false
                })
                return `${datePart} ${timePart}`
            }
            return datePart
        } catch (error) {
            return escapeHtml(String(val))
        }
    }

    return escapeHtml(String(val))
}

export function renderTableWidget(rows: any[], columns: any[] | undefined): { html: string, charts: any[] } {
    if (!columns || columns.length === 0) {
        return { html: "<div class='text-grey q-pa-md'>Column is not configured</div>", charts: [] }
    }
    if (!rows || rows.length === 0) {
        return { html: "<div class='text-grey q-pa-md'>No data</div>", charts: [] }
    }

    const cols = columns
    const thead = cols.map((col) => {
        return `<th class="text-center">${escapeHtml(col.label || col.id || col.name || '')}</th>`
    }).join('')

    let tbody = ''
    for (const row of rows) {
        const tds = cols.map((col) => {
            const cls = col.format === 'number' ? 'class="text-right"' : ''
            return `<td ${cls}>${formatValue(col, row[col.id || col.name])}</td>`
        }).join('')
        tbody += `<tr>${tds}</tr>`
    }

    let tfoot = ""
    const hasAgg = cols.some(c => c.aggregation)
    if (hasAgg) {
        const fds = cols.map(c => {
            if (c.format === "number") {
                const values = rows.map(r => Number(r[c.id || c.name])).filter(v => !isNaN(v))
                if (values.length > 0) {
                    const sum = values.reduce((a, b) => a + b, 0)
                    const mean = sum / values.length
                    const min = Math.min(...values)
                    const max = Math.max(...values)
                    
                    return `
                        <td class="text-right">
                            <div class="row justify-between"><div>Σ</div><div>${formatValue(c, sum)}</div></div>
                            <div class="row justify-between"><div>μ</div><div>${formatValue(c, mean)}</div></div>
                            <div class="row justify-between"><div>↓</div><div>${formatValue(c, min)}</div></div>
                            <div class="row justify-between"><div>↑</div><div>${formatValue(c, max)}</div></div>
                        </td>
                    `
                }
                return `<td class="text-right">-</td>`
            }
            return `<td></td>`
        }).join('')
        tfoot = `<tfoot><tr class="bg-grey-2">${fds}</tr></tfoot>`
    }

    const html = `
        <div class="q-mt-sm q-markup-table q-table__container q-table__card q-table--flat q-table--dense q-table--no-wrap table-wrapper">
        <table class="q-table">
            <thead><tr>${thead}</tr></thead>
            <tbody>${tbody}</tbody>
            ${tfoot}
        </table>
        </div>
    `;

    return { html, charts: [] };
}