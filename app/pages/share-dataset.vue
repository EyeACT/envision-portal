<script setup>
import { externalDatasetSchema } from "#shared/utils/external_dataset";

definePageMeta({
  layout: "public",
});

const toast = useToast();

const state = reactive({
  title: "",
  description: "",
  version: "",
  publicationYear: new Date().getFullYear().toString(),
  creatorName: "",
  creatorNameType: "Personal",
  managingOrgName: "",
  accessType: "PublicOnScreenAccess",
  accessDescription: "",
  accessUrl: "",
  rightsName: "",
  publisherName: "",
  resourceTypeValue: "",
  deIdentType: "NoDeIdentification",
  deIdentDirect: false,
  deIdentHIPAA: false,
  deIdentDates: false,
  deIdentNonarr: false,
  deIdentKAnon: false,
  consentType: "NoExplicitConsent",
  consentNoncommercial: false,
  consentGeogRestrict: false,
  consentResearchType: false,
  consentGeneticOnly: false,
  consentNoMethods: false,
});

const schema = externalDatasetSchema;

const loading = ref(false);

async function onSubmit() {
  loading.value = true;
  try {
    await $fetch("/api/datasets/external", {
      method: "POST",
      body: state,
    });

    toast.add({
      title: "Success",
      description: "External dataset has been submitted for review.",
      color: "green",
    });
  } catch (error) {
    toast.add({
      title: "Error",
      description: error.message || "Failed to register dataset",
      color: "red",
    });
  } finally {
    loading.value = false;
  }
}

const nameTypeOptions = [
  { label: "Personal", value: "Personal" },
  { label: "Organizational", value: "Organizational" },
];

const accessTypeOptions = [
  { label: "Public On-Screen Access", value: "PublicOnScreenAccess" },
  {
    label: "Public On-Screen Access and Download",
    value: "PublicOnScreenAccessAndDownload",
  },
  {
    label: "Public Download (Self-Attestation Required)",
    value: "PublicDownloadSelfAttestationRequired",
  },
  { label: "Restricted Download", value: "RestrictedDownload" },
  { label: "Case by Case Download", value: "CaseByCaseDownload" },
  { label: "Other", value: "Other" },
];

const deIdentTypeOptions = [
  { label: "No De-Identification", value: "NoDeIdentification" },
  { label: "De-Identification Applied", value: "DeIdentificationApplied" },
  {
    label: "De-Identification Applied (Primary Outcomes Re-Assessed)",
    value: "DeIdentificationAppliedPrimaryOutcomesReAssessed",
  },
];

const consentTypeOptions = [
  { label: "No Explicit Consent", value: "NoExplicitConsent" },
  { label: "No Restriction", value: "NoRestriction" },
  { label: "General Research Use", value: "GeneralResearchUse" },
  {
    label: "Health/Medical/Biomedical Research",
    value: "HealthMedicalBiomedicalResearch",
  },
  { label: "Disease Specific Research", value: "DiseaseSpecificResearch" },
  {
    label: "Consent Specified (Not Elsewhere Categorised)",
    value: "ConsentSpecifiedNotElsewhereCategorised",
  },
];
</script>

