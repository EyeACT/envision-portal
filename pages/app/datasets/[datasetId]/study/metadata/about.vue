<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, FormError } from "@nuxt/ui";
import { nanoid } from "nanoid";
import FORM_JSON from "@/assets/data/form.json";
import { isValidUrl } from "~/utils/validations";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { datasetId } = route.params as { datasetId: string };

const saveLoading = ref(false);

const schema = z.object({
  briefSummary: z.string().min(1, "Brief summary is required"),
  conditions: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      classificationCode: z.string(),
      conditionUri: z.string(),
      deleted: z.boolean(),
      local: z.boolean(),
      scheme: z.string(),
      schemeUri: z.string(),
    }),
  ),
  detailedDescription: z.string(),
  keywords: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      classificationCode: z.string(),
      deleted: z.boolean(),
      keywordUri: z.string(),
      local: z.boolean(),
      scheme: z.string(),
      schemeUri: z.string(),
    }),
  ),
  primaryIdentifier: z.object({
    domain: z.string(),
    identifier: z.string(),
    link: z.string(),
    type: z.string().min(1, "Type is required"),
  }),
  secondaryIdentifiers: z.array(
    z.object({
      id: z.string(),
      deleted: z.boolean(),
      domain: z.string(),
      identifier: z.string(),
      link: z.string(),
      local: z.boolean(),
      type: z.string(),
    }),
  ),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  briefSummary: "",
  conditions: [],
  detailedDescription: "",
  keywords: [],
  primaryIdentifier: {
    domain: "",
    identifier: "",
    link: "",
    type: "",
  },
  secondaryIdentifiers: [],
});

