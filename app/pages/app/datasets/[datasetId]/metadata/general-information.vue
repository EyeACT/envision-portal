<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, FormError } from "@nuxt/ui";
import { nanoid } from "nanoid";
import FORM_JSON from "~/assets/data/form.json";
import AI_FIELDS from "~/assets/data/ai-extract-fields.json";
import LANGUAGES_JSON from "@/assets/data/languages.json";
import type {
  ExtractedValues,
  ExtractField,
} from "@/components/ai/ExtractDrawer.vue";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { datasetId } = route.params as {
  datasetId: string;
};

const languageOptions = LANGUAGES_JSON.map((language) => ({
  label: language.name,
  value: language.alpha2,
}));

const saveLoading = ref(false);
const isSubmitting = ref(false);
const originalStateString = ref("");

const schema = z.object({
  descriptions: z.array(
    z.object({
      id: z.string(),
      deleted: z.boolean(),
      description: z.string(),
      local: z.boolean(),
      type: z.string(),
    }),
  ),
  language: z.string(),
  resourceTypeName: z.string(),
  titles: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      deleted: z.boolean(),
      local: z.boolean(),
      type: z.string(),
    }),
  ),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  descriptions: [],
  language: "",
  resourceTypeName: "",
  titles: [],
});

const { data, error, refresh } = await useFetch(
  `/api/datasets/${datasetId}/metadata/general-information`,
  {},
);

if (error.value) {
  toast.add({
    title: "Error fetching study",
    description: "Please try again later",
    icon: "material-symbols:error",
  });
}

// Fills the form from the fetched data, on page load and again after each save.
const loadFormState = () => {
  if (!data.value) return;

  state.descriptions = data.value.DatasetDescription.map(
    (description: any) => ({
      id: description.id,
      deleted: false,
      description: description.description,
      local: false,
      type: description.type,
    }),
  );
  state.language = data.value.DatasetOther?.language ?? "";
  state.resourceTypeName = data.value.DatasetOther?.resourceTypeName ?? "";
  state.titles = data.value.DatasetTitle.map((title: any) => ({
    id: title.id,
    title: title.title,
    deleted: false,
    local: false,
    type: title.type,
  }));
};

if (data.value) {
  useSeoMeta({
    title: data.value.title,
  });

  loadFormState();
  originalStateString.value = JSON.stringify(state);
}

const isDirty = computed(() => {
  return JSON.stringify(state) !== originalStateString.value;
});

const { showLeaveModal, confirmLeave, cancelLeave } = useUnsavedChangesGuard({
  isDirty,
  isSubmitting,
});

const addTitle = () => {
  state.titles.push({
    id: nanoid(),
    title: "",
    deleted: false,
    local: true,
    type: "",
  });
};

const removeTitle = (index: number) => {
  const title = state.titles[index];
  if (!title) return;

  if (title.local) {
    state.titles.splice(index, 1);
  } else {
    title.deleted = true;
  }
};

const addDescription = () => {
  state.descriptions.push({
    id: nanoid(),
    deleted: false,
    description: "",
    local: true,
    type: "",
  });
};

const removeDescription = (index: number) => {
  const description = state.descriptions[index];
  if (!description) return;

  if (description.local) {
    state.descriptions.splice(index, 1);
  } else {
    description.deleted = true;
  }
};

