<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";

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
      id: z.number(),
      name: z.string(),
      classificationCode: z.string(),
      conditionUri: z.string(),
      scheme: z.string(),
      schemeUri: z.string(),
    }),
  ),
  detailedDescription: z.string().min(1, "Detailed description is required"),
  keywords: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      classificationCode: z.string(),
      keywordUri: z.string(),
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
  keywords: [
    {
      id: 1,
      name: "Keyword 1",
      classificationCode: "NCT",
      keywordUri: "https://www.clinicaltrials.gov/keyword/1",
      scheme: "NCT",
      schemeUri: "https://www.clinicaltrials.gov",
    },
  ],
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
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  toast.add({
    title: "Success",
    color: "success",
    description: "The form has been submitted.",
  });
  await console.log(event.data);
}
const addKeyword = () => {
  state.keywords.push({
    id: state.keywords.length + 1,
    name: "",
    classificationCode: "",
    keywordUri: "",
    scheme: "",
    schemeUri: "",
  });
};

const removeKeyword = (index: number) => {
  state.keywords.splice(index, 1);
};

const addCondition = () => {
  state.conditions.push({
    id: state.conditions.length + 1,
    name: "",
    classificationCode: "",
    conditionUri: "",
    scheme: "",
    schemeUri: "",
  });
};

const removeCondition = (index: number) => {
  state.conditions.splice(index, 1);
};
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
        :schema="schema"
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
