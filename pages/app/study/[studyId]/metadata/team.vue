<script setup lang="ts">
import { ref, reactive, onBeforeMount, computed } from "vue";
import { UInput, USelect, UFormField, UButton, UForm } from "#components";
import { useRoute, useToast } from "#imports";
import FORM_JSON from "~/assets/data/form.json";

const route = useRoute();
const toast = useToast();
const { studyId } = route.params as { studyId: string };

const loading = ref(false);

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

  loading.value = true;

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
  } catch (err) {
    console.error(err);
    toast.add({ title: "Error", description: "Failed to save sponsor data." });
  } finally {
    loading.value = false;
  }
}

onBeforeMount(fetchStudySponsor);
</script>

<template>
  <div>
    <UForm
      :state="state"
      class="flex flex-col gap-6"
      @submit.prevent="onSubmit"
    >
      <div
        class="flex w-full flex-wrap items-start rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full flex-col gap-4">
          <h2 class="mb-4 text-xl font-semibold">Responsible Party</h2>

          <UFormField>
            <template #label>
              Type <span class="mr-1 text-red-500">*</span>
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

          <div class="flex gap-4">
            <UFormField label="Given Name" class="w-1/2">
              <UInput
                v-model="state.responsiblePartyInvestigatorGivenName"
                placeholder="Annie"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Family Name" class="w-1/2">
              <UInput
                v-model="state.responsiblePartyInvestigatorFamilyName"
                placeholder="Leonhart"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField label="Title">
            <UInput
              v-model="state.responsiblePartyInvestigatorTitle"
              placeholder="Warrior Candidate"
              class="w-full"
            />
          </UFormField>

          <div class="flex gap-4">
            <UFormField label="Affiliation" class="w-1/2">
              <UInput
                v-model="state.responsiblePartyInvestigatorAffiliationName"
                placeholder="Marleyan Military"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Affiliation Identifier" class="w-1/2">
              <UInput
                v-model="
                  state.responsiblePartyInvestigatorAffiliationIdentifier
                "
                placeholder="0156zyn36"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="flex gap-4">
            <UFormField label="Affiliation Identifier Scheme" class="w-1/2">
              <UInput
                v-model="
                  state.responsiblePartyInvestigatorAffiliationIdentifierScheme
                "
                placeholder="ROR"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Affiliation Identifier Scheme URI" class="w-1/2">
              <UInput
                v-model="
                  state.responsiblePartyInvestigatorAffiliationIdentifierSchemeUri
                "
                placeholder="https://ror.org"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="flex gap-4">
            <UFormField label="Identifier Scheme" class="w-1/2">
              <UInput
                v-model="state.responsiblePartyInvestigatorIdentifierScheme"
                placeholder="ORCID"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Identifier Value" class="w-1/2">
              <UInput
                v-model="state.responsiblePartyInvestigatorIdentifierValue"
                placeholder="0000-0003-2829-8032"
                class="w-full"
              />
            </UFormField>
          </div>

          <h2 class="mt-6 mb-4 text-xl font-semibold">Lead Sponsor</h2>

          <UFormField>
            <template #label>
              Name <span class="mr-1 text-red-500">*</span>
            </template>

            <UInput
              v-model="state.leadSponsorName"
              placeholder="Willy Tybur"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Identifier">
            <UInput
              v-model="state.leadSponsorIdentifier"
              placeholder="04aj4c18"
              class="w-full"
            />
          </UFormField>

          <div class="flex gap-4">
            <UFormField label="Identifier Scheme" class="w-1/2">
              <UInput
                v-model="state.leadSponsorIdentifierScheme"
                placeholder="ROR"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Identifier Scheme URI" class="w-1/2">
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
              Add collaborators involved in the study with their identifiers and
              schemes.
            </p>
          </div>

          <UFormField name="collaborators">
            <CardCollapsible
              v-for="(item, index) in visibleCollaborators"
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
                <UFormField label="Name" name="name">
                  <UInput v-model="item.name" placeholder="Collaborator Name" />
                </UFormField>

                <UFormField label="Identifier" name="identifier">
                  <UInput v-model="item.identifier" placeholder="Identifier" />
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
        class="w-1/10 text-center"
        size="lg"
        label="Save Metadata"
        icon="i-lucide-save"
      />
    </UForm>
  </div>
</template>
