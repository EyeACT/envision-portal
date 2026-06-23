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
  studyArms: z.array(
    z.object({
      id: z.string(),
      deleted: z.boolean(),
      description: z.string(),
      interventionList: z.array(z.string()),
      label: z.string(),
      local: z.boolean(),
      type: z.string().optional(),
    }),
  ),
  studyType: z.string(),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  studyArms: [],
  studyType: "",
});

const { data, error } = await useFetch(
  `/api/datasets/${datasetId}/study/metadata/arms`,
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

  state.studyArms = data.value.StudyArm.map((arm: any) => ({
    id: arm.id,
    deleted: false,
    description: arm.description,
    interventionList: arm.interventionList,
    label: arm.label,
    local: false,
    type: arm.type || "",
  }));
  state.studyType = data.value.StudyDesign?.studyType ?? "";

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

const addArm = () => {
  state.studyArms.push({
    id: nanoid(),
    deleted: false,
    description: "",
    interventionList: [],
    label: "",
    local: true,
    type: "",
  });
};

const removeArm = (index: number) => {
  const arm = state.studyArms[index];

  if (arm?.local) {
    state.studyArms.splice(index, 1);
  } else {
    arm!.deleted = true;
  }
};

const validate = (state: any): FormError[] => {
  const errors = [];

  if (state.studyArms.length === 0) {
    errors.push({
      name: "studyArms",
      message: "At least one study arm is required",
    });
  }

  const activeArms = state.studyArms.filter((arm: any) => !arm.deleted);

  if (activeArms.length === 0) {
    errors.push({
      name: "studyArms",
      message: "At least one active study arm is required",
    });
  }

  const seen = new Set<string>();
  activeArms.forEach((arm: any, index: number) => {
    const key = arm.label?.trim().toLowerCase();
    if (seen.has(key)) {
      errors.push({
        name: `label-${index}`,
        message: "Duplicate arm label.",
      });
    }
    seen.add(key);
  });

  activeArms.forEach((arm: any, index: number) => {
    if (arm.label.trim() === "") {
      errors.push({
        name: `label-${index}`,
        message: "Label is required",
      });
    }

    if (arm.description.trim() === "") {
      errors.push({
        name: `description-${index}`,
        message: "Description is required",
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
    studyArms: formData.studyArms.map((arm: any) => {
      const s = { ...arm };

      s.interventionList = s.interventionList.filter((item: string) =>
        item.trim(),
      );

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
    const res = await $fetch(`/api/datasets/${datasetId}/study/metadata/arms`, {
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
            label: 'Arms',
            to: `/app/datasets/${datasetId}/study/metadata/arms`,
          },
        ]"
      />

      <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <div class="flex w-full items-center justify-between gap-3">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Arms</h1>
        </div>
        <p class="text-gray-500 dark:text-gray-400">
          Some basic information about the study is displayed here.
        </p>
      </div>

      <UAlert
        v-show="!state.studyType"
        title="Missing Study Type"
        description="Some information is missing from the study. Please add a study type to continue."
        color="error"
        variant="soft"
        orientation="horizontal"
        :actions="[
          {
            label: 'Add a study type',
            to: '/app/datasets/' + datasetId + '/study/metadata/design',
            color: 'warning',
          },
        ]"
      />

      <UForm
        id="study-metadata-arms-form"
        :validate="validate"
        :state="state"
        class="space-y-6"
        :disabled="!state.studyType"
        @submit="onSubmit"
      >
        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Study Arms Configuration
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Create and manage structural cohort allocations, groups, or comparison vectors participating in this setup.
              </p>
            </div>

            <UFormField name="studyArms">
              <CardCollapsible
                v-for="(item, index) in state.studyArms"
                v-show="!item.deleted"
                :key="item.id"
                class="my-2 shadow-none"
                :title="item.label || `Arm ${index + 1}`"
                bordered
              >
                <template #header-extra>
                  <UButton
                    icon="i-lucide-trash"
                    label="Remove Arm"
                    variant="soft"
                    color="error"
                    @click="removeArm(index)"
                  />
                </template>

                <div class="flex w-full flex-col gap-4 p-1">
                  <UFormField required label="Label" :name="`label-${index}`">
                    <UInput v-model="item.label" placeholder="e.g., Control Group, Experimental Arm A" />
                  </UFormField>

                  <UFormField
                    label="Description"
                    :name="`description-${index}`"
                    required
                  >
                    <UTextarea
                      v-model="item.description"
                      placeholder="Enter a descriptive detail outlining what distinguishes this research path alignment group"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField label="Type" :name="`type-${index}`">
                    <USelect
                      v-model="item.type as string"
                      placeholder="Select arm baseline type"
                      :items="FORM_JSON.studyMetadataArmsTypeOptions"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField label="Intervention List" name="interventionList">
                    <div v-if="item.interventionList.length > 0">
                      <div
                        v-for="(intervention, innerIndex) in item.interventionList"
                        :key="innerIndex"
                        class="mb-2 flex gap-2"
                      >
                        <UInput
                          v-model="item.interventionList[innerIndex]"
                          class="w-full"
                          placeholder="Provide descriptive active intervention label"
                        />

                        <UButton
                          size="sm"
                          color="error"
                          variant="outline"
                          icon="i-lucide-trash"
                          @click="item.interventionList.splice(innerIndex, 1)"
                        />

                        <UButton
                          size="sm"
                          color="success"
                          variant="outline"
                          icon="i-lucide-plus"
                          @click="item.interventionList.splice(innerIndex + 1, 0, '')"
                        />
                      </div>
                    </div>

                    <div v-else>
                      <UButton
                        :disabled="!state.studyType"
                        size="sm"
                        class="w-full"
                        color="success"
                        variant="outline"
                        label="Add Intervention"
                        icon="i-lucide-plus"
                        @click="item.interventionList.push('')"
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
              label="Add New Arm Layer"
              class="mt-2"
              @click="addArm"
            />
          </div>
        </div>
      </UForm>
    </div>

    <div class="absolute bottom-0 left-0 right-0 z-10 px-6 pb-6 pt-4">
      <UButton
        form="study-metadata-arms-form"
        type="submit"
        :disabled="saveLoading || !state.studyType"
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
            Are you sure you want to leave this page? Any modifications made to your configured study arm allocations will be permanently discarded.
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