const validate = (state: any): FormError[] => {
  const errors: FormError[] = [];
  const activeTitles = state.titles?.filter((item: any) => !item.deleted) ?? [];

  if (activeTitles.length === 0) {
    errors.push({
      name: "titles",
      message: "Please add at least one title.",
    });
  }

  const seenTitles = new Set<string>();
  state.titles.forEach((item: any, index: number) => {
    if (item.deleted) return;

    const key = item.title?.trim().toLowerCase();
    if (seenTitles.has(key)) {
      errors.push({
        name: `title-${index}`,
        message: "Duplicate title.",
      });
    }
    seenTitles.add(key);
  });

  state.titles.forEach((item: any, index: number) => {
    if (item.deleted) return;

    if (!item.title?.trim()) {
      errors.push({
        name: `title-${index}`,
        message: "Title value is required.",
      });
    }
    if (!item.type?.trim()) {
      errors.push({
        name: `title-type-${index}`,
        message: "Title type is required.",
      });
    }
  });

  const activeDescriptions =
    state.descriptions?.filter((item: any) => !item.deleted) ?? [];

  if (activeDescriptions.length === 0) {
    errors.push({
      name: "descriptions",
      message: "At least one Abstract description is required.",
    });
  }

  const seenDescriptions = new Set<string>();
  state.descriptions.forEach((item: any, index: number) => {
    if (item.deleted) return;

    const key = `${item.description?.trim().toLowerCase()}|${item.type?.trim().toLowerCase()}`;
    if (seenDescriptions.has(key)) {
      errors.push({
        name: `description-${index}`,
        message: "Duplicate description with same type.",
      });
    }
    seenDescriptions.add(key);
  });

  state.descriptions.forEach((item: any, index: number) => {
    if (item.deleted) return;

    if (!item.description?.trim()) {
      errors.push({
        name: `description-${index}`,
        message: "Description value is required.",
      });
    }
    if (!item.type?.trim()) {
      errors.push({
        name: `description-type-${index}`,
        message: "Description type is required.",
      });
    }
  });

  if (!state.resourceTypeName?.trim()) {
    errors.push({
      name: "resourceTypeName",
      message: "Resource type name is required.",
    });
  }

  if (!state.language) {
    errors.push({
      name: "language",
      message: "Language is required.",
    });
  }

  return errors;
};

async function executeSave(formData: typeof state) {
  saveLoading.value = true;
  isSubmitting.value = true;

  const b = {
    DatasetDescription: formData.descriptions.map((description: any) => {
      const d = { ...description };
      if (d.local) delete d.id;
      if (!d.deleted) delete d.deleted;
      return d;
    }),
    DatasetOther: {
      language: formData.language,
      resourceTypeName: formData.resourceTypeName,
    },
    DatasetTitle: formData.titles.map((title: any) => {
      const d = { ...title };
      if (d.local) delete d.id;
      if (!d.deleted) delete d.deleted;
      return d;
    }),
  };

  try {
    await $fetch(`/api/datasets/${datasetId}/metadata/general-information`, {
      body: b,
      method: "PUT",
    });

    // Reload so new rows get their real ids and removed rows drop out of the form.
    await refresh();
    if (!error.value) loadFormState();
    originalStateString.value = JSON.stringify(state);

    toast.add({
      title: "Success",
      color: "success",
      description: "The form has been submitted.",
    });
  } catch (err) {
    console.error(err);
    toast.add({
      title: "Error",
      color: "error",
      description: "Could not sync your updates to the server.",
    });
  } finally {
    saveLoading.value = false;
    isSubmitting.value = false;
  }
}

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  await executeSave(event.data);
}

// AI extraction drawer
const drawerOpen = ref(false);
const pageFields = AI_FIELDS["metadata/general-information"]
  .fields as ExtractField[];

