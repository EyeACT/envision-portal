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
  conditions: z.array(z.string()).min(1, "Conditions are required"),
  detailedDescription: z.string().min(1, "Detailed description is required"),
  keywords: z.array(z.string()).min(1, "Keywords are required"),
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
  state.keywords.push("");
};

const removeKeyword = (index: number) => {
  state.keywords.splice(index, 1);
};

const addCondition = () => {
  state.conditions.push("");
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

            <UFormField label="Keywords" name="keywords">
              <div class="flex flex-col gap-2">
                <div
                  v-for="(_keyword, index) in state.keywords"
                  v-show="state.keywords.length > 0"
                  :key="index"
                  class="flex items-center gap-2"
                >
                  <UInput v-model="state.keywords[index]" />

                  <UButton
                    icon="i-lucide-trash"
                    variant="outline"
                    color="error"
                    size="sm"
                    @click="removeKeyword(index)"
                  />
                </div>

                <UButton
                  icon="i-lucide-plus"
                  variant="outline"
                  color="primary"
                  label="Add Keyword"
                  @click="addKeyword"
                />
              </div>
            </UFormField>
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

            <UFormField label="Conditions" name="conditions">
              <div class="flex flex-col gap-2">
                <div
                  v-for="(_condition, index) in state.conditions"
                  v-show="state.conditions.length > 0"
                  :key="index"
                  class="flex items-center gap-2"
                >
                  <UInput v-model="state.conditions[index]" />

                  <UButton
                    icon="i-lucide-trash"
                    variant="outline"
                    color="error"
                    size="sm"
                    @click="removeCondition(index)"
                  />
                </div>

                <UButton
                  icon="i-lucide-plus"
                  variant="outline"
                  color="primary"
                  label="Add Condition"
                  @click="addCondition"
                />
              </div>
            </UFormField>
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
