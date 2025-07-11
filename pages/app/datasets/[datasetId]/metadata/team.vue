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
  contributors: z.array(
    z.object({
      id: z.string(),
      affiliations: z.array(
        z.object({
          affiliation: z.string(),
          identifier: z.string(),
          identifierScheme: z.string(),
          identifierSchemeUri: z.string(),
        }),
      ),
      contributorType: z.string(),
      deleted: z.boolean(),
      familyName: z.string(),
      givenName: z.string(),
      local: z.boolean(),
      nameIdentifier: z.string(),
      nameIdentifierScheme: z.string(),
      nameIdentifierSchemeUri: z.string(),
      nameType: z.string(),
    }),
  ),
  creators: z.array(
    z.object({
      id: z.string(),
      affiliations: z.array(
        z.object({
          affiliation: z.string(),
          identifier: z.string(),
          identifierScheme: z.string(),
          identifierSchemeUri: z.string(),
        }),
      ),
      deleted: z.boolean(),
      familyName: z.string(),
      givenName: z.string(),
      local: z.boolean(),
      nameIdentifier: z.string(),
      nameIdentifierScheme: z.string(),
      nameIdentifierSchemeUri: z.string(),
      nameType: z.string(),
    }),
  ),
  funders: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      awardNumber: z.string(),
      awardTitle: z.string(),
      awardUri: z.string(),
      deleted: z.boolean(),
      identifier: z.string(),
      identifierSchemeUri: z.string(),
      identifierType: z.string(),
      local: z.boolean(),
    }),
  ),
  managingOrganization: z.object({
    name: z.string(),
    identifier: z.string(),
    identifierScheme: z.string(),
    identifierSchemeUri: z.string(),
  }),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  contributors: [],
  creators: [],
  funders: [],
  managingOrganization: {
    name: "",
    identifier: "",
    identifierScheme: "",
    identifierSchemeUri: "",
  },
});

const { data, error } = await useFetch(
  `/api/datasets/${datasetId}/metadata/team`,
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

  state.contributors = data.value.contributors.map((item: any) => ({
    id: item.id,
    affiliations: item.affiliations,
    contributorType: item.contributorType,
    deleted: false,
    familyName: item.familyName,
    givenName: item.givenName,
    local: false,
    nameIdentifier: item.nameIdentifier,
    nameIdentifierScheme: item.nameIdentifierScheme,
    nameIdentifierSchemeUri: item.nameIdentifierSchemeUri,
    nameType: item.nameType,
  }));
  state.creators = data.value.creators.map((item: any) => ({
    id: item.id,
    affiliations: item.affiliations,
    deleted: false,
    familyName: item.familyName,
    givenName: item.givenName,
    local: false,
    nameIdentifier: item.nameIdentifier,
    nameIdentifierScheme: item.nameIdentifierScheme,
    nameIdentifierSchemeUri: item.nameIdentifierSchemeUri,
    nameType: item.nameType,
  }));
  state.funders = data.value.funders.map((item: any) => ({
    id: item.id,
    name: item.name,
    awardNumber: item.awardNumber,
    awardTitle: item.awardTitle,
    awardUri: item.awardUri,
    deleted: false,
    identifier: item.identifier,
    identifierSchemeUri: item.identifierSchemeUri,
    identifierType: item.identifierType,
    local: false,
  }));
  state.managingOrganization = {
    name: data.value.managingOrganization?.name ?? "",
    identifier: data.value.managingOrganization?.identifier ?? "",
    identifierScheme: data.value.managingOrganization?.identifierScheme ?? "",
    identifierSchemeUri:
      data.value.managingOrganization?.identifierSchemeUri ?? "",
  };
}

const addContributor = () => {
  state.contributors.push({
    id: nanoid(),
    affiliations: [],
    contributorType: "",
    deleted: false,
    familyName: "",
    givenName: "",
    local: true,
    nameIdentifier: "",
    nameIdentifierScheme: "",
    nameIdentifierSchemeUri: "",
    nameType: "",
  });
};

const removeContributor = (index: number) => {
  const contributor = state.contributors[index];

  if (contributor.local) {
    state.contributors.splice(index, 1);
  } else {
    contributor.deleted = true;
  }
};

