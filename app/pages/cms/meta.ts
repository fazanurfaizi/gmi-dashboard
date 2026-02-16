import type { Dashboard } from '~~/types/dashboard'

export const Meta = {
  app: 'main',
  schema: 'cms',
  name: 'cmsDashboard',
  classname: 'CmsDashboard',
  title: 'CMS Dashboard',
  module: 'cms',
  routeUi: 'cms',
  permission: { browse: true, create: true, read: true, update: true, delete: true, restore: true },
  
  // Model Object
  model: <Dashboard>{
    id: null,
    code: null,
    companyCode: null,
    name: null,
    templates: [],
    config: { companyFilter: { show: false, codes: null } },
  },

  table: (H: any, C: any, L: any) => {
    const meta = { app: 'main', schema: 'cms', name: 'CmsDashboard' }
    return [
      { align: 'left', formatter: null, name: 'action', field: 'id', label: '#', style: 'width: 20px' },
      { align: 'left', formatter: null, name: 'code', field: 'code', label: L.module(meta, 'code') },
      { align: 'left', formatter: null, name: 'name', field: 'name', label: L.module(meta, 'name') },
      { align: 'left', formatter: 'datetime', name: 'updatedAt', label: L.module(meta, 'updatedAt'), field: 'updatedAt', isDate: true },
    ]
  },
}