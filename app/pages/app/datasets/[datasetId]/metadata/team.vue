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
  if (!contributor) return;

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
  if (!creator) return;

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
  if (!funder) return;

  if (funder.local) {
    state.funders.splice(index, 1);
  } else {
    funder.deleted = true;
  }
};

const validate = (state: any): FormError[] => {
  const errors: FormError[] = [];

  // Validate creators
  const activeCreators =
    state.creators?.filter((creator: any) => !creator.deleted) ?? [];

  if (activeCreators.length === 0) {
    errors.push({
      name: "creators",
      message: "Please add at least one creator",
    });
  } else {
    activeCreators.forEach((creator: any, index: number) => {
      if (!creator.givenName) {
        errors.push({
          name: `creators[${index}].givenName`,
          message: "Given name is required.",
        });
      }
      if (!creator.familyName) {
        errors.push({
          name: `creators[${index}].familyName`,
          message: "Family name is required.",
        });
      }
      if (!creator.nameType) {
        errors.push({
          name: `creators[${index}].nameType`,
          message: "Name type is required.",
        });
      }
      if (
        (creator.nameIdentifier.trim() !== "" &&
          creator.nameIdentifierScheme.trim() === "") ||
        (creator.nameIdentifier.trim() === "" &&
          creator.nameIdentifierScheme.trim() !== "")
      ) {
        const messages = [
          {
            name: `creators[${index}].nameIdentifier`,
            message:
              "Identifier scheme is required when identifier scheme is provided",
          },
          {
            name: `creators[${index}].nameIdentifierScheme`,
            message:
              "Identifier value is required when identifier value is provided",
          },
        ];

        errors.push(...messages);
      }
      if (
        creator.nameIdentifier &&
        creator.nameIdentifierScheme.toUpperCase() === "ORCID" &&
        !isValidORCIDValue(creator.nameIdentifier)
      ) {
        errors.push({
          name: `creators[${index}].nameIdentifier`,
          message: "Invalid ORCID value",
        });
      }
      if (
        creator.nameIdentifier &&
        creator.nameIdentifierScheme.toUpperCase() === "ROR" &&
        !isValidRORValue(creator.nameIdentifier)
      ) {
        errors.push({
          name: `creators[${index}].nameIdentifier`,
          message: "Invalid ROR value",
        });
      }
      if (
        creator.nameIdentifierSchemeUri &&
        !isValidUrl(creator.nameIdentifierSchemeUri)
      ) {
        errors.push({
          name: `creators[${index}].nameIdentifierSchemeUri`,
          message: "Invalid URL",
        });
      }

      // Iterate through affiliations
      creator.affiliations?.forEach((affiliation: any, affIndex: number) => {
        if (!affiliation.affiliation?.trim()) {
          errors.push({
            name: `creators[${index}].affiliations[${affIndex}].affiliation`,
            message: "Affiliation name is required",
          });
        }

        if (
          (affiliation.identifier?.trim() !== "" &&
            affiliation.identifierScheme?.trim() === "") ||
          (affiliation.identifier?.trim() === "" &&
            affiliation.identifierScheme?.trim() !== "")
        ) {
          const messages = [
            {
              name: `creators[${index}].affiliations[${affIndex}].identifier`,
              message:
                "Identifier scheme is required when identifier scheme is provided",
            },
            {
              name: `creators[${index}].affiliations[${affIndex}].identifierType`,
              message:
                "Identifier value is required when identifier value is provided",
            },
          ];

          errors.push(...messages);
        }
        if (
          affiliation.identifier &&
          affiliation.identifierScheme.toUpperCase() === "ORCID" &&
          !isValidORCIDValue(affiliation.identifier)
        ) {
          errors.push({
            name: `creators[${index}].affiliations[${affIndex}].identifier`,
            message: "Invalid ORCID value",
          });
        }
        if (
          affiliation.identifier &&
          affiliation.identifierScheme.toUpperCase() === "ROR" &&
          !isValidRORValue(affiliation.identifier)
        ) {
          errors.push({
            name: `creators[${index}].affiliations[${affIndex}].identifier`,
            message: "Invalid ROR value",
          });
        }
        if (
          affiliation.identifierSchemeUri &&
          !isValidUrl(affiliation.identifierSchemeUri)
        ) {
          errors.push({
            name: `creators[${index}].affiliations[${affIndex}].identifierSchemeUri`,
            message: "Invalid URL",
          });
        }
      });
    });
  }

  // Validate contributors
  const activeContributors =
    state.contributors?.filter((contributor: any) => !contributor.deleted) ??
    [];

  if (activeContributors.length === 0) {
    errors.push({
      name: "contributors",
      message: "Please add at least one contributor",
    });
  } else {
    activeContributors.forEach((contributor: any, index: number) => {
      if (!contributor.givenName) {
        errors.push({
          name: `contributors[${index}].givenName`,
          message: "Given name is required.",
        });
      }
      if (!contributor.familyName) {
        errors.push({
          name: `contributors[${index}].familyName`,
          message: "Family name is required.",
        });
      }
      if (!contributor.nameType) {
        errors.push({
          name: `contributors[${index}].nameType`,
          message: "Name type is required.",
        });
      }
      if (
        (contributor.nameIdentifier.trim() !== "" &&
          contributor.nameIdentifierScheme.trim() === "") ||
        (contributor.nameIdentifier.trim() === "" &&
          contributor.nameIdentifierScheme.trim() !== "")
      ) {
        const messages = [
          {
            name: `contributors[${index}].nameIdentifier`,
            message:
              "Identifier scheme is required when identifier scheme is provided",
          },
          {
            name: `contributors[${index}].nameIdentifierScheme`,
            message:
              "Identifier value is required when identifier value is provided",
          },
        ];

        errors.push(...messages);
      }
      if (
        contributor.nameIdentifier &&
        contributor.nameIdentifierScheme.toUpperCase() === "ORCID" &&
        !isValidORCIDValue(contributor.nameIdentifier)
      ) {
        errors.push({
          name: `contributors[${index}].nameIdentifier`,
          message: "Invalid ORCID value",
        });
      }
      if (
        contributor.nameIdentifier &&
        contributor.nameIdentifierScheme.toUpperCase() === "ROR" &&
        !isValidRORValue(contributor.nameIdentifier)
      ) {
        errors.push({
          name: `contributors[${index}].nameIdentifier`,
          message: "Invalid ROR value",
        });
      }
      if (
        contributor.nameIdentifierSchemeUri &&
        !isValidUrl(contributor.nameIdentifierSchemeUri)
      ) {
        errors.push({
          name: `contributors[${index}].nameIdentifierSchemeUri`,
          message: "Invalid URL",
        });
      }

      contributor.affiliations.forEach((affiliation: any, affIndex: number) => {
        if (!affiliation.affiliation?.trim()) {
          errors.push({
            name: `contributors[${index}].affiliations[${affIndex}].affiliation`,
            message: "Affiliation is required",
          });
        }

        if (
          (affiliation.identifier?.trim() !== "" &&
            affiliation.identifierScheme?.trim() === "") ||
          (affiliation.identifier?.trim() === "" &&
            affiliation.identifierScheme?.trim() !== "")
        ) {
          const messages = [
            {
              name: `contributors[${index}].affiliations[${affIndex}].identifier`,
              message:
                "Identifier scheme is required when identifier scheme is provided",
            },
            {
              name: `contributors[${index}].affiliations[${affIndex}].identifierType`,
              message:
                "Identifier value is required when identifier value is provided",
            },
          ];

          errors.push(...messages);
        }
        if (
          affiliation.identifier &&
          affiliation.identifierScheme.toUpperCase() === "ORCID" &&
          !isValidORCIDValue(affiliation.identifier)
        ) {
          errors.push({
            name: `contributors[${index}].affiliations[${affIndex}].identifier`,
            message: "Invalid ORCID value",
          });
        }
        if (
          affiliation.identifier &&
          affiliation.identifierScheme.toUpperCase() === "ROR" &&
          !isValidRORValue(affiliation.identifier)
        ) {
          errors.push({
            name: `contributors[${index}].affiliations[${affIndex}].identifier`,
            message: "Invalid ROR value",
          });
        }
        if (
          affiliation.identifierSchemeUri &&
          !isValidUrl(affiliation.identifierSchemeUri)
        ) {
          errors.push({
            name: `contributors[${index}].affiliations[${affIndex}].identifierSchemeUri`,
            message: "Invalid URL",
          });
        }
      });
    });
  }

  // Validate funders
  const activeFunders =
    state.funders?.filter((funder: any) => !funder.deleted) ?? [];

  if (activeFunders.length === 0) {
    errors.push({
      name: "funders",
      message: "Please add at least one funder",
    });
  } else {
    activeFunders.forEach((funder: any, index: number) => {
      if (!funder.name?.trim()) {
        errors.push({
          name: `funders[${index}].name`,
          message: "Name is required",
        });
      }

      if (
        (funder.identifier?.trim() !== "" &&
          funder.identifierType?.trim() === "") ||
        (funder.identifier?.trim() === "" &&
          funder.identifierType?.trim() !== "")
      ) {
        const messages = [
          {
            name: `funders[${index}].identifier`,
            message: "Identifier type is required when identifier is provided",
          },
          {
            name: `funders[${index}].identifierType`,
            message: "Identifier is required when identifier type is provided",
          },
        ];

        errors.push(...messages);
      }

      if (
        funder.identifier &&
        funder.identifierType?.toUpperCase() === "ROR" &&
        !isValidRORValue(funder.identifier)
      ) {
        errors.push({
          name: `funders[${index}].identifier`,
          message: "Invalid ROR value",
        });
      }

      if (
        funder.identifier &&
        funder.identifierType?.toUpperCase() === "CROSSREF_FUNDER_ID" &&
        !isValidCrossRefValue(funder.identifier)
      ) {
        errors.push({
          name: `funders[${index}].identifier`,
          message: "Invalid Crossref Funder ID",
        });
      }

      if (
        funder.identifierSchemeUri &&
        !isValidUrl(funder.identifierSchemeUri)
      ) {
        errors.push({
          name: `funders[${index}].identifierSchemeUri`,
          message: "Invalid Identifier Scheme URI",
        });
      }

      if (funder.awardUri && !isValidUrl(funder.awardUri)) {
        errors.push({
          name: `funders[${index}].awardUri`,
          message: "Invalid Award URI",
        });
      }
    });
  }

  // Validate managing organization
  if (!state.managingOrganization.name?.trim()) {
    errors.push({
      name: "managingOrganization.name",
      message: "Name is required",
    });
  }
  if (
    (state.managingOrganization.identifier.trim() !== "" &&
      state.managingOrganization.identifierScheme.trim() === "") ||
    (state.managingOrganization.identifier.trim() === "" &&
      state.managingOrganization.identifierScheme.trim() !== "")
  ) {
    const messages = [
      {
        name: "managingOrganization.identifier",
        message:
          "Identifier scheme is required when identifier scheme is provided",
      },
      {
        name: "managingOrganization.identifierScheme",
        message:
          "Identifier value is required when identifier value is provided",
      },
    ];

    errors.push(...messages);
  }
  if (
    state.managingOrganization.identifier &&
    state.managingOrganization.identifierScheme.toUpperCase() === "ORCID" &&
    !isValidORCIDValue(state.managingOrganization.identifier)
  ) {
    errors.push({
      name: "managingOrganization.identifier",
      message: "Invalid ORCID value",
    });
  }
  if (
    state.managingOrganization.identifier &&
    state.managingOrganization.identifierScheme.toUpperCase() === "ROR" &&
    !isValidRORValue(state.managingOrganization.identifier)
  ) {
    errors.push({
      name: "managingOrganization.identifier",
      message: "Invalid ROR value",
    });
  }
  if (
    state.managingOrganization.identifierSchemeUri &&
    !isValidUrl(state.managingOrganization.identifierSchemeUri)
  ) {
    errors.push({
      name: "managingOrganization.identifierSchemeUri",
      message: "Invalid URL",
    });
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
                  <UFormField
                    label="Name Type"
                    :name="`creators[${index}].nameType`"
                    required
                  >
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
                      :name="`creators[${index}].givenName`"
                      class="w-full"
                      required
                    >
                      <UInput
                        v-model="item.givenName"
                        placeholder="John"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="Family Name"
                      :name="`creators[${index}].familyName`"
                      class="w-full"
                      required
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
                      :name="`creators[${index}].nameIdentifier`"
                      class="w-full"
                      :required="
                        !!item.nameIdentifier?.trim() ||
                        !!item.nameIdentifierScheme?.trim()
                      "
                    >
                      <UInput
                        v-model="item.nameIdentifier"
                        placeholder="0000-0000-0000-0000"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="Name Identifier Scheme"
                      :name="`creators[${index}].nameIdentifierScheme`"
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
                      :name="`creators[${index}].nameIdentifierSchemeUri`"
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
                          <UFormField
                            label="Name"
                            :name="`creators[${index}].affiliations[${affIndex}].affiliation`"
                            required
                          >
                            <UInput
                              v-model="affiliation.affiliation"
                              class="w-full"
                              placeholder="University of Example"
                            />
                          </UFormField>

                          <div class="flex w-full gap-2">
                            <UFormField
                              label="Identifier"
                              :name="`creators[${index}].affiliations[${affIndex}].identifier`"
                              class="w-full"
                              :required="
                                !!affiliation.identifier?.trim() ||
                                !!affiliation.identifierScheme?.trim()
                              "
                            >
                              <UInput
                                v-model="affiliation.identifier"
                                class="w-full"
                                placeholder="1234567890"
                              />
                            </UFormField>

                            <UFormField
                              label="Identifier Scheme"
                              :name="`creators[${index}].affiliations[${affIndex}].identifierScheme`"
                              class="w-full"
                              :required="
                                !!affiliation.identifier?.trim() ||
                                !!affiliation.identifierScheme?.trim()
                              "
                            >
                              <UInput
                                v-model="affiliation.identifierScheme"
                                class="w-full"
                                placeholder="ROR"
                              />
                            </UFormField>

                            <UFormField
                              label="Identifier Scheme URI"
                              :name="`creators[${index}].affiliations[${affIndex}].identifierSchemeUri`"
                              class="w-full"
                            >
                              <UInput
                                v-model="affiliation.identifierSchemeUri"
                                class="w-full"
                                placeholder="https://ror.org"
                              />
                            </UFormField>
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
                  <UFormField
                    label="Contributor Type"
                    :name="`contributors[${index}].contributorType`"
                    required
                  >
                    <USelect
                      v-model="item.contributorType"
                      class="w-full"
                      placeholder="Data Curator"
                      :items="FORM_JSON.datasetContributorTypeOptions"
                    />
                  </UFormField>

                  <UFormField
                    label="Name Type"
                    :name="`contributors[${index}].nameType`"
                    required
                  >
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
                      :name="`contributors[${index}].givenName`"
                      class="w-full"
                      required
                    >
                      <UInput
                        v-model="item.givenName"
                        placeholder="John"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="Family Name"
                      :name="`contributors[${index}].familyName`"
                      class="w-full"
                      required
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
                      :name="`contributors[${index}].nameIdentifier`"
                      class="w-full"
                      :required="
                        !!item.nameIdentifier?.trim() ||
                        !!item.nameIdentifierScheme?.trim()
                      "
                    >
                      <UInput
                        v-model="item.nameIdentifier"
                        placeholder="0000-0000-0000-0000"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="Name Identifier Scheme"
                      :name="`contributors[${index}].nameIdentifierScheme`"
                      class="w-full"
                      :required="
                        !!item.nameIdentifier?.trim() ||
                        !!item.nameIdentifierScheme?.trim()
                      "
                    >
                      <UInput
                        v-model="item.nameIdentifierScheme"
                        placeholder="ORCID"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="Name Identifier Scheme URI"
                      :name="`contributors[${index}].nameIdentifierSchemeUri`"
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
                          <UFormField
                            label="Name"
                            :name="`contributors[${index}].affiliations[${affIndex}].affiliation`"
                            required
                          >
                            <UInput
                              v-model="affiliation.affiliation"
                              class="w-full"
                              placeholder="University of Example"
                            />
                          </UFormField>

                          <div class="flex w-full gap-2">
                            <UFormField
                              label="Identifier"
                              :name="`contributors[${index}].affiliations[${affIndex}].identifier`"
                              :required="
                                !!affiliation.identifier?.trim() ||
                                !!affiliation.identifierScheme?.trim()
                              "
                            >
                              <UInput
                                v-model="affiliation.identifier"
                                class="w-full"
                                placeholder="1234567890"
                              />
                            </UFormField>

                            <UFormField
                              label="Identifier Scheme"
                              :name="`contributors[${index}].affiliations[${affIndex}].identifierScheme`"
                              :required="
                                !!affiliation.identifier?.trim() ||
                                !!affiliation.identifierScheme?.trim()
                              "
                            >
                              <UInput
                                v-model="affiliation.identifierScheme"
                                class="w-full"
                                placeholder="ROR"
                              />
                            </UFormField>

                            <UFormField
                              label="Identifier Scheme URI"
                              :name="`contributors[${index}].affiliations[${affIndex}].identifierSchemeUri`"
                            >
                              <UInput
                                v-model="affiliation.identifierSchemeUri"
                                class="w-full"
                                placeholder="https://ror.org"
                              />
                            </UFormField>
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
                  <UFormField
                    label="Name"
                    :name="`funders[${index}].name`"
                    required
                  >
                    <UInput
                      v-model="item.name"
                      placeholder="National Institutes of Health"
                      class="w-full"
                    />
                  </UFormField>

                  <div class="flex w-full gap-3">
                    <UFormField
                      label="Identifier"
                      :name="`funders[${index}].identifier`"
                      class="w-full"
                      :required="
                        !!item.identifier?.trim() ||
                        !!item.identifierType?.trim()
                      "
                    >
                      <UInput
                        v-model="item.identifier"
                        placeholder="1234567890"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="Identifier Type"
                      :name="`funders[${index}].identifierType`"
                      class="w-full"
                      :required="
                        !!item.identifier?.trim() ||
                        !!item.identifierType?.trim()
                      "
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
                      :name="`funders[${index}].identifierSchemeUri`"
                      class="w-full"
                    >
                      <UInput
                        v-model="item.identifierSchemeUri"
                        placeholder="https://grid.ac"
                        class="w-full"
                      />
                    </UFormField>
                  </div>

                  <UFormField
                    label="Award Number"
                    :name="`funders[${index}].awardNumber`"
                  >
                    <UInput
                      v-model="item.awardNumber"
                      placeholder="R01GM123456"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField
                    label="Award Title"
                    :name="`funders[${index}].awardTitle`"
                  >
                    <UInput
                      v-model="item.awardTitle"
                      placeholder="Research Project Grant"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField
                    label="Award URI"
                    :name="`funders[${index}].awardUri`"
                  >
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

            <UFormField label="Name" name="managingOrganization.name" required>
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
                :required="
                  !!state.managingOrganization.identifier?.trim() ||
                  !!state.managingOrganization.identifierScheme?.trim()
                "
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
                :required="
                  !!state.managingOrganization.identifier?.trim() ||
                  !!state.managingOrganization.identifierScheme?.trim()
                "
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
                :required="
                  !!state.managingOrganization.identifier?.trim() ||
                  !!state.managingOrganization.identifierScheme?.trim()
                "
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