const addCreator = () => {
  state.creators.push({
    id: nanoid(),
    affiliations: [],
    deleted: false,
    familyName: "",
    givenName: "",
    local: true,
    nameIdentifier: "",
    nameIdentifierScheme: "",
    nameIdentifierSchemeUri: "",
    nameType: "",
  });
};

const removeCreator = (index: number) => {
  const creator = state.creators[index];

  if (creator.local) {
    state.creators.splice(index, 1);
  } else {
    creator.deleted = true;
  }
};

const addFunder = () => {
  state.funders.push({
    id: nanoid(),
    name: "",
    awardNumber: "",
    awardTitle: "",
    awardUri: "",
    deleted: false,
    identifier: "",
    identifierSchemeUri: "",
    identifierType: "",
    local: true,
  });
};

const removeFunder = (index: number) => {
  const funder = state.funders[index];

  if (funder.local) {
    state.funders.splice(index, 1);
  } else {
    funder.deleted = true;
  }
};

const validate = (state: any): FormError[] => {
  const errors = [];

  // Validate creators
  if (state.creators.length === 0) {
    errors.push({
      message: "Please add at least one creator",
      path: "creators",
    });
  } else {
    state.creators.forEach((creator: any, index: number) => {
      if (!creator.givenName) {
        errors.push({
          message: "Given name is required for creator",
          path: `creators`,
        });
      }
      if (!creator.nameType) {
        errors.push({
          message: "Name type is required for creator",
          path: `creators`,
        });
      }
      if (!creator.nameIdentifier) {
        errors.push({
          message: "Name identifier is required for creator",
          path: `creators`,
        });
      }
      if (!creator.nameIdentifierScheme) {
        errors.push({
          message: "Name identifier scheme is required for creator",
          path: `creators`,
        });
      }
      if (!creator.nameIdentifierSchemeUri) {
        errors.push({
          message: "Name identifier scheme URI is required for creator",
          path: `creators`,
        });
      }
    });
  }

  // Validate contributors
  state.contributors.forEach((contributor: any, index: number) => {
    if (!contributor.givenName) {
      errors.push({
        message: "Given name is required for contributor",
        path: `contributors`,
      });
    }
    if (!contributor.nameType) {
      errors.push({
        message: "Name type is required for contributor",
        path: `contributors`,
      });
    }
    if (!contributor.nameIdentifier) {
      errors.push({
        message: "Name identifier is required for contributor",
        path: `contributors`,
      });
    }
    if (!contributor.nameIdentifierScheme) {
      errors.push({
        message: "Name identifier scheme is required for contributor",
        path: `contributors`,
      });
    }
    if (!contributor.nameIdentifierSchemeUri) {
      errors.push({
        message: "Name identifier scheme URI is required for contributor",
        path: `contributors`,
      });
    }
    if (!contributor.contributorType) {
      errors.push({
        message: "Contributor type is required for contributor",
        path: `contributors`,
      });
    }
  });

  // Validate funders
  state.funders.forEach((funder: any, index: number) => {
    if (!funder.name) {
      errors.push({
        message: "Name is required for funder",
        path: `funders`,
      });
    }
    if (!funder.identifier) {
      errors.push({
        message: "Identifier is required for funder",
        path: `funders`,
      });
    }
    if (!funder.identifierType) {
      errors.push({
        message: "Identifier type is required for funder",
        path: `funders`,
      });
    }
    if (!funder.identifierSchemeUri) {
      errors.push({
        message: "Identifier scheme URI is required for funder",
        path: `funders`,
      });
    }
    if (!funder.awardNumber) {
      errors.push({
        message: "Award number is required for funder",
        path: `funders`,
      });
    }
    if (!funder.awardTitle) {
      errors.push({
        message: "Award title is required for funder",
        path: `funders`,
      });
    }
    if (!funder.awardUri) {
      errors.push({
        message: "Award URI is required for funder",
        path: `funders`,
      });
    }
  });

  // Validate managing organization
  if (!state.managingOrganization.name) {
    errors.push({
      message: "Name is required for managing organization",
      path: "managingOrganization.name",
    });
  }
  if (
    (state.managingOrganization.identifier.trim() !== "" &&
      !state.managingOrganization.identifierScheme) ||
    (state.managingOrganization.identifierScheme.trim() !== "" &&
      !state.managingOrganization.identifier)
  ) {
    const messages = [
      {
        message: "Identifier scheme is required when identifier is provided",
        path: "managingOrganization.identifier",
      },
      {
        message: "Identifier scheme is required when identifier is provided",
        path: "managingOrganization.identifierScheme",
      },
    ];

    errors.push(...messages);
  }

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;

  const formData = event.data;

  const b = {
    contributors: formData.contributors.map((contributor: any) => {
      const d = contributor;

      if (d.local) {
        delete d.id;
      }
      if (!d.deleted) {
        delete d.deleted;
      }

      return d;
    }),
    creators: formData.creators.map((creator: any) => {
      const d = creator;

      if (d.local) {
        delete d.id;
      }
      if (!d.deleted) {
        delete d.deleted;
      }

      return d;
    }),
    funders: formData.funders.map((funder: any) => {
      const d = funder;

      if (d.local) {
        delete d.id;
      }
      if (!d.deleted) {
        delete d.deleted;
      }

      return d;
    }),
    managingOrganization: {
      name: formData.managingOrganization.name,
      identifier: formData.managingOrganization.identifier,
      identifierScheme: formData.managingOrganization.identifierScheme,
      identifierSchemeUri: formData.managingOrganization.identifierSchemeUri,
    },
  };

  console.log(JSON.stringify(b, null, 2));

  await $fetch(`/api/datasets/${datasetId}/metadata/team`, {
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
        description: "The form has been submitted.",
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
          label: 'Team',
          to: `/app/datasets/${datasetId}/metadata/team`,
        },
      ]"
    />

    <div class="flex w-full flex-col gap-6 pb-5">
      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full items-center justify-between gap-3">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Team</h1>
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
        <!-- Creators Section -->
        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Creators
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Please add the creators of this dataset.
              </p>
            </div>

            <UFormField name="creators">
              <CardCollapsible
                v-for="(item, index) in state.creators"
                v-show="!item.deleted"
                :key="item.id"
                class="my-1 shadow-none"
                :title="
                  item.givenName + ' ' + item.familyName ||
                  `Creator ${index + 1}`
                "
                bordered
              >
                <template #header-extra>
                  <UButton
                    icon="i-lucide-trash"
                    label="Remove creator"
                    variant="soft"
                    color="error"
                    @click="removeCreator(index)"
                  />
                </template>

                <div class="flex flex-col gap-3">
                  <UFormField label="Name Type" name="nameType">
                    <USelect
                      v-model="item.nameType"
                      class="w-full"
                      placeholder="Personal"
                      :items="FORM_JSON.datasetNameTypeOptions"
                    />
                  </UFormField>

                  <div class="flex w-full gap-3">
                    <UFormField
                      label="Given Name"
                      name="givenName"
                      class="w-full"
                    >
                      <UInput
                        v-model="item.givenName"
                        placeholder="John"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="Family Name"
                      name="familyName"
                      class="w-full"
                    >
                      <UInput
                        v-model="item.familyName"
                        placeholder="Doe"
                        class="w-full"
                      />
                    </UFormField>
                  </div>

                  <div class="flex w-full gap-3">
                    <UFormField
                      label="Name Identifier"
                      name="nameIdentifier"
                      class="w-full"
                    >
                      <UInput
                        v-model="item.nameIdentifier"
                        placeholder="0000-0000-0000-0000"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="Name Identifier Scheme"
                      name="nameIdentifierScheme"
                      class="w-full"
                    >
                      <UInput
                        v-model="item.nameIdentifierScheme"
                        placeholder="ORCID"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="Name Identifier Scheme URI"
                      name="nameIdentifierSchemeUri"
                      class="w-full"
                    >
                      <UInput
                        v-model="item.nameIdentifierSchemeUri"
                        placeholder="https://orcid.org"
                        class="w-full"
                      />
                    </UFormField>
                  </div>

                  <UFormField label="Affiliations" name="affiliations">
                    <div v-if="item.affiliations.length > 0">
                      <div
                        v-for="(affiliation, affIndex) in item.affiliations"
                        :key="affIndex"
                        class="mb-2 flex gap-2"
                      >
                        <div class="flex w-full flex-col gap-2">
                          <UInput
                            v-model="affiliation.affiliation"
                            class="w-full"
                            placeholder="University of Example"
                          />

                          <div class="flex w-full gap-2">
                            <UInput
                              v-model="affiliation.identifier"
                              class="w-full"
                              placeholder="1234567890"
                            />

                            <UInput
                              v-model="affiliation.identifierScheme"
                              class="w-full"
                              placeholder="ROR"
                            />

                            <UInput
                              v-model="affiliation.identifierSchemeUri"
                              class="w-full"
                              placeholder="https://ror.org"
                            />
                          </div>
                        </div>

                        <UButton
                          size="sm"
                          color="error"
                          variant="outline"
                          icon="i-lucide-trash"
                          @click="item.affiliations.splice(affIndex, 1)"
                        />

                        <UButton
                          size="sm"
                          color="success"
                          variant="outline"
                          icon="i-lucide-plus"
                          @click="
                            item.affiliations.splice(affIndex + 1, 0, {
                              affiliation: '',
                              identifier: '',
                              identifierScheme: '',
                              identifierSchemeUri: '',
                            })
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
                        label="Add Affiliation"
                        icon="i-lucide-plus"
                        @click="
                          item.affiliations.push({
                            affiliation: '',
                            identifier: '',
                            identifierScheme: '',
                            identifierSchemeUri: '',
                          })
                        "
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
              label="Add Creator"
              @click="addCreator"
            />
          </div>
        </div>

        <!-- Contributors Section -->
        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Contributors
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Please add the contributors to this dataset.
              </p>
            </div>

            <UFormField name="contributors">
              <CardCollapsible
                v-for="(item, index) in state.contributors"
                v-show="!item.deleted"
                :key="item.id"
                class="my-1 shadow-none"
                :title="
                  item.givenName + ' ' + item.familyName ||
                  `Contributor ${index + 1}`
                "
                bordered
              >
                <template #header-extra>
                  <UButton
                    icon="i-lucide-trash"
                    label="Remove contributor"
                    variant="soft"
                    color="error"
                    @click="removeContributor(index)"
                  />
                </template>

                <div class="flex flex-col gap-3">
                  <UFormField label="Contributor Type" name="contributorType">
                    <USelect
                      v-model="item.contributorType"
                      class="w-full"
                      placeholder="Data Curator"
                      :items="FORM_JSON.datasetContributorTypeOptions"
                    />
                  </UFormField>

                  <UFormField label="Name Type" name="nameType">
                    <USelect
                      v-model="item.nameType"
                      class="w-full"
                      placeholder="Personal"
                      :items="FORM_JSON.datasetNameTypeOptions"
                    />
                  </UFormField>

                  <div class="flex w-full gap-3">
                    <UFormField
                      label="Given Name"
                      name="givenName"
                      class="w-full"
                    >
                      <UInput
                        v-model="item.givenName"
                        placeholder="John"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="Family Name"
                      name="familyName"
                      class="w-full"
                    >
                      <UInput
                        v-model="item.familyName"
                        placeholder="Doe"
                        class="w-full"
                      />
                    </UFormField>
                  </div>

                  <div class="flex w-full gap-3">
                    <UFormField
                      label="Name Identifier"
                      name="nameIdentifier"
                      class="w-full"
                    >
                      <UInput
                        v-model="item.nameIdentifier"
                        placeholder="0000-0000-0000-0000"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="Name Identifier Scheme"
                      name="nameIdentifierScheme"
                      class="w-full"
                    >
                      <UInput
                        v-model="item.nameIdentifierScheme"
                        placeholder="ORCID"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="Name Identifier Scheme URI"
                      name="nameIdentifierSchemeUri"
                      class="w-full"
                    >
                      <UInput
                        v-model="item.nameIdentifierSchemeUri"
                        placeholder="https://orcid.org"
                        class="w-full"
                      />
                    </UFormField>
                  </div>

                  <UFormField label="Affiliations" name="affiliations">
                    <div v-if="item.affiliations.length > 0">
                      <div
                        v-for="(affiliation, affIndex) in item.affiliations"
                        :key="affIndex"
                        class="mb-2 flex gap-2"
                      >
                        <div class="flex w-full flex-col gap-2">
                          <UInput
                            v-model="affiliation.affiliation"
                            class="w-full"
                            placeholder="University of Example"
                          />

                          <div class="flex w-full gap-2">
                            <UInput
                              v-model="affiliation.identifier"
                              class="w-full"
                              placeholder="1234567890"
                            />

                            <UInput
                              v-model="affiliation.identifierScheme"
                              class="w-full"
                              placeholder="ROR"
                            />

                            <UInput
                              v-model="affiliation.identifierSchemeUri"
                              class="w-full"
                              placeholder="https://ror.org"
                            />
                          </div>
                        </div>

                        <UButton
                          size="sm"
                          color="error"
                          variant="outline"
                          icon="i-lucide-trash"
                          @click="item.affiliations.splice(affIndex, 1)"
                        />

                        <UButton
                          size="sm"
                          color="success"
                          variant="outline"
                          icon="i-lucide-plus"
                          @click="
                            item.affiliations.splice(affIndex + 1, 0, {
                              affiliation: '',
                              identifier: '',
                              identifierScheme: '',
                              identifierSchemeUri: '',
                            })
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
                        label="Add Affiliation"
                        icon="i-lucide-plus"
                        @click="
                          item.affiliations.push({
                            affiliation: '',
                            identifier: '',
                            identifierScheme: '',
                            identifierSchemeUri: '',
                          })
                        "
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
              label="Add Contributor"
              @click="addContributor"
            />
          </div>
        </div>

        <!-- Funders Section -->
        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Funders
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Please add the funders of this dataset.
              </p>
            </div>

            <UFormField name="funders">
              <CardCollapsible
                v-for="(item, index) in state.funders"
                v-show="!item.deleted"
                :key="item.id"
                class="my-1 shadow-none"
                :title="item.name || `Funder ${index + 1}`"
                bordered
              >
                <template #header-extra>
                  <UButton
                    icon="i-lucide-trash"
                    label="Remove funder"
                    variant="soft"
                    color="error"
                    @click="removeFunder(index)"
                  />
                </template>

                <div class="flex flex-col gap-3">
                  <UFormField label="Name" name="name">
                    <UInput
                      v-model="item.name"
                      placeholder="National Institutes of Health"
                      class="w-full"
                    />
                  </UFormField>

                  <div class="flex w-full gap-3">
                    <UFormField
                      label="Identifier"
                      name="identifier"
                      class="w-full"
                    >
                      <UInput
                        v-model="item.identifier"
                        placeholder="1234567890"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="Identifier Type"
                      name="identifierType"
                      class="w-full"
                    >
                      <USelect
                        v-model="item.identifierType"
                        placeholder="GRID"
                        class="w-full"
                        :items="FORM_JSON.datasetFunderIdentifierTypeOptions"
                      />
                    </UFormField>

                    <UFormField
                      label="Identifier Scheme URI"
                      name="identifierSchemeUri"
                      class="w-full"
                    >
                      <UInput
                        v-model="item.identifierSchemeUri"
                        placeholder="https://grid.ac"
                        class="w-full"
                      />
                    </UFormField>
                  </div>

                  <UFormField label="Award Number" name="awardNumber">
                    <UInput
                      v-model="item.awardNumber"
                      placeholder="R01GM123456"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField label="Award Title" name="awardTitle">
                    <UInput
                      v-model="item.awardTitle"
                      placeholder="Research Project Grant"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField label="Award URI" name="awardUri">
                    <UInput
                      v-model="item.awardUri"
                      placeholder="https://reporter.nih.gov/project-details/12345678"
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
              label="Add Funder"
              @click="addFunder"
            />
          </div>
        </div>

        <!-- Managing Organization Section -->
        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full flex-col gap-4">
            <div class="flex w-full flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Managing Organization
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Please add the managing organization of this dataset.
              </p>
            </div>

            <UFormField label="Name" name="managingOrganization.name">
              <UInput
                v-model="state.managingOrganization.name"
                placeholder="University of Example"
                class="w-full"
              />
            </UFormField>

            <div class="flex w-full gap-3">
              <UFormField
                label="Identifier"
                name="managingOrganization.identifier"
                class="w-full"
              >
                <UInput
                  v-model="state.managingOrganization.identifier"
                  placeholder="1234567890"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Identifier Scheme"
                name="managingOrganization.identifierScheme"
                class="w-full"
              >
                <UInput
                  v-model="state.managingOrganization.identifierScheme"
                  placeholder="ROR"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Identifier Scheme URI"
                name="managingOrganization.identifierSchemeUri"
                class="w-full"
              >
                <UInput
                  v-model="state.managingOrganization.identifierSchemeUri"
                  placeholder="https://ror.org"
                  class="w-full"
                />
              </UFormField>
            </div>
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
