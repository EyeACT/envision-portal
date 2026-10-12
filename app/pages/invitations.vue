<script setup lang="ts">

definePageMeta({
  middleware: ["auth"],
});

useSeoMeta({
  title: "Invitations",
});

const toast = useToast();

const { data: invitations, error } = await useFetch("/api/datasetInvitations");

if (error.value) {
  console.log(error.value);
}

const acceptLoading = ref(false)
const accept = (id: string) => {
  acceptLoading.value = true

  try {
    $fetch(`/api/datasetInvitations/${id}/accept`, {
      method: "POST"
    })
    toast.add({title: "Dataset Invitation Accepted", description: "View the dataset by clicking 'My datasets' in the sidebar."})
    invitations.value = invitations.value ? invitations.value.filter((d) => d.id !== id) : []
  } catch(e) {
    console.error(e)
    toast.add({title: "Dataset Invitation Not Accepted", description: "The invitation could not be accepted.", color: "error", icon: "material-symbols:error"})
  } finally {
    acceptLoading.value = false
  }
}

const rejectLoading = ref(false)
const reject = (id: string) => {
  rejectLoading.value = true

  try {
    $fetch(`/api/datasetInvitations/${id}/reject`, {
      method: "POST"
    })
    toast.add({title: "Dataset Invitation Rejected"})
    invitations.value = invitations.value ? invitations.value.filter((d) => d.id !== id) : []
  } catch(e) {
    console.error(e)
    toast.add({title: "Dataset Invitation Not Rejected", description: "The invitation could not be rejected. Please try again later.", color: "error", icon: "material-symbols:error"})
  } finally {
    rejectLoading.value = false
  }
}

const items = [
  {
    icon: "i-lucide-inbox",
    label: "Invitations",
    slot: "Invitations",
  },
];

</script>

// ALLOW THEM TO ACCEPT OR REJECT THAT WAY
<template>
  <UTabs
    :items="items"
    orientation="horizontal"
    variant="link"
    class="w-full gap-4"
    :ui="{ trigger: 'cursor-pointer' }"> 
    <template #Invitations>
      <div class="flex flex-col gap-5">
        <ul
          v-if="invitations?.length"
          class="divide-y divide-gray-200 dark:divide-gray-800"
        >
          <li
            v-for="invitation in invitations"
            :key="invitation.id"
            class="flex flex-col flex-wrap items-center justify-between gap-2 py-4"
          >

            <p class="truncate text-xs text-gray-500 dark:text-gray-400">
              You have been invited to become a {{ invitation.role }} for {{invitation.dataset.title }}.
            </p>
            <div class="flex flex-row gap-2">
              <UButton 
                @click="accept(invitation.id)"
                label="Accept"
                size="sm"
                :loading="acceptLoading"
                ></UButton>
              <UButton
                color="error"
                label="Reject"
                size="sm"
                :loading="rejectLoading"
                @click="reject(invitation.id)"
              ></UButton>
            </div>
          </li>

        </ul>

        <p v-else>No Invitations</p>
      </div>
    </template>
  </UTabs>
</template>