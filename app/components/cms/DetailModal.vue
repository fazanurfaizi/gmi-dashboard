<!-- <template>
  <div>
    <h-detail v-else :meta="Meta" :modal="props.data" @back="back" :model="dataModel">
      <div class="row q-pa-sm">
        <f-card title="Detail" col="6">
          <s-list v-for="(value, index) in viewList" :key="index" :data="value" />
        </f-card>
        <f-card title="Log" col="6">
          <log-info :data="dataModel" />
        </f-card>
        <f-card title="templates" col="12">
          <div ref="gridContainer" class="grid-stack"></div>
        </f-card>
      </div>
    </h-detail>
  </div>
</template>

<script setup lang="ts">
import Api from '~/services/api'
import { Handler } from '~/services/handler'
import { Helper } from '~/services/helper'
import { Meta } from '~/utils/cms-dashboard/meta'
import { initGrid, addWidget, updateWidgetContent, removeAllWidget } from '~/utils/cms-dashboard/gridstack'

const props = defineProps<{ data?: { id?: string | number } }>()

const route = useRoute()
const router = useRouter()
const API = new Api()

const loading = ref(true)
const dataModel = ref(Meta.model)
const viewList = ref<{ label: string; value: any }[]>([])

const gridContainer = ref<HTMLElement | null>(null)
const widgets = ref<any[]>([])

const init = () => {
  dataModel.value = Helper.unreactive(Meta.model)
  onRefresh()
}

const onRefresh = () => {
  const routeId = Array.isArray(route.params?.id) ? route.params.id[0] : (route.params?.id ?? null)
  const id = props?.data?.id ?? routeId
  if (id) getData(id)
  else loading.value = false
}

const getData = (id: string | number) => {
  loading.value = true
  const endpoint = `${Meta.module}/${id}`
  void API.get(
    endpoint,
    (status: number, data: any) => {
      loading.value = false
      if (status === 200) {
        dataModel.value = data
        const config = { app: 'main', schema: 'cms', name: 'cmsDashboard', exclude: ['id', 'templates'], float: [], integer: [], date: [], datetime: [], constant: [], money: [], detail: [] }
        viewList.value = Handler.viewList(dataModel.value, config)
        void nextTick(() => {
          if (gridContainer.value) {
            initGrid(gridContainer.value, (widget: any) => void updateWidget(widget))
            if (data.templates && Array.isArray(data.templates) && data.templates.length > 0) {
              loadSavedWidgets(data.templates)
            }
          }
        })
      }
    },
    Meta.app
  )
}

const back = () => {
  if (!props.data) void router.back()
}

const loadSavedWidgets = (templates: any[]) => {
  removeAllWidget()
  templates.forEach((t) => {
    const w = addWidget(t)
    if (w) {
      const newWidget = { ...t, ...w, modules: [] }
      upsertWidget(newWidget)
      void updateWidget(newWidget)
    }
  })
}

function upsertWidget(data: any) {
  const index = widgets.value.findIndex((w) => w.id === data.id)
  if (index !== -1) widgets.value[index] = { ...widgets.value[index], ...data }
  else widgets.value.push(data)
}

const updateWidget = async (payload: any) => {
  const savedWidget = widgets.value.find((w) => w.id === payload.id)
  if (!savedWidget) return
  const mergedData = { ...savedWidget, ...payload }
  upsertWidget(mergedData)
  const endpoint = `dashboard/render?name=${payload.type}&is_dummy=true`
  let resHtml = ''
  await API.post(endpoint, { ...mergedData, config: mergedData.config }, (status: number, data: any) => {
    if (status === 200) resHtml = data
  }, 'main')
  updateWidgetContent(payload, resHtml)
}

onMounted(() => {
  init()
})
</script> -->

<template>
  <h1>DETAIL</h1>
</template>