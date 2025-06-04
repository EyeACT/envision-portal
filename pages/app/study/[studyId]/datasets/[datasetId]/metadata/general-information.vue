<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, FormError } from "@nuxt/ui";
import { nanoid } from "nanoid";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

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
      type: z.string(),
    }),
  ),
  descriptions: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      deleted: z.boolean(),
    }),
  ),
  titles: z.array(
    z.object({
      id: z.string(),
      deleted: z.boolean(),
      description: z.string(),
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

  state.dates = data.value.DatasetDate.map((date: any) => ({
    id: date.id,
    date: date.date,
    deleted: false,
    information: date.information,
    type: date.type,
  }));
  state.descriptions = data.value.DatasetDescription.map(
    (description: any) => ({
      id: description.id,
      name: description.name,
      deleted: false,
    }),
  );
  state.titles = data.value.DatasetTitle.map((title: any) => ({
    id: title.id,
    deleted: false,
    description: title.description,
    local: title.local,
    type: title.type,
  }));
}

const addSecondaryIdentifier = () => {
  state.secondaryIdentifiers.push({
    id: nanoid(),
    deleted: false,
    domain: "",
    identifier: "",
    link: "",
    local: true,
    type: "",
  });
};

const removeSecondaryIdentifier = (index: number) => {
  const secondaryIdentifier = state.secondaryIdentifiers[index];

  if (secondaryIdentifier.local) {
    state.secondaryIdentifiers.splice(index, 1);
  } else {
    secondaryIdentifier.deleted = true;
  }
};

const validate = (state: any): FormError[] => {
  const errors = [];

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;

  const formData = event.data;

  const b = {};

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
      // refresh the page
      window.location.reload();

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
        { label: data?.title, to: `/app/study/${studyId}` },
        {
          label: 'Metadata',
        },
        {
          label: 'About',
          to: `/app/study/${studyId}/metadata/about`,
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
                Keywords
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Please add some keywords that describe the study. These will be
                used to help find the study when searching for it.
              </p>
            </div>

            <UFormField name="keywords">
              <CardCollapsible
                v-for="(item, index) in state.keywords"
                v-show="!item.deleted"
                :key="item.id"
                class="my-1 shadow-none"
                :title="item.name || `Keyword ${index + 1}`"
                bordered
              >
                <template #header-extra>
                  <UButton
                    icon="i-lucide-trash"
                    label="Remove keyword"
                    variant="soft"
                    color="error"
                    @click="removeKeyword(index)"
                  />
                </template>

                <div class="flex flex-col gap-3">
                  <UFormField label="Name" name="name">
                    <UInput
                      v-model="item.name"
                      placeholder="Artifical Intelligence"
                    />
                  </UFormField>

                  <UFormField label="Identifier" name="classificationCode">
                    <UInput
                      v-model="item.classificationCode"
                      placeholder="D001185"
                    />
                  </UFormField>

                  <UFormField label="Identifier Scheme" name="scheme">
                    <UInput v-model="item.scheme" placeholder="MeSH" />
                  </UFormField>

                  <UFormField label="Scheme URI" name="schemeUri">
                    <UInput
                      v-model="item.schemeUri"
                      placeholder="https://meshb.nlm.nih.gov/"
                    />
                  </UFormField>

                  <UFormField label="Keyword URI" name="keywordUri">
                    <UInput
                      v-model="item.keywordUri"
                      placeholder="https://meshb.nlm.nih.gov/record/ui?ui=D001185"
                    />
                  </UFormField>
                </div>
              </CardCollapsible>
            </UFormField>

            <UButton
              icon="i-lucide-plus"
              variant="outline"
              color="primary"
              label="Add Keyword"
              @click="addKeyword"
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

    <pre> {{ data }}</pre>
  </div>
</template>
