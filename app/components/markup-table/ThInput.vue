<template>
  <th class="col-editable resizable-th">
    <slot></slot>
    <span class="resize-handle"></span>
  </th>
</template>
<script setup lang="ts"></script>

<style lang="scss" scoped>
@import 'src/services/composables/resizableTh.scss';
</style>
