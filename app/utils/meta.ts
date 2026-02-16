export const Meta = {
    page: {
        index: 'IndexDashboard',
    },
    name: 'Dashboard',
    title: 'Dashboard',
    icon: 'stop_circle',
    module: 'dashboard',
    permission: {
        browse: true,
        read: true,
        create: true,
        update: true,
        delete: true,
        restore: true,
    },
}

export const chartDateIncludes: any = [
    'coal_getting_chart',
    'coal_getting_group_company',
    'coal_exposed_chart',
    'coal_exposed_group_company',
    'coal_hauling_chart_stacked',
    'coal_hauling_chart_grouped',
    'waterfall_ob',
]

export const tableIncludes: any = [
    'combine_chart',
    'table',
    'coal_getting_group_company',
    'coal_exposed_chart',
    'coal_exposed_group_company',
    'coal_hauling_chart_stacked',
    'coal_hauling_chart_grouped',
    'waterfall_ob',
]

export const chartLineIncludes: any = [
    'combine_chart',
    'coal_getting_chart',
    'coal_getting_group_company',
    'coal_exposed_chart',
    'coal_exposed_group_company',
    'coal_hauling_chart_stacked',
    'coal_hauling_chart_grouped',
]

export const unreactive = <T>(arr: T): T => {
    try {
      return JSON.parse(JSON.stringify(arr))
    } catch {
      console.warn('Helper unreactive parsing error')
      return arr
    }
  }