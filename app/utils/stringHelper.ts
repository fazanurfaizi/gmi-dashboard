export function formatNumber(value: any, precision: number | null = null) {
    if (value === null || value === undefined || isNaN(Number(value))) {
        return null
    }
    if (precision == null) precision = 2
    const formatted = parseFloat(value)
        .toFixed(precision)
        // .replace('.', ',') // Use comma for decimals
        .replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',') // Thousand separator
    return formatted
}

export function formatMoney(value: any) {
    if (value === null || value === undefined || isNaN(Number(value))) {
        return null
    }
    const precision = 2
    const formatted = parseFloat(value)
        .toFixed(precision)
        // .replace('.', ',') // Use comma for decimals
        .replace(/\B(?=(\d{3})+(?!\d))/g, ',') // Thousand separator
    return formatted
}

export function strReplace(target: string, replace: string, str: string) {
    const string = '' + str
    const regex = new RegExp(target, 'g')
    return string.replace(regex, replace)
}