<script setup lang="ts">
import type { DatasetInvitation } from '~~/shared/generated/client';

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { studyId } = route.params as { studyId: string };
const { datasetId } = route.params as { datasetId: string };

const invitation = route.query.invitation

if(invitation) {
  // TODO: Show accept MODAL
  console.log("We are accepting the invitation automatically for now")

  // SESSION protected accept for given invitation
  await $fetch(`/api/datasetInvitations/${invitation}/accept`, {
    method: "POST"
  })
}

useSeoMeta({ title: "Permissions" });

type MemberRole = "owner" | "admin" | "editor" | "viewer";

interface DatasetMember {
  userId: string;
  givenName: string;
  familyName: string;
  emailAddress: string;
  owner: boolean;
  role: MemberRole;
  created: string;
  accepted: boolean;
  url?: string;
}


const roleOptions = [
  {
    label: "Admin",
    value: "admin",
    description: "Can manage members and edit the dataset",
  },
  {
    label: "Editor",
    value: "editor",
    description: "Can edit the dataset metadata and files",
  },
  {
    label: "Viewer",
    value: "viewer",
    description: "Can view the dataset",
  },
];


const currentRole = ref("")
const currentEmail = ref("")

// email sending loading
const emailSending = ref(false)

// member removal loading
const removingMember = ref(false)


// NOTE: Accepted will be a foregin field from DatasetInvitation later on
// TODO: replace with data from `/api/datasets/${datasetId}/members`
$fetch(`/api/datasets/${datasetId}/members`).then(fetchedMembers  => {
  for(const m of fetchedMembers) {
    const {user, updated, role, ...mFields} = m 
    members.value.push({ 
      accepted: false, // TODO: Get accepted or pre made equivalent from DB on this fetch call
      role: role as DatasetRole, 
      ...user, 
      ...mFields
    })
  }

}).catch((error) => {
  console.error(error)
})
const members = ref<DatasetMember []>([
  {
    userId: "1",
    givenName: "Jane",
    familyName: "Doe",
    emailAddress: "jane.doe@example.com",
    owner: true,
    role: "owner",
    created: "2026-01-12T00:00:00.000Z",
    accepted: true
  },
  {
    userId: "2",
    givenName: "John",
    familyName: "Smith",
    emailAddress: "john.smith@example.com",
    owner: false,
    role: "admin",
    created: "2026-02-03T00:00:00.000Z",
    accepted: true

  },
  {
    userId: "3",
    givenName: "Alex",
    familyName: "Lee",
    emailAddress: "alex.lee@example.com",
    owner: false,
    role: "editor",
    created: "2026-03-21T00:00:00.000Z",
    accepted: true

  },
  {
    userId: "4",
    givenName: "",
    familyName: "",
    emailAddress: "sam.patel@example.com",
    owner: false,
    role: "viewer",
    created: "2026-05-08T00:00:00.000Z",
    accepted: false,
    url: "https://fairdataihub.org/"
  },
]);

const search = ref("");

const filteredMembers = computed(() => {
  const query = search.value.trim().toLowerCase();

  if (!query) return members.value;

  return members.value.filter((member) =>
    [member.givenName, member.familyName, member.emailAddress]
      .join(" ")
      .toLowerCase()
      .includes(query),
  );
});

const displayName = (member: DatasetMember) => {
  if(!member.accepted) {
    return `${member.emailAddress} [invited]`
  }
  return `${member.givenName} ${member.familyName}`.trim() || member.emailAddress;
}

const roleLabel = (role: MemberRole) =>
  role === "owner"
    ? "Owner"
    : (roleOptions.find((option) => option.value === role)?.label ?? role);

const updatingMemberId = ref<string | null>(null);

const updateRole = async (member: DatasetMember, newRole: MemberRole) => {
  if (member.owner || member.role === newRole) return;

  const previousRole = member.role;

  member.role = newRole;
  updatingMemberId.value = member.userId;

  try {
    // TODO: persist with PUT `/api/datasets/${datasetId}/members/${member.userId}`
    toast.add({
      title: "Role updated",
      description: `${displayName(member)} is now ${roleLabel(newRole).toLowerCase()}`,
      icon: "material-symbols:check-circle",
    });
  } catch (error) {
    console.error(error);
    member.role = previousRole;
    toast.add({
      title: "Could not update role",
      color: "error",
      icon: "material-symbols:error",
    });
  } finally {
    updatingMemberId.value = null;
  }
};

