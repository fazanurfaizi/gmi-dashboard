import { DataRow, WidgetData, WidgetRenderResult } from "~~/types/dashboard"

interface AggregatedProjectData {
    totalProjects: number
    procurementCount: number
    installationCount: number
    totalCapacity: number
    procurementStatusCounts: Record<string, number>
    installationStatusCounts: Record<string, number>
    encodeProcurementBreakdown: (statusKey: string) => string 
    encodeInstallationBreakdown: (statusKey: string) => string
}

export function renderProjectSummaryWidget(
    rows: DataRow[],
    config: WidgetData['config'],
    height?: number
): WidgetRenderResult {
    const templateType = config.summaryTemplate === 'monitoring' ? 'monitoring' : 'executive'

    let procurementCount = 0
    let installationCount = 0
    let totalCapacity = 0
    
    const procurementStatusCounts: Record<string, number> = {
        'On Progres': 0,
        'Close': 0,
        'Menunggu TTD BAST': 0,
        'Retensi': 0
    }

    const installationStatusCounts: Record<string, number> = {
        'On Going': 0,
        'Close': 0,
        'Menunggu TTD BAST': 0,
        'Retensi': 0
    }

    const procurementBreakdownAgg: Record<string, Record<string, Record<string, number>>> = {}
    const installationBreakdownAgg: Record<string, Record<string, Record<string, number>>> = {}

    rows.forEach(row => {
        if (row['procurements.id']) {
            procurementCount++

            const status = String(row['procurements.status'] || row['status']).trim()
            const pic = String(row['procurements.pm'] || '-').trim()
            const year = String(row['procurements.year'] || '-').trim()
            
            if (status) {
                const matchedKey = Object.keys(procurementStatusCounts).find((k) => k.toLowerCase() === status.toLowerCase())
                const finalStatusKey = matchedKey || status

                if (matchedKey && procurementStatusCounts[matchedKey] !== undefined) {
                    procurementStatusCounts[matchedKey]++
                } else if (status !== 'undefined' && status !== 'null') {
                    procurementStatusCounts[finalStatusKey] = (procurementStatusCounts[finalStatusKey] || 0) + 1
                }

                if (finalStatusKey !== 'undefined' && finalStatusKey !== 'null') {
                    if (!procurementBreakdownAgg[finalStatusKey]) procurementBreakdownAgg[finalStatusKey] = {}
                    if (!procurementBreakdownAgg[finalStatusKey][pic]) procurementBreakdownAgg[finalStatusKey][pic] = {}
                    procurementBreakdownAgg[finalStatusKey][pic][year] = (procurementBreakdownAgg[finalStatusKey][pic][year] || 0) + 1
                }
            }
        }

        if (row['installations.id']) {
            installationCount++

            const cap = Number(row['installations.capacity'])
            if (!isNaN(cap)) totalCapacity += cap

            const status = String(row['installations.status'] || '').trim()
            const pic = String(row['installations.pm'] || '-').trim()
            const year = String(row['installations.year'] || '-').trim()

            if (status) {
                const matchedKey = Object.keys(installationStatusCounts).find(k => k.toLowerCase() === status.toLowerCase())
                const finalStatusKey = matchedKey || status
                
                if (matchedKey && installationStatusCounts[matchedKey] !== undefined) { 
                    installationStatusCounts[matchedKey]++
                } else if (status !== 'undefined' && status !== 'null') {
                    installationStatusCounts[finalStatusKey] = (installationStatusCounts[finalStatusKey] || 0) + 1
                }

                if (finalStatusKey !== 'undefined' && finalStatusKey !== 'null') {
                    if (!installationBreakdownAgg[finalStatusKey]) installationBreakdownAgg[finalStatusKey] = {}
                    if (!installationBreakdownAgg[finalStatusKey][pic]) installationBreakdownAgg[finalStatusKey][pic] = {}
                    installationBreakdownAgg[finalStatusKey][pic][year] = (installationBreakdownAgg[finalStatusKey][pic][year] || 0) + 1
                }
            }
        }
    })

    const createEncodeFn = (agg: Record<string, Record<string, Record<string, number>>>) => (statusKey: string) => {
        const data = agg[statusKey] || {}
        const result: { pic: string, year: string, count: number }[] = []
        
        for (const pic of Object.keys(data)) {
            if (data[pic]) {
                for (const year of Object.keys(data[pic])) {
                    result.push({ pic, year, count: data[pic][year]! })
                }
            }
        }
        result.sort((a, b) => b.year.localeCompare(a.year) || b.count - a.count)
        return encodeURIComponent(JSON.stringify(result))
    }

    const aggregatedData: AggregatedProjectData = {
        totalProjects: procurementCount + installationCount,
        procurementCount,
        installationCount,
        totalCapacity,
        procurementStatusCounts,
        installationStatusCounts,
        encodeProcurementBreakdown: createEncodeFn(procurementBreakdownAgg),
        encodeInstallationBreakdown: createEncodeFn(installationBreakdownAgg)
    }

    let innerHtml = ''
    if (templateType === 'monitoring') {
        innerHtml = renderMonitoringTemplate(aggregatedData)
    } else {
        innerHtml = renderExecutiveTemplate(aggregatedData)
    }

    const html = `
        <div class="bg-grey-1 rounded-borders q-pa-md" style="font-family: sans-serif; overflow-y: auto; overflow-x: hidden; height: ${height}px !important; max-height: ${height}px !important;">
            ${innerHtml}
        </div>
    `

    return { html, charts: [] }
}

