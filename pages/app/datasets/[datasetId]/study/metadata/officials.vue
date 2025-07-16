<script setup lang="ts">
import * as z from "zod";
import { nanoid } from "nanoid";
import type { FormSubmitEvent, FormError } from "@nuxt/ui";
import FORM_JSON from "~/assets/data/form.json";
import {
  isValidORCIDValue,
  isValidRORValue,
  isValidUrl,
} from "~/utils/validations";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { datasetId } = route.params as { datasetId: string };

const saveLoading = ref(false);

const schema = z.object({
  studyOverallOfficials: z.array(
    z.object({
      id: z.string(),
      affiliation: z.string(),
      affiliationIdentifier: z.string(),
      affiliationIdentifierScheme: z.string(),
      affiliationIdentifierSchemeUri: z.string(),
      degree: z.string(),
      deleted: z.boolean(),
      familyName: z.string(),
      givenName: z.string(),
      identifier: z.string(),
      identifierScheme: z.string(),
      identifierSchemeUri: z.string(),
      local: z.boolean(),
      role: z.string(),
    }),
  ),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  studyOverallOfficials: [],
});

const { data, error } = await useFetch(
  `/api/datasets/${datasetId}/study/metadata/officials`,
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

  state.studyOverallOfficials = data.value.StudyOverallOfficials.map(
    (official: any) => ({
      ...official,
      deleted: false,
      local: false,
    }),
  );
}

const addOfficial = () => {
  state.studyOverallOfficials.push({
    id: nanoid(),
    affiliation: "",
    affiliationIdentifier: "",
    affiliationIdentifierScheme: "",
    affiliationIdentifierSchemeUri: "",
    degree: "",
    deleted: false,
    familyName: "",
    givenName: "",
    identifier: "",
    identifierScheme: "",
    identifierSchemeUri: "",
    local: true,
    role: "",
  });
};

const removeOfficial = (index: number) => {
  const official = state.studyOverallOfficials[index];

  if (official.local) {
    state.studyOverallOfficials.splice(index, 1);
  } else {
    official.deleted = true;
  }
};

