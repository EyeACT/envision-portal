<script setup lang="ts">
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

// TODO: replace with data from `/api/datasets/${datasetId}/members`
const members = ref<DatasetMember[]>([
  {
    userId: "1",
    givenName: "Jane",
    familyName: "Doe",
    emailAddress: "jane.doe@example.com",
    owner: true,
    role: "owner",
    created: "2026-01-12T00:00:00.000Z",
  },
  {
    userId: "2",
    givenName: "John",
    familyName: "Smith",
    emailAddress: "john.smith@example.com",
    owner: false,
    role: "admin",
    created: "2026-02-03T00:00:00.000Z",
  },
  {
    userId: "3",
    givenName: "Alex",
    familyName: "Lee",
    emailAddress: "alex.lee@example.com",
    owner: false,
    role: "editor",
    created: "2026-03-21T00:00:00.000Z",
  },
  {
    userId: "4",
    givenName: "",
    familyName: "",
    emailAddress: "sam.patel@example.com",
    owner: false,
    role: "viewer",
    created: "2026-05-08T00:00:00.000Z",
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

const displayName = (member: DatasetMember) =>
  `${member.givenName} ${member.familyName}`.trim() || member.emailAddress;

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
            :key="member.userId"
            class="flex flex-wrap items-center justify-between gap-3 py-4"
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
              v-else
              :model-value="member.role"
              :items="roleOptions"
              :loading="updatingMemberId === member.userId"
              :disabled="updatingMemberId === member.userId"
              class="w-36"
              @update:model-value="
                (value) => updateRole(member, value as MemberRole)
              "
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
