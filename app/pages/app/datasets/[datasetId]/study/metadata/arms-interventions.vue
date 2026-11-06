<script setup lang="ts">
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
      interventionIds: z.array(z.string()),
      label: z.string(),
      local: z.boolean(),
      type: z.string().optional(),
    }),
  ),
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
  studyArms: [],
  studyInterventions: [],
});

const { data, error, refresh } = await useFetch(
  `/api/datasets/${datasetId}/study/metadata/arms-interventions`,
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

  const { StudyArm, StudyIntervention } = data.value;

  state.studyInterventions = StudyIntervention.map((intervention: any) => ({
    id: intervention.id,
    name: intervention.name,
    deleted: false,
    description: intervention.description,
    local: false,
    otherNameList: [...intervention.otherNameList],
    type: intervention.type,
  }));
  // Arms are saved with intervention names, but the form tracks ids so that
  // renaming an intervention doesn't disconnect it from its arms.
  state.studyArms = StudyArm.map((arm: any) => ({
    id: arm.id,
    deleted: false,
    description: arm.description,
    interventionIds: StudyIntervention.filter((intervention: any) =>
      arm.interventionList.includes(intervention.name),
    ).map((intervention: any) => intervention.id),
    label: arm.label,
    local: false,
    type: arm.type || "",
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

const addArm = () => {
  state.studyArms.push({
    id: nanoid(),
    deleted: false,
    description: "",
    interventionIds: [],
    label: "",
    local: true,
    type: "",
  });
};

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
  if (!intervention) return;

  removeRow(state.studyInterventions, index);

  state.studyArms.forEach((arm) => {
    arm.interventionIds = arm.interventionIds.filter(
      (id) => id !== intervention.id,
    );
  });
};

const interventionOptions = computed(() =>
  state.studyInterventions
    .filter((intervention) => !intervention.deleted)
    .map((intervention, index) => ({
      label: intervention.name || `Intervention ${index + 1}`,
      value: intervention.id,
    })),
);

const validateArms = (state: any, errors: FormError[]) => {
  const activeArms = state.studyArms.filter((arm: any) => !arm.deleted);

  if (activeArms.length === 0) {
    errors.push({
      name: "studyArms",
      message: "At least one study arm is required",
    });
  }

  const seen = new Set<string>();
  state.studyArms.forEach((arm: any, index: number) => {
    if (arm.deleted) return;

    const key = arm.label?.trim().toLowerCase();
    if (seen.has(key)) {
      errors.push({
        name: `arm-label-${index}`,
        message: "Duplicate arm label.",
      });
    }
    seen.add(key);

    if (arm.label.trim() === "") {
      errors.push({
        name: `arm-label-${index}`,
        message: "Label is required",
      });
    }

    if (arm.description.trim() === "") {
      errors.push({
        name: `arm-description-${index}`,
        message: "Description is required",
      });
    }
  });
};

const validateInterventions = (state: any, errors: FormError[]) => {
  const enumValues = FORM_JSON.studyMetadataInterventionsTypeOptions.map(
    (option) => option.value,
  );

  const activeInterventions = state.studyInterventions.filter(
    (intervention: any) => !intervention.deleted,
  );

  if (activeInterventions.length === 0) {
    errors.push({
      name: "studyInterventions",
      message: "At least one study intervention is required",
    });
  }

  const seen = new Set<string>();
  state.studyInterventions.forEach((intervention: any, index: number) => {
    if (intervention.deleted) return;

    const key = intervention.name?.trim().toLowerCase();
    if (seen.has(key)) {
      errors.push({
        name: `intervention-name-${index}`,
        message: "Duplicate intervention.",
      });
    }
    seen.add(key);

    if (intervention.name.trim() === "") {
      errors.push({
        name: `intervention-name-${index}`,
        message: "Name is required",
      });
    }

    if (intervention.description.trim() === "") {
      errors.push({
        name: `intervention-description-${index}`,
        message: "Description is required",
      });
    }

    if (!intervention.type) {
      errors.push({
        name: `intervention-type-${index}`,
        message: "Type is required",
      });
    } else if (!enumValues.includes(intervention.type.trim())) {
      errors.push({
        name: `intervention-type-${index}`,
        message: "Type must be a valid option",
      });
    }
  });
};

const validate = (state: any): FormError[] => {
  const errors: FormError[] = [];

  validateArms(state, errors);
  validateInterventions(state, errors);

  return errors;
};

// Prepares a row for the API: new rows have no id, and only removed rows carry `deleted`.
const toRequestRow = (row: any) => {
  const s = { ...row };

  if (s.local) delete s.id;
  if (!s.deleted) delete s.deleted;

  return s;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;
  isSubmitting.value = true;

  const formData = event.data;

  const b = {
    studyArms: formData.studyArms.map(({ interventionIds, ...arm }) => ({
      ...toRequestRow(arm),
      interventionList: formData.studyInterventions
        .filter((intervention) => interventionIds.includes(intervention.id))
        .map((intervention) => intervention.name.trim()),
    })),
    studyInterventions: formData.studyInterventions.map((intervention) => ({
      ...toRequestRow(intervention),
      otherNameList: intervention.otherNameList.filter((item) => item.trim()),
    })),
  };

  try {
    await $fetch(
      `/api/datasets/${datasetId}/study/metadata/arms-interventions`,
      {
        body: b,
        method: "PUT",
      },
    );

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
      description: "An error occurred while submitting the form.",
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
            label: 'Study Metadata',
          },
          {
            label: 'Arms & Interventions',
            to: `/app/datasets/${datasetId}/study/metadata/arms-interventions`,
          },
        ]"
      />

      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full items-center justify-between gap-3">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Arms &amp; Interventions
          </h1>
        </div>
        <p class="text-gray-500 dark:text-gray-400">
          List the treatments and other interventions this study evaluates, and
          the groups of participants who receive them.
        </p>
      </div>

      <UForm
        id="study-metadata-arms-interventions-form"
        :validate="validate"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Interventions
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Add each drug, device, procedure, or other intervention
                evaluated in the study.
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
                  <UFormField
                    label="Type"
                    :name="`intervention-type-${index}`"
                    required
                  >
                    <USelect
                      v-model="item.type as string"
                      placeholder="Drug"
                      :items="FORM_JSON.studyMetadataInterventionsTypeOptions"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField
                    label="Name"
                    :name="`intervention-name-${index}`"
                    required
                  >
                    <UInput
                      v-model="item.name"
                      placeholder="Acetaminophen, Cognitive Behavioral Therapy"
                    />
                  </UFormField>

                  <UFormField
                    label="Description"
                    :name="`intervention-description-${index}`"
                    required
                  >
                    <UTextarea
                      v-model="item.description"
                      placeholder="One 500 mg tablet taken by mouth twice daily for 12 weeks."
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField
                    label="Other Names / Synonyms"
                    :name="`intervention-other-names-${index}`"
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
                          placeholder="Tylenol, Paracetamol"
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
                          @click="
                            item.otherNameList.splice(innerIndex + 1, 0, '')
                          "
                        />
                      </div>
                    </div>

                    <div v-else>
                      <UButton
                        size="sm"
                        class="w-full"
                        color="success"
                        variant="outline"
                        label="Add Other Name"
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
              label="Add Intervention"
              class="mt-2"
              @click="addIntervention"
            />
          </div>
        </div>

        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Arms
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Add each group of participants in the study and select the
                interventions they receive.
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
                    @click="removeRow(state.studyArms, index)"
                  />
                </template>

                <div class="flex w-full flex-col gap-4 p-1">
                  <UFormField
                    required
                    label="Label"
                    :name="`arm-label-${index}`"
                  >
                    <UInput
                      v-model="item.label"
                      placeholder="Control Group, Experimental Arm A"
                    />
                  </UFormField>

                  <UFormField
                    label="Description"
                    :name="`arm-description-${index}`"
                    required
                  >
                    <UTextarea
                      v-model="item.description"
                      placeholder="Participants take one 500 mg tablet of acetaminophen twice daily for 12 weeks."
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField label="Type" :name="`arm-type-${index}`">
                    <USelect
                      v-model="item.type as string"
                      placeholder="Experimental"
                      :items="FORM_JSON.studyMetadataArmsTypeOptions"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField
                    label="Interventions"
                    :name="`arm-interventions-${index}`"
                  >
                    <USelectMenu
                      v-model="item.interventionIds"
                      multiple
                      value-key="value"
                      class="w-full"
                      :disabled="interventionOptions.length === 0"
                      :items="interventionOptions"
                      :placeholder="
                        interventionOptions.length === 0
                          ? 'Add an intervention first'
                          : 'Select interventions'
                      "
                    />
                  </UFormField>
                </div>
              </CardCollapsible>
            </UFormField>

            <UButton
              icon="i-lucide-plus"
              variant="outline"
              color="primary"
              label="Add Arm"
              class="mt-2"
              @click="addArm"
            />
          </div>
        </div>
      </UForm>
    </div>

    <div class="absolute right-0 bottom-0 left-0 z-10 px-6 pt-4 pb-6">
      <UButton
        form="study-metadata-arms-interventions-form"
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
