<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import * as z from "zod";
import { nanoid } from "nanoid";
import type { FormSubmitEvent, FormError } from "@nuxt/ui";
import FORM_JSON from "~/assets/data/form.json";
import {
  isValidORCIDValue,
  isValidRORValue,
  normalizeORCID,
  normalizeROR,
} from "~/utils/validations";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { datasetId } = route.params as { datasetId: string };

const saveLoading = ref(false);
const isSubmitting = ref(false);
const originalStateString = ref("");

const schema = z.object({
  studyOverallOfficials: z.array(
    z.object({
      id: z.string(),
      affiliation: z.string(),
      affiliationIdentifier: z.string(),
      degree: z.string(),
      deleted: z.boolean(),
      familyName: z.string(),
      givenName: z.string(),
      identifier: z.string(),
      local: z.boolean(),
      role: z.string(),
    }),
  ),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  studyOverallOfficials: [],
});

const { data, error, refresh } = await useFetch(
  `/api/datasets/${datasetId}/study/metadata/officials`,
  {},
);

if (error.value) {
  toast.add({
    title: "Error fetching study",
    description: "Please try again later",
    icon: "material-symbols:error",
  });
}

const toFormOfficial = (official: any) => ({
  ...official,
  deleted: false,
  local: false,
});

if (data.value) {
  useSeoMeta({
    title: data.value.title,
  });

  state.studyOverallOfficials =
    data.value.StudyOverallOfficials.map(toFormOfficial);

  originalStateString.value = JSON.stringify(state);
}

const isDirty = computed(() => {
  return JSON.stringify(state) !== originalStateString.value;
});

const { showLeaveModal, confirmLeave, cancelLeave } = useUnsavedChangesGuard({
  isDirty,
  isSubmitting,
});

const addOfficial = () => {
  state.studyOverallOfficials.push({
    id: nanoid(),
    affiliation: "",
    affiliationIdentifier: "",
    degree: "",
    deleted: false,
    familyName: "",
    givenName: "",
    identifier: "",
    local: true,
    role: "",
  });
};

const removeOfficial = (index: number) => {
  const official = state.studyOverallOfficials[index];

  if (official?.local) {
    state.studyOverallOfficials.splice(index, 1);
  } else {
    official!.deleted = true;
  }
};

const validate = (state: any): FormError[] => {
  const errors: FormError<string>[] = [];
  const enumValues = FORM_JSON.studyMetadataContactsOverallOfficialRole.map(
    (option) => option.value,
  );

  const seen = new Set<string>();

  // Field names use the index in state, which is what the template renders from.
  state.studyOverallOfficials.forEach((official: any, index: number) => {
    if (official.deleted) return;

    const key = `${official.givenName?.trim().toLowerCase()}|${official.familyName?.trim().toLowerCase()}|${official.role?.trim().toLowerCase()}`;
    if (seen.has(key)) {
      errors.push({
        name: `givenName-${index}`,
        message:
          "Duplicate official with same given name, family name, and role",
      });
    }
    seen.add(key);

    if (official.givenName.trim() === "") {
      errors.push({
        name: `givenName-${index}`,
        message: "Given name is required",
      });
    }

    if (official.familyName.trim() === "") {
      errors.push({
        name: `familyName-${index}`,
        message: "Family name is required",
      });
    }

    if (official.affiliation.trim() === "") {
      errors.push({
        name: `affiliation-${index}`,
        message: "Affiliation is required",
      });
    }

    const ror = normalizeROR(official.affiliationIdentifier);
    if (ror && !isValidRORValue(ror)) {
      errors.push({
        name: `affiliationIdentifier-${index}`,
        message: "Enter a valid ROR ID or ROR URL",
      });
    }

    const orcid = normalizeORCID(official.identifier);
    if (orcid && !isValidORCIDValue(orcid)) {
      errors.push({
        name: `identifier-${index}`,
        message: "Enter a valid ORCID iD or ORCID URL",
      });
    }

    if (
      official.role.trim() !== "" &&
      !enumValues.includes(official.role.trim())
    ) {
      errors.push({
        name: `role-${index}`,
        message: `Role must be one of the following: ${enumValues.join(", ")}`,
      });
    }

    if (official.role.trim() === "") {
      errors.push({
        name: `role-${index}`,
        message: "Role is required",
      });
    }
  });

  return errors;
};

