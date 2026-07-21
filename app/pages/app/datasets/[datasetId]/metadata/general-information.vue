<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, FormError } from "@nuxt/ui";
import { nanoid } from "nanoid";
import FORM_JSON from "~/assets/data/form.json";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();
const dayjs = useDayjs();

const { datasetId } = route.params as {
  datasetId: string;
};

const saveLoading = ref(false);
const isSubmitting = ref(false);
const originalStateString = ref("");

const schema = z.object({
  dates: z.array(
    z.object({
      id: z.string(),
      date: z.string(),
      deleted: z.boolean(),
      information: z.string(),
      local: z.boolean(),
      type: z.string(),
    }),
  ),
  descriptions: z.array(
    z.object({
      id: z.string(),
      deleted: z.boolean(),
      description: z.string(),
      local: z.boolean(),
      type: z.string(),
    }),
  ),
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
  dates: [],
  descriptions: [],
  titles: [],
});

const { data, error } = await useFetch(
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

if (data.value) {
  useSeoMeta({
    title: data.value.title,
  });

  state.dates = data.value.DatasetDate.map((item: any) => ({
    id: item.id,
    date: item.date ? dayjs(item.date).format("YYYY-MM-DD") : "",
    deleted: false,
    information: item.information,
    local: false,
    type: item.type,
  }));
  state.descriptions = data.value.DatasetDescription.map(
    (description: any) => ({
      id: description.id,
      deleted: false,
      description: description.description,
      local: false,
      type: description.type,
    }),
  );
  state.titles = data.value.DatasetTitle.map((title: any) => ({
    id: title.id,
    title: title.title,
    deleted: false,
    local: false,
    type: title.type,
  }));

  originalStateString.value = JSON.stringify(state);
}

const isDirty = computed(() => {
  return JSON.stringify(state) !== originalStateString.value;
});

const { 
  showLeaveModal, 
  confirmLeave, 
  cancelLeave 
} = useUnsavedChangesGuard({ isDirty, isSubmitting });

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

const addDate = () => {
  state.dates.push({
    id: nanoid(),
    date: "",
    deleted: false,
    information: "",
    local: true,
    type: "",
  });
};

const removeDate = (index: number) => {
  const date = state.dates[index];
  if (!date) return;

  if (date.local) {
    state.dates.splice(index, 1);
  } else {
    date.deleted = true;
  }
};

const validate = (state: any): FormError[] => {
  const errors: FormError[] = [];
  const activeTitles = state.titles?.filter((item: any) => !item.deleted) ?? [];

  if (activeTitles.length === 0) {
    errors.push({ 
      name: "titles", 
      message: "Please add at least one title." 
    });
  }

  const seenTitles = new Set<string>();
  activeTitles.forEach((item: any, index: number) => {
    const key = item.title?.trim().toLowerCase();
    if (seenTitles.has(key)) {
      errors.push({ 
        name: `title-${index}`, 
        message: "Duplicate title." 
      });
    }
    seenTitles.add(key);
  });

  activeTitles.forEach((item: any, index: number) => {
    if (!item.title?.trim()) {
      errors.push({ 
        name: `title-${index}`, 
        message: "Title value is required." 
      });
    }
    if (!item.type?.trim()) {
      errors.push({ 
        name: `title-type-${index}`, 
        message: "Title type is required." 
      });
    }
  });

  const activeDescriptions = state.descriptions?.filter((item: any) => !item.deleted) ?? [];

  if (activeDescriptions.length === 0) {
    errors.push({ 
      name: "descriptions", 
      message: "At least one Abstract description is required." 
    });
  }

  const seenDescriptions = new Set<string>();
  activeDescriptions.forEach((item: any, index: number) => {
    const key = `${item.description?.trim().toLowerCase()}|${item.type?.trim().toLowerCase()}`;
    if (seenDescriptions.has(key)) {
      errors.push({ 
        name: `description-${index}`, 
        message: "Duplicate description with same type." 
      });
    }
    seenDescriptions.add(key);
  });

  activeDescriptions.forEach((item: any, index: number) => {
    if (!item.description?.trim()) {
      errors.push({ 
        name: `description-${index}`, 
        message: "Description value is required." 
      });
    }
    if (!item.type?.trim()) {
      errors.push({ 
        name: `description-type-${index}`, 
        message: "Description type is required." 
      });
    }
  });

  const activeDates = state.dates?.filter((item: any) => !item.deleted) ?? [];

  if (activeDates.length === 0) {
    errors.push({ 
      name: "dates", 
      message: "Please add at least one date." 
    });
  }

  const seenDates = new Set<string>();
  activeDates.forEach((item: any, index: number) => {
    const key = item.type?.trim().toLowerCase();
    if (seenDates.has(key)) {
      errors.push({ 
        name: `date-type-${index}`, 
        message: "Duplicate date. Dates are unique by type" 
      });
    }
    seenDates.add(key);
  });

  activeDates.forEach((item: any, index: number) => {
    if (!item.date?.trim()) {
      errors.push({ 
        name: `date-${index}`, 
        message: "Date value is required." 
      });
    }
    if (!item.type?.trim()) {
      errors.push({ 
        name: `date-type-${index}`, 
        message: "Date type is required." 
      });
    }
  });

  return errors;
};

async function executeSave(formData: typeof state) {
  saveLoading.value = true;
  isSubmitting.value = true;

  const b = {
    DatasetDate: formData.dates.map((date: any) => {
      const d = { ...date };
      if (d.local) delete d.id;
      if (!d.deleted) delete d.deleted;
      return d;
    }),
    DatasetDescription: formData.descriptions.map((description: any) => {
      const d = { ...description };
      if (d.local) delete d.id;
      if (!d.deleted) delete d.deleted;
      return d;
    }),
    DatasetTitle: formData.titles.map((title: any) => {
      const d = { ...title };
      if (d.local) delete d.id;
      if (!d.deleted) delete d.deleted;
      return d;
    }),
  };

  try {
    const res = await $fetch(`/api/datasets/${datasetId}/metadata/general-information`, {
      body: b,
      method: "PUT",
    });
    console.log(res);

    toast.add({
      title: "Success",
      color: "success",
      description: "The form has been submitted.",
    });

    originalStateString.value = JSON.stringify(state);
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
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-6rem)] relative overflow-hidden">
    
    <div class="flex-1 overflow-y-auto p-4 pb-28 space-y-6">
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
        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full items-center justify-between gap-3">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              General Information
            </h1>
          </div>
          <p class="text-gray-500 dark:text-gray-400">
            Some basic information about the dataset is displayed here.
          </p>
        </div>

        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
  <div class="flex w-full flex-col gap-4">
    <div class="flex w-full flex-col">
      <h2 class="text-lg font-bold text-gray-900 dark:text-white">Titles</h2>
      <p class="text-gray-500 dark:text-gray-400">Please add some titles that describe the dataset.</p>
    </div>
    <UFormField name="titles">
      <CardCollapsible
        v-for="(item, index) in state.titles"
        v-show="!item.deleted"
        :key="item.id"
        class="my-1 shadow-none"
        :title="item.type === 'MainTitle' ? 'Main Title' : (item.title || `Title ${index + 1}`)"
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
            <UInput v-model="item.title" placeholder="Artificial Intelligence" />
          </UFormField>
          
          <!-- Only show Type field if it is NOT a MainTitle -->
          <UFormField v-if="item.type !== 'MainTitle'" :name="`title-type-${index}`" label="Type">
            <USelect
              v-model="item.type"
              class="w-full"
              placeholder="Alternative title"
              :items="FORM_JSON.datasetTitleTypeOptions"
            />
          </UFormField>
        </div>
      </CardCollapsible>
    </UFormField>
    <UButton icon="i-lucide-plus" variant="outline" color="primary" label="Add Title" @click="addTitle" />
  </div>
</div>

        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">Descriptions</h2>
              <p class="text-gray-500 dark:text-gray-400">Please add some descriptions that describe the dataset.</p>
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
                  <UFormField :name="`description-${index}`" label="Name" required>
                    <UTextarea v-model="item.description" placeholder="Artifical Intelligence" class="w-full" />
                  </UFormField>
                  <UFormField :name="`description-type-${index}`" label="Type" required>
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
            <UButton icon="i-lucide-plus" variant="outline" color="primary" label="Add Description" @click="addDescription" />
          </div>
        </div>

        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">Dates</h2>
              <p class="text-gray-500 dark:text-gray-400">Please add some dates that describe the dataset.</p>
            </div>
            <UFormField name="dates">
              <CardCollapsible
                v-for="(item, index) in state.dates"
                v-show="!item.deleted"
                :key="item.id"
                class="my-1 shadow-none"
                :title="item.date || `Date ${index + 1}`"
                bordered
              >
                <template #header-extra>
                  <UButton icon="i-lucide-trash" label="Remove date" variant="soft" color="error" @click="removeDate(index)" />
                </template>
                <div class="flex flex-col gap-3">
                  <UFormField :name="`date-${index}`" label="Date" required>
                    <UInput v-model="item.date" placeholder="2021-01-01" class="w-full" type="date" />
                  </UFormField>
                  <UFormField :name="`date-type-${index}`" label="Type" required>
                    <USelect v-model="item.type" class="w-full" placeholder="Date" :items="FORM_JSON.datasetDateTypeOptions" />
                  </UFormField>
                  <UFormField label="Information" name="information">
                    <UTextarea v-model="item.information" placeholder="Details..." class="w-full" />
                  </UFormField>
                </div>
              </CardCollapsible>
            </UFormField>
            <UButton icon="i-lucide-plus" variant="outline" color="primary" label="Add Date" @click="addDate" />
          </div>
        </div>
      </UForm>
    </div>

    <div class="absolute bottom-0 left-0 right-0 z-10 px-6 pb-6 pt-4">
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
            Are you sure you want to leave this page? Any modifications made to your fields will be permanently discarded.
          </p>
          <div class="flex justify-end gap-3 pt-2">
            <UButton color="error" label="Discard Changes" @click="confirmLeave" />
          <UButton color="neutral" label="Stay on Page" @click="cancelLeave" />  
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>