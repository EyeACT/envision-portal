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
  acknowledgement: z.string(),
  alternateIdentifiers: z.array(
    z.object({
      id: z.string(),
      deleted: z.boolean(),
      identifier: z.string(),
      local: z.boolean(),
      type: z.string(),
    }),
  ),
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
  format: z.array(z.string()),
  relatedIdentifiers: z.array(
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
  size: z.array(z.string()),
  standardsFollowed: z.string(),
  subjects: z.array(
    z.object({
      id: z.string(),
      classificationCode: z.string(),
      deleted: z.boolean(),
      local: z.boolean(),
      scheme: z.string(),
      schemeUri: z.string(),
      subject: z.string(),
      valueUri: z.string(),
    }),
  ),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  acknowledgement: "",
  alternateIdentifiers: [],
  dates: [],
  format: [],
  relatedIdentifiers: [],
  size: [],
  standardsFollowed: "",
  subjects: [],
});

const { data, error, refresh } = await useFetch(
  `/api/datasets/${datasetId}/metadata/additional-details`,
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

  state.acknowledgement = data.value.DatasetOther?.acknowledgement ?? "";
  state.alternateIdentifiers = data.value.DatasetAlternateIdentifier.map(
    (item: any) => ({
      id: item.id,
      deleted: false,
      identifier: item.identifier,
      local: false,
      type: item.type,
    }),
  );
  state.dates = data.value.DatasetDate.map((item: any) => ({
    id: item.id,
    date: item.date ? dayjs(item.date).format("YYYY-MM-DD") : "",
    deleted: false,
    information: item.information,
    local: false,
    type: item.type,
  }));
  state.format = [...(data.value.DatasetOther?.format ?? [])];
  state.relatedIdentifiers = data.value.DatasetRelatedIdentifier.map(
    (item: any) => ({
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
    }),
  );
  state.size = [...(data.value.DatasetOther?.size ?? [])];
  state.standardsFollowed = data.value.DatasetOther?.standardsFollowed ?? "";
  state.subjects = data.value.DatasetSubject.map((item: any) => ({
    id: item.id,
    classificationCode: item.classificationCode,
    deleted: false,
    local: false,
    scheme: item.scheme,
    schemeUri: item.schemeUri,
    subject: item.subject,
    valueUri: item.valueUri,
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

// New rows can simply be dropped, but saved rows are flagged so the server deletes them.
const removeRow = (rows: { deleted: boolean; local: boolean }[], i: number) => {
  const row = rows[i];
  if (!row) return;

  if (row.local) {
    rows.splice(i, 1);
  } else {
    row.deleted = true;
  }
};

const addAlternateIdentifier = () => {
  state.alternateIdentifiers.push({
    id: nanoid(),
    deleted: false,
    identifier: "",
    local: true,
    type: "",
  });
};

const addRelatedIdentifier = () => {
  state.relatedIdentifiers.push({
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

const addSubject = () => {
  state.subjects.push({
    id: nanoid(),
    classificationCode: "",
    deleted: false,
    local: true,
    scheme: "",
    schemeUri: "",
    subject: "",
    valueUri: "",
  });
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

const usesMetadataScheme = (relationType: string) =>
  relationType === "IsMetadataFor" || relationType === "HasMetadata";

// Helper to check format based on identifier type
const getFormatError = (identifier: string, type: string): string | null => {
  if (type?.trim().toUpperCase() === "DOI") {
    // Basic DOI regex pattern check (e.g. 10.xxxx/...)
    const doiRegex = /^10.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;
    if (!doiRegex.test(identifier.trim())) {
      return "Invalid DOI format (10.1000/182)";
    }
  }

  return null;
};

const validateAlternateIdentifiers = (state: any, errors: FormError[]) => {
  const seen = new Set<string>();

  state.alternateIdentifiers.forEach((item: any, index: number) => {
    if (item.deleted) return;

    const identifierKey = `alternate-identifier-${index}`;

    const key = `${item.identifier?.trim().toLowerCase()}|${item.type?.trim().toLowerCase()}`;
    if (seen.has(key)) {
      errors.push({
        name: identifierKey,
        message: "Duplicate identifier with same value and type.",
      });
    }
    seen.add(key);

    if (!item.identifier?.trim()) {
      errors.push({
        name: identifierKey,
        message: "Identifier value is required.",
      });
    } else {
      const formatError = getFormatError(item.identifier, item.type);
      if (formatError) {
        errors.push({ name: identifierKey, message: formatError });
      }
    }

    if (!item.type?.trim()) {
      errors.push({
        name: `alternate-type-${index}`,
        message: "Identifier type is required.",
      });
    }
  });
};

const validateRelatedIdentifiers = (state: any, errors: FormError[]) => {
  const seen = new Set<string>();

  state.relatedIdentifiers.forEach((item: any, index: number) => {
    if (item.deleted) return;

    const fieldName = (field: string) =>
      `relatedIdentifiers[${index}].${field}`;

    const key = `${item.identifier?.trim().toLowerCase()}|${item.identifierType?.trim().toLowerCase()}|${item.relationType?.trim().toLowerCase()}`;
    if (seen.has(key)) {
      errors.push({
        name: fieldName("identifier"),
        message:
          "Duplicate related identifier with same value, type, and relation.",
      });
    }
    seen.add(key);

    if (!item.identifier?.trim()) {
      errors.push({
        name: fieldName("identifier"),
        message: "Identifier is required",
      });
    } else {
      const type = item.identifierType?.toUpperCase();

      if (type === "ORCID" && !isValidORCIDValue(item.identifier)) {
        errors.push({
          name: fieldName("identifier"),
          message: "Invalid ORCID value",
        });
      }
      if (type === "ROR" && !isValidRORValue(item.identifier)) {
        errors.push({
          name: fieldName("identifier"),
          message: "Invalid ROR value",
        });
      }
    }

    if (!item.identifierType?.trim()) {
      errors.push({
        name: fieldName("identifierType"),
        message: "Identifier type is required",
      });
    }

    if (!item.relationType?.trim()) {
      errors.push({
        name: fieldName("relationType"),
        message: "Relation type is required",
      });
    }

    if (usesMetadataScheme(item.relationType)) {
      if (!item.relatedMetadataScheme?.trim()) {
        errors.push({
          name: fieldName("relatedMetadataScheme"),
          message: "Related metadata scheme is required",
        });
      }

      if (!item.schemeType?.trim()) {
        errors.push({
          name: fieldName("schemeType"),
          message: "Scheme type is required",
        });
      }

      if (!item.schemeUri?.trim()) {
        errors.push({
          name: fieldName("schemeUri"),
          message: "Scheme URI is required",
        });
      } else if (!isValidUrl(item.schemeUri)) {
        errors.push({
          name: fieldName("schemeUri"),
          message: "Scheme URI must be a valid URL",
        });
      }
    }
  });
};

const validateSubjects = (state: any, errors: FormError[]) => {
  const seen = new Set<string>();

  state.subjects.forEach((subject: any, index: number) => {
    if (subject.deleted) return;

    const key = subject.subject?.trim().toLowerCase();
    if (seen.has(key)) {
      errors.push({
        name: `subjects[${index}].subject`,
        message: "Duplicate subject.",
      });
    }
    seen.add(key);

    if (!subject.subject?.trim()) {
      errors.push({
        name: `subjects[${index}].subject`,
        message: "Subject is required",
      });
    }

    const code = subject.classificationCode?.trim();
    const scheme = subject.scheme?.trim();

    if ((code && !scheme) || (!code && scheme)) {
      errors.push({
        name: `subjects[${index}].classificationCode`,
        message:
          "Classification code and scheme must both be provided together",
      });
      errors.push({
        name: `subjects[${index}].scheme`,
        message:
          "Scheme and classification code must both be provided together",
      });
    }

    if (subject.schemeUri && !isValidUrl(subject.schemeUri)) {
      errors.push({
        name: `subjects[${index}].schemeUri`,
        message: "Scheme URI must be a valid URL if provided",
      });
    }

    if (subject.valueUri && !isValidUrl(subject.valueUri)) {
      errors.push({
        name: `subjects[${index}].valueUri`,
        message: "Value URI must be a valid URL",
      });
    }
  });
};

const validateDates = (state: any, errors: FormError[]) => {
  const seen = new Set<string>();

  state.dates.forEach((item: any, index: number) => {
    if (item.deleted) return;

    const key = item.type?.trim().toLowerCase();
    if (seen.has(key)) {
      errors.push({
        name: `date-type-${index}`,
        message: "Duplicate date. Dates are unique by type",
      });
    }
    seen.add(key);

    if (!item.date?.trim()) {
      errors.push({
        name: `date-${index}`,
        message: "Date value is required.",
      });
    }
    if (!item.type?.trim()) {
      errors.push({
        name: `date-type-${index}`,
        message: "Date type is required.",
      });
    }
  });
};

const validate = (state: any): FormError[] => {
  const errors: FormError[] = [];

  validateAlternateIdentifiers(state, errors);
  validateRelatedIdentifiers(state, errors);
  validateSubjects(state, errors);
  validateDates(state, errors);

  const seenSizes = new Set<string>();
  state.size.forEach((size: string, index: number) => {
    if (seenSizes.has(size.trim().toLowerCase())) {
      errors.push({
        name: `size-${index}`,
        message: "Duplicate size value.",
      });
    } else {
      seenSizes.add(size.trim().toLowerCase());
    }
  });

  return errors;
};

// Prepares a row for the API: new rows have no id, and only removed rows carry `deleted`.
const toRequestRow = (row: any) => {
  const d = { ...row };

  if (d.local) delete d.id;
  if (!d.deleted) delete d.deleted;

  return d;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;
  isSubmitting.value = true;

  const formData = event.data;

  const b = {
    DatasetAlternateIdentifier: formData.alternateIdentifiers.map(toRequestRow),
    DatasetDate: formData.dates.map(toRequestRow),
    DatasetOther: {
      acknowledgement: formData.acknowledgement,
      format: formData.format.filter((format) => format !== ""),
      size: formData.size.filter((size) => size !== ""),
      standardsFollowed: formData.standardsFollowed,
    },
    DatasetRelatedIdentifier: formData.relatedIdentifiers.map((row) =>
      // Scheme fields are hidden unless the relation type uses them, so drop any left behind.
      toRequestRow(
        usesMetadataScheme(row.relationType)
          ? row
          : {
              ...row,
              relatedMetadataScheme: "",
              schemeType: "",
              schemeUri: "",
            },
      ),
    ),
    DatasetSubject: formData.subjects.map(toRequestRow),
  };

  try {
    await $fetch(`/api/datasets/${datasetId}/metadata/additional-details`, {
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
    console.log(err);
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
            label: 'Additional Details',
            to: `/app/datasets/${datasetId}/metadata/additional-details`,
          },
        ]"
      />

      <UForm
        id="metadata-additional-details-form"
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
              Additional Details
            </h1>
          </div>
          <p class="text-gray-500 dark:text-gray-400">
            Everything on this page is optional. Add any other details that help
            people find, cite, and understand this dataset.
          </p>
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
                Add any other identifiers for this dataset. The primary
                identifier is generated automatically when you publish a
                version, and is shown on the
                <NuxtLink
                  :to="`/app/datasets/${datasetId}`"
                  class="text-blue-500"
                >
                  dataset overview
                </NuxtLink>
                page.
              </p>
            </div>

            <UFormField name="alternateIdentifiers">
              <CardCollapsible
                v-for="(item, index) in state.alternateIdentifiers"
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
                    @click="removeRow(state.alternateIdentifiers, index)"
                  />
                </template>

                <div class="flex flex-col gap-3">
                  <UFormField
                    :name="`alternate-identifier-${index}`"
                    label="Identifier"
                    required
                  >
                    <UInput
                      v-model="item.identifier"
                      placeholder="10.1000/182"
                    />
                  </UFormField>

                  <UFormField
                    :name="`alternate-type-${index}`"
                    label="Type"
                    required
                  >
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
              @click="addAlternateIdentifier"
            />
          </div>
        </div>

        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Related Identifiers
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Add identifiers for publications, datasets, and other resources
                related to this dataset.
              </p>
            </div>

            <UFormField name="relatedIdentifiers">
              <CardCollapsible
                v-for="(item, index) in state.relatedIdentifiers"
                v-show="!item.deleted"
                :key="item.id"
                class="my-1 shadow-none"
                :title="item.identifier || `Related Identifier ${index + 1}`"
                bordered
              >
                <template #header-extra>
                  <UButton
                    icon="i-lucide-trash"
                    label="Remove related identifier"
                    variant="soft"
                    color="error"
                    @click="removeRow(state.relatedIdentifiers, index)"
                  />
                </template>

                <div class="flex flex-col gap-3">
                  <UFormField
                    label="Identifier"
                    :name="`relatedIdentifiers[${index}].identifier`"
                    required
                  >
                    <UInput
                      v-model="item.identifier"
                      placeholder="10.1000/182"
                    />
                  </UFormField>

                  <UFormField
                    label="Identifier Type"
                    :name="`relatedIdentifiers[${index}].identifierType`"
                    required
                  >
                    <USelect
                      v-model="item.identifierType"
                      class="w-full"
                      placeholder="DOI"
                      :items="FORM_JSON.datasetIdentifierTypeOptions"
                    />
                  </UFormField>

                  <UFormField
                    label="Relation Type"
                    :name="`relatedIdentifiers[${index}].relationType`"
                    required
                  >
                    <USelect
                      v-model="item.relationType"
                      class="w-full"
                      placeholder="Is Part Of"
                      :items="
                        FORM_JSON.datasetRelatedIdentifierRelationTypeOptions
                      "
                    />
                  </UFormField>

                  <UFormField
                    label="Resource Type"
                    :name="`relatedIdentifiers[${index}].resourceType`"
                  >
                    <USelect
                      v-model="item.resourceType"
                      class="w-full"
                      placeholder="Dataset"
                      :items="
                        FORM_JSON.datasetRelatedIdentifierResourceTypeOptions
                      "
                    />
                  </UFormField>

                  <template v-if="usesMetadataScheme(item.relationType)">
                    <UFormField
                      label="Related Metadata Scheme"
                      :name="`relatedIdentifiers[${index}].relatedMetadataScheme`"
                      required
                    >
                      <UInput
                        v-model="item.relatedMetadataScheme"
                        class="w-full"
                        placeholder="DataCite"
                      />
                    </UFormField>

                    <UFormField
                      label="Scheme Type"
                      :name="`relatedIdentifiers[${index}].schemeType`"
                      required
                    >
                      <UInput
                        v-model="item.schemeType"
                        class="w-full"
                        placeholder="XSD"
                      />
                    </UFormField>

                    <UFormField
                      label="Scheme URI"
                      :name="`relatedIdentifiers[${index}].schemeUri`"
                      required
                    >
                      <UInput
                        v-model="item.schemeUri"
                        class="w-full"
                        placeholder="https://datacite.org/schema/datacite-metadata-v4.3.xsd"
                      />
                    </UFormField>
                  </template>
                </div>
              </CardCollapsible>
            </UFormField>

            <UButton
              icon="i-lucide-plus"
              variant="outline"
              color="primary"
              label="Add Related Identifier"
              @click="addRelatedIdentifier"
            />
          </div>
        </div>

        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Subjects
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Add any subjects for this dataset.
              </p>
            </div>

            <UFormField name="subjects">
              <CardCollapsible
                v-for="(item, index) in state.subjects"
                v-show="!item.deleted"
                :key="item.id"
                class="my-1 shadow-none"
                :title="item.subject || `Subject ${index + 1}`"
                bordered
              >
                <template #header-extra>
                  <UButton
                    icon="i-lucide-trash"
                    label="Remove subject"
                    variant="soft"
                    color="error"
                    @click="removeRow(state.subjects, index)"
                  />
                </template>

                <div class="flex flex-col gap-3">
                  <UFormField
                    label="Subject"
                    :name="`subjects[${index}].subject`"
                    required
                  >
                    <UInput
                      v-model="item.subject"
                      placeholder="Diabetes Mellitus, Type 2"
                      class="w-full"
                    />
                  </UFormField>

                  <MetadataOptionalFields
                    :values="[
                      item.classificationCode,
                      item.scheme,
                      item.schemeUri,
                      item.valueUri,
                    ]"
                  >
                    <UFormField
                      label="Classification Code"
                      :name="`subjects[${index}].classificationCode`"
                      :required="
                        !!item.classificationCode?.trim() ||
                        !!item.scheme?.trim()
                      "
                    >
                      <UInput
                        v-model="item.classificationCode"
                        placeholder="D003924"
                        class="w-full"
                      />
                    </UFormField>

                    <div class="flex w-full gap-3">
                      <UFormField
                        label="Scheme"
                        :name="`subjects[${index}].scheme`"
                        class="w-full"
                        :required="
                          !!item.classificationCode?.trim() ||
                          !!item.scheme?.trim()
                        "
                      >
                        <UInput
                          v-model="item.scheme"
                          placeholder="MeSH"
                          class="w-full"
                        />
                      </UFormField>

                      <UFormField
                        label="Scheme URI"
                        :name="`subjects[${index}].schemeUri`"
                        class="w-full"
                      >
                        <UInput
                          v-model="item.schemeUri"
                          placeholder="https://meshb.nlm.nih.gov/"
                          class="w-full"
                        />
                      </UFormField>
                    </div>

                    <UFormField
                      label="Value URI"
                      :name="`subjects[${index}].valueUri`"
                    >
                      <UInput
                        v-model="item.valueUri"
                        placeholder="https://meshb.nlm.nih.gov/record/ui?ui=D003924"
                        class="w-full"
                      />
                    </UFormField>
                  </MetadataOptionalFields>
                </div>
              </CardCollapsible>
            </UFormField>

            <UButton
              icon="i-lucide-plus"
              variant="outline"
              color="primary"
              label="Add Subject"
              @click="addSubject"
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
                Add any dates that describe the dataset.
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
                    @click="removeRow(state.dates, index)"
                  />
                </template>
                <div class="flex flex-col gap-3">
                  <UFormField :name="`date-${index}`" label="Date" required>
                    <UInput
                      v-model="item.date"
                      placeholder="2021-01-01"
                      class="w-full"
                      type="date"
                    />
                  </UFormField>
                  <UFormField
                    :name="`date-type-${index}`"
                    label="Type"
                    required
                  >
                    <USelect
                      v-model="item.type"
                      class="w-full"
                      placeholder="Collected"
                      :items="FORM_JSON.datasetDateTypeOptions"
                    />
                  </UFormField>
                  <UFormField label="Information" name="information">
                    <UTextarea
                      v-model="item.information"
                      placeholder="Date the first participant's data was collected"
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

        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Size
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Size (bytes, pages, inches, etc.) or duration (extent), hours,
                minutes, days, etc., of a resource
              </p>
            </div>

            <UFormField name="size">
              <div
                v-for="(size, index) in state.size"
                :key="index"
                class="mb-4 flex items-start gap-2"
              >
                <UFormField class="w-full" :name="`size-${index}`" label="">
                  <UInput
                    v-model="state.size[index]"
                    placeholder="45 minutes"
                  />
                </UFormField>

                <div class="mt-1">
                  <UButton
                    size="sm"
                    color="error"
                    variant="outline"
                    icon="i-lucide-trash"
                    @click="state.size.splice(index, 1)"
                  />
                </div>
              </div>

              <UButton
                size="sm"
                class="w-full"
                color="success"
                variant="outline"
                label="Add Size"
                icon="i-lucide-plus"
                @click="state.size.push('')"
              />
            </UFormField>
          </div>
        </div>

        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Format
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Technical format of the data files in the dataset. Use file
                extension or MIME type where possible, PDF, XML, MPG or
                application/pdf, text/xml, video/mpeg.
              </p>
            </div>

            <UFormField label="" name="format">
              <div
                v-for="(format, index) in state.format"
                :key="index"
                class="mb-4 flex items-start gap-2"
              >
                <UInput
                  v-model="state.format[index]"
                  class="w-full"
                  placeholder="CSV"
                />

                <UButton
                  size="sm"
                  color="error"
                  variant="outline"
                  icon="i-lucide-trash"
                  @click="state.format.splice(index, 1)"
                />
              </div>

              <UButton
                size="sm"
                class="w-full"
                color="success"
                variant="outline"
                label="Add Format"
                icon="i-lucide-plus"
                @click="state.format.push('')"
              />
            </UFormField>
          </div>
        </div>

        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Standards Followed
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Mention the standards followed to structure the dataset, format
                the data files, etc. Make sure to include identifiers of the
                standards when available and/or link to the associated
                documentation.
              </p>
            </div>

            <UFormField label="" name="standardsFollowed">
              <UTextarea
                v-model="state.standardsFollowed"
                class="w-full"
                placeholder="Data files follow the CMDS folder structure, and clinical data use the OMOP Common Data Model v5.4."
              />
            </UFormField>
          </div>
        </div>

        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Acknowledgement
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Brief description of how to acknowledge the dataset, in APA
                format (refer to the ACKNOWLEDGEMENT.txt file for additional
                details).
              </p>
            </div>

            <UFormField label="" name="acknowledgement">
              <UTextarea
                v-model="state.acknowledgement"
                class="w-full"
                placeholder="Doe, J., &amp; Smith, J. (2026). Retinal imaging in type 2 diabetes [Data set]. University of Example."
              />
            </UFormField>
          </div>
        </div>
      </UForm>
    </div>

    <div class="absolute right-0 bottom-0 left-0 z-10 px-6 pt-4 pb-6">
      <UButton
        form="metadata-additional-details-form"
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
  </div>
</template>