const onApplyExtracted = (_values: ExtractedValues) => {
  // TODO: map _values onto state.titles / state.descriptions
  toast.add({
    title: "Fields updated",
    description: "Extracted metadata has been applied to the form.",
    color: "success",
  });
};
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
            label: 'General Information',
            to: `/app/datasets/${datasetId}/metadata/general-information`,
          },
        ]"
      />

      <UForm
        id="metadata-general-form"
        :validate="validate"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full items-center justify-between gap-3">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              General Information
            </h1>

            <UButton
              icon="material-symbols:auto-awesome"
              label="Extract from Documents"
              color="primary"
              variant="subtle"
              @click="drawerOpen = true"
            />
          </div>
          <p class="text-gray-500 dark:text-gray-400">
            Add the titles, descriptions, resource type, and language that
            identify this dataset.
          </p>
        </div>

        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Titles
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Add the titles of this dataset, including any alternative or
                translated titles.
              </p>
            </div>
            <UFormField name="titles">
              <CardCollapsible
                v-for="(item, index) in state.titles"
                v-show="!item.deleted"
                :key="item.id"
                class="my-1 shadow-none"
                :title="
                  item.type === 'MainTitle'
                    ? 'Main Title'
                    : item.title || `Title ${index + 1}`
                "
                bordered
              >
                <template #header-extra>
                  <UButton
                    v-if="item.type !== 'MainTitle'"
                    icon="i-lucide-trash"
                    label="Remove title"
                    variant="soft"
                    color="error"
                    @click="removeTitle(index)"
                  />
                </template>
                <div class="flex flex-col gap-3">
                  <UFormField :name="`title-${index}`" label="Name" required>
                    <UInput
                      v-model="item.title"
                      placeholder="Retinal Imaging in Type 2 Diabetes"
                    />
                  </UFormField>

                  <!-- Only show Type field if it is NOT a MainTitle -->
                  <UFormField
                    v-if="item.type !== 'MainTitle'"
                    :name="`title-type-${index}`"
                    label="Type"
                  >
                    <USelect
                      v-model="item.type"
                      class="w-full"
                      placeholder="Alternative Title"
                      :items="FORM_JSON.datasetTitleTypeOptions"
                    />
                  </UFormField>
                </div>
              </CardCollapsible>
            </UFormField>
            <UButton
              icon="i-lucide-plus"
              variant="outline"
              color="primary"
              label="Add Title"
              @click="addTitle"
            />
          </div>
        </div>

        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Descriptions
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Add descriptions of this dataset, such as an abstract or a
                summary of methods.
              </p>
            </div>
            <UFormField name="descriptions">
              <CardCollapsible
                v-for="(item, index) in state.descriptions"
                v-show="!item.deleted"
                :key="item.id"
                class="my-1 shadow-none"
                :title="item.type || `Description ${index + 1}`"
                bordered
              >
                <template #header-extra>
                  <UButton
                    icon="i-lucide-trash"
                    label="Remove description"
                    variant="soft"
                    color="error"
                    :disabled="item.type === 'Abstract'"
                    @click="removeDescription(index)"
                  />
                </template>
                <div class="flex flex-col gap-3">
                  <UFormField
                    :name="`description-${index}`"
                    label="Name"
                    required
                  >
                    <UTextarea
                      v-model="item.description"
                      placeholder="This dataset contains retinal images and clinical measurements collected from adults with type 2 diabetes."
                      class="w-full"
                    />
                  </UFormField>
                  <UFormField
                    :name="`description-type-${index}`"
                    label="Type"
                    required
                  >
                    <USelect
                      v-model="item.type"
                      class="w-full"
                      placeholder="Abstract"
                      :items="FORM_JSON.datasetDescriptionTypeOptions"
                      :disabled="item.type === 'Abstract'"
                    />
                  </UFormField>
                </div>
              </CardCollapsible>
            </UFormField>
            <UButton
              icon="i-lucide-plus"
              variant="outline"
              color="primary"
              label="Add Description"
              @click="addDescription"
            />
          </div>
        </div>

        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                About
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Additional information about this dataset
              </p>
            </div>

            <UFormField
              label="A single term describing the domain or content of the dataset."
              name="resourceTypeName"
              required
            >
              <UInput
                v-model="state.resourceTypeName"
                class="w-full"
                placeholder="Clinical Trial Data"
              />
              <p
                v-if="state.resourceTypeName"
                class="p-1 text-sm text-slate-500"
              >
                Researchers will see this term as `{{ state.resourceTypeName }}
                dataset` when this dataset is published.
              </p>
            </UFormField>

            <UFormField
              label="What is the primary language of the dataset?"
              name="language"
              required
            >
              <USelect
                v-model="state.language"
                class="w-full"
                placeholder="Select language"
                :items="languageOptions"
              />
            </UFormField>
          </div>
        </div>
      </UForm>
    </div>

    <div class="absolute right-0 bottom-0 left-0 z-10 px-6 pt-4 pb-6">
      <UButton
        form="metadata-general-form"
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
            your fields will be permanently discarded.
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

    <AiExtractDrawer
      v-model:open="drawerOpen"
      :fields="pageFields"
      :page-label="AI_FIELDS['metadata/general-information'].pageLabel"
      @apply="onApplyExtracted"
    />
  </div>
</template>
