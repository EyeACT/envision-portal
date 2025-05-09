<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, FormError } from "@nuxt/ui";
import { nanoid } from "nanoid";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { studyId } = route.params as { studyId: string };

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
  detailedDescription: z.string().min(1, "Detailed description is required"),
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
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  briefSummary: "",
  conditions: [],
  detailedDescription: "",
  keywords: [],
});

const { data, error } = await useFetch(
  `/api/studies/${studyId}/metadata/about`,
  {},
);

if (error.value) {
  toast.add({
    title: "Error fetching study",
    description: "Please try again later",
    icon: "material-symbols:error",
  });

  await navigateTo("/");
}

if (data.value) {
  useSeoMeta({
    title: data.value.title,
  });

  state.briefSummary = data.value.StudyDescription[0].briefSummary;
  state.detailedDescription =
    data.value.StudyDescription[0].detailedDescription;

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
}

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
    errors.push({ name: "briefSummary", message: "Required" });
  }

  if (!state.detailedDescription) {
    errors.push({ name: "detailedDescription", message: "Required" });
  }

  if (state.keywords.length === 0) {
    errors.push({
      name: "keywords",
      message: "At least one keyword is required",
    });
  } else {
    state.keywords.forEach((keyword: any) => {
      if (!keyword.name) {
        errors.push({ name: "keywords", message: "A name is required" });
      }

      // if classificationCode or scheme is provided, the other is also required
      if (keyword.classificationCode && !keyword.scheme) {
        errors.push({
          name: "keywords",
          message:
            "Both identifier and scheme are required if either is provided ",
        });
      }

      if (keyword.scheme && !keyword.classificationCode) {
        errors.push({
          name: "keywords",
          message:
            "Both identifier and scheme are required if either is provided",
        });
      }
    });
  }

  if (state.conditions.length === 0) {
    errors.push({
      name: "conditions",
      message: "At least one condition is required",
    });
  } else {
    state.conditions.forEach((condition: any) => {
      if (!condition.name) {
        errors.push({ name: "conditions", message: "Required" });
      }
    });

    state.conditions.forEach((condition: any) => {
      if (condition.classificationCode && !condition.scheme) {
        errors.push({ name: "conditions", message: "Required" });
      }

      if (condition.scheme && !condition.classificationCode) {
        errors.push({ name: "conditions", message: "Required" });
      }
    });
  }

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  toast.add({
    title: "Success",
    color: "success",
    description: "The form has been submitted.",
  });
  await console.log(event.data);
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

    <div class="flex w-full flex-col gap-6">
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

            <UFormField label="Brief Summary" name="briefSummary">
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
                Please add some keywords that describe the study. These will be
                used to help find the study when searching for it.
              </p>
            </div>

            <UFormField name="keywords">
              <CardCollapsible
                v-for="(item, index) in state.keywords"
                :key="item.id"
                class="shadow-none"
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
                :key="item.id"
                class="shadow-none"
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
                  <UFormField label="Name" name="name">
                    <UInput v-model="item.name" placeholder="Glaucoma" />
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

        <UButton
          type="submit"
          class="w-full"
          size="lg"
          label="Save Metadata"
          icon="i-lucide-save"
        />
      </UForm>

      <div>
        <pre>{{ data }}</pre>

        <pre>{{ state }}</pre>
      </div>
    </div>
  </div>
</template>
