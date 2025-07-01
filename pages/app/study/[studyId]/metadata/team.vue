<script setup lang="ts">
import type { FormError } from "@nuxt/ui";
import FORM_JSON from "~/assets/data/form.json";

const route = useRoute();
const toast = useToast();
const { studyId } = route.params as { studyId: string };

const saveLoading = ref(false);

const state = reactive({
  collaborators: [
    {
      id: crypto.randomUUID(),
      name: "",
      deleted: false,
      identifier: "",
      scheme: "",
      schemeUri: "",
    },
  ],
  leadSponsorIdentifier: "",
  leadSponsorIdentifierScheme: "",
  leadSponsorIdentifierSchemeUri: "",
  leadSponsorName: "",
  responsiblePartyInvestigatorAffiliationIdentifier: "",
  responsiblePartyInvestigatorAffiliationIdentifierScheme: "",
  responsiblePartyInvestigatorAffiliationIdentifierSchemeUri: "",
  responsiblePartyInvestigatorAffiliationName: "",
  responsiblePartyInvestigatorFamilyName: "",
  responsiblePartyInvestigatorGivenName: "",
  responsiblePartyInvestigatorIdentifierScheme: "",
  responsiblePartyInvestigatorIdentifierValue: "",
  responsiblePartyInvestigatorTitle: "",
  responsiblePartyType: "",
});

const visibleCollaborators = computed(() =>
  state.collaborators.filter((c) => !c.deleted),
);

function addCollaborator() {
  state.collaborators.push({
    id: crypto.randomUUID(),
    name: "",
    deleted: false,
    identifier: "",
    scheme: "",
    schemeUri: "",
  });
}

function removeCollaboratorById(id: string) {
  const collaborator = state.collaborators.find((c) => c.id === id);

  if (collaborator) {
    collaborator.deleted = true;
  }
}

async function fetchStudySponsor() {
  try {
    const res = await fetch(`/api/studies/${studyId}/metadata/team`);

    if (!res.ok) throw new Error("Failed to fetch sponsor data");
    const data = await res.json();

    // assign all keys except collaborators
    for (const key in state) {
      if (key === "collaborators") continue;
      state[key as keyof typeof state] = data[key as keyof typeof data] ?? "";
    }

    // assign collaborators carefully
    if (Array.isArray(data.collaborators)) {
      state.collaborators = data.collaborators;
    } else {
      state.collaborators = [];
    }
  } catch (err) {
    console.error(err);
    toast.add({ title: "Error", description: "Failed to fetch sponsor data." });
  }
}

async function onSubmit() {
  if (!state.responsiblePartyType) {
    toast.add({ title: "Validation Error", description: "Type is required." });

    return;
  }

  if (!state.leadSponsorName.trim()) {
    toast.add({
      title: "Validation Error",
      description: "Lead Sponsor Name is required.",
    });

    return;
  }

  saveLoading.value = true;

  try {
    const res = await fetch(`/api/studies/${studyId}/metadata/team`, {
      body: JSON.stringify({ studyId, ...state }),
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    });

    if (!res.ok) {
      throw new Error(
        `[PUT] "/api/studies/${studyId}/metadata/team": ${res.statusText}`,
      );
    }

    toast.add({
      title: "Success",
      description: "Sponsor data saved successfully.",
    });

    window.location.reload();
  } catch (err) {
    console.error(err);
    toast.add({ title: "Error", description: "Failed to save sponsor data." });
  } finally {
    saveLoading.value = false;
  }
}
const studyTitle = computed(() => studyMeta.value?.title || "Untitled Study");

const { data: studyMeta, error: metaError } = await useFetch(
  `/api/studies/${studyId}`,
);

const validate = (state: any): FormError[] => {
  const errors: FormError[] = [];

  if (!state.responsiblePartyType?.trim()) {
    errors.push({
      name: "responsiblePartyType",
      message: "Responsible party type is required",
    });
  }

  if (!state.leadSponsorName?.trim()) {
    errors.push({
      name: "leadSponsorName",
      message: "Lead sponsor name is required",
    });
  }

  state.collaborators.forEach((c: any, index: number) => {
    if (!c.deleted && !c.name?.trim()) {
      errors.push({
        name: `collaborators[${index}].name`,
        message: `Collaborator ${index + 1} name is required`,
      });
    }
  });

  return errors;
};

onBeforeMount(fetchStudySponsor);
</script>