const validate = (state: any): FormError[] => {
  const errors = [];
  const enumValues = FORM_JSON.studyMetadataContactsOverallOfficialRole.map(
    (option) => option.value,
  );

  if (state.studyOverallOfficials.length === 0) {
    errors.push({
      name: "studyOverallOfficials",
      message: "At least one study overall official is required",
    });
  }

  state.studyOverallOfficials.forEach((official: any, index: number) => {
    if (official.givenName.trim() === "") {
      errors.push({
        name: `givenName-${index}`,
        message: "Given name is required",
      });
    }

    if (official.familyName.trim() === "") {
      errors.push({
        name: `familyName-${index}`,
        message: "Family name is required",
      });
    }

    if (official.affiliation.trim() === "") {
      errors.push({
        name: `affiliation-${index}`,
        message: "Affiliation is required",
      });
    }

    // If affiliation identifier is provided, scheme and scheme URI must also be provided
    if (
      (official.affiliationIdentifier.trim() !== "" &&
        official.affiliationIdentifierScheme.trim() === "") ||
      (official.affiliationIdentifier.trim() === "" &&
        official.affiliationIdentifierScheme.trim() !== "")
    ) {
      const messages = [
        {
          name: `affiliationIdentifier-${index}`,
          message:
            "Affiliation identifier and scheme must be provided together",
        },
        {
          name: `affiliationIdentifierScheme-${index}`,
          message:
            "Affiliation identifier and scheme must be provided together",
        },
      ];

      errors.push(...messages);
    }

    if (
      official.affiliationIdentifier &&
      official.affiliationIdentifierScheme?.toUpperCase() === "ORCID" &&
      !isValidORCIDValue(official.affiliationIdentifier)
    ) {
      errors.push({
        name: `affiliationIdentifier-${index}`,
        message: "Affiliation identifier must be a valid ORCID",
      });
    }
    if (
      official.affiliationIdentifier &&
      official.affiliationIdentifierScheme?.toUpperCase() === "ROR" &&
      !isValidRORValue(official.affiliationIdentifier)
    ) {
      errors.push({
        name: `affiliationIdentifier-${index}`,
        message: "Affiliation identifier must be a valid ROR",
      });
    }

    if (
      official.affiliationIdentifierSchemeUri.trim() !== "" &&
      !isValidUrl(official.affiliationIdentifierSchemeUri)
    ) {
      errors.push({
        name: `affiliationIdentifierSchemeUri-${index}`,
        message: "Affiliation identifier scheme URI must be a valid URI",
      });
    }

    // If either official identifier or identifier scheme is provided, both must be provided
    if (
      (official.identifier.trim() !== "" &&
        official.identifierScheme.trim() === "") ||
      (official.identifier.trim() === "" &&
        official.identifierScheme.trim() !== "")
    ) {
      const messages = [
        {
          name: `identifier-${index}`,
          message: "Identifier and Identifier scheme must be provided together",
        },
        {
          name: `identifierScheme-${index}`,
          message: "Identifier and Identifier scheme must be provided together",
        },
      ];

      errors.push(...messages);
    }

    if (
      official.identifier &&
      official.identifierScheme?.toUpperCase() === "ORCID" &&
      !isValidORCIDValue(official.identifier)
    ) {
      errors.push({
        name: `identifier-${index}`,
        message: "Identifier must be a valid ORCID",
      });
    }

    if (
      official.identifier &&
      official.identifierScheme?.toUpperCase() === "ROR" &&
      !isValidRORValue(official.identifier)
    ) {
      errors.push({
        name: `identifier-${index}`,
        message: "Identifier must be a valid ROR",
      });
    }

    if (
      official.identifierSchemeUri &&
      !isValidUrl(official.identifierSchemeUri)
    ) {
      errors.push({
        name: `identifierSchemeUri-${index}`,
        message: "Identifier scheme URI must be a valid URL",
      });
    }

    // Official role must be one of the predefined options
    if (
      official.role.trim() !== "" &&
      !enumValues.includes(official.role.trim())
    ) {
      errors.push({
        name: `role-${index}`,
        message: `Role must be one of the following: ${enumValues.join(", ")}`,
      });
    }

    if (official.role.trim() === "") {
      errors.push({
        name: `role-${index}`,
        message: "Role is required",
      });
    }
  });

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;

  const formData = event.data;

  const b = {
    studyOverallOfficials: formData.studyOverallOfficials.map(
      (official: any) => {
        const s = official;

        if (s.local) {
          delete s.id;
        }
        if (!s.deleted) {
          delete s.deleted;
        }

        return s;
      },
    ),
  };

  await $fetch(`/api/datasets/${datasetId}/study/metadata/officials`, {
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
        { label: data?.title, to: `/app/datasets/${datasetId}` },
        {
          label: 'Study Metadata',
        },
        {
          label: 'Overall Officials',
          to: `/app/datasets/${datasetId}/study/metadata/officials`,
        },
      ]"
    />

    <div class="flex w-full flex-col gap-6 pb-5">
      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full items-center justify-between gap-3">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Overall Officials
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
                Overall Officials
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Quisquam, quos.
              </p>
            </div>

            <UFormField name="studyOverallOfficials">
              <CardCollapsible
                v-for="(item, index) in state.studyOverallOfficials"
                v-show="!item.deleted"
                :key="item.id"
                class="my-1 shadow-none"
                :title="
                  item.givenName
                    ? `${item.givenName} ${item.familyName}`
                    : `Overall Official ${index + 1}`
                "
                bordered
              >
                <template #header-extra>
                  <UButton
                    icon="i-lucide-trash"
                    label="Remove identifier"
                    variant="soft"
                    color="error"
                    @click="removeOfficial(index)"
                  />
                </template>

                <div class="flex w-full flex-col gap-3">
                  <UFormField
                    label="Given Name"
                    :name="`givenName-${index}`"
                    required
                  >
                    <UInput v-model="item.givenName" placeholder="James" />
                  </UFormField>

                  <UFormField
                    label="Family Name"
                    :name="`familyName-${index}`"
                    required
                  >
                    <UInput v-model="item.familyName" placeholder="Smith" />
                  </UFormField>

                  <UFormField label="Degree" :name="`degree-${index}`">
                    <UInput v-model="item.degree" placeholder="PhD" />
                  </UFormField>

                  <UFormField
                    label="Affiliation"
                    :name="`affiliation-${index}`"
                    required
                  >
                    <UInput
                      v-model="item.affiliation"
                      placeholder="University of California, San Francisco"
                    />
                  </UFormField>

                  <div class="flex w-full gap-3">
                    <UFormField
                      label="Affiliation Identifier"
                      :name="`affiliationIdentifier-${index}`"
                      class="w-full"
                    >
                      <UInput
                        v-model="item.affiliationIdentifier"
                        placeholder="1234567890"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="Affiliation Identifier Scheme"
                      class="w-full"
                      :name="`affiliationIdentifierScheme-${index}`"
                    >
                      <UInput
                        v-model="item.affiliationIdentifierScheme"
                        placeholder="ROR"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="Affiliation Identifier Scheme URI"
                      class="w-full"
                      :name="`affiliationIdentifierSchemeUri-${index}`"
                    >
                      <UInput
                        v-model="item.affiliationIdentifierSchemeUri"
                        placeholder="https://ror.org"
                        class="w-full"
                      />
                    </UFormField>
                  </div>

                  <UFormField label="Role" :name="`role-${index}`" required>
                    <USelect
                      v-model="item.role"
                      class="w-full"
                      placeholder="Principal Investigator"
                      :items="
                        FORM_JSON.studyMetadataContactsOverallOfficialRole
                      "
                    />
                  </UFormField>

                  <div class="flex w-full gap-3">
                    <UFormField
                      label="Identifier"
                      :name="`identifier-${index}`"
                      class="w-full"
                    >
                      <UInput
                        v-model="item.identifier"
                        placeholder="0000-0000-0000-0000"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="Identifier Scheme"
                      :name="`identifierScheme-${index}`"
                      class="w-full"
                    >
                      <UInput
                        v-model="item.identifierScheme"
                        placeholder="ORCID"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="Identifier Scheme URI"
                      :name="`identifierSchemeUri-${index}`"
                      class="w-full"
                    >
                      <UInput
                        v-model="item.identifierSchemeUri"
                        placeholder="https://orcid.org"
                        class="w-full"
                      />
                    </UFormField>
                  </div>
                </div>
              </CardCollapsible>
            </UFormField>

            <UButton
              icon="i-lucide-plus"
              variant="outline"
              color="primary"
              label="Add Overall Official"
              @click="addOfficial"
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
