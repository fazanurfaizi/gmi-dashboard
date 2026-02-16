<template>
  <div>
    <q-page padding>
      <div class="q-pa-md">
        <q-table
          flat
          bordered
          ref="tableRef"
          :title="Meta.title"
          :rows="rows"
          :columns="columns"
          v-model:pagination="pagination"
          :loading="loading"
          :filter="filter"
          @request="onRequest"
          row-key="id"
        >
          <!-- Top Toolbar: Search Only (No Add) -->
          <template v-slot:top-right>
            <q-input borderless dense debounce="300" v-model="filter" placeholder="Search">
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
            <q-btn flat round dense icon="refresh" class="q-ml-sm" @click="onRefresh">
              <q-tooltip>Refresh</q-tooltip>
            </q-btn>
          </template>

          <!-- Action Column (Edit Only) -->
          <template v-slot:body-cell-action="props">
            <q-td :props="props">
              <div class="row q-gutter-xs no-wrap items-center">
                <q-btn size="sm" flat round color="primary" icon="edit" @click="edit(props.row)">
                  <q-tooltip>Edit</q-tooltip>
                </q-btn>
                <q-btn size="sm" flat round color="info" icon="visibility" @click="detail(props.row)">
                  <q-tooltip>Detail</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </template>

          <!-- UpdatedAt / Log Column -->
          <template v-slot:body-cell-updatedAt="props">
            <q-td :props="props">
              <log-info :data="props.row" table />
            </q-td>
          </template>
        </q-table>
      </div>

      <q-dialog v-model="dialog.show" :maximized="dialog.maximize" :persistent="dialog.persistent">
        <q-card :style="dialog.maximize ? '' : 'min-width: 50vw'">
          <q-toolbar class="bg-primary text-white">
            <q-toolbar-title>{{ dialog.title }}</q-toolbar-title>
            <q-btn flat round dense icon="close" v-close-popup />
          </q-toolbar>

          <q-card-section class="q-pa-none">
            <CmsFormModal v-if="dialog.type == 'form'" :data="dialog.props" :meta="Meta" @refreshEvent="onRefresh" />
            <CmsDetailModal v-else :data="dialog.props" :meta="Meta" @refreshEvent="onRefresh" />
          </q-card-section>
        </q-card>
      </q-dialog>
    </q-page>
  </div>
</template>

<script setup lang="ts">
import { Meta } from './meta'
import { useQuasar } from 'quasar'

definePageMeta({
  layout: 'cms'
})

const $q = useQuasar()
const $api = useApi()
const $alert = useAlert()

const dialog = ref<any>({
  show: false,
  type: 'form',
  title: 'Form',
  props: null,
  maximize: true,
  persistent: true,
})

const loading = ref(false)
const rows = ref([])
const filter = ref('')
const pagination = ref({
  sortBy: 'updatedAt',
  descending: true,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 10
})

const columns = [
  { name: 'action', label: 'Action', field: 'id', align: 'left', style: 'width: 140px' },
  { name: 'code', label: 'Code', field: 'code', align: 'left', sortable: true },
  { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
  { name: 'updatedAt', label: 'Updated At', field: 'updatedAt', align: 'left', sortable: true },
] as any

const init = () => {
  loading.value = true
  onRequest({
    pagination: pagination.value,
    filter: undefined
  })
}

const onRequest = async (props: any) => {
  const { page, rowsPerPage, sortBy, descending } = props.pagination
  const filter = props.filter

  loading.value = true

  const limit = rowsPerPage === 0 ? 100000 : rowsPerPage
  const offset = (page - 1) * limit
  const sort = sortBy ? `${sortBy}:${descending ? 'DESC' : 'ASC'}` : 'updatedAt:DESC'
  
  let endpoint = `${Meta.module}?limit=${limit}&offset=${offset}&order=${sort}`
  if (filter) {
    endpoint += `&search=${encodeURIComponent(filter)}`
  }

  try {
    const res: any = await $api.get(endpoint)
    loading.value = false
    
    const data = res.data || res 

    if (Array.isArray(data)) {
      rows.value = data as any
      pagination.value.rowsNumber = data.length
    } else if (data && data.rows) {
      rows.value = data.rows
      pagination.value.rowsNumber = data.count || 0
    }

    pagination.value.page = page
    pagination.value.rowsPerPage = rowsPerPage
    pagination.value.sortBy = sortBy
    pagination.value.descending = descending

  } catch (error) {
    loading.value = false
    console.error('API Error:', error)
  }
}

const onRefresh = () => {
  onRequest({ pagination: pagination.value, filter: filter.value })
  dialog.value.show = false
  dialog.value.props = null
}

const showDialog = (type: string, title: string, data: any = null) => {
  dialog.value.type = type
  dialog.value.title = `${title} | ${Meta.title}`
  dialog.value.show = true
  dialog.value.props = data
}

const edit = (data: any) => showDialog('form', 'Edit', data)
const detail = (data: any) => showDialog('detail', 'Detail', data)

onMounted(() => {
  init()
})
</script>