<template>
  <UContainer class="py-8">
    <div class="mx-auto max-w-4xl">
      <h1 class="mb-2 text-3xl font-bold">Register External Dataset</h1>
      <p class="mb-8 text-gray-600 dark:text-gray-400">
        Share an external dataset with the Envision Portal community. Fill in
        the required information below.
      </p>

      <UForm
        :schema="schema"
        :state="state"
        @submit="onSubmit"
        class="space-y-8"
      >
        <!-- Basic Information -->
        <UCard>
          <template #header>
            <h2 class="text-xl font-semibold">Basic Information</h2>
          </template>

          <div class="space-y-4">
            <UFormField label="Dataset Title" name="title" required>
              <UInput
                v-model="state.title"
                placeholder="Enter the dataset title"
              />
            </UFormField>

            <UFormField label="Description" name="description" required>
              <UTextarea
                v-model="state.description"
                placeholder="Provide a brief description of the dataset"
                :rows="4"
                class="w-full"
              />
            </UFormField>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <UFormField label="Version" name="version" required>
                <UInput v-model="state.version" placeholder="e.g., 1.0" />
              </UFormField>

              <UFormField
                label="Publication Year"
                name="publicationYear"
                required
              >
                <UInput
                  v-model="state.publicationYear"
                  placeholder="e.g., 2024"
                  maxlength="4"
                />
              </UFormField>
            </div>

            <UFormField label="Resource Type" name="resourceTypeValue" required>
              <UInput
                v-model="state.resourceTypeValue"
                placeholder="e.g., Diabetes, Cancer Research"
              />
            </UFormField>
          </div>
        </UCard>

        <!-- Creator Information -->
        <UCard>
          <template #header>
            <h2 class="text-xl font-semibold">Creator Information</h2>
          </template>

          <div class="space-y-4">
            <UFormField
              label="Creator Name"
              name="creatorName"
              required
              help="Format for personal names: Family, Given"
            >
              <UInput
                v-model="state.creatorName"
                placeholder="e.g., Smith, John"
              />
            </UFormField>

            <UFormField label="Name Type" name="creatorNameType" required>
              <USelect
                v-model="state.creatorNameType"
                :items="nameTypeOptions"
                class="w-full"
              />
            </UFormField>
          </div>
        </UCard>

        <!-- Managing Organization -->
        <UCard>
          <template #header>
            <h2 class="text-xl font-semibold">Managing Organization</h2>
          </template>

          <UFormField label="Organization Name" name="managingOrgName" required>
            <UInput
              v-model="state.managingOrgName"
              placeholder="Enter the managing organization name"
            />
          </UFormField>
        </UCard>

        <!-- Access Information -->
        <UCard>
          <template #header>
            <h2 class="text-xl font-semibold">Access Information</h2>
          </template>

          <div class="space-y-4">
            <UFormField label="Access Type" name="accessType" required>
              <USelect
                v-model="state.accessType"
                :items="accessTypeOptions"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Access Description"
              name="accessDescription"
              required
            >
              <UTextarea
                v-model="state.accessDescription"
                placeholder="Describe how to access this dataset"
                :rows="3"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Access URL" name="accessUrl" required>
              <UInput
                v-model="state.accessUrl"
                placeholder="https://example.com/dataset"
                type="url"
              />
            </UFormField>
          </div>
        </UCard>

        <!-- Rights/License -->
        <UCard>
          <template #header>
            <h2 class="text-xl font-semibold">License</h2>
          </template>

          <UFormField
            label="License Name"
            name="rightsName"
            required
            help="e.g., Creative Commons Attribution 4.0 International"
          >
            <UInput
              v-model="state.rightsName"
              placeholder="Enter the license name"
            />
          </UFormField>
        </UCard>

        <!-- Publisher -->
        <UCard>
          <template #header>
            <h2 class="text-xl font-semibold">Publisher</h2>
          </template>

          <UFormField label="Publisher Name" name="publisherName" required>
            <UInput
              v-model="state.publisherName"
              placeholder="Enter the publisher name"
            />
          </UFormField>
        </UCard>

        <!-- De-identification Level -->
        <UCard>
          <template #header>
            <h2 class="text-xl font-semibold">De-identification Level</h2>
          </template>

          <div class="space-y-4">
            <UFormField
              label="De-identification Type"
              name="deIdentType"
              required
            >
              <USelect
                v-model="state.deIdentType"
                :items="deIdentTypeOptions"
                class="w-full"
              />
            </UFormField>

            <div class="space-y-2">
              <p class="text-sm font-medium">
                De-identification Measures Applied
              </p>
              <UCheckbox
                v-model="state.deIdentDirect"
                label="Direct identifiers removed"
              />
              <UCheckbox
                v-model="state.deIdentHIPAA"
                label="HIPAA de-identification rules applied"
              />
              <UCheckbox
                v-model="state.deIdentDates"
                label="Dates rebased/replaced"
              />
              <UCheckbox
                v-model="state.deIdentNonarr"
                label="Narrative text fields removed"
              />
              <UCheckbox
                v-model="state.deIdentKAnon"
                label="K-anonymization achieved (k≥2)"
              />
            </div>
          </div>
        </UCard>

        <!-- Consent Information -->
        <UCard>
          <template #header>
            <h2 class="text-xl font-semibold">Consent Information</h2>
          </template>

          <div class="space-y-4">
            <UFormField label="Consent Type" name="consentType" required>
              <USelect
                v-model="state.consentType"
                :items="consentTypeOptions"
                class="w-full"
              />
            </UFormField>

            <div class="space-y-2">
              <p class="text-sm font-medium">Consent Restrictions</p>
              <UCheckbox
                v-model="state.consentNoncommercial"
                label="Non-commercial use only"
              />
              <UCheckbox
                v-model="state.consentGeogRestrict"
                label="Geographic restriction"
              />
              <UCheckbox
                v-model="state.consentResearchType"
                label="Specific research type only"
              />
              <UCheckbox
                v-model="state.consentGeneticOnly"
                label="Genetic research only"
              />
              <UCheckbox
                v-model="state.consentNoMethods"
                label="No methods/algorithms development"
              />
            </div>
          </div>
        </UCard>

        <!-- Submit Button -->
        <div class="flex justify-end">
          <UButton type="submit" size="lg" :loading="loading">
            Register Dataset
          </UButton>
        </div>
      </UForm>
    </div>
  </UContainer>
</template>
