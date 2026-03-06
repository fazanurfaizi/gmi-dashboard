import { ColumnConfig, DataRow, DataValue, WidgetRenderResult } from "~~/types/dashboard"

function escapeHtml(unsafe: string): string {
  if (unsafe === null || unsafe === undefined) return ''
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function formatValue(col: ColumnConfig, val: DataValue): string {
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
      const d = new Date(val as string | number | Date)
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

export function renderTableWidget(
  rows: DataRow[],
  columns: ColumnConfig[] | undefined,
  dataSource: string[] | null | undefined,
  height?: number
): WidgetRenderResult {  
  if (!columns || columns.length === 0) {
    return { html: "<div class='text-grey q-pa-md'>Column is not configured</div>", charts: [] }
  }
  if (!rows || rows.length === 0) {
    return { html: "<div class='text-grey q-pa-md'>No data</div>", charts: [] }
  }

  const cleanRows = rows.filter(row => {
    return columns.every(col => {
      const val = row[col.id || col.name];
      console.log(val)

      if (val === undefined || val === 'undefined' || val === null || val === '') return false;
      // if (typeof val === 'object' && Object.keys(val).length === 0) return false;
      
      return true;
    });
  });

  if (cleanRows.length === 0) {
    return { html: "<div class='text-grey q-pa-md'>No data</div>", charts: [] }
  }

  const cols = columns
  const thead = cols.map((col) => {
    if (!col.hideColumn) return `<th class="text-center">${escapeHtml(col.label || col.id || col.name || '')}</th>`
  }).join('')

  let tbody = ''
  const isInstallations = dataSource && dataSource.includes('installations')
  
  for (const row of cleanRows) {
    const tds = cols.map((col) => {
      if (!col.hideColumn) {
        const cls = col.format === 'number' ? 'class="text-right"' : ''
        return `<td ${cls}>${formatValue(col, row[col.id || col.name])}</td>`
      }
    }).join('')

    const normalizedRow: Record<string, any> = {}
    for (const [key, value] of Object.entries(row)) {
      const cleanKey = key.includes('.') ? key.split('.').pop() as string : key
      normalizedRow[cleanKey] = value
    }

    if (isInstallations) {
      const rowJson = encodeURIComponent(JSON.stringify(normalizedRow))
      tbody += `<tr class="cursor-pointer hoverable-row" data-row="${rowJson}">${tds}</tr>`
    } else {
      tbody += `<tr>${tds}</tr>`
    }
  }

  const html = `
    <div
      class="q-mt-sm q-markup-table q-table__container q-table__card q-table--flat q-table--dense q-table--no-wrap table-wrapper"
      style="min-height: ${height}px !important; max-height: ${height}px !important;"
    >
      <table class="q-table">
        <thead><tr>${thead}</tr></thead>
        <tbody>${tbody}</tbody>
      </table>
    </div>
  `;

  return { html, charts: [] };
}