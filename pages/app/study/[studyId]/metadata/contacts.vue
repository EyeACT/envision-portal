<script setup lang="ts">
import * as z from "zod";
import { nanoid } from "nanoid";
import type { FormSubmitEvent, FormError } from "@nuxt/ui";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { studyId } = route.params as { studyId: string };

const saveLoading = ref(false);

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
  `/api/studies/${studyId}/metadata/contacts`,
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

  state.studyCentralContacts = data.value.StudyCentralContact.map(
    (contact) => ({
      ...contact,
      deleted: false,
      local: false,
    }),
  );
}

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

  if (contact.local) {
    state.studyCentralContacts.splice(index, 1);
  } else {
    contact.deleted = true;
  }
};

const validate = (state: any): FormError[] => {
  const errors = [];
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (state.studyCentralContacts.length === 0) {
    errors.push({
      name: "studyCentralContacts",
      message: "At least one study central contact is required",
    });
  }

  state.studyCentralContacts.forEach((contact: any, index: number) => {
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

    // Validate email format
    if (
      contact.emailAddress.trim() !== "" &&
      !emailPattern.test(contact.emailAddress)
    ) {
      errors.push({
        name: `emailAddress-${index}`,
        message: "Email address is not valid",
      });
    }

    // If identifier is provided, identifier scheme must also be provided and vice versa
    if (
      (contact.identifier.trim() !== "" &&
        contact.identifierScheme.trim() === "") ||
      (contact.identifier.trim() === "" &&
        contact.identifierScheme.trim() !== "")
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
  });

  console.log("Validation errors:", errors);

  return errors;
};

async function onSubmit(event: FormSubmitEvent<typeof state>) {
  saveLoading.value = true;

  const formData = event.data;

  const b = {
    studyContacts: formData.studyCentralContacts.map((contact: any) => {
      const s = contact;

      if (s.local) {
        delete s.id;
      }
      if (!s.deleted) {
        delete s.deleted;
      }

      return s;
    }),
  };

  await $fetch(`/api/studies/${studyId}/metadata/contacts`, {
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
          label: 'Central Contacts',
          to: `/app/study/${studyId}/metadata/contacts`,
        },
      ]"
    />

    <div class="flex w-full flex-col gap-6 pb-5">
      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
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
                Central Contacts
              </h2>

              <p class="text-gray-500 dark:text-gray-400">
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Quisquam, quos.
              </p>
            </div>

            <UFormField name="studyCentralContacts">
              <CardCollapsible
                v-for="(item, index) in state.studyCentralContacts"
                v-show="!item.deleted"
                :key="item.id"
                class="my-1 shadow-none"
                :title="
                  item.givenName
                    ? `${item.givenName} ${item.familyName}`
                    : `Central Contact ${index + 1}`
                "
                bordered
              >
                <template #header-extra>
                  <UButton
                    icon="i-lucide-trash"
                    label="Remove identifier"
                    variant="soft"
                    color="error"
                    @click="removeContact(index)"
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
                        placeholder="ORCID"
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

                  <UFormField
                    label="Email Address"
                    :name="`emailAddress-${index}`"
                    required
                  >
                    <UInput
                      v-model="item.emailAddress"
                      placeholder="james.smith@example.com"
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

                  <div class="flex w-full gap-3">
                    <UFormField
                      label="Phone"
                      :name="`phone-${index}`"
                      class="w-full"
                    >
                      <UInput
                        v-model="item.phone"
                        placeholder="1234567890"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="Phone Extension"
                      :name="`phoneExt-${index}`"
                      class="w-full"
                    >
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
              label="Add Central Contact"
              @click="addContact"
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
