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

const { datasetId } = route.params as {
  datasetId: string;
};

const saveLoading = ref(false);

const schema = z.object({
  identifiers: z.array(
    z.object({
      id: z.string(),
      deleted: z.boolean(),
      identifier: z.string(),
      identifierType: z.string(),
      local: z.boolean(),
      relatedMetadataScheme: z.string(),
      relationType: z.string(),
      resourceType: z.string(),
      schemeType: z.string(),
      schemeUri: z.string(),
    }),
  ),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  identifiers: [],
});

const { data, error } = await useFetch(
  `/api/datasets/${datasetId}/metadata/related-identifiers`,
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

  state.identifiers = data.value.DatasetRelatedIdentifier.map((item: any) => ({
    id: item.id,
    deleted: false,
    identifier: item.identifier,
    identifierType: item.identifierType,
    local: false,
    relatedMetadataScheme: item.relatedMetadataScheme,
    relationType: item.relationType,
    resourceType: item.resourceType,
    schemeType: item.schemeType,
    schemeUri: item.schemeUri,
  }));
}

const addIdentifier = () => {
  state.identifiers.push({
    id: nanoid(),
    deleted: false,
    identifier: "",
    identifierType: "",
    local: true,
    relatedMetadataScheme: "",
    relationType: "",
    resourceType: "",
    schemeType: "",
    schemeUri: "",
  });
};

const removeIdentifier = (index: number) => {
  const identifier = state.identifiers[index];

  if (identifier.local) {
    state.identifiers.splice(index, 1);
  } else {
    identifier.deleted = true;
  }
};

const validate = (state: any): FormError[] => {
  const errors = [];

  if (state.identifiers.length === 0) {
    errors.push({
      message: "Please add at least one related identifier",
      path: "identifiers",
    });
  }

  state.identifiers.forEach((identifier: any) => {
    if (
      identifier.relationType === "IsMetadataFor" ||
      identifier.relationType === "HasMetadata"
    ) {
      if (!identifier.relatedMetadataScheme) {
        errors.push({
          message: "Please add a related metadata scheme",
          path: "identifiers",
        });
      }

      if (!identifier.schemeType) {
        errors.push({
          message: "Please add a scheme type",
          path: "identifiers",
        });
      }

      if (!identifier.schemeUri) {
        errors.push({
          message: "Please add a scheme URI",
          path: "identifiers",
        });
      }
    }
  });

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;

  const formData = event.data;

  const b = {
    relatedIdentifiers: formData.identifiers.map((identifier: any) => {
      const d = identifier;

      if (d.local) {
        delete d.id;
      }
      if (!d.deleted) {
        delete d.deleted;
      }

      return d;
    }),
  };

  await $fetch(`/api/datasets/${datasetId}/metadata/related-identifiers`, {
    body: b,
    method: "PUT",
  })
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
        description: "Failed to submit the form.",
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
        { label: data?.title, to: `/app/datasets/${datasetId}` },
        {
          label: 'Related Identifiers',
          to: `/app/datasets/${datasetId}/metadata/related-identifiers`,
        },
      ]"
    />

    <div class="flex w-full flex-col gap-6 pb-5">
      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full items-center justify-between gap-3">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Related Identifiers
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
                Related Identifiers
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Please add some related identifiers that describe the dataset.
              </p>
            </div>

            <UFormField name="identifiers">
              <CardCollapsible
                v-for="(item, index) in state.identifiers"
                v-show="!item.deleted"
                :key="item.id"
                class="my-1 shadow-none"
                :title="item.identifier || `Related Identifier ${index + 1}`"
                bordered
              >
                <template #header-extra>
                  <UButton
                    icon="i-lucide-trash"
                    label="Remove secondary identifier"
                    variant="soft"
                    color="error"
                    @click="removeIdentifier(index)"
                  />
                </template>

                <div class="flex flex-col gap-3">
                  <UFormField label="Identifier" name="identifier">
                    <UInput
                      v-model="item.identifier"
                      placeholder="10.1000/182"
                    />
                  </UFormField>

                  <UFormField label="Identifier Type" name="identifierType">
                    <USelect
                      v-model="item.identifierType"
                      class="w-full"
                      placeholder="DOI"
                      :items="FORM_JSON.datasetIdentifierTypeOptions"
                    />
                  </UFormField>

                  <UFormField label="Relation Type" name="relationType">
                    <USelect
                      v-model="item.relationType"
                      class="w-full"
                      placeholder="Is Part Of"
                      :items="
                        FORM_JSON.datasetRelatedIdentifierRelationTypeOptions
                      "
                    />
                  </UFormField>

                  <UFormField label="Resource Type" name="resourceType">
                    <USelect
                      v-model="item.resourceType"
                      class="w-full"
                      placeholder="Dataset"
                      :items="
                        FORM_JSON.datasetRelatedIdentifierResourceTypeOptions
                      "
                    />
                  </UFormField>

                  <UFormField
                    label="Related Metadata Scheme"
                    name="relatedMetadataScheme"
                  >
                    <UInput
                      v-model="item.relatedMetadataScheme"
                      class="w-full"
                      :disabled="
                        item.relationType !== 'IsMetadataFor' &&
                        item.relationType !== 'HasMetadata'
                      "
                      placeholder="DataCite"
                    />
                  </UFormField>

                  <UFormField label="Scheme Type" name="schemeType">
                    <UInput
                      v-model="item.schemeType"
                      class="w-full"
                      :disabled="
                        item.relationType !== 'IsMetadataFor' &&
                        item.relationType !== 'HasMetadata'
                      "
                      placeholder="DataCite"
                    />
                  </UFormField>

                  <UFormField label="Scheme URI" name="schemeUri">
                    <UInput
                      v-model="item.schemeUri"
                      class="w-full"
                      :disabled="
                        item.relationType !== 'IsMetadataFor' &&
                        item.relationType !== 'HasMetadata'
                      "
                      placeholder="https://datacite.org/schema/datacite-metadata-v4.3.xsd"
                    />
                  </UFormField>
                </div>
              </CardCollapsible>
            </UFormField>

            <UButton
              icon="i-lucide-plus"
              variant="outline"
              color="primary"
              label="Add Related Identifier"
              @click="addIdentifier"
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
