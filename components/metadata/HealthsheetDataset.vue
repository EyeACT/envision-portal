<script lang="ts" setup>
// Define props
const props = defineProps<{
  metadata: any;
}>();
</script>

<template>
  <div class="space-y-6">
    <CardCollapsibleContent title="General Information">
      <div>Testing content here</div>
    </CardCollapsibleContent>

    <CardCollapsibleContent title="Dataset Versioning">
      <div>Testing content here</div>
    </CardCollapsibleContent>

    <CardCollapsibleContent title="Motivation">
      <div>Testing content here</div>
    </CardCollapsibleContent>

    <CardCollapsibleContent title="Data Composition">
      <div>Testing content here</div>
    </CardCollapsibleContent>

    <CardCollapsibleContent
      title="Devices and Contextual Attributes in Data Collection"
    >
      <div>Testing content here</div>
    </CardCollapsibleContent>

    <CardCollapsibleContent title="Challenge in tests and confounding factors">
      <div>Testing content here</div>
    </CardCollapsibleContent>

    <CardCollapsibleContent
      title="Collection and use of demograpohic information"
    >
      <div>Testing content here</div>
    </CardCollapsibleContent>

    <CardCollapsibleContent title="Pre-processing / De-Identification">
      <div>Testing content here</div>
    </CardCollapsibleContent>

    <CardCollapsibleContent title="Labeling and subjectivity of labeling">
      <div>Testing content here</div>
    </CardCollapsibleContent>

    <CardCollapsibleContent title="Collection Process">
      <div>Testing content here</div>
    </CardCollapsibleContent>

    <CardCollapsibleContent
      title="Inclusion Criteria-Accessibility in Data Collection"
    >
      <div>Testing content here</div>
    </CardCollapsibleContent>

    <CardCollapsibleContent title="Uses">
      <div>Testing content here</div>
    </CardCollapsibleContent>

    <CardCollapsibleContent title="Dataset Distribution">
      <div>Testing content here</div>
    </CardCollapsibleContent>

    <CardCollapsibleContent title="Maintenance">
      <div>Testing content here</div>
    </CardCollapsibleContent>
  </div>
</template>
