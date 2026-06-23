<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import * as z from "zod";
import { nanoid } from "nanoid";
import type { FormSubmitEvent, FormError } from "@nuxt/ui";

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
  studyCentralContacts: z.array(
    z.object({
      id: z.string(),
      affiliation: z.string(),
      affiliationIdentifier: z.string(),
      affiliationIdentifierScheme: z.string(),
      affiliationIdentifierSchemeUri: z.string(),
      degree: z.string(),
      deleted: z.boolean(),
      emailAddress: z.string(),
      familyName: z.string(),
      givenName: z.string(),
      identifier: z.string(),
      identifierScheme: z.string(),
      identifierSchemeUri: z.string(),
      local: z.boolean(),
      phone: z.string(),
      phoneExt: z.string(),
    }),
  ),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  studyCentralContacts: [],
});

const { data, error } = await useFetch(
  `/api/datasets/${datasetId}/study/metadata/contacts`,
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

  state.studyCentralContacts = data.value.StudyCentralContact.map(
    (contact: any) => ({
      id: contact.id,
      affiliation: contact.affiliation,
      affiliationIdentifier: contact.affiliationIdentifier,
      affiliationIdentifierScheme: contact.affiliationIdentifierScheme,
      affiliationIdentifierSchemeUri: contact.affiliationIdentifierSchemeUri,
      degree: contact.degree,
      deleted: false,
      emailAddress: contact.emailAddress,
      familyName: contact.familyName,
      givenName: contact.givenName,
      identifier: contact.identifier,
      identifierScheme: contact.identifierScheme,
      identifierSchemeUri: contact.identifierSchemeUri,
      local: false,
      phone: contact.phone,
      phoneExt: contact.phoneExt,
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

const addContact = () => {
  state.studyCentralContacts.push({
    id: nanoid(),
    affiliation: "",
    affiliationIdentifier: "",
    affiliationIdentifierScheme: "",
    affiliationIdentifierSchemeUri: "",
    degree: "",
    deleted: false,
    emailAddress: "",
    familyName: "",
    givenName: "",
    identifier: "",
    identifierScheme: "",
    identifierSchemeUri: "",
    local: true,
    phone: "",
    phoneExt: "",
  });
};

const removeContact = (index: number) => {
  const contact = state.studyCentralContacts[index];

  if (contact?.local) {
    state.studyCentralContacts.splice(index, 1);
  } else {
    contact!.deleted = true;
  }
};

const validate = (state: any): FormError[] => {
  const errors: FormError<string>[] = [];

  const activeContacts = state.studyCentralContacts.filter(
    (contact: any) => !contact.deleted,
  );

  if (activeContacts.length === 0) {
    errors.push({
      name: "studyCentralContacts",
      message: "At least one central contact is required",
    });
  }

  if (activeContacts.length > 0) {
    const seen = new Set<string>();
    activeContacts.forEach((contact: any, index: number) => {
      const key = `${contact.givenName?.trim().toLowerCase()}|${contact.familyName?.trim().toLowerCase()}|${contact.emailAddress?.trim().toLowerCase()}`;
      if (seen.has(key)) {
        errors.push({
          name: `givenName-${index}`,
          message: "Duplicate central contact with same given name, family name, and email address",
        });
      }
      seen.add(key);
    });

    activeContacts.forEach((contact: any, index: number) => {
      if (contact.givenName.trim() === "") {
        errors.push({
          name: `givenName-${index}`,
          message: "Given name is required",
        });
      }

      if (contact.familyName.trim() === "") {
        errors.push({
          name: `familyName-${index}`,
          message: "Family name is required",
        });
      }

      if (contact.affiliation.trim() === "") {
        errors.push({
          name: `affiliation-${index}`,
          message: "Affiliation is required",
        });
      }

      if (contact.emailAddress.trim() === "") {
        errors.push({
          name: `emailAddress-${index}`,
          message: "Email address is required",
        });
      }

      if (contact.emailAddress.trim() && !isValidEmail(contact.emailAddress)) {
        errors.push({
          name: `emailAddress-${index}`,
          message: "Email address is not valid",
        });
      }

      if (
        (contact.affiliationIdentifier.trim() !== "" && contact.affiliationIdentifierScheme.trim() === "") ||
        (contact.affiliationIdentifier.trim() === "" && contact.affiliationIdentifierScheme.trim() !== "")
      ) {
        errors.push(
          {
            name: `affiliationIdentifier-${index}`,
            message: "Affiliation identifier and scheme must be provided together",
          },
          {
            name: `affiliationIdentifierScheme-${index}`,
            message: "Affiliation identifier and scheme must be provided together",
          }
        );
      }

      if (
        contact.affiliationIdentifier &&
        contact.affiliationIdentifierScheme.toUpperCase() === "ORCID" &&
        !isValidORCIDValue(contact.affiliationIdentifier)
      ) {
        errors.push({
          name: `affiliationIdentifier-${index}`,
          message: "Must be a valid ORCID value",
        });
      }
      
      if (
        contact.affiliationIdentifier &&
        contact.affiliationIdentifierScheme.toUpperCase() === "ROR" &&
        !isValidRORValue(contact.affiliationIdentifier)
      ) {
        errors.push({
          name: `affiliationIdentifier-${index}`,
          message: "Must be a valid ROR value",
        });
      }

      if (
        contact.affiliationIdentifierSchemeUri.trim() &&
        !isValidUrl(contact.affiliationIdentifierSchemeUri)
      ) {
        errors.push({
          name: `affiliationIdentifierSchemeUri-${index}`,
          message: "Affiliation identifier scheme URI must be a valid URL",
        });
      }

      if (
        (contact.identifier.trim() !== "" && contact.identifierScheme.trim() === "") ||
        (contact.identifier.trim() === "" && contact.identifierScheme.trim() !== "")
      ) {
        errors.push(
          {
            name: `identifier-${index}`,
            message: "Identifier and Identifier scheme must be provided together",
          },
          {
            name: `identifierScheme-${index}`,
            message: "Identifier and Identifier scheme must be provided together",
          }
        );
      }

      if (
        contact.identifier &&
        contact.identifierScheme.toUpperCase() === "ORCID" &&
        !isValidORCIDValue(contact.identifier)
      ) {
        errors.push({
          name: `identifier-${index}`,
          message: "Must be a valid ORCID value",
        });
      }

      if (
        contact.identifier &&
        contact.identifierScheme.toUpperCase() === "ROR" &&
        !isValidRORValue(contact.identifier)
      ) {
        errors.push({
          name: `identifier-${index}`,
          message: "Must be a valid ROR value",
        });
      }

      if (
        contact.identifierSchemeUri &&
        !isValidUrl(contact.identifierSchemeUri)
      ) {
        errors.push({
          name: `identifierSchemeUri-${index}`,
          message: "Identifier scheme URI must be a valid URL",
        });
      }
    });
  }

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;
  isSubmitting.value = true;

  const formData = event.data;

  const b = {
    studyContacts: formData.studyCentralContacts.map((contact: any) => {
      const s = { ...contact };

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
    const res = await $fetch(`/api/datasets/${datasetId}/study/metadata/contacts`, {
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
            label: 'Central Contacts',
            to: `/app/datasets/${datasetId}/study/metadata/contacts`,
          },
        ]"
      />

      <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <div class="flex w-full items-center justify-between gap-3">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Central Contacts
          </h1>
        </div>
        <p class="text-gray-500 dark:text-gray-400">
          Some basic information about the study is displayed here.
        </p>
      </div>

      <UForm
        id="study-metadata-contacts-form"
        :validate="validate"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <div class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div class="flex w-full flex-col gap-4">
            <div class="flex flex-col">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Study Investigators & Contacts
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                Register administrative data, organizational alignments, and lookup schemes for primary coordinators responsible for running this setup.
              </p>
            </div>

            <UFormField name="studyCentralContacts">
              <CardCollapsible
                v-for="(item, index) in state.studyCentralContacts"
                v-show="!item.deleted"
                :key="item.id"
                class="my-2 shadow-none"
                :title="item.givenName ? `${item.givenName} ${item.familyName}` : `Central Contact ${index + 1}`"
                bordered
              >
                <template #header-extra>
                  <UButton
                    icon="i-lucide-trash"
                    label="Remove Contact"
                    variant="soft"
                    color="error"
                    @click="removeContact(index)"
                  />
                </template>

                <div class="flex w-full flex-col gap-4 p-1">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <UFormField label="Given Name" :name="`givenName-${index}`" required>
                      <UInput v-model="item.givenName" placeholder="James" />
                    </UFormField>

                    <UFormField label="Family Name" :name="`familyName-${index}`" required>
                      <UInput v-model="item.familyName" placeholder="Smith" />
                    </UFormField>

                    <UFormField label="Degree" :name="`degree-${index}`">
                      <UInput v-model="item.degree" placeholder="e.g., PhD, MD" />
                    </UFormField>
                  </div>

                  <UFormField label="Affiliation" :name="`affiliation-${index}`" required>
                    <UInput
                      v-model="item.affiliation"
                      placeholder="University of California, San Francisco"
                    />
                  </UFormField>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <UFormField
                      label="Affiliation Identifier"
                      :name="`affiliationIdentifier-${index}`"
                      class="w-full"
                    >
                      <UInput
                        v-model="item.affiliationIdentifier"
                        placeholder="e.g., ror-id-0123"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="Affiliation Scheme"
                      class="w-full"
                      :name="`affiliationIdentifierScheme-${index}`"
                    >
                      <UInput
                        v-model="item.affiliationIdentifierScheme"
                        placeholder="e.g., ROR, Ringgold"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="Affiliation Scheme URI"
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

                  <UFormField label="Email Address" :name="`emailAddress-${index}`" required>
                    <UInput
                      v-model="item.emailAddress"
                      type="email"
                      placeholder="james.smith@example.com"
                    />
                  </UFormField>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <UFormField
                      label="Personal Identifier"
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
                        placeholder="e.g., ORCID"
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

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <UFormField label="Phone Number" :name="`phone-${index}`" class="w-full">
                      <UInput
                        v-model="item.phone"
                        placeholder="+1 (555) 000-0000"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField label="Extension" :name="`phoneExt-${index}`" class="w-full">
                      <UInput
                        v-model="item.phoneExt"
                        placeholder="123"
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
              label="Add New Central Contact"
              class="mt-2"
              @click="addContact"
            />
          </div>
        </div>
      </UForm>
    </div>

    <div class="absolute bottom-0 left-0 right-0 z-10 px-6 pb-6 pt-4">
      <UButton
        form="study-metadata-contacts-form"
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
            Are you sure you want to leave this page? Any modifications made to your configured study investigator contacts data points will be permanently discarded.
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