const addMember = async () => {
  emailSending.value = true;


  console.log(currentRole.value)

  try {
    const dsi = await $fetch(`/api/datasets/${datasetId}/datasetInvitation`, {
      method: "POST",
      body: {
        emailAddress: currentEmail.value,
        datasetId: datasetId,
        role: currentRole.value,

      }
    })
    console.log(dsi)
    toast.add({ title: "Invite Sent", description: `${currentEmail.value}` })
    // add member if has account to members list
    members.value.push({
      userId: "9", // spoof for now
      givenName: "",
      familyName: "",
      emailAddress: currentEmail.value,
      owner: false,
      role: currentRole.value,
      created: "2026-02-03T00:00:00.000Z",
      accepted: false,
      url: dsi
    })

  // TODO: Create member if already a user (maybe)
  // try {
  //   const addedMember = await $fetch(`/api/datasets/${datasetId}/members`, {
  //     method: "POST",
  //     body: email
  //   })
  // } catch(error) {
  //   const e = error as any
  //   console.error(e)
  // }

    currentRole.value = ""
    currentEmail.value = ""
  } catch (error) {
    const e = error as any
    console.error(e)
    toast.add({title: "Dataset Invitation Not Sent", description: e.data.statusMessage,  color: "error", icon: "material-symbols:error"})
  } finally {
    emailSending.value = false;
  }

}

const removeMember = async (member: DatasetMember) => {
    removingMember.value = true

    // Mock rescinding invitation and removing user from dataset team
    await new Promise((resolve) => setTimeout(resolve, 1800));

    removingMember.value = false

    toast.add({
      title: "Member Removed",
      icon: "material-symbols:check-circle",
    });


    members.value = members.value.filter(currMember => currMember.emailAddress !== member.emailAddress)
}

</script>

<template>
  <div>
    <UBreadcrumb
      class="mb-4 ml-2"
      :items="[
        { label: 'Dashboard', to: '/app/dashboard' },
        { label: 'Permissions', to: `/app/datasets/${datasetId}/permissions` },
      ]"
    />

    <div class="flex w-full flex-col gap-6 pb-5">
      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full items-center justify-between gap-3">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Permissions
          </h1>
        </div>

        <p class="text-base text-gray-500 dark:text-gray-400">
          Manage who has access to this dataset and what they can do.
        </p>
      </div>

      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full items-center justify-between gap-3">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Add Members
        </h1>
        </div>

        <p class="flex w-full text-base text-gray-500 dark:text-gray-400">
          Invite members to your team and assign their role
        </p>

        <div class="flex w-full py-4 gap-3">
          <div class="flex flex-col">
            <label>Email address</label>
            <UInput
                v-model="currentEmail"
                placeholder="Ex. sue@gmail.com"
                class="w-full sm:w-64"
            />
          </div>
          <div class="flex flex-col">
            <label>Role</label>
            <USelect
              v-model="currentRole"
              :items="roleOptions"
              value-key="label"
              class="w-36"
              placeholder="Select role"
            />
          </div>
          <div class="flex items-end">
            <UButton
              label="Add Member"
              @click="addMember"
              :loading="emailSending"
            />
          </div>
        </div>

      </div>

      <div
        class="flex w-full flex-col gap-5 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">
              Members
            </h2>

            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ members.length }}
              {{ members.length === 1 ? "person has" : "people have" }} access
              to this dataset.
            </p>
          </div>
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Search members"
            class="w-full sm:w-64"
          />
        </div>

        <ul
          v-if="filteredMembers.length"
          class="divide-y divide-gray-200 dark:divide-gray-800"
        >
          <li
            v-for="member in filteredMembers"
            :key="member.emailAddress"
            :class="[member.accepted ? 'flex flex-wrap items-center justify-between gap-2 py-4' : 'flex flex-wrap items-center justify-between gap-2 py-4 opacity-60']"
          >
            <div class="flex min-w-0 items-center gap-3">
              <UAvatar :alt="displayName(member)" size="md" />

              <div class="min-w-0">
                <p
                  class="truncate text-sm font-medium text-gray-900 dark:text-white"
                >
                  {{ displayName(member) }}
                </p>

                <p class="truncate text-xs text-gray-500 dark:text-gray-400">
                  {{ member.emailAddress }}
                </p>
              </div>
            </div>

            <UBadge
              v-if="member.owner"
              color="primary"
              variant="soft"
              size="md"
              class="font-bold uppercase"
            >
              Owner
            </UBadge>

            <USelect
              v-else-if="member.accepted"
              :model-value="member.role"
              :items="roleOptions"
              :loading="updatingMemberId === member.userId"
              :disabled="updatingMemberId === member.userId"
              class="w-36"
              @update:model-value="
                (value) => updateRole(member, value as MemberRole)
              "
            />

            <div 
              v-else
              class="flex gap-2"
            >
              <UBadge 
                color="neutral"
                variant="soft"
                size="md"
                class="font-bold uppercase"
              >
                {{ member.role }}
              </UBadge>
              <ULink 
                as="button"
                color="primary"
                variant="soft"
                size="sm"
                :to="member.url"
                target="_blank"
              >Follow Invite URL</ULink>
            </div>

            <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-x"
                @click="removeMember(member)"
                :loading="removingMember"
              />
          </li>
        </ul>

        <p v-else class="text-sm text-gray-500 dark:text-gray-400">
          No members match your search.
        </p>
      </div>
    </div>
  </div>
</template>
example.com


Vie