<script setup lang="ts">
import datasetMetadata from "@/assets/data/dataset-metadata.json";
const _props = defineProps<{
  metadata: DatasetDescription["datasetConsent"];
}>();

const getConsentType = (consentType: string) => {
  const consentTypeOptions = datasetMetadata.datasetConsentTypeOptions;

  for (const [_key, object] of Object.entries(consentTypeOptions)) {
    if (object.value === consentType) {
      return object.description;
    }
  }
};

const formattedConsentType = getConsentType(_props.metadata.consentType);
const sectionTitleClass = "mb-2 w-full border-b border-gray-200 font-semibold";
</script>

<template>
  <CardCollapsibleContent title="Consent">
    <div class="space-y-6">
      <!-- Consent Type -->
      <div>
        <p :class="sectionTitleClass">Consent Type</p>

        <p>{{ formattedConsentType }}</p>
      </div>

      <!-- Non-commercial use -->
      <div>
        <p :class="sectionTitleClass">
          Does this dataset allow only the non-commercial use of the data?
        </p>

        <USwitch
          class="cursor-default"
          disabled
          :default-value="metadata.consentNoncommercial"
          unchecked-icon="i-lucide-x"
          checked-icon="i-lucide-check"
        />

        <!-- <p>{{ metadata.consentNoncommercial }}</p> -->
      </div>

      <!-- Geographic location restriction -->
      <div>
        <p :class="sectionTitleClass">
          Does this dataset allow only the use of the data in a specific
          geographic location?
        </p>

        <USwitch
          class="cursor-default"
          disabled
          :default-value="metadata.consentGeogRestrict"
          unchecked-icon="i-lucide-x"
          checked-icon="i-lucide-check"
        />

        <!-- <p>{{ metadata.consentGeogRestrict }}</p> -->
      </div>

      <!-- Research type restriction -->
      <div>
        <p :class="sectionTitleClass">
          Does this dataset allow only the use of the data for a specific type
          of research?
        </p>

        <USwitch
          class="cursor-default"
          disabled
          :default-value="metadata.consentResearchType"
          unchecked-icon="i-lucide-x"
          checked-icon="i-lucide-check"
        />

        <!-- <p>{{ metadata.consentResearchType }}</p> -->
      </div>

      <!-- Genetic research restriction -->
      <div>
        <p :class="sectionTitleClass">
          Does this dataset allow only the use of the data for genetic research?
        </p>

        <USwitch
          class="cursor-default"
          disabled
          :default-value="metadata.consentGeneticOnly"
          unchecked-icon="i-lucide-x"
          checked-icon="i-lucide-check"
        />

        <!-- <p>{{ metadata.consentGeneticOnly }}</p> -->
      </div>

      <!-- No methods or algorithms restriction -->
      <div>
        <p :class="sectionTitleClass">
          Does this dataset allow only the use of the data for research that
          does not involve the development of methods or algorithms?
        </p>

        <USwitch
          class="cursor-default"
          disabled
          :default-value="metadata.consentNoMethods"
          unchecked-icon="i-lucide-x"
          checked-icon="i-lucide-check"
        />

        <!-- <p>{{ metadata.consentNoMethods }}</p> -->
      </div>
    </div>
  </CardCollapsibleContent>
</template>
