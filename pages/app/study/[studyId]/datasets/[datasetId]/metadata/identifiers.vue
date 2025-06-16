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

const { datasetId, studyId } = route.params as {
  datasetId: string;
  studyId: string;
};

const saveLoading = ref(false);

const schema = z.object({
  secondaryIdentifiers: z.array(
    z.object({
      id: z.string(),
      deleted: z.boolean(),
      identifier: z.string(),
      local: z.boolean(),
      type: z.string(),
    }),
  ),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  secondaryIdentifiers: [],
});

const { data, error } = await useFetch(
  `/api/studies/${studyId}/datasets/${datasetId}/metadata/identifiers`,
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

  state.secondaryIdentifiers = data.value.DatasetAlternateIdentifier.map(
    (item: any) => ({
      id: item.id,
      deleted: false,
      identifier: item.identifier,
      local: false,
      type: item.type,
    }),
  );
}

const addSecondaryIdentifier = () => {
  state.secondaryIdentifiers.push({
    id: nanoid(),
    deleted: false,
    identifier: "",
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

  if (state.secondaryIdentifiers.length === 0) {
    errors.push({
      message: "Please add at least one secondary identifier",
      path: "secondaryIdentifiers",
    });
  }

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;

  const formData = event.data;

  const b = {
    DatasetAlternateIdentifier: formData.secondaryIdentifiers.map(
      (secondaryIdentifier: any) => {
        const d = secondaryIdentifier;

        if (d.local) {
          delete d.id;
        }
        if (!d.deleted) {
          delete d.deleted;
        }

        return d;
      },
    ),
  };

  await $fetch(
    `/api/studies/${studyId}/datasets/${datasetId}/metadata/identifiers`,
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
        { label: 'Dashboard', to: '/app/dashboard' },
        { label: data?.study.title, to: `/app/study/${studyId}` },
        {
          label: data?.title,
          to: `/app/study/${studyId}/datasets/${datasetId}`,
        },
        {
          label: 'Identifiers',
          to: `/app/study/${studyId}/datasets/${datasetId}/metadata/identifiers`,
        },
      ]"
    />

    <div class="flex w-full flex-col gap-6 pb-5">
      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full items-center justify-between gap-3">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Identifiers
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
                Primary Identifiers
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                The primary identifier for your dataset is generated
                automatically when you publish a version of your dataset. You
                can find the identifier for the latest published version of your
                dataset on the
                <NuxtLink
                  :to="`/app/study/${studyId}/datasets/${datasetId}`"
                  class="text-blue-500"
                >
                  dataset overview
                </NuxtLink>
                page.
              </p>
            </div>
          </div>
        </div>

        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Secondary Identifiers
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Please add some secondary identifiers that describe the dataset.
              </p>
            </div>

            <UFormField name="secondaryIdentifiers">
              <CardCollapsible
                v-for="(item, index) in state.secondaryIdentifiers"
                v-show="!item.deleted"
                :key="item.id"
                class="my-1 shadow-none"
                :title="item.identifier || `Secondary Identifier ${index + 1}`"
                bordered
              >
                <template #header-extra>
                  <UButton
                    icon="i-lucide-trash"
                    label="Remove secondary identifier"
                    variant="soft"
                    color="error"
                    @click="removeSecondaryIdentifier(index)"
                  />
                </template>

                <div class="flex flex-col gap-3">
                  <UFormField label="Identifier" name="identifier">
                    <UInput
                      v-model="item.identifier"
                      placeholder="10.1000/182"
                    />
                  </UFormField>

                  <UFormField label="Type" name="type">
                    <USelect
                      v-model="item.type"
                      class="w-full"
                      placeholder="DOI"
                      :items="FORM_JSON.datasetIdentifierTypeOptions"
                    />
                  </UFormField>
                </div>
              </CardCollapsible>
            </UFormField>

            <UButton
              icon="i-lucide-plus"
              variant="outline"
              color="primary"
              label="Add Secondary Identifier"
              @click="addSecondaryIdentifier"
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
