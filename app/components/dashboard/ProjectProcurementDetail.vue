<template>
  <q-card flat class="full-width">
    <q-toolbar class="bg-primary text-white shadow-2">
      <q-toolbar-title>
        <div class="text-weight-bold">{{ project?.projectName }}</div>
        <div class="text-caption">Kode: {{ project?.projectCode }} | Lokasi: {{ project?.location }}</div>
      </q-toolbar-title>
    </q-toolbar>

    <div class="q-pa-sm">
      <div class="row q-col-gutter-sm">       
        <div class="col-12 col-md-4">
          <q-card flat bordered class="full-height">
            <q-card-section class="q-pa-sm">
              <div class="text-h6 q-mb-sm text-primary">Detail Pengadaan</div>
              
              <q-list separator dense class="q-px-none">
                <q-item 
                  v-for="(item, index) in dynamicDetails" 
                  :key="index" 
                  class="q-px-xs"
                >
                  <q-item-section>
                    <q-item-label caption>{{ item.label }}</q-item-label>
                    
                    <q-item-label v-if="item.isStatus">
                      <q-chip 
                        :color="getStatusColor(String(item.value))" 
                        text-color="white" 
                        size="sm" 
                        class="text-weight-bold q-ma-none"
                      >
                        {{ item.value }}
                      </q-chip>
                    </q-item-label>

                    <q-item-label 
                      v-else 
                      class="text-weight-bold text-dark"
                    >
                      {{ item.value }}
                    </q-item-label>
                    
                  </q-item-section>
                </q-item>
                <q-item>
                  <q-item-section>
                    <q-item-label caption>Pekerjaan</q-item-label>                   
                    <q-item-label class="text-weight-bold text-dark">
                      {{ detail?.financeData?.progress * 100 }}%
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <q-item>
                  <q-item-section>
                    <q-item-label caption>Pengeluaran</q-item-label>                   
                    <q-item-label class="text-weight-bold text-dark">
                      {{ detail?.financeData?.expense * 100 }}%
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-8">
          <q-card flat bordered class="full-height">
            <q-card-section class="q-pa-sm">
              <div class="text-h6 text-primary">Progress Pekerjaan</div>
            </q-card-section>
            <q-card-section class="q-pa-sm q-pt-none">
              <div ref="chartRef" style="width: 100%; height: 400px;"></div>
            </q-card-section>
          </q-card>
        </div>        
      </div>
    </div>
  </q-card>  
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick, onBeforeUnmount } from 'vue'

const props = defineProps<{ project: any }>()
const $api = useApi()

let resizeObserver: ResizeObserver | null = null
const chartRef = ref<HTMLElement | null>(null)
const detail = ref<any>(null)
const isLoadingDetail = ref(false)

const fetchDetail = async () => {
  if (!props.project?.projectCode) {
    detail.value = null
    return
  }

  isLoadingDetail.value = true
  try {
    const url = `/api/procurements/${props.project.projectCode}`
    detail.value = await $api.get(url)
    nextTick(() => renderChart())
  } catch (error) {
    console.error('Failed to fetch procurements:', error)
    detail.value = null
  } finally {
    isLoadingDetail.value = false
  }
}

const getStatusColor = (status: string) => {
  const s = (status || '').toLowerCase()
  if (s.includes('close')) return 'positive'
  if (s.includes('retensi')) return 'warning'
  return 'primary'
}

const renderChart = () => {
  if (!detail.value?.financeData || !chartRef.value) return

  let progress = parseFloat(detail.value.financeData.progress) || 0
  let expense = parseFloat(detail.value.financeData.expense) || 0

  // Format to percentages if needed
  progress = progress <= 1 && progress > 0 ? progress * 100 : progress
  expense = expense <= 1 && expense > 0 ? expense * 100 : expense

  const traceProject = {
    x: ['Status Saat Ini'],
    y: [progress],
    name: 'Progress',
    type: 'bar',
    marker: { color: '#21ba45' }
  }

  const traceFinance = {
    x: ['Status Saat Ini'],
    y: [expense],
    name: 'Pengeluaran',
    type: 'bar',
    marker: { color: '#31ccec' }
  }  

  const layout = {
    autosize: true,
    dragmode: false,
    barmode: 'group',
    bargap: 0.1,
    bargroupgap: 0.1,
    margin: { t: 20, r: 20, l: 40, b: 60 },
    xaxis: { type: 'category' },
    yaxis: { title: 'Persentase (%)', range: [0, Math.max(105, expense + 10)] },
    legend: { orientation: 'h', y: -0.2 }
  }

  const config = {
    responsive: true,
    displayModeBar: false,
    scrollZoom: false
  }

  if (typeof window !== 'undefined' && (window as any).Plotly) {
    ;(window as any).Plotly.newPlot(chartRef.value, [traceProject, traceFinance], layout, config)
    
    if (resizeObserver) resizeObserver.disconnect()
    
    resizeObserver = new ResizeObserver(() => {
      if (chartRef.value && (window as any).Plotly) {
        (window as any).Plotly.Plots.resize(chartRef.value)
      }
    })
    resizeObserver.observe(chartRef.value)
  }
}

const dynamicDetails = computed(() => {
  if (!detail.value) return []

  const details = []
  
  // Exclude keys that shouldn't render natively
  const excludeKeys = ['financeData', 'projectName', 'projectCode', 'location', 'id', 'year', 'syncedAt']
  
  for (const [key, val] of Object.entries(detail.value)) {
    if (!excludeKeys.includes(key) && val !== null && val !== '' && typeof val !== 'object') {    
      const formattedLabel = key
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim()

      const isStatus = key.toLowerCase() === 'status'
      
      details.push({ 
        label: formattedLabel, 
        value: val,
        isStatus: isStatus
      })
    }
  }

  return details
})

onMounted(() => fetchDetail())

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect()
})

watch(() => props.project, () => fetchDetail(), { deep: true })
watch(() => detail.value, () => nextTick(() => renderChart()), { deep: true })
</script>