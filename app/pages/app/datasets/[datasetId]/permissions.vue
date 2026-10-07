<script setup lang="ts">
import { InvitationStatuses } from '~~/shared/generated/browser';

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { studyId } = route.params as { studyId: string };
const { datasetId } = route.params as { datasetId: string };


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
  url?: string;
}

interface DatasetInvitation {
  id: string;
  emailAddress: string | null;
  role: MemberRole;
  url: string;
  status: (typeof InvitationStatuses)[keyof typeof InvitationStatuses]
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
    console.log(m)
    const {user, updated, role, ...mFields} = m 
    members.value.push({ 
      role: role as DatasetRole, 
      ...user, 
      ...mFields
    })
  }

}).catch((error) => {
  console.error(error)
})


$fetch(`/api/datasets/${datasetId}/invitations`).then(fetchedInvitations => {
  for(const i of fetchedInvitations) {
    const {role, ...iFields} = i
    invitations.value.push({...iFields, role: role as DatasetRole})
  }
}).catch((error) => {
  console.error(error)
})

// TODO: Convert accepted invites to Datasetmembers/remove accetped invites to avoid duplication
const members = ref<DatasetMember []>([]);

const invitations = ref<DatasetInvitation []>([])

type PermissionRow = | {
  kind: "member",
  key: string;
  name: string;
  emailAddress: string;
  role: MemberRole;
  owner: boolean; 
  member: DatasetMember
} | {
  kind: "invitation";
  key: string;
  owner: boolean;
  name: string;
  emailAddress: string | null;
  role: MemberRole;
  invitation: DatasetInvitation;
}

const search = ref("");

const filteredRows = computed<PermissionRow[]>(() => {
  const rows: PermissionRow[] = [
    ...members.value.map((member) => ({
      kind: "member" as const,
      key: `member:${member.userId}`,
      name: `${member.givenName} ${member.familyName}`.trim() || member.emailAddress,
      emailAddress: member.emailAddress,
      role: member.role,
      owner: member.owner,
      member,
    })),
    ...invitations.value.filter((invitation) => { 
      return invitation.status === InvitationStatuses.NORESPONSE
    })
    .map((invitation) => ({
      kind: "invitation" as const,
      key: `invitation:${invitation.id}`,
      name: `${invitation.emailAddress ?? "Unknown email"} [invited]`,
      emailAddress: invitation.emailAddress ?? "",
      role: invitation.role,
      owner: false,
      invitation
    }))
  ]

  const query = search.value.trim().toLowerCase();

  if(!query) return rows

  return rows.filter((row) => 
    `${row.name} ${row.emailAddress}`.toLocaleLowerCase().includes(query)
  );
})

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
    
try {

  let targetEmail = currentEmail.value

  // check if invitation already exists but is RESCINDED/EXPIRED/ACCEPTED but member is gone
  const isMember = members.value.some(member => {
    return member.emailAddress.toLocaleLowerCase() === targetEmail.toLocaleLowerCase()
  })

  if(isMember) {
    toast.add({title: "Already a member of the dataset", color: "error", icon: "material-symbols:error"})
    return
  }

  // check last updated time
  const existingInvitation = invitations.value.find(invitation => 
  targetEmail.toLocaleLowerCase() === invitation.emailAddress?.toLocaleLowerCase()
  )

  if(existingInvitation) {
    // update invitation if within update policy time
    $fetch(`/api/datasets/${datasetId}/invitations/${existingInvitation.id}/resend`, {
      method: "POST"
    })
    toast.add({ title: "Invite Sent", description: `${currentEmail.value}` })
    emailSending.value = false;
    return
  } 

    const dsi = await $fetch(`/api/datasets/${datasetId}/invitations`, {
      method: "POST",
      body: {
        emailAddress: currentEmail.value,
        datasetId: datasetId,
        role: currentRole.value.toLocaleLowerCase(),

      }
    })
    toast.add({ title: "Invite Sent", description: `${currentEmail.value}` })
    // add member if has account to members list
    invitations.value.push({
      ...dsi.invitation,
      url: dsi.url,
      role: dsi.invitation.role as MemberRole
    })

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

const removeRow = async (row: PermissionRow) => {
    removingMember.value = true

    if(row.kind == "member") {
      console.log("Remove later")
      toast.add({
      title: "Member Removed",
      icon: "material-symbols:check-circle",
    });


    members.value = members.value.filter(currMember => currMember.emailAddress !== row.emailAddress)

    } else {
      // remove invitation
      await $fetch(`/api/datasets/${datasetId}/invitations/${row.invitation.id}`, {
        method: "PATCH",
        body: {
          status: InvitationStatuses.RESCINDED
        }
      })
      toast.add({
        title: "Invitation Rescinded",
        icon: "material-symbols:check-circle",
      });
    }


    removingMember.value = false
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
          v-if="filteredRows.length"
          class="divide-y divide-gray-200 dark:divide-gray-800"
        >
          <li
            v-for="row in filteredRows"
            :key="row.key"
            :class="[row.kind == 'member' ? 'flex flex-wrap items-center justify-between gap-2 py-4' : 'flex flex-wrap items-center justify-between gap-2 py-4 opacity-60']"
          >
            <div class="flex min-w-0 items-center gap-3">
              <UAvatar :alt="row.name" size="md" />

              <div class="min-w-0">
                <p
                  class="truncate text-sm font-medium text-gray-900 dark:text-white"
                >
                  {{ row.name }}
                </p>

                <p class="truncate text-xs text-gray-500 dark:text-gray-400">
                  {{ row.emailAddress }}
                </p>
              </div>
            </div>

            <UBadge
              v-if="row.kind == 'member' && row.owner"
              color="primary"
              variant="soft"
              size="md"
              class="font-bold uppercase"
            >
              Owner
            </UBadge>

            <USelect
              v-else-if="row.kind === 'member' && !row.owner"
              :items="roleOptions"
              :loading="updatingMemberId === row.member.userId"
              :disabled="updatingMemberId === row.member.userId"
              class="w-36"
              @update:model-value="
                (value) => updateRole(row.member, value as MemberRole)
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
                {{ row.role }}
              </UBadge>
               <ULink 
                as="button"
                color="primary"
                variant="soft"
                size="sm"
                :to="row.invitation.url"
                target="_blank"
              >Follow Invite URL</ULink> 
            </div>

            <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-x"
                @click="removeRow(row)"
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
