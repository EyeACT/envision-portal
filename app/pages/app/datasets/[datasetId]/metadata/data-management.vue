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

const schema = z.object({
  consent: z.object({
    details: z.string(),
    geneticOnly: z.boolean(),
    geogRestrict: z.boolean(),
    noMethods: z.boolean(),
    noncommercial: z.boolean(),
    researchType: z.boolean(),
    type: z.string(),
  }),
  deidentLevel: z.object({
    dates: z.boolean(),
    details: z.string(),
    direct: z.boolean(),
    hipaa: z.boolean(),
    kAnon: z.boolean(),
    nonarr: z.boolean(),
    type: z.string(),
  }),
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
  consent: {
    details: "",
    geneticOnly: false,
    geogRestrict: false,
    noMethods: false,
    noncommercial: false,
    researchType: false,
    type: "",
  },
  deidentLevel: {
    dates: false,
    details: "",
    direct: false,
    hipaa: false,
    kAnon: false,
    nonarr: false,
    type: "",
  },
  subjects: [],
});

const { data, error } = await useFetch(
  `/api/datasets/${datasetId}/metadata/data-management`,
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

  state.subjects = data.value.DatasetSubject.map((subject: any) => ({
    id: subject.id,
    classificationCode: subject.classificationCode,
    deleted: false,
    local: false,
    scheme: subject.scheme,
    schemeUri: subject.schemeUri,
    subject: subject.subject,
    valueUri: subject.valueUri,
  }));

  state.consent.details = data.value.DatasetConsent?.details ?? "";
  state.consent.geneticOnly = data.value.DatasetConsent?.geneticOnly ?? false;
  state.consent.geogRestrict = data.value.DatasetConsent?.geogRestrict ?? false;
  state.consent.noMethods = data.value.DatasetConsent?.noMethods ?? false;
  state.consent.noncommercial =
    data.value.DatasetConsent?.noncommercial ?? false;
  state.consent.researchType = data.value.DatasetConsent?.researchType ?? false;
  state.consent.type = data.value.DatasetConsent?.type ?? "";

  state.deidentLevel.dates = data.value.DatasetDeIdentLevel?.dates ?? false;
  state.deidentLevel.details = data.value.DatasetDeIdentLevel?.details ?? "";
  state.deidentLevel.direct = data.value.DatasetDeIdentLevel?.direct ?? false;
  state.deidentLevel.hipaa = data.value.DatasetDeIdentLevel?.hipaa ?? false;
  state.deidentLevel.kAnon = data.value.DatasetDeIdentLevel?.kAnon ?? false;
  state.deidentLevel.nonarr = data.value.DatasetDeIdentLevel?.nonarr ?? false;
  state.deidentLevel.type = data.value.DatasetDeIdentLevel?.type ?? "";
}

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

const removeSubject = (index: number) => {
  const subject = state.subjects[index];
  if (!subject) {
    return;
  }

  if (subject.local) {
    state.subjects.splice(index, 1);
  } else {
    subject.deleted = true;
  }
};

