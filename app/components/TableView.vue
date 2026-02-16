<template>
    <div>
        <q-table
            v-if="tableRows.length"
            flat
            bordered
            :title="props.title"
            :rows="tableRows"
            :columns="tableColumns"
            :pagination="{ rowsPerPage: 10 }"
            separator="cell"
        />
        <div v-else class="text-grey-6 q-pa-sm">No table data to display.</div>
    </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
    data?: any[];
    title?: string;
}>()

const buildColumnsFromRows = (rows: any[]) => {
    if (!rows || !rows.length) return []
    const sample = rows[0]

    return Object.keys(sample).map((key) => ({
        name: key,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        field: key,
        align: typeof sample[key] === 'number' ? 'right' : 'left',
        sortable: true,
        format: (val: any) => {
            if (typeof val === 'number') {
                return val.toLocaleString(undefined, { maximumFractionDigits: 2 })
            }
            return val
        }
    })) as any[]
}

const tableRows = computed(() => props.data ?? [])
const tableColumns = computed(() => buildColumnsFromRows(tableRows.value))
</script>