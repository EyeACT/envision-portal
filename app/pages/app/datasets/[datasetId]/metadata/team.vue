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
const isSubmitting = ref(false);
const originalStateString = ref("");

const schema = z.object({
  contributors: z.array(
    z.object({
      id: z.string(),
      affiliations: z.array(
        z.object({
          affiliation: z.string(),
          identifier: z.string(),
        }),
      ),
      contributorType: z.string(),
      deleted: z.boolean(),
      familyName: z.string(),
      givenName: z.string(),
      local: z.boolean(),
      nameIdentifier: z.string(),
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
        }),
      ),
      deleted: z.boolean(),
      familyName: z.string(),
      givenName: z.string(),
      local: z.boolean(),
      nameIdentifier: z.string(),
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
      local: z.boolean(),
    }),
  ),
  managingOrganization: z.object({
    name: z.string(),
    identifier: z.string(),
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
}

// People are identified by ORCID and organizations by ROR.
const ORCID_FIELD = {
  label: "ORCID",
  help: "Enter the ORCID iD or paste the full ORCID URL.",
  placeholder: "0000-0000-0000-0000 or https://orcid.org/0000-0000-0000-0000",
  invalidMessage: "Enter a valid ORCID iD or ORCID URL",
  scheme: "ORCID",
  schemeUri: "https://orcid.org",
  normalize: normalizeORCID,
  isValid: isValidORCIDValue,
};

const ROR_FIELD = {
  label: "ROR",
  help: "Enter the ROR ID or paste the full ROR URL.",
  placeholder: "03yrm5c26 or https://ror.org/03yrm5c26",
  invalidMessage: "Enter a valid ROR ID or ROR URL",
  scheme: "ROR",
  schemeUri: "https://ror.org",
  normalize: normalizeROR,
  isValid: isValidRORValue,
};

const nameIdentifierField = (nameType: string) =>
  nameType === "Organizational" ? ROR_FIELD : ORCID_FIELD;

const toFormAffiliations = (affiliations: any[] | null | undefined) =>
  (affiliations ?? []).map((item) => ({
    affiliation: item.affiliation ?? "",
    identifier: item.identifier ?? "",
  }));

if (data.value) {
  useSeoMeta({
    title: data.value.title,
  });

  state.contributors = data.value.contributors.map((item: any) => ({
    id: item.id,
    affiliations: toFormAffiliations(item.affiliations),
    contributorType: item.contributorType ?? "",
    deleted: false,
    familyName: item.familyName ?? "",
    givenName: item.givenName ?? "",
    local: false,
    nameIdentifier: item.nameIdentifier ?? "",
    nameType: item.nameType ?? "",
  }));
  state.creators = data.value.creators.map((item: any) => ({
    id: item.id,
    affiliations: toFormAffiliations(item.affiliations),
    deleted: false,
    familyName: item.familyName ?? "",
    givenName: item.givenName ?? "",
    local: false,
    nameIdentifier: item.nameIdentifier ?? "",
    nameType: item.nameType ?? "",
  }));
  state.funders = data.value.funders.map((item: any) => ({
    id: item.id,
    name: item.name ?? "",
    awardNumber: item.awardNumber ?? "",
    awardTitle: item.awardTitle ?? "",
    awardUri: item.awardUri ?? "",
    deleted: false,
    identifier: item.identifier ?? "",
    local: false,
  }));
  state.managingOrganization = {
    name: data.value.managingOrganization?.name ?? "",
    identifier: data.value.managingOrganization?.identifier ?? "",
  };

  originalStateString.value = JSON.stringify(state);
}

const isDirty = computed(() => {
  return JSON.stringify(state) !== originalStateString.value;
});

const { showLeaveModal, confirmLeave, cancelLeave } = useUnsavedChangesGuard({
  isDirty,
  isSubmitting,
});

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
    const seenCreators = new Set<string>();
    activeCreators.forEach((creator: any, index: number) => {
      const key = `${creator.givenName?.trim().toLowerCase()}|${creator.familyName?.trim().toLowerCase()}|${creator.nameType?.trim().toLowerCase()}`;
      if (seenCreators.has(key)) {
        errors.push({
          name: `creators[${index}].givenName`,
          message:
            "Duplicate creator with same given name, family name, and name type.",
        });
      }
      seenCreators.add(key);
    });

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
      const creatorIdField = nameIdentifierField(creator.nameType);
      const creatorId = creatorIdField.normalize(creator.nameIdentifier);
      if (creatorId && !creatorIdField.isValid(creatorId)) {
        errors.push({
          name: `creators[${index}].nameIdentifier`,
          message: creatorIdField.invalidMessage,
        });
      }

      creator.affiliations?.forEach((affiliation: any, affIndex: number) => {
        if (!affiliation.affiliation?.trim()) {
          errors.push({
            name: `creators[${index}].affiliations[${affIndex}].affiliation`,
            message: "Affiliation name is required",
          });
        }

        const ror = normalizeROR(affiliation.identifier);
        if (ror && !isValidRORValue(ror)) {
          errors.push({
            name: `creators[${index}].affiliations[${affIndex}].identifier`,
            message: "Enter a valid ROR ID or ROR URL",
          });
        }
      });
    });
  }

  // Validate contributors
  const activeContributors =
    state.contributors?.filter((contributor: any) => !contributor.deleted) ??
    [];

  if (activeContributors.length > 0) {
    const seenContributors = new Set<string>();
    activeContributors.forEach((contributor: any, index: number) => {
      const key = `${contributor.givenName?.trim().toLowerCase()}|${contributor.familyName?.trim().toLowerCase()}|${contributor.nameType?.trim().toLowerCase()}|${contributor.contributorType?.trim().toLowerCase()}`;
      if (seenContributors.has(key)) {
        errors.push({
          name: `contributors[${index}].givenName`,
          message:
            "Duplicate contributor. Contributors are unique by name, name type, and contributor type",
        });
      }
      seenContributors.add(key);
    });

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
      const contributorIdField = nameIdentifierField(contributor.nameType);
      const contributorId = contributorIdField.normalize(
        contributor.nameIdentifier,
      );
      if (contributorId && !contributorIdField.isValid(contributorId)) {
        errors.push({
          name: `contributors[${index}].nameIdentifier`,
          message: contributorIdField.invalidMessage,
        });
      }

      contributor.affiliations.forEach((affiliation: any, affIndex: number) => {
        if (!affiliation.affiliation?.trim()) {
          errors.push({
            name: `contributors[${index}].affiliations[${affIndex}].affiliation`,
            message: "Affiliation is required",
          });
        }

        const ror = normalizeROR(affiliation.identifier);
        if (ror && !isValidRORValue(ror)) {
          errors.push({
            name: `contributors[${index}].affiliations[${affIndex}].identifier`,
            message: "Enter a valid ROR ID or ROR URL",
          });
        }
      });
    });
  }

  // Validate funders
  const activeFunders =
    state.funders?.filter((funder: any) => !funder.deleted) ?? [];

  if (activeFunders.length > 0) {
    const seenFunders = new Set<string>();
    activeFunders.forEach((funder: any, index: number) => {
      const key = `${funder.name?.trim().toLowerCase()}|${funder.awardNumber?.trim().toLowerCase()}`;
      if (seenFunders.has(key)) {
        errors.push({
          name: `funders[${index}].name`,
          message:
            "Duplicate funder. Funders are unique by name and award number",
        });
      }
      seenFunders.add(key);
    });

    activeFunders.forEach((funder: any, index: number) => {
      if (!funder.name?.trim()) {
        errors.push({
          name: `funders[${index}].name`,
          message: "Name is required",
        });
      }

      const funderRor = normalizeROR(funder.identifier);
      if (funderRor && !isValidRORValue(funderRor)) {
        errors.push({
          name: `funders[${index}].identifier`,
          message: "Enter a valid ROR ID or ROR URL",
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
  const managingOrganizationRor = normalizeROR(
    state.managingOrganization.identifier,
  );
  if (managingOrganizationRor && !isValidRORValue(managingOrganizationRor)) {
    errors.push({
      name: "managingOrganization.identifier",
      message: "Enter a valid ROR ID or ROR URL",
    });
  }

  return errors;
};

// The form only collects the ORCID and ROR IDs; the API also expects their schemes and scheme URIs.
const toRorFields = (value: string) => {
  const ror = normalizeROR(value);

  return {
    identifier: ror,
    identifierScheme: ror ? "ROR" : "",
    identifierSchemeUri: ror ? "https://ror.org" : "",
  };
};

// Deleted rows are still validated by the API, so their old identifiers are cleared.
const withIdentifierFields = (person: any) => {
  const idField = nameIdentifierField(person.nameType);
  const nameIdentifier = person.deleted
    ? ""
    : idField.normalize(person.nameIdentifier);

  return {
    ...person,
    affiliations: person.affiliations.map((affiliation: any) => ({
      ...affiliation,
      ...toRorFields(person.deleted ? "" : affiliation.identifier),
    })),
    nameIdentifier,
    nameIdentifierScheme: nameIdentifier ? idField.scheme : "",
    nameIdentifierSchemeUri: nameIdentifier ? idField.schemeUri : "",
  };
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;
  isSubmitting.value = true;

  const formData = event.data;

  const b = {
    contributors: formData.contributors.map((contributor: any) => {
      const d = withIdentifierFields(contributor);

      if (d.local) {
        delete d.id;
      }
      if (!d.deleted) {
        delete d.deleted;
      }

      return d;
    }),
    creators: formData.creators.map((creator: any) => {
      const d = withIdentifierFields(creator);

      if (d.local) {
        delete d.id;
      }
      if (!d.deleted) {
        delete d.deleted;
      }

      return d;
    }),
    funders: formData.funders.map((funder: any) => {
      const { identifier, identifierScheme, identifierSchemeUri } = toRorFields(
        funder.deleted ? "" : funder.identifier,
      );
      const d = {
        ...funder,
        identifier,
        identifierSchemeUri,
        identifierType: identifierScheme,
      };

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
      ...toRorFields(formData.managingOrganization.identifier),
    },
  };

  try {
    const res = await $fetch(`/api/datasets/${datasetId}/metadata/team`, {
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
      description: "The form has been submitted.",
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
            label: 'Team',
            to: `/app/datasets/${datasetId}/metadata/team`,
          },
        ]"
      />

      <UForm
        id="metadata-team-form"
        :validate="validate"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <div
          class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
        >
          <div class="flex w-full items-center justify-between gap-3">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Team
            </h1>
          </div>
          <p class="text-gray-500 dark:text-gray-400">
            Some basic information about the dataset is displayed here.
          </p>
        </div>

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
                  item.givenName || item.familyName
                    ? `${item.givenName} ${item.familyName}`
                    : `Creator ${index + 1}`
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

                  <UFormField
                    :label="nameIdentifierField(item.nameType).label"
                    :name="`creators[${index}].nameIdentifier`"
                    :help="nameIdentifierField(item.nameType).help"
                  >
                    <UInput
                      v-model="item.nameIdentifier"
                      :placeholder="
                        nameIdentifierField(item.nameType).placeholder
                      "
                      class="w-full"
                      @blur="
                        item.nameIdentifier = nameIdentifierField(
                          item.nameType,
                        ).normalize(item.nameIdentifier)
                      "
                    />
                  </UFormField>

                  <UFormField label="Affiliations" name="affiliations">
                    <div
                      v-for="(affiliation, affIndex) in item.affiliations"
                      :key="affIndex"
                      class="mb-2 flex items-start gap-2"
                    >
                      <UFormField
                        label="Name"
                        :name="`creators[${index}].affiliations[${affIndex}].affiliation`"
                        class="w-full"
                        required
                      >
                        <UInput
                          v-model="affiliation.affiliation"
                          class="w-full"
                          placeholder="University of Example"
                        />
                      </UFormField>

                      <UFormField
                        label="ROR"
                        :name="`creators[${index}].affiliations[${affIndex}].identifier`"
                        class="w-full"
                        hint="ID or URL"
                      >
                        <UInput
                          v-model="affiliation.identifier"
                          class="w-full"
                          placeholder="03yrm5c26 or https://ror.org/03yrm5c26"
                          @blur="
                            affiliation.identifier = normalizeROR(
                              affiliation.identifier,
                            )
                          "
                        />
                      </UFormField>

                      <UButton
                        class="mt-6 shrink-0"
                        size="sm"
                        color="error"
                        variant="outline"
                        icon="i-lucide-trash"
                        aria-label="Remove affiliation"
                        @click="item.affiliations.splice(affIndex, 1)"
                      />
                    </div>

                    <UButton
                      size="sm"
                      class="mt-2 w-full"
                      color="success"
                      variant="outline"
                      label="Add Affiliation"
                      icon="i-lucide-plus"
                      @click="
                        item.affiliations.push({
                          affiliation: '',
                          identifier: '',
                        })
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
              label="Add Creator"
              @click="addCreator"
            />
          </div>
        </div>

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
                  item.givenName || item.familyName
                    ? `${item.givenName} ${item.familyName}`
                    : `Contributor ${index + 1}`
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

                  <UFormField
                    :label="nameIdentifierField(item.nameType).label"
                    :name="`contributors[${index}].nameIdentifier`"
                    :help="nameIdentifierField(item.nameType).help"
                  >
                    <UInput
                      v-model="item.nameIdentifier"
                      :placeholder="
                        nameIdentifierField(item.nameType).placeholder
                      "
                      class="w-full"
                      @blur="
                        item.nameIdentifier = nameIdentifierField(
                          item.nameType,
                        ).normalize(item.nameIdentifier)
                      "
                    />
                  </UFormField>

                  <UFormField label="Affiliations" name="affiliations">
                    <div
                      v-for="(affiliation, affIndex) in item.affiliations"
                      :key="affIndex"
                      class="mb-2 flex items-start gap-2"
                    >
                      <UFormField
                        label="Name"
                        :name="`contributors[${index}].affiliations[${affIndex}].affiliation`"
                        class="w-full"
                        required
                      >
                        <UInput
                          v-model="affiliation.affiliation"
                          class="w-full"
                          placeholder="University of Example"
                        />
                      </UFormField>

                      <UFormField
                        label="ROR"
                        :name="`contributors[${index}].affiliations[${affIndex}].identifier`"
                        class="w-full"
                        hint="ID or URL"
                      >
                        <UInput
                          v-model="affiliation.identifier"
                          class="w-full"
                          placeholder="03yrm5c26 or https://ror.org/03yrm5c26"
                          @blur="
                            affiliation.identifier = normalizeROR(
                              affiliation.identifier,
                            )
                          "
                        />
                      </UFormField>

                      <UButton
                        class="mt-6 shrink-0"
                        size="sm"
                        color="error"
                        variant="outline"
                        icon="i-lucide-trash"
                        aria-label="Remove affiliation"
                        @click="item.affiliations.splice(affIndex, 1)"
                      />
                    </div>

                    <UButton
                      size="sm"
                      class="mt-2 w-full"
                      color="success"
                      variant="outline"
                      label="Add Affiliation"
                      icon="i-lucide-plus"
                      @click="
                        item.affiliations.push({
                          affiliation: '',
                          identifier: '',
                        })
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
              label="Add Contributor"
              @click="addContributor"
            />
          </div>
        </div>

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

                  <UFormField
                    label="ROR"
                    :name="`funders[${index}].identifier`"
                    help="Enter the ROR ID or paste the full ROR URL."
                  >
                    <UInput
                      v-model="item.identifier"
                      placeholder="03yrm5c26 or https://ror.org/03yrm5c26"
                      class="w-full"
                      @blur="item.identifier = normalizeROR(item.identifier)"
                    />
                  </UFormField>

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

            <UFormField
              label="ROR"
              name="managingOrganization.identifier"
              help="Enter the ROR ID or paste the full ROR URL."
            >
              <UInput
                v-model="state.managingOrganization.identifier"
                placeholder="03yrm5c26 or https://ror.org/03yrm5c26"
                class="w-full"
                @blur="
                  state.managingOrganization.identifier = normalizeROR(
                    state.managingOrganization.identifier,
                  )
                "
              />
            </UFormField>
          </div>
        </div>
      </UForm>
    </div>

    <div class="absolute right-0 bottom-0 left-0 z-10 px-6 pt-4 pb-6">
      <UButton
        form="metadata-team-form"
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