const validate = (state: any): FormError[] => {
  const errors: FormError[] = [];

  // Consent section
  if (state.consent.type === "Consent") {
    errors.push({ name: "consent.type", message: "Consent type is required" });
  }

  // De-identification section
  if (state.deidentLevel.type === "") {
    errors.push({
      name: "deidentLevel.type",
      message: "De-identification type is required",
    });
  }

  // Subjects section
  const activeSubjects = state.subjects?.filter((s: any) => !s.deleted) ?? [];

  if (activeSubjects.length === 0) {
    errors.push({
      name: "subjects",
      message: "Please add at least one subject",
    });
  } else {
    // Check for duplicate subjects
    const seenSubjects = new Set<string>();
    activeSubjects.forEach((subject: any, index: number) => {
      // Subjects are unique by value
      const key = subject.subject?.trim().toLowerCase();
      if (seenSubjects.has(key)) {
        errors.push({
          name: `subjects[${index}].subject`,
          message: "Duplicate subject.",
        });
      }
      seenSubjects.add(key);
    });

    activeSubjects.forEach((subject: any, index: number) => {
      if (!subject.subject?.trim()) {
        errors.push({
          name: `subjects[${index}].subject`,
          message: "Subject is required",
        });
      }

      // classificationCode / scheme pairing logic
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
  }

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;

  const formData = event.data;

  const b = {
    consent: formData.consent,
    deidentLevel: formData.deidentLevel,
    subjects: formData.subjects.map((subject: any) => {
      const d = subject;

      if (d.local) {
        delete d.id;
      }
      if (!d.deleted) {
        delete d.deleted;
      }

      return d;
    }),
  };

  console.log(JSON.stringify(b, null, 2));

  await $fetch(`/api/datasets/${datasetId}/metadata/data-management`, {
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
        description: "The form was unable to be submitted.",
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
          label: 'Data Management',
          to: `/app/datasets/${datasetId}/metadata/data-management`,
        },
      ]"
    />

    <div class="flex w-full flex-col gap-6 pb-5">
      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full items-center justify-between gap-3">
          <h1 class="font-bold text-gray-900 dark:text-white">
            Data Management
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
                Consent
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Please provide consent information for this dataset.
              </p>
            </div>

            <div class="flex flex-col gap-3">
              <UFormField label="Type" name="consent.type" required>
                <USelect
                  v-model="state.consent.type"
                  class="w-full"
                  placeholder="Select consent type"
                  :items="FORM_JSON.datasetConsentTypeOptions"
                />
              </UFormField>

              <UFormField
                label="Does the consent allow only non-commercial use of the data?"
                required
              >
                <USwitch
                  v-model="state.consent.noncommercial"
                  :label="state.consent.noncommercial ? 'Yes' : 'No'"
                />
              </UFormField>

              <UFormField
                label="Does the consent allow only use of the data in a specific geographic location?"
                required
              >
                <USwitch
                  v-model="state.consent.geogRestrict"
                  :label="state.consent.geogRestrict ? 'Yes' : 'No'"
                />
              </UFormField>

              <UFormField
                label="Does the consent allow only use of the data for a specific type of research?"
                required
              >
                <USwitch
                  v-model="state.consent.researchType"
                  :label="state.consent.researchType ? 'Yes' : 'No'"
                />
              </UFormField>

              <UFormField
                label="Does the consent allow only use of the data for genetic research?"
                required
              >
                <USwitch
                  v-model="state.consent.geneticOnly"
                  :label="state.consent.geneticOnly ? 'Yes' : 'No'"
                />
              </UFormField>

              <UFormField
                label="Does the consent allow only use of the data for research that does not involve the development of methods or algorithms?"
                required
              >
                <USwitch
                  v-model="state.consent.noMethods"
                  :label="state.consent.noMethods ? 'Yes' : 'No'"
                />
              </UFormField>

              <UFormField label="Details" name="consent.details">
                <UTextarea
                  v-model="state.consent.details"
                  placeholder="Provide further details about the consent details"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>
        </div>

        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                De-identification Level
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Please specify the de-identification level for this dataset.
              </p>
            </div>

            <div class="flex flex-col gap-3">
              <UFormField label="Type" name="deidentLevel.type" required>
                <USelect
                  v-model="state.deidentLevel.type"
                  class="w-full"
                  placeholder="Select de-identification type"
                  :items="FORM_JSON.datasetDeIdentTypeOptions"
                />
              </UFormField>

              <UFormField label="Were direct identifiers removed?" required>
                <USwitch
                  v-model="state.deidentLevel.direct"
                  :label="state.deidentLevel.direct ? 'Yes' : 'No'"
                />
              </UFormField>

              <UFormField
                label="Were US HIPAA de-identification rules applied?"
                required
              >
                <USwitch
                  v-model="state.deidentLevel.hipaa"
                  :label="state.deidentLevel.hipaa ? 'Yes' : 'No'"
                />
              </UFormField>

              <UFormField
                label="Were dates rebased and/or replaced by integers?"
                required
              >
                <USwitch
                  v-model="state.deidentLevel.dates"
                  :label="state.deidentLevel.dates ? 'Yes' : 'No'"
                />
              </UFormField>

              <UFormField label="Were narrative text fields removed?" required>
                <USwitch
                  v-model="state.deidentLevel.nonarr"
                  :label="state.deidentLevel.nonarr ? 'Yes' : 'No'"
                />
              </UFormField>

              <UFormField label="Was k-anonymisation (k>=2) achieved?" required>
                <USwitch
                  v-model="state.deidentLevel.kAnon"
                  :label="state.deidentLevel.kAnon ? 'Yes' : 'No'"
                />
              </UFormField>

              <UFormField label="Details" name="deidentLevel.details">
                <UTextarea
                  v-model="state.deidentLevel.details"
                  placeholder="Enter de-identification details"
                  class="w-full"
                />
              </UFormField>
            </div>
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
                Please add subjects for this dataset.
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
                    @click="removeSubject(index)"
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
                      placeholder="Enter subject"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField
                    label="Classification Code"
                    :name="`subjects[${index}].classificationCode`"
                    :required="
                      !!item.classificationCode?.trim() || !!item.scheme?.trim()
                    "
                  >
                    <UInput
                      v-model="item.classificationCode"
                      placeholder="Enter classification code"
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
                        placeholder="Enter scheme"
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
                        placeholder="Enter scheme URI"
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
                      placeholder="Enter value URI"
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
              label="Add Subject"
              @click="addSubject"
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
