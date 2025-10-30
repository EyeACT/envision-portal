<script lang="ts" setup>
// Define props
const props = defineProps<{
  metadata: HealthsheetRecords;
}>();

const healthsheetData = [
  {
    title: "General Information",
    data: props.metadata.generalInformation,
  },
  {
    title: "Dataset versioning",
    data: props.metadata.versioning,
  },
  {
    title: "Motivation",
    data: props.metadata.motivation,
  },
  {
    title: "Data Composition",
    data: props.metadata.composition,
  },
  {
    title: "Devices and Contextual Attributes in Data Collection",
    data: props.metadata.devices,
  },
  {
    title: "Challenge in tests and confounding factors",
    data: props.metadata.demographicInformation,
  },
  {
    title: "Pre-processing / De-Identification",
    data: props.metadata.preprocessing,
  },
  {
    title: "Labeling and Subjectibity of Labeling",
    data: props.metadata.inclusion,
  },
  {
    title: "Collection Process",
    data: props.metadata.collection,
  },
  {
    title: "Inclusion Criteria-Accessibility in Data Collection",
    data: props.metadata.inclusion,
  },
  {
    title: "Uses",
    data: props.metadata.uses,
  },
  {
    title: "Dataset Distribution",
    data: props.metadata.distribution,
  },
  {
    title: "Maintenance",
    data: props.metadata.maintenance,
  },
];
</script>

<template>
  <div class="space-y-6">
    <CardCollapsibleContent
      v-for="(item, index) in healthsheetData"
      v-show="item.data.length > 0"
      :key="index"
      :title="item.title"
      :collapse="index > 0"
    >
      <div class="flex w-full flex-col space-y-7">
        <ul v-for="i in item.data" :key="i.id" class="list-none">
          <li class="w-full">
            <MarkdownRenderer
              :content="i.question"
              class="w-full border-b border-gray-200 text-base font-semibold"
            />

            <MarkdownRenderer
              v-if="i.response.trim()"
              :content="i.response"
              class="w-full text-base"
            />

            <p v-else class="pl-1 italic">N/A</p>
          </li>
        </ul>
      </div>
    </CardCollapsibleContent>

    <CardCollapsibleContent title="View the full Healthsheet file">
      <pre>{{ props.metadata }}</pre>
    </CardCollapsibleContent>
  </div>
</template>
