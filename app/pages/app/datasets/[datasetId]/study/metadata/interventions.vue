<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import * as z from "zod";
import { nanoid } from "nanoid";
import type { FormSubmitEvent, FormError } from "@nuxt/ui";
import FORM_JSON from "~/assets/data/form.json";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { datasetId } = route.params as { datasetId: string };

const saveLoading = ref(false);
const isSubmitting = ref(false);
const originalStateString = ref("");

const schema = z.object({
  studyInterventions: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      deleted: z.boolean(),
      description: z.string(),
      local: z.boolean(),
      otherNameList: z.array(z.string()),
      type: z.string().nullable(),
    }),
  ),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  studyInterventions: [],
});

const { data, error } = await useFetch(
  `/api/datasets/${datasetId}/study/metadata/interventions`,
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

  state.studyInterventions = data.value.StudyIntervention.map(
    (intervention: any) => ({
      ...intervention,
      deleted: false,
      local: false,
    }),
  );

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

const addIntervention = () => {
  state.studyInterventions.push({
    id: nanoid(),
    name: "",
    deleted: false,
    description: "",
    local: true,
    otherNameList: [],
    type: null,
  });
};

const removeIntervention = (index: number) => {
  const intervention = state.studyInterventions[index];

  if (intervention?.local) {
    state.studyInterventions.splice(index, 1);
  } else {
    intervention!.deleted = true;
  }
};

const validate = (state: any): FormError[] => {
  const errors = [];
  const enumValues = FORM_JSON.studyMetadataInterventionsTypeOptions.map(
    (option) => option.value,
  );

  if (state.studyInterventions.length === 0) {
    errors.push({
      name: "studyInterventions",
      message: "At least one study intervention is required",
    });
  }

  const activeInterventions = state.studyInterventions.filter(
    (intervention: any) => !intervention.deleted,
  );

  if (activeInterventions.length === 0) {
    errors.push({
      name: "studyInterventions",
      message: "At least one study intervention is required",
    });
  }

  const seenInterventions = new Set<string>();
  activeInterventions.forEach((intervention: any, index: number) => {
    const key = intervention.name?.trim().toLowerCase();
    if (seenInterventions.has(key)) {
      errors.push({
        name: `name-${index}`,
        message: "Duplicate intervention.",
      });
    }
    seenInterventions.add(key);
  });

  activeInterventions.forEach((intervention: any, index: number) => {
    if (intervention.name.trim() === "") {
      errors.push({
        name: `name-${index}`,
        message: "Name is required",
      });
    }

    if (intervention.description.trim() === "") {
      errors.push({
        name: `description-${index}`,
        message: "Description is required",
      });
    }

    if (intervention.type === null) {
      errors.push({
        name: `type-${index}`,
        message: "Type is required",
      });
    }

    if (intervention.type && !enumValues.includes(intervention.type.trim())) {
      errors.push({
        name: `type-${index}`,
        message: "Type must be a valid option",
      });
    }
  });

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;
  isSubmitting.value = true;

  const formData = event.data;

  const b = {
    studyInterventions: formData.studyInterventions.map((intervention: any) => {
      const s = { ...intervention };

      s.otherNameList = s.otherNameList.filter((item: string) => item.trim());

      if (s.local) {
        delete s.id;
      }
      if (!s.deleted) {
        delete s.deleted;
      }

      return s;
    }),
  };

  try {
    const res = await $fetch(`/api/datasets/${datasetId}/study/metadata/interventions`, {
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
    console.log(err);

    toast.add({
      title: "Error",
      color: "error",
      description: "An error occurred while submitting the form.",
    });
  } finally {
    saveLoading.value = false;
    isSubmitting.value = false;
  }
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
            label: 'Study Metadata',
          },
          {
            label: 'Interventions',
            to: `/app/datasets/${datasetId}/study/metadata/interventions`,
          },
        ]"
      />

      <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <div class="flex w-full items-center justify-between gap-3">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Interventions
          </h1>
        </div>
        <p class="text-gray-500 dark:text-gray-400">
          Some basic information about the study is displayed here.
        </p>
      </div>

      <UForm
        id="study-metadata-interventions-form"
        :validate="validate"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Study Interventions Listing
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Register and define precise tracking metrics for procedural methods, therapeutic plans, or medicinal steps executed in this protocol.
              </p>
            </div>

            <UFormField name="studyInterventions">
              <CardCollapsible
                v-for="(item, index) in state.studyInterventions"
                v-show="!item.deleted"
                :key="item.id"
                class="my-2 shadow-none"
                :title="item.name || `Intervention ${index + 1}`"
                bordered
              >
                <template #header-extra>
                  <UButton
                    icon="i-lucide-trash"
                    label="Remove Intervention"
                    variant="soft"
                    color="error"
                    @click="removeIntervention(index)"
                  />
                </template>

                <div class="flex w-full flex-col gap-4 p-1">
                  <UFormField label="Type" :name="`type-${index}`" required>
                    <USelect
                      v-model="item.type as string"
                      placeholder="Select intervention format"
                      :items="FORM_JSON.studyMetadataInterventionsTypeOptions"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField label="Name" :name="`name-${index}`" required>
                    <UInput v-model="item.name" placeholder="e.g., Acetaminophen, Cognitive Behavioral Therapy" />
                  </UFormField>

                  <UFormField
                    label="Description"
                    :name="`description-${index}`"
                    required
                  >
                    <UTextarea
                      v-model="item.description"
                      placeholder="Specify clear and descriptive structural administration guidelines or details regarding this item layer"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField
                    label="Other Names / Synonyms"
                    :name="`otherNameList-${index}`"
                  >
                    <div v-if="item.otherNameList.length > 0">
                      <div
                        v-for="(otherName, innerIndex) in item.otherNameList"
                        :key="innerIndex"
                        class="mb-2 flex gap-2"
                      >
                        <UInput
                          v-model="item.otherNameList[innerIndex]"
                          class="w-full"
                          placeholder="Provide optional brand reference name or alias"
                        />

                        <UButton
                          size="sm"
                          color="error"
                          variant="outline"
                          icon="i-lucide-trash"
                          @click="item.otherNameList.splice(innerIndex, 1)"
                        />

                        <UButton
                          size="sm"
                          color="success"
                          variant="outline"
                          icon="i-lucide-plus"
                          @click="item.otherNameList.splice(innerIndex + 1, 0, '')"
                        />
                      </div>
                    </div>

                    <div v-else>
                      <UButton
                        size="sm"
                        class="w-full"
                        color="success"
                        variant="outline"
                        label="Add Other Name Entry"
                        icon="i-lucide-plus"
                        @click="item.otherNameList.push('')"
                      />
                    </div>
                  </UFormField>
                </div>
              </CardCollapsible>
            </UFormField>

            <UButton
              icon="i-lucide-plus"
              variant="outline"
              color="primary"
              label="Add New Intervention Card"
              class="mt-2"
              @click="addIntervention"
            />
          </div>
        </div>
      </UForm>
    </div>

    <div class="absolute bottom-0 left-0 right-0 z-10 px-6 pb-6 pt-4">
      <UButton
        form="study-metadata-interventions-form"
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
            Are you sure you want to leave this page? Any modifications made to your registered protocol study interventions will be permanently discarded.
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