export const COLORS = {
  RED: '#D32F2F',
  GREEN: '#388E3C',
  BLUE: '#1976D2',
  Rain: '#87c556',
  Plan: '#FC0000',
  Default: ['#0097A7', '#7B1FA2', '#C2185B']
};

export const WIDGET_OPTIONS = [
  { label: 'Add Chart', value: 'basic_chart' },
  { label: 'Add Waterfall', value: 'waterfall_chart' },
  { label: 'Add Area Chart', value: 'area_chart' },
  { label: 'Add Donut Chart', value: 'donut_chart' },
  { label: 'Add Sparkline Chart', value: 'sparkline_chart' },
  { label: 'Add Achievement Card', value: 'achievement_card' },
  { label: 'Add Table', value: 'table' }
];

export const TABLE_SCHEMAS: Record<string, { name: string, format: string }[]> = {
  procurements: [
    { name: 'id', format: 'number' },
    { name: 'year', format: 'number' },
    { name: 'status', format: 'text' },
    { name: 'no', format: 'number' },
    { name: 'projectCode', format: 'text' },
    { name: 'projectName', format: 'text' },
    { name: 'location', format: 'text' },
    { name: 'pm', format: 'text' },
    { name: 'admin', format: 'text' },
    { name: 'epc', format: 'text' },
    { name: 'notes', format: 'text' },
    { name: 'syncedAt', format: 'datetime' }
  ],
  installations: [
    { name: 'id', format: 'number' },
    { name: 'year', format: 'number' },
    { name: 'status', format: 'text' },
    { name: 'no', format: 'number' },
    { name: 'note', format: 'text' },
    { name: 'weeklyMeeting', format: 'text' },
    { name: 'projectCode', format: 'text' },
    { name: 'projectName', format: 'text' },
    { name: 'location', format: 'text' },
    { name: 'capacity', format: 'number' },
    { name: 'unit', format: 'text' },
    { name: 'pm', format: 'text' },
    { name: 'admin', format: 'text' },
    { name: 'sm', format: 'text' },
    { name: 'manpowerUpdate', format: 'text' },
    { name: 'epc', format: 'text' },
    { name: 'developer', format: 'text' },
    { name: 'roofType', format: 'text' },
    { name: 'progressData', format: 'text' }, // JSON
    { name: 'syncedAt', format: 'datetime' }
  ]
};