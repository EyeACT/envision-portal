<script lang="ts" setup>
// Define props
const props = defineProps<{
  metadata: any;
}>();
</script>

<template>
  <div>metadata</div>

  <pre>{{ metadata }}</pre>
</template>