function renderStatusGrid(type: 'installations' | 'procurements', counts: Record<string, number>, encodeFn?: (statusKey: string) => string): string {
    const statuses = Object.keys(counts)
    
    return statuses.map(status => {
        const count = counts[status]

        const cardAttributes = encodeFn 
            ? `class="bg-grey-2 rounded-borders q-pa-sm full-height cursor-pointer hoverable-card" data-status-summary="${encodeFn(status)}" data-status-name="${status}" data-type="${type}"`
            : `class="bg-grey-2 rounded-borders q-pa-sm full-height"`

        return `
            <div class="col-6">
                <div ${cardAttributes}>
                    <div class="text-caption text-grey-8 q-mb-xs" style="line-height: 1.2; word-break: break-word">${status}</div>
                    <div class="text-h6 text-weight-bold text-secondary">${count}</div>
                </div>
            </div>
        `
    }).join('')
}

function renderMonitoringTemplate(data: AggregatedProjectData): string {
    const uid = Math.random().toString(36).substring(7)

    return `
        <div class="row justify-center q-mb-md">
            <div class="bg-white shadow-1 rounded-borders flex" style="overflow: hidden; border: 1px solid #e0e0e0;">
                <div data-tab-btn class="cursor-pointer q-px-md q-py-sm text-caption text-weight-bold bg-primary text-white text-uppercase"
                    data-tab-target="tab-inst-${uid}" 
                    data-tab-hide="tab-proc-${uid}"
                >
                    Pemasangan
                </div>
                <div data-tab-btn class="cursor-pointer q-px-md q-py-sm text-caption text-weight-bold bg-white text-grey-8 text-uppercase"
                    data-tab-target="tab-proc-${uid}" 
                    data-tab-hide="tab-inst-${uid}"
                >
                    Pengadaan
                </div>
            </div>
        </div>

        <div id="tab-inst-${uid}" style="display: block;">
            <div class="bg-white shadow-1 rounded-borders q-pa-lg q-mb-md text-center">
                <div class="text-subtitle1 text-grey-8 text-weight-medium q-mb-sm text-uppercase">Jumlah Pemasangan</div>
                <div class="text-weight-bolder text-primary" style="font-size: 4rem; line-height: 1;">${data.installationCount}</div>
            </div>
            
            <div class="bg-white shadow-1 rounded-borders q-pa-md">
                <div class="text-subtitle2 text-weight-bold text-grey-9 q-mb-md text-center text-uppercase">Status Pemasangan</div>
                <div class="row q-col-gutter-sm text-center">
                    ${renderStatusGrid('installations', data.installationStatusCounts, data.encodeInstallationBreakdown)}
                </div>
            </div>
        </div>

        <div id="tab-proc-${uid}" style="display: none;">
            <div class="bg-white shadow-1 rounded-borders q-pa-lg q-mb-md text-center">
                <div class="text-subtitle1 text-grey-8 text-weight-medium q-mb-sm text-uppercase">Jumlah Pengadaan</div>
                <div class="text-weight-bolder text-primary" style="font-size: 4rem; line-height: 1;">${data.procurementCount}</div>
            </div>
            
            <div class="bg-white shadow-1 rounded-borders q-pa-md">
                <div class="text-subtitle2 text-weight-bold text-grey-9 q-mb-md text-center text-uppercase">Status Pengadaan</div>
                <div class="row q-col-gutter-sm text-center">
                    ${renderStatusGrid('procurements', data.procurementStatusCounts, data.encodeProcurementBreakdown)}
                </div>
            </div>
        </div>
    `
}