<template>
  <div>
    <UBreadcrumb
      class="mb-4 ml-2"
      :items="[
        { label: 'Dashboard', to: '/app/dashboard' },
        { label: studyTitle, to: `/app/study/${studyId}` },
        {
          label: 'Metadata',
        },
        {
          label: 'Team',
          to: `/app/study/${studyId}/metadata/team`,
        },
      ]"
    />

    <div class="flex w-full flex-col gap-6 pb-5">
      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full items-center justify-between gap-3">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Team</h1>
        </div>

        <p class="text-gray-500 dark:text-gray-400">
          Some basic information about the study is displayed here.
        </p>
      </div>

      <UForm
        :state="state"
        :validate="validate"
        class="flex flex-col gap-6"
        @submit.prevent="onSubmit"
      >
        <!-- Responsible Party Card -->
        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Responsible Party
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Provide information about the individual or entity responsible
                for the study.
              </p>
            </div>

            <UFormField name="responsiblePartyType" class="w-full">
              <template #label>
                Type <span class="text-red-500">*</span>
              </template>

              <USelect
                v-model="state.responsiblePartyType"
                class="w-full"
                placeholder="Principal Investigator"
                :items="
                  FORM_JSON.studyMetadataSponsorsResponsiblePartyTypeOptions
                "
              />
            </UFormField>

            <div class="flex w-full gap-4">
              <UFormField label="Given Name" name="givenName" class="w-full">
                <UInput
                  v-model="state.responsiblePartyInvestigatorGivenName"
                  placeholder="Annie"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Family Name" name="familyName" class="w-full">
                <UInput
                  v-model="state.responsiblePartyInvestigatorFamilyName"
                  placeholder="Leonhart"
                  class="w-full"
                />
              </UFormField>
            </div>

            <UFormField label="Title" name="title" class="w-full">
              <UInput
                v-model="state.responsiblePartyInvestigatorTitle"
                placeholder="Warrior Candidate"
                class="w-full"
              />
            </UFormField>

            <div class="flex w-full gap-4">
              <UFormField label="Affiliation" name="affiliation" class="w-full">
                <UInput
                  v-model="state.responsiblePartyInvestigatorAffiliationName"
                  placeholder="Marleyan Military"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Affiliation Identifier"
                name="affiliationId"
                class="w-full"
              >
                <UInput
                  v-model="
                    state.responsiblePartyInvestigatorAffiliationIdentifier
                  "
                  placeholder="0156zyn36"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="flex w-full gap-4">
              <UFormField
                label="Affiliation Identifier Scheme"
                name="affiliationScheme"
                class="w-full"
              >
                <UInput
                  v-model="
                    state.responsiblePartyInvestigatorAffiliationIdentifierScheme
                  "
                  placeholder="ROR"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Affiliation Identifier Scheme URI"
                name="affiliationSchemeUri"
                class="w-full"
              >
                <UInput
                  v-model="
                    state.responsiblePartyInvestigatorAffiliationIdentifierSchemeUri
                  "
                  placeholder="https://ror.org"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="flex w-full gap-4">
              <UFormField
                label="Identifier Scheme"
                name="idScheme"
                class="w-full"
              >
                <UInput
                  v-model="state.responsiblePartyInvestigatorIdentifierScheme"
                  placeholder="ORCID"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Identifier Value"
                name="idValue"
                class="w-full"
              >
                <UInput
                  v-model="state.responsiblePartyInvestigatorIdentifierValue"
                  placeholder="0000-0003-2829-8032"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>
        </div>

        <!-- Lead Sponsor Card -->
        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Lead Sponsor
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Provide information about the primary organization overseeing
                the study.
              </p>
            </div>

            <UFormField name="leadSponsorName" class="w-full">
              <template #label>
                Name <span class="text-red-500">*</span>
              </template>

              <UInput
                v-model="state.leadSponsorName"
                placeholder="Willy Tybur"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Identifier"
              name="leadSponsorIdentifier"
              class="w-full"
            >
              <UInput
                v-model="state.leadSponsorIdentifier"
                placeholder="04aj4c18"
                class="w-full"
              />
            </UFormField>

            <div class="flex w-full gap-4">
              <UFormField
                label="Identifier Scheme"
                name="leadSponsorScheme"
                class="w-full"
              >
                <UInput
                  v-model="state.leadSponsorIdentifierScheme"
                  placeholder="ROR"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Identifier Scheme URI"
                name="leadSponsorSchemeUri"
                class="w-full"
              >
                <UInput
                  v-model="state.leadSponsorIdentifierSchemeUri"
                  placeholder="https://ror.org"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>
        </div>

        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Collaborators
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Add collaborators involved in the study with their identifiers
                and schemes.
              </p>
            </div>

            <UFormField name="collaborators">
              <CardCollapsible
                v-for="(item, index) in visibleCollaborators"
                v-show="!item.deleted"
                :key="item.id"
                class="my-1 shadow-none"
                :title="item.name || `Collaborator ${index + 1}`"
                bordered
              >
                <template #header-extra>
                  <UButton
                    icon="i-lucide-trash"
                    label="Remove collaborator"
                    variant="soft"
                    color="error"
                    @click="() => removeCollaboratorById(item.id)"
                  />
                </template>

                <div class="flex flex-col gap-3">
                  <UFormField
                    :name="`collaborators[${index}].name`"
                    label="Name"
                  >
                    <UInput
                      v-model="item.name"
                      placeholder="Collaborator Name"
                    />
                  </UFormField>

                  <UFormField label="Identifier" name="identifier">
                    <UInput
                      v-model="item.identifier"
                      placeholder="Identifier"
                    />
                  </UFormField>

                  <UFormField label="Identifier Scheme" name="scheme">
                    <UInput v-model="item.scheme" placeholder="Scheme" />
                  </UFormField>

                  <UFormField label="Scheme URI" name="schemeUri">
                    <UInput
                      v-model="item.schemeUri"
                      placeholder="https://scheme.uri"
                    />
                  </UFormField>
                </div>
              </CardCollapsible>
            </UFormField>

            <UButton
              icon="i-lucide-plus"
              variant="outline"
              color="primary"
              label="Add Collaborator"
              @click="addCollaborator"
            />
          </div>
        </div>

        <UButton
          type="submit"
          :disabled="saveLoading"
          :loading="saveLoading"
          class="w-full"
          size="lg"
          label="Save Metadata"
          icon="i-lucide-save"
        />
      </UForm>
    </div>
  </div>
</template>
