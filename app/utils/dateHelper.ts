import { date } from 'quasar'

export const types = [
  { label: 'Today', value: 0 },
  { label: 'Last 7 Days', value: 7 },
  { label: 'Last 14 Days', value: 14 },
  { label: 'Last 30 Days', value: 30 },
  { label: 'Last 1 Month', value: 30 },
  { label: 'Last 2 Months', value: 60 },
  { label: 'Last 3 Months', value: 90 },
  { label: 'Last 1 Year', value: 365 },
  { label: 'Last 2 Years', value: 730 },
  { label: 'Last 3 Years', value: 1095 },
]

export const timeframeBased: any = {
  daily: [
    { label: '3M', value: 90 },
    { label: '2M', value: 60 },
    { label: '1M', value: 30 },
    { label: '3W', value: 21 },
    { label: '2W', value: 14 },
    { label: '1W', value: 7 },
  ],
  monthly: [
    { label: '3Y', value: 36 },
    { label: '2Y', value: 24 },
    { label: '1Y', value: 12 },
    { label: '6M', value: 6 },
    { label: 'YTD', value: null },
  ],
  yearly: [
    { label: '5Y', value: 5 },
    { label: '4Y', value: 4 },
    { label: '3Y', value: 3 },
    { label: '2Y', value: 2 },
    { label: '1Y', value: 1 },
  ],
}

export const formatDate = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const startOfWeek = (d: Date): Date => {
  const date = new Date(d)
  const day = date.getDay() || 7
  date.setDate(date.getDate() - day + 1)
  return date
}

export const endOfWeek = (d: Date): Date => {
  const date = startOfWeek(d)
  date.setDate(date.getDate() + 6)
  return date
}

export const startOfMonth = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), 1)
export const startOfQuarter = (d: Date): Date => new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1)
export const startOfYear = (d: Date): Date => new Date(d.getFullYear(), 0, 1)
export const startOfSpecificQuarter = (year: number, q: number): Date => new Date(year, (q - 1) * 3, 1)
export const endOfSpecificQuarter = (year: number, q: number): Date => new Date(year, q * 3, 0)

const subtractMonths = (d: Date, n: number): Date => {
  const date = new Date(d)
  date.setMonth(date.getMonth() - n)
  return date
}

const subtractYears = (d: Date, n: number): Date => {
  const date = new Date(d)
  date.setFullYear(date.getFullYear() - n)
  return date
}

export const today = (format = 'YYYY-MM-DD'): string => {
  return toDate(new Date(), format)
}

export const transformDate = (type: 'today' | 'thisWeek' | 'lastWeek' | 'MTD' | 'thisQuarter' | 'YTD' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'last1Month' | 'last2Month' | 'last3Month' | 'last1Year' | 'last2Year' | 'last3Year') => {
  const now = new Date()
  const year = now.getFullYear()

  let from: Date
  let to: Date = now

  switch (type) {
    case 'today': from = to = now; break
    case 'thisWeek': from = startOfWeek(now); to = endOfWeek(now); break
    case 'lastWeek': {
      const lw = new Date(now)
      lw.setDate(now.getDate() - 7)
      from = startOfWeek(lw)
      to = endOfWeek(lw)
      break
    }
    case 'MTD': from = startOfMonth(now); break
    case 'thisQuarter': from = startOfQuarter(now); break
    case 'YTD': from = startOfYear(now); break
    case 'Q1': from = startOfSpecificQuarter(year, 1); to = endOfSpecificQuarter(year, 1); break
    case 'Q2': from = startOfSpecificQuarter(year, 2); to = endOfSpecificQuarter(year, 2); break
    case 'Q3': from = startOfSpecificQuarter(year, 3); to = endOfSpecificQuarter(year, 3); break
    case 'Q4': from = startOfSpecificQuarter(year, 4); to = endOfSpecificQuarter(year, 4); break
    case 'last1Month': from = subtractMonths(now, 1); break
    case 'last2Month': from = subtractMonths(now, 2); break
    case 'last3Month': from = subtractMonths(now, 3); break
    case 'last1Year': from = subtractYears(now, 1); break
    case 'last2Year': from = subtractYears(now, 2); break
    case 'last3Year': from = subtractYears(now, 3); break
    default: return
  }

  return { from: formatDate(from), to: formatDate(to) }
}

export const readDate = (date: string | Date | number, includeTime = false): string => {
  return includeTime ? toDate(date, 'DD-MMM-YY HH:mm') : toDate(date, 'DD-MMM-YY')
}

export function toQuasarDate(d: any): Date {
  if (d instanceof Date) return d
  return new Date(d)
}

export function date2millis(dateTime: string, local = false): number {
  try {
    const time = new Date(dateTime).getTime()
    const tzOffset = local ? new Date().getTimezoneOffset() * 60000 : 0
    return time + tzOffset
  } catch (error) {
    console.error("Invalid date format for 'date2millis'", error)
    return 0
  }
}

export function toDate(dateInput: string | Date | number, format = 'YYYY-MM-DD'): string {
  try {
    return date.formatDate(dateInput, format)
  } catch (error) {
    console.error("Invalid date input for 'toDate'", error)
    return ''
  }
}

export function ym2date(yearMonth: string): string {
  try {
    const months = ['', 'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    const [monthStr, year] = yearMonth.split(' ')
    if (monthStr) {
      const monthIndex = months.indexOf(monthStr.toLowerCase())
      if (monthIndex <= 0 || !year) return ''
      const month = monthIndex < 10 ? `0${monthIndex}` : `${monthIndex}`
      return `${year}-${month}-01`
    }
    return ''
  } catch (error) {
    console.error("Invalid input for 'ym2date'", error)
    return ''
  }
}

export function addDays(d: Date, days: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + days)
  return r
}

export function addMonths(d: Date, months: number) {
  const r = new Date(d)
  r.setMonth(r.getMonth() + months)
  return r
}

export function addYears(d: Date, years: number) {
  const r = new Date(d)
  r.setFullYear(r.getFullYear() + years)
  return r
}

export function diffDates(fromInput: any, toInput: any) {
  const from = toQuasarDate(fromInput)
  const to = toQuasarDate(toInput)
  const ms = to.getTime() - from.getTime()
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  const months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
  const years = to.getFullYear() - from.getFullYear()
  return { days, months, years }
}

export function buildRange(endInput: any, timeframe: string, value: number | null) {
  const end = toQuasarDate(endInput)
  if (value === null) {
    if (timeframe === 'monthly') {
      return {
        from: toQuasarDate(new Date(end.getFullYear(), end.getMonth(), 1)),
        to: toQuasarDate(end),
      }
    }
  }

  let from = new Date(end)

  if (timeframe === 'daily') {
    from = addDays(end, -(value! - 1))
  } else if (timeframe === 'monthly') {
    from = addMonths(end, -value!)
    from.setDate(1)
  } else if (timeframe === 'yearly') {
    from = addYears(end, -value!)
    from = new Date(from.getFullYear(), 0, 1)
  }

  return {
    from: toDate(toQuasarDate(from), 'YYYY-MM-DD'),
    to: toDate(toQuasarDate(end), 'YYYY-MM-DD'),
  }
}