function renderExecutiveTemplate(data: AggregatedProjectData): string {
    let html = `
        <div class="row q-col-gutter-md q-mb-md">    
            <div class="col-6">
                <div class="bg-white shadow-1 rounded-borders q-pa-sm text-center full-height flex flex-center column">
                    <div class="text-caption text-grey-8 text-weight-bold text-uppercase q-mb-xs">Project Pengadaan</div>
                    <div class="text-h5 text-weight-bolder text-secondary">${data.procurementCount}</div>
                </div>
            </div>

            <div class="col-6">
                <div class="bg-white shadow-1 rounded-borders q-pa-sm text-center full-height flex flex-center column">
                    <div class="text-caption text-grey-8 text-weight-bold text-uppercase q-mb-xs">Project Pemasangan</div>
                    <div class="text-h5 text-weight-bolder text-secondary">${data.installationCount}</div>
                </div>
            </div>
        </div>

        <div class="bg-primary text-white shadow-1 rounded-borders q-pa-md q-mb-md text-center">
            <div class="text-subtitle2 text-weight-medium text-uppercase q-mb-sm" style="opacity: 0.9">Kapasitas PLTS Terpasang</div>
            <div class="row justify-center items-baseline">
                <div class="text-h3 text-weight-bolder q-mr-sm">${data.totalCapacity.toLocaleString('en-US')}</div>
                <div class="text-subtitle1 text-weight-medium">KWP</div>
            </div>
        </div>
    `

    const statusCards: string[] = [];
    
    if (Object.keys(data.procurementStatusCounts).length > 0) {
        statusCards.push(`
            <div class="bg-white shadow-1 rounded-borders q-pa-md full-height">
                <div class="text-subtitle2 text-weight-bold text-grey-9 q-mb-md text-center text-uppercase">Status Pengadaan</div>
                <div class="row q-col-gutter-sm text-center">
                    ${renderStatusGrid('procurements', data.procurementStatusCounts, data.encodeProcurementBreakdown)}
                </div>
            </div>
        `)
    }

    if (Object.keys(data.installationStatusCounts).length > 0) {
        statusCards.push(`
            <div class="bg-white shadow-1 rounded-borders q-pa-md full-height">
                <div class="text-subtitle2 text-weight-bold text-grey-9 q-mb-md text-center text-uppercase">Status Pemasangan</div>
                <div class="row q-col-gutter-sm text-center">
                    ${renderStatusGrid('installations', data.installationStatusCounts, data.encodeInstallationBreakdown)}
                </div>
            </div>
        `)
    }

    if (statusCards.length > 0) {
        const totalCol = 12 / statusCards.length
        html += `
            <div class="row q-col-gutter-sm">
                ${statusCards.map(card => `
                    <div class="col-12 col-md-${totalCol}">
                        ${card}
                    </div>
                `).join('')}
            </div>
        `
    }

    return html
}