// The form only collects the ORCID and ROR IDs; the API also expects their schemes and scheme URIs.
// Deleted rows are still validated by the API, so their old identifiers are cleared.
const withIdentifierFields = (official: any) => {
  const ror = official.deleted
    ? ""
    : normalizeROR(official.affiliationIdentifier);
  const orcid = official.deleted ? "" : normalizeORCID(official.identifier);

  return {
    ...official,
    affiliationIdentifier: ror,
    affiliationIdentifierScheme: ror ? "ROR" : "",
    affiliationIdentifierSchemeUri: ror ? "https://ror.org" : "",
    identifier: orcid,
    identifierScheme: orcid ? "ORCID" : "",
    identifierSchemeUri: orcid ? "https://orcid.org" : "",
  };
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;
  isSubmitting.value = true;

  const formData = event.data;

  const b = {
    studyOverallOfficials: formData.studyOverallOfficials.map(
      (official: any) => {
        const s = withIdentifierFields(official);

        if (s.local) {
          delete s.id;
        }
        if (!s.deleted) {
          delete s.deleted;
        }

        return s;
      },
    ),
  };

  try {
    await $fetch(`/api/datasets/${datasetId}/study/metadata/officials`, {
      body: b,
      method: "PUT",
    });

    // Reload so new officials get their real ids and removed ones drop out of the form.
    await refresh();
    if (!error.value && data.value) {
      state.studyOverallOfficials =
        data.value.StudyOverallOfficials.map(toFormOfficial);
    }
    originalStateString.value = JSON.stringify(state);

    toast.add({
      title: "Success",
      color: "success",
      description: "The form has been submitted.",
    });
  } catch (err) {
    console.log(err);

    toast.add({
      title: "Error",
      color: "error",
      description: "An error occurred while submitting the form.",
    });
  } finally {
    saveLoading.value = false;
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="relative flex h-[calc(100vh-6rem)] flex-col overflow-hidden">
    <div class="flex-1 space-y-6 overflow-y-auto p-4 pb-28">
      <UBreadcrumb
        class="mb-4 ml-2"
        :items="[
          { label: 'Dashboard', to: '/app/dashboard' },
          { label: data?.title, to: `/app/datasets/${datasetId}` },
          {
            label: 'Study Metadata',
          },
          {
            label: 'Overall Officials',
            to: `/app/datasets/${datasetId}/study/metadata/officials`,
          },
        ]"
      />

      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full items-center justify-between gap-3">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Overall Officials
          </h1>
        </div>
        <p class="text-gray-500 dark:text-gray-400">
          Some basic information about the study is displayed here.
        </p>
      </div>

      <UForm
        id="study-metadata-officials-form"
        :validate="validate"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Study Governance Officials & Directors
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Register oversight personnel, scientific leaders, principal
                investigators, and authorization leads tied to managing
                execution milestones.
              </p>
            </div>

            <UFormField name="studyOverallOfficials">
              <CardCollapsible
                v-for="(item, index) in state.studyOverallOfficials"
                v-show="!item.deleted"
                :key="item.id"
                class="my-2 shadow-none"
                :title="
                  item.givenName
                    ? `${item.givenName} ${item.familyName}`
                    : `Overall Official ${index + 1}`
                "
                bordered
              >
                <template #header-extra>
                  <UButton
                    icon="i-lucide-trash"
                    label="Remove Official"
                    variant="soft"
                    color="error"
                    @click="removeOfficial(index)"
                  />
                </template>

                <div class="flex w-full flex-col gap-4 p-1">
                  <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <UFormField
                      label="Given Name"
                      :name="`givenName-${index}`"
                      required
                    >
                      <UInput v-model="item.givenName" placeholder="James" />
                    </UFormField>

                    <UFormField
                      label="Family Name"
                      :name="`familyName-${index}`"
                      required
                    >
                      <UInput v-model="item.familyName" placeholder="Smith" />
                    </UFormField>

                    <UFormField label="Degree" :name="`degree-${index}`">
                      <UInput
                        v-model="item.degree"
                        placeholder="PhD, MD, ScD"
                      />
                    </UFormField>
                  </div>

                  <UFormField
                    label="ORCID"
                    :name="`identifier-${index}`"
                    help="Enter the ORCID iD or paste the full ORCID URL."
                  >
                    <UInput
                      v-model="item.identifier"
                      placeholder="0000-0000-0000-0000 or https://orcid.org/0000-0000-0000-0000"
                      class="w-full"
                      @blur="item.identifier = normalizeORCID(item.identifier)"
                    />
                  </UFormField>

                  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <UFormField
                      label="Affiliation"
                      :name="`affiliation-${index}`"
                      class="w-full"
                      required
                    >
                      <UInput
                        v-model="item.affiliation"
                        placeholder="University of California, San Francisco"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="ROR"
                      :name="`affiliationIdentifier-${index}`"
                      class="w-full"
                      hint="ID or URL"
                    >
                      <UInput
                        v-model="item.affiliationIdentifier"
                        placeholder="03yrm5c26 or https://ror.org/03yrm5c26"
                        class="w-full"
                        @blur="
                          item.affiliationIdentifier = normalizeROR(
                            item.affiliationIdentifier,
                          )
                        "
                      />
                    </UFormField>
                  </div>

                  <UFormField
                    label="Official Protocol Role"
                    :name="`role-${index}`"
                    required
                  >
                    <USelect
                      v-model="item.role"
                      class="w-full"
                      placeholder="Select authority designation"
                      :items="
                        FORM_JSON.studyMetadataContactsOverallOfficialRole
                      "
                    />
                  </UFormField>
                </div>
              </CardCollapsible>
            </UFormField>

            <UButton
              icon="i-lucide-plus"
              variant="outline"
              color="primary"
              label="Add New Overall Official"
              class="mt-2"
              @click="addOfficial"
            />
          </div>
        </div>
      </UForm>
    </div>

    <div class="absolute right-0 bottom-0 left-0 z-10 px-6 pt-4 pb-6">
      <UButton
        form="study-metadata-officials-form"
        type="submit"
        :disabled="saveLoading"
        :loading="saveLoading"
        class="w-full"
        size="xl"
        label="Save Metadata"
        icon="i-lucide-save"
      />
    </div>

    <UModal
      v-model:open="showLeaveModal"
      title="Unsaved changes"
      :prevent-close="true"
    >
      <template #body>
        <div class="space-y-4">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to leave this page? Any modifications made to
            your registered oversight officials structural mapping lines will be
            permanently discarded.
          </p>
          <div class="flex justify-end gap-3 pt-2">
            <UButton
              color="error"
              label="Discard Changes"
              @click="confirmLeave"
            />
            <UButton
              color="neutral"
              label="Stay on Page"
              @click="cancelLeave"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
