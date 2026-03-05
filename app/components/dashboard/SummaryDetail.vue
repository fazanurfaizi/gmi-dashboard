<template>
  <q-card flat class="full-width" style="min-width: 400px; max-width: 900px;">
    <q-card-section class="q-pa-none">
      <q-table :rows="enrichedData" :columns="columns" row-key="rowKey" flat bordered hide-pagination :pagination="{ rowsPerPage: 0 }">
        <template v-slot:header="props">
          <q-tr :props="props" class="bg-grey-2">
            <q-th auto-width /> <q-th v-for="col in props.cols" :key="col.name" :props="props" class="text-weight-bold">
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>

        <template v-slot:body="props">
          <q-tr :props="props" class="cursor-pointer hoverable-row" @click="toggleRow(props)">
            <q-td auto-width>
              <q-btn size="sm" color="primary" round dense flat @click.stop="toggleRow(props)" :icon="props.expand ? 'keyboard_arrow_up' : 'keyboard_arrow_down'" />
            </q-td>
            <q-td v-for="col in props.cols" :key="col.name" :props="props">
              {{ col.value }}
            </q-td>
          </q-tr>

          <q-tr v-show="props.expand" :props="props">
            <q-td colspan="100%" class="bg-grey-1 q-pa-md">

              <div v-if="loadingRows[props.row.rowKey]" class="flex flex-center q-pa-sm">
                <q-spinner-dots color="primary" size="2em" />
              </div>

              <div v-else-if="details[props.row.rowKey] && props.row.rowKey && details[props.row.rowKey].length">
                <div class="text-caption text-weight-bold text-grey-8 q-mb-xs text-uppercase">
                  Daftar Project
                </div>
                <q-list bordered separator dense class="bg-white rounded-borders shadow-1">
                  <q-item v-for="(item, index) in details[props.row.rowKey]" :key="index">
                    <q-item-section avatar>
                      <q-avatar color="primary" text-color="white" size="sm">
                        {{ index + 1 }}
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-weight-medium">{{ item.name || item.projectName || '-' }}</q-item-label>
                      <q-item-label caption>{{ item.code || item.projectCode || '-' }}</q-item-label>
                      <q-item-label v-if="project.type === 'installations'" caption>{{ item.capacity }} {{ item.unit }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>

              <div v-else class="text-center text-grey-6 q-pa-sm">
                Tidak ada data project yang ditemukan.
              </div>

            </q-td>
          </q-tr>
        </template>
      </q-table>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  project: {
    title: string;
    data: any[];
    status?: string; // e.g., 'On Going'
    type?: string;   // e.g., 'installations' or 'procurements'
    projectName?: string;
  }
}>()

const $api = useApi()

const columns = [
  { name: 'pic', label: 'PIC (PM)', field: 'pic', align: 'left' as const, sortable: true },
  { name: 'year', label: 'Tahun', field: 'year', align: 'center' as const, sortable: true },
  { name: 'count', label: 'Total Project', field: 'count', align: 'right' as const, sortable: true }
]


const enrichedData = computed(() => {
  return props.project.data.map(row => ({
    ...row,
    rowKey: `${row.pic}-${row.year}`
  }))
})

const loadingRows = ref<Record<string, boolean>>({})
const details = ref<Record<string, any[]>>({})

const toggleRow = async (rowProps: any) => {
  rowProps.expand = !rowProps.expand

  if (rowProps.expand) {
    const key = rowProps.row.rowKey

    if (!details.value[key]) {
      loadingRows.value[key] = true

      try {
        const endpointType = props.project.type === 'procurements' ? 'procurements' : 'installations'
        const status = props.project.status || props.project.title

        let url = `/${endpointType}?pm=${rowProps.row.pic}&year=${rowProps.row.year}&status=${status}`
        if (props.project.projectName && props.project.projectName.trim() !== '') {
          url += `&projectName=${encodeURIComponent(props.project.projectName.trim())}`
        }

        const response = await $api.get(url)

        details.value[key] = response.data?.data || response.data || response || []
      } catch (error) {
        console.error('Failed to fetch row details:', error)
        details.value[key] = []
      } finally {
        loadingRows.value[key] = false
      }
    }
  }
}
</script>

<style scoped>
.hoverable-row {
  transition: background-color 0.2s ease;
}

.hoverable-row:hover {
  background-color: #f5f5f5 !important;
}
</style>