<script setup lang="ts">
import datasetMetadata from "@/assets/data/dataset-metadata.json";
const _props = defineProps<{
  metadata: DatasetDescription["datasetDeIdentLevel"];
}>();

const sectionTitleClass = "mb-2 w-full border-b border-gray-200 font-semibold";

const getDeIdentType = (deIdentType: string) => {
  const deIdentTypeOptions = datasetMetadata.datasetDeIdentTypeOptions;

  for (const [_key, object] of Object.entries(deIdentTypeOptions)) {
    if (object.value === deIdentType) {
      return object.description;
    }
  }
};

const formattedDeIdentType = getDeIdentType(_props.metadata.deIdentType);
</script>

<template>
  <CardCollapsibleContent title="De-Identification Levels">
    <div class="space-y-6">
      <!-- Level of De-Identification -->
      <div>
        <p :class="sectionTitleClass">
          Level of de-identification from this dataset
        </p>

        <p>{{ formattedDeIdentType }}</p>
      </div>

      <!-- Removes Direct Identifiers -->
      <div>
        <p :class="sectionTitleClass">
          Does this dataset remove direct identifiers?
        </p>

        <USwitch
          class="cursor-default"
          disabled
          :default-value="metadata.deIdentDirect"
          unchecked-icon="i-lucide-x"
          checked-icon="i-lucide-check"
        />

        <!-- <p>{{ metadata.deIdentDirect }}</p> -->
      </div>

      <!-- HIPPA de-identification rules -->
      <div>
        <p :class="sectionTitleClass">
          Does this dataset apply the HIPAA de-identification rules?
        </p>

        <USwitch
          class="cursor-default"
          disabled
          unchecked-icon="i-lucide-x"
          checked-icon="i-lucide-check"
          :default-value="metadata.deIdentHIPAA"
        />

        <!-- <p>{{ metadata.deIdentHIPAA }}</p> -->
      </div>

      <!-- Rebase and/or replace dates by integers -->
      <div>
        <p :class="sectionTitleClass">
          Does this dataset rebase and/or replace dates by integers?
        </p>

        <USwitch
          class="cursor-default"
          disabled
          unchecked-icon="i-lucide-x"
          checked-icon="i-lucide-check"
          :default-value="metadata.deIdentDates"
        />

        <!-- <p>{{ metadata.deIdentDates }}</p> -->
      </div>

      <!-- Remove narrative text fields -->
      <div>
        <p :class="sectionTitleClass">
          Does this dataset remove narrative text fields?
        </p>

        <USwitch
          class="cursor-default"
          disabled
          unchecked-icon="i-lucide-x"
          checked-icon="i-lucide-check"
          :default-value="metadata.deIdentNonarr"
        />

        <!-- <p>{{ metadata.deIdentNonarr }}</p> -->
      </div>

      <!-- Achieve K-anonymisation (k>=2) -->
      <div>
        <p :class="sectionTitleClass">
          Does this dataset achieve K-anonymisation (k>=2)?
        </p>

        <USwitch
          class="cursor-default"
          disabled
          unchecked-icon="i-lucide-x"
          checked-icon="i-lucide-check"
          :default-value="metadata.deIdentKAnon"
        />

        <!-- <p>{{ metadata.deIdentKAnon }}</p> -->
      </div>

      <!-- De-identiciation details -->
      <div>
        <p :class="sectionTitleClass">De-identification Details</p>

        <p>{{ metadata.deIdentDetails }}</p>
      </div>
    </div>
  </CardCollapsibleContent>
</template>
