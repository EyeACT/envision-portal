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

const { datasetId, studyId } = route.params as {
  datasetId: string;
  studyId: string;
};

const saveLoading = ref(false);

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
  `/api/studies/${studyId}/datasets/${datasetId}/metadata/general-information`,
  {},
);

if (error.value) {
  toast.add({
    title: "Error fetching study",
    description: "Please try again later",
    icon: "material-symbols:error",
  });

  // await navigateTo("/");
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
}

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

  if (date.local) {
    state.dates.splice(index, 1);
  } else {
    date.deleted = true;
  }
};

const validate = (state: any): FormError[] => {
  const errors = [];

  if (state.titles.length === 0) {
    errors.push({
      message: "Please add at least one title",
      path: "titles",
    });
  }

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;

  const formData = event.data;

  const b = {
    DatasetDate: formData.dates.map((date: any) => {
      const d = date;

      if (d.local) {
        delete d.id;
      }
      if (!d.deleted) {
        delete d.deleted;
      }

      return d;
    }),
    DatasetDescription: formData.descriptions.map((description: any) => {
      const d = description;

      if (d.local) {
        delete d.id;
      }
      if (!d.deleted) {
        delete d.deleted;
      }

      return d;
    }),
    DatasetTitle: formData.titles.map((title: any) => {
      const d = title;

      if (d.local) {
        delete d.id;
      }
      if (!d.deleted) {
        delete d.deleted;
      }

      return d;
    }),
  };

  await $fetch(
    `/api/studies/${studyId}/datasets/${datasetId}/metadata/general-information`,
    {
      body: b,
      method: "PUT",
    },
  )
    .then((res) => {
      console.log(res);

      toast.add({
        title: "Success",
        color: "success",
        description: "The form has been submitted.",
      });

      // refresh the page
      window.location.reload();
    })
    .catch((err) => {
      console.log(err);

      toast.add({
        title: "Error",
        color: "error",
        description: "The form has been submitted.",
      });
    })
    .finally(() => {
      saveLoading.value = false;
    });
}
</script>

<template>
  <div>
    <UBreadcrumb
      class="mb-4 ml-2"
      :items="[
        { label: 'Home', to: '/' },
        { label: 'Dashboard', to: '/app/dashboard' },
        { label: data?.study.title, to: `/app/study/${studyId}` },
        {
          label: data?.title,
          to: `/app/study/${studyId}/datasets/${datasetId}`,
        },
        {
          label: 'General Information',
          to: `/app/study/${studyId}/datasets/${datasetId}/metadata/general-information`,
        },
      ]"
    />

    <div class="flex w-full flex-col gap-6 pb-5">
      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full items-center justify-between gap-3">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            General Information
          </h1>
        </div>

        <p class="text-gray-500 dark:text-gray-400">
          Some basic information about the dataset is displayed here.
        </p>
      </div>

      <UForm
        :validate="validate"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Titles
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Please add some titles that describe the dataset.
              </p>
            </div>

            <UFormField name="titles">
              <CardCollapsible
                v-for="(item, index) in state.titles"
                v-show="!item.deleted"
                :key="item.id"
                class="my-1 shadow-none"
                :title="item.title || `Title ${index + 1}`"
                bordered
              >
                <template #header-extra>
                  <UButton
                    icon="i-lucide-trash"
                    label="Remove title"
                    variant="soft"
                    color="error"
                    @click="removeTitle(index)"
                  />
                </template>

                <div class="flex flex-col gap-3">
                  <UFormField label="Name" name="name">
                    <UInput
                      v-model="item.title"
                      placeholder="Artifical Intelligence"
                    />
                  </UFormField>

                  <UFormField label="Type" name="type">
                    <USelect
                      v-model="item.type"
                      class="w-full"
                      placeholder="Alternative title"
                      :items="FORM_JSON.datasetTitleTypeOptions"
                      :disabled="item.type === 'MainTitle'"
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
                Please add some descriptions that describe the dataset.
              </p>
            </div>

            <UFormField name="descriptions">
              <CardCollapsible
                v-for="(item, index) in state.descriptions"
                v-show="!item.deleted"
                :key="item.id"
                class="my-1 shadow-none"
                :title="item.description || `Description ${index + 1}`"
                bordered
              >
                <template #header-extra>
                  <UButton
                    icon="i-lucide-trash"
                    label="Remove description"
                    variant="soft"
                    color="error"
                    @click="removeDescription(index)"
                  />
                </template>

                <div class="flex flex-col gap-3">
                  <UFormField label="Name" name="name">
                    <UTextarea
                      v-model="item.description"
                      placeholder="Artifical Intelligence"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField label="Type" name="type">
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
                Dates
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Please add some dates that describe the dataset.
              </p>
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
                  <UButton
                    icon="i-lucide-trash"
                    label="Remove date"
                    variant="soft"
                    color="error"
                    @click="removeDate(index)"
                  />
                </template>

                <div class="flex flex-col gap-3">
                  <UFormField label="Date" name="date">
                    <UInput
                      v-model="item.date"
                      placeholder="2021-01-01"
                      class="w-full"
                      type="date"
                    />
                  </UFormField>

                  <UFormField label="Type" name="type">
                    <USelect
                      v-model="item.type"
                      class="w-full"
                      placeholder="Date"
                      :items="FORM_JSON.datasetDateTypeOptions"
                    />
                  </UFormField>

                  <UFormField label="Information" name="information">
                    <UTextarea
                      v-model="item.information"
                      placeholder="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos."
                      class="w-full"
                    />
                  </UFormField>
                </div>
              </CardCollapsible>
            </UFormField>

            <UButton
              icon="i-lucide-plus"
              variant="outline"
              color="primary"
              label="Add Date"
              @click="addDate"
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