const { data, error } = await useFetch(
  `/api/datasets/${datasetId}/study/metadata/about`,
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

  state.briefSummary = data.value.StudyDescription?.briefSummary || "";
  state.detailedDescription =
    data.value.StudyDescription?.detailedDescription || "";

  state.keywords = data.value.StudyKeywords.map((keyword) => ({
    id: keyword.id,
    name: keyword.name,
    classificationCode: keyword.classificationCode,
    deleted: false,
    keywordUri: keyword.keywordUri,
    local: false,
    scheme: keyword.scheme,
    schemeUri: keyword.schemeUri,
  }));

  state.conditions = data.value.StudyConditions.map((condition) => ({
    id: condition.id,
    name: condition.name,
    classificationCode: condition.classificationCode,
    conditionUri: condition.conditionUri,
    deleted: false,
    local: false,
    scheme: condition.scheme,
    schemeUri: condition.schemeUri,
  }));

  state.primaryIdentifier = {
    domain: data.value.primaryIdentifier?.identifierDomain || "",
    identifier: data.value.primaryIdentifier?.identifier || "",
    link: data.value.primaryIdentifier?.identifierLink || "",
    type: data.value.primaryIdentifier?.identifierType || "",
  };

  state.secondaryIdentifiers = data.value.secondaryIdentifiers.map(
    (identifier) => ({
      id: identifier.id,
      deleted: false,
      domain: identifier.identifierDomain || "",
      identifier: identifier.identifier,
      link: identifier.identifierLink || "",
      local: false,
      type: identifier.identifierType || "",
    }),
  );
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

const addKeyword = () => {
  state.keywords.push({
    id: nanoid(),
    name: "",
    classificationCode: "",
    deleted: false,
    keywordUri: "",
    local: true,
    scheme: "",
    schemeUri: "",
  });
};

const removeKeyword = (index: number) => {
  const keyword = state.keywords[index];

  if (keyword.local) {
    state.keywords.splice(index, 1);
  } else {
    keyword.deleted = true;
  }
};

const addCondition = () => {
  state.conditions.push({
    id: nanoid(),
    name: "",
    classificationCode: "",
    conditionUri: "",
    deleted: false,
    local: true,
    scheme: "",
    schemeUri: "",
  });
};

const removeCondition = (index: number) => {
  const condition = state.conditions[index];

  if (condition.local) {
    state.conditions.splice(index, 1);
  } else {
    condition.deleted = true;
  }
};

const validate = (state: any): FormError[] => {
  const errors = [];

  if (!state.briefSummary) {
    errors.push({
      name: "briefSummary",
      message: "A brief summary is required",
    });
  }

  if (state.keywords.length === 0) {
    errors.push({
      name: "keywords",
      message: "At least one keyword is required",
    });
  }
  const activeKeywords = state.keywords.filter((k: any) => !k.deleted);

  if (activeKeywords.length === 0) {
    errors.push({
      name: "keywords",
      message: "At least one keyword is required",
    });
  }

  activeKeywords.forEach((keyword: any, index: number) => {
    if (!keyword.name) {
      errors.push({
        name: `name-${index}`,
        message: "A name is required",
      });
    }

    // if classificationCode or scheme is provided, the other is also required
    if (
      (keyword.classificationCode && !keyword.scheme) ||
      (!keyword.classificationCode && keyword.scheme)
    ) {
      const messages = [
        {
          name: `classificationCode-${index}`,
          message:
            "Both identifier and scheme are required if either is provided",
        },
        {
          name: `scheme-${index}`,
          message:
            "Both identifier and scheme are required if either is provided",
        },
      ];

      errors.push(...messages);
    }

    if (
      keyword.classificationCode &&
      keyword.scheme?.toUpperCase() === "ORCID" &&
      !isValidORCIDValue(keyword.classificationCode)
    ) {
      errors.push({
        name: `classificationCode-${index}`,
        message: "ORCID identifier must be a valid ORCID format",
      });
    }

    if (
      keyword.classificationCode &&
      keyword.scheme?.toUpperCase() === "ROR" &&
      !isValidRORValue(keyword.classificationCode)
    ) {
      errors.push({
        name: `classificationCode-${index}`,
        message: "ROR identifier must be a valid ROR format",
      });
    }

    // Verify url for classificationCode and schemeUri
    if (keyword.keywordUri && keyword.schemeUri) {
      // validate url
      if (!isValidUrl(keyword.keywordUri)) {
        errors.push({
          name: `schemeUri-${index}`,
          message: "Invalid URL format",
        });
      }
      if (!isValidUrl(keyword.schemeUri)) {
        errors.push({
          name: `keywordUri-${index}`,
          message: "Invalid URL format",
        });
      }
    }
  });

  if (state.conditions.length === 0) {
    errors.push({
      name: "conditions",
      message: "At least one condition is required",
    });
  }
  const activeConditions = state.conditions.filter((c: any) => !c.deleted);

  if (activeConditions.length === 0) {
    errors.push({
      name: "conditions",
      message: "At least one condition is required",
    });
  }

  activeConditions.forEach((condition: any, index: number) => {
    if (!condition.name) {
      errors.push({ name: `name-${index}`, message: "Name is required" });
    }

    if (
      (condition.classificationCode && !condition.scheme) ||
      (!condition.classificationCode && condition.scheme)
    ) {
      const messages = [
        {
          name: `classificationCode-${index}`,
          message:
            "Both Identifier and scheme are required if either is provided",
        },
        {
          name: `scheme-${index}`,
          message:
            "Both Identifier and scheme are required if either is provided",
        },
      ];

      errors.push(...messages);
    }

    if (
      condition.classificationCode &&
      condition.scheme?.toUpperCase() === "ORCID" &&
      !isValidORCIDValue(condition.classificationCode)
    ) {
      errors.push({
        name: `classificationCode-${index}`,
        message: "ORCID identifier must be a valid ORCID format",
      });
    }

    if (
      condition.classificationCode &&
      condition.scheme?.toUpperCase() === "ROR" &&
      !isValidRORValue(condition.classificationCode)
    ) {
      errors.push({
        name: `classificationCode-${index}`,
        message: "ROR identifier must be a valid ROR format",
      });
    }

    // Verify url for schemeuri and keyworduri
    if (condition.conditionUri && !isValidUrl(condition.conditionUri)) {
      // validate url
      errors.push({
        name: `schemeUri-${index}`,
        message: "Invalid URL format",
      });
    }

    if (condition.schemeUri && !isValidUrl(condition.schemeUri)) {
      errors.push({
        name: `keywordUri-${index}`,
        message: "Invalid URL format",
      });
    }
  });

  if (!state.primaryIdentifier.identifier) {
    errors.push({
      name: "primaryIdentifier.identifier",
      message: "Primary identifier is required",
    });
  }

  if (!state.primaryIdentifier.type) {
    errors.push({
      name: "primaryIdentifier.type",
      message: "Primary identifier type is required",
    });
  }

  if (
    state.primaryIdentifier.domain &&
    !isValidUrl(state.primaryIdentifier.domain)
  ) {
    errors.push({
      name: "primaryIdentifier.domain",
      message: "Primary identifier domain must be a valid URL",
    });
  }

  if (
    state.primaryIdentifier.link &&
    !isValidUrl(state.primaryIdentifier.link)
  ) {
    errors.push({
      name: "primaryIdentifier.link",
      message: "Primary identifier link must be a valid URL",
    });
  }

  if (state.secondaryIdentifiers.length === 0) {
    errors.push({
      name: "secondaryIdentifiers",
      message: "At least one secondary identifier is required",
    });
  }

  const activeSecondaryIDs = state.secondaryIdentifiers.filter(
    (i: any) => !i.deleted,
  );

  if (activeSecondaryIDs.length === 0) {
    errors.push({
      name: "secondaryIdentifiers",
      message: "At least one second identifier is required",
    });
  }

  activeSecondaryIDs.forEach((identifier: any, index: number) => {
    if (!identifier.identifier) {
      errors.push({
        name: `identifier-${index}`,
        message: "Identifier is required",
      });
    }

    if (!identifier.type) {
      errors.push({
        name: `type-${index}`,
        message: "Identifier type is required",
      });
    }

    if (identifier.domain && !isValidUrl(identifier.domain)) {
      errors.push({
        name: `domain-${index}`,
        message: "Invalid URL format",
      });
    }

    if (identifier.link && !isValidUrl(identifier.link)) {
      errors.push({
        name: `link-${index}`,
        message: "Invalid URL format",
      });
    }
  });

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;

  const formData = event.data;

  const b = {
    briefSummary: formData.briefSummary,
    conditions: formData.conditions.map((condition: any) => {
      const c = condition;

      if (c.local) {
        delete c.id;
      }
      if (!c.deleted) {
        delete c.deleted;
      }

      return c;
    }),
    detailedDescription: formData.detailedDescription,
    keywords: formData.keywords.map((keyword: any) => {
      const k = keyword;

      if (k.local) {
        delete k.id;
      }
      if (!k.deleted) {
        delete k.deleted;
      }

      return k;
    }),
    primaryIdentifier: formData.primaryIdentifier,
    secondaryIdentifiers: formData.secondaryIdentifiers.map(
      (identifier: any) => {
        const i = identifier;

        if (i.local) {
          delete i.id;
        }
        if (!i.deleted) {
          delete i.deleted;
        }

        return i;
      },
    ),
  };

  console.log(JSON.stringify(b, null, 2));

  await $fetch(`/api/datasets/${datasetId}/study/metadata/about`, {
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
    })
    .catch((err) => {
      console.log(err);

      toast.add({
        title: "Error",
        color: "error",
        description: "Error occurred while submitting the form.",
      });
    })
    .finally(() => {
      // refresh the page
      // window.location.reload();

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
          label: 'Study Metadata',
        },
        {
          label: 'About',
          to: `/app/datasets/${datasetId}/study-metadata/about`,
        },
      ]"
    />

    <div class="flex w-full flex-col gap-6 pb-5">
      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full items-center justify-between gap-3">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            About
          </h1>
        </div>

        <p class="text-gray-500 dark:text-gray-400">
          Some basic information about the study is displayed here.
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
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">
              Description
            </h2>

            <UFormField label="Brief Summary" name="briefSummary" required>
              <UTextarea
                v-model="state.briefSummary"
                class="w-full"
                placeholder="Short description of the clinical study, written in a language intended for lay public."
              />
            </UFormField>

            <UFormField label="Detailed Description" name="detailedDescription">
              <UTextarea
                v-model="state.detailedDescription"
                class="w-full"
                placeholder="Extended description of the study, including more technical information (as compared to the Brief Summary), if desired. Do not include the entire protocol; do not duplicate information recorded in other data elements, such as Eligibility Criteria or outcome measures."
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
                Keywords
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Please add at least one keyword that describes the study. These
                will be used to help find the study when searching for it.
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
                  <UFormField label="Name" :name="`name-${index}`" required>
                    <UInput
                      v-model="item.name"
                      placeholder="Artifical Intelligence"
                    />
                  </UFormField>

                  <UFormField
                    label="Identifier"
                    :name="`classificationCode-${index}`"
                  >
                    <UInput
                      v-model="item.classificationCode"
                      placeholder="D001185"
                    />
                  </UFormField>

                  <UFormField
                    label="Identifier Scheme"
                    :name="`scheme-${index}`"
                  >
                    <UInput v-model="item.scheme" placeholder="MeSH" />
                  </UFormField>

                  <UFormField label="Scheme URI" :name="`schemeUri-${index}`">
                    <UInput
                      v-model="item.schemeUri"
                      placeholder="https://meshb.nlm.nih.gov/"
                    />
                  </UFormField>

                  <UFormField label="Keyword URI" :name="`keywordUri-${index}`">
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

        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Conditions
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Please add some conditions that describe the study. These are
                usually the diseases or conditions that the study is
                investigating.
              </p>
            </div>

            <UFormField name="conditions">
              <CardCollapsible
                v-for="(item, index) in state.conditions"
                v-show="!item.deleted"
                :key="item.id"
                class="my-1 shadow-none"
                :title="item.name || `Condition ${index + 1}`"
                bordered
              >
                <template #header-extra>
                  <UButton
                    icon="i-lucide-trash"
                    label="Remove condition"
                    variant="soft"
                    color="error"
                    @click="removeCondition(index)"
                  />
                </template>

                <div class="flex flex-col gap-3">
                  <UFormField label="Name" :name="`name-${index}`" required>
                    <UInput v-model="item.name" placeholder="Glaucoma" />
                  </UFormField>

                  <UFormField
                    label="Identifier"
                    :name="`classificationCode-${index}`"
                  >
                    <UInput
                      v-model="item.classificationCode"
                      placeholder="D001185"
                    />
                  </UFormField>

                  <UFormField
                    label="Identifier Scheme"
                    :name="`scheme-${index}`"
                  >
                    <UInput v-model="item.scheme" placeholder="MeSH" />
                  </UFormField>

                  <UFormField label="Scheme URI" :name="`schemeUri-${index}`">
                    <UInput
                      v-model="item.schemeUri"
                      placeholder="https://meshb.nlm.nih.gov/"
                    />
                  </UFormField>

                  <UFormField label="Keyword URI" :name="`keywordUri-${index}`">
                    <UInput
                      v-model="item.conditionUri"
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
              label="Add Condition"
              @click="addCondition"
            />
          </div>
        </div>

        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">
              Primary Identifier
            </h2>

            <UFormField
              label="Identifier"
              name="primaryIdentifier.identifier"
              required
            >
              <UInput
                v-model="state.primaryIdentifier.identifier"
                class="w-full"
                placeholder="10.1234/1234567890"
              />
            </UFormField>

            <UFormField
              label="Identifier Type"
              name="primaryIdentifier.type"
              required
            >
              <USelect
                v-model="state.primaryIdentifier.type"
                class="w-full"
                placeholder="NIH Grant Number"
                :items="
                  FORM_JSON.studyMetadataIdentificationPrimaryIdentifierTypeOptions
                "
              />
            </UFormField>

            <UFormField
              label="Identifier Domain"
              name="primaryIdentifier.domain"
            >
              <UInput
                v-model="state.primaryIdentifier.domain"
                placeholder="https://doi.org"
              />
            </UFormField>

            <UFormField label="Identifier Link" name="primaryIdentifier.link">
              <UInput
                v-model="state.primaryIdentifier.link"
                placeholder="https://doi.org/10.1234/1234567890"
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
                Alternative Identifiers
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Please add some secondary identifiers that describe the study.
                These are usually any other identifiers that are not the primary
                identifier.
              </p>
            </div>

            <UFormField name="secondaryIdentifiers">
              <CardCollapsible
                v-for="(item, index) in state.secondaryIdentifiers"
                v-show="!item.deleted"
                :key="item.id"
                class="my-1 shadow-none"
                :title="item.identifier || `Identifier ${index + 1}`"
                bordered
              >
                <template #header-extra>
                  <UButton
                    icon="i-lucide-trash"
                    label="Remove identifier"
                    variant="soft"
                    color="error"
                    @click="removeSecondaryIdentifier(index)"
                  />
                </template>

                <div class="flex flex-col gap-3">
                  <UFormField
                    label="Identifier"
                    :name="`identifier-${index}`"
                    required
                  >
                    <UInput
                      v-model="item.identifier"
                      placeholder="10.1234/1234567890"
                    />
                  </UFormField>

                  <UFormField
                    label="Identifier Type"
                    :name="`type-${index}`"
                    required
                  >
                    <USelect
                      v-model="item.type"
                      class="w-full"
                      placeholder="NIH Grant Number"
                      :items="
                        FORM_JSON.studyMetadataIdentificationPrimaryIdentifierTypeOptions
                      "
                    />
                  </UFormField>

                  <UFormField
                    label="Identifier Domain"
                    :name="`domain-${index}`"
                  >
                    <UInput
                      v-model="item.domain"
                      placeholder="https://doi.org"
                    />
                  </UFormField>

                  <UFormField label="Identifier Link" :name="`link-${index}`">
                    <UInput
                      v-model="item.link"
                      placeholder="https://doi.org/10.1234/1234567890"
                    />
                  </UFormField>
                </div>
              </CardCollapsible>
            </UFormField>

            <UButton
              icon="i-lucide-plus"
              variant="outline"
              color="primary"
              label="Add Alternative Identifier"
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
