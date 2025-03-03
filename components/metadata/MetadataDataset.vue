<script lang="ts" setup>
// Define props
const props = defineProps<{
  metadata: any;
}>();
</script>

<template>
  <div class="h-auto space-y-6">
    <CardCollapsibleContent title="Creators">
      <div>testing content here</div>
    </CardCollapsibleContent>

    <CardCollapsibleContent title="Contributors">
      <div>testing content here</div>
    </CardCollapsibleContent>

    <CardCollapsibleContent title="Funders">
      <div>testing content here</div>
    </CardCollapsibleContent>

    <CardCollapsibleContent title="De-Identification Levels">
      <div>testing content here</div>
    </CardCollapsibleContent>

    <CardCollapsibleContent title="Consent">
      <div>testing content here</div>
    </CardCollapsibleContent>

    <CardCollapsibleContent
      title="View the full dataset_dsecription.json file"
      :collapse="true"
    >
      <pre>{{ props.metadata }}</pre>
    </CardCollapsibleContent>
  </div>
</template>
