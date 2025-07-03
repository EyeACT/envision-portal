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

const { studyId } = route.params as { studyId: string };

const saveLoading = ref(false);

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
  `/api/studies/${studyId}/metadata/interventions`,
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

  state.studyInterventions = data.value.StudyIntervention.map(
    (intervention) => ({
      ...intervention,
      deleted: false,
      local: false,
    }),
  );
}

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

  if (intervention.local) {
    state.studyInterventions.splice(index, 1);
  } else {
    intervention.deleted = true;
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

  state.studyInterventions.forEach((intervention: any, index: number) => {
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

  const formData = event.data;

  const b = {
    studyInterventions: formData.studyInterventions.map((intervention: any) => {
      const s = intervention;

      if (s.local) {
        delete s.id;
      }
      if (!s.deleted) {
        delete s.deleted;
      }

      return s;
    }),
  };

  await $fetch(`/api/studies/${studyId}/metadata/interventions`, {
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
        description: "An error occurred while submitting the form.",
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
        { label: data?.title, to: `/app/study/${studyId}` },
        {
          label: 'Metadata',
        },
        {
          label: 'Interventions',
          to: `/app/study/${studyId}/metadata/interventions`,
        },
      ]"
    />

    <div class="flex w-full flex-col gap-6 pb-5">
      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
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
        :validate="validate"
        :state="state"
        class="space-y-4"
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
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Quisquam, quos.
              </p>
            </div>

            <UFormField name="studyInterventions">
              <CardCollapsible
                v-for="(item, index) in state.studyInterventions"
                v-show="!item.deleted"
                :key="item.id"
                class="my-1 shadow-none"
                :title="item.name || `Intervention ${index + 1}`"
                bordered
              >
                <template #header-extra>
                  <UButton
                    icon="i-lucide-trash"
                    label="Remove identifier"
                    variant="soft"
                    color="error"
                    @click="removeIntervention(index)"
                  />
                </template>

                <div class="flex w-full flex-col gap-3">
                  <UFormField label="Type" :name="`type-${index}`" required>
                    <USelect
                      v-model="item.type as string"
                      placeholder="Type"
                      :items="FORM_JSON.studyMetadataInterventionsTypeOptions"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField label="Name" :name="`name-${index}`" required>
                    <UInput v-model="item.name" placeholder="Intervention 1" />
                  </UFormField>

                  <UFormField
                    label="Description"
                    :name="`description-${index}`"
                    required
                  >
                    <UTextarea
                      v-model="item.description"
                      placeholder="Description"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField
                    label="Other Names"
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
                          placeholder="Other Name"
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
              @click="addIntervention"
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
