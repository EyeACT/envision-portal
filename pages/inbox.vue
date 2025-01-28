<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

useSeoMeta({
  title: "Inbox",
});

const toast = useToast();

const items = [
  {
    icon: "i-lucide-inbox",
    label: "Unread Messages",
    slot: "unread",
  },
  {
    icon: "i-lucide-bell",
    label: "Archived Notifications",
    slot: "notifications",
  },
];

const { data: notifications, error } = await useFetch("/api/notifications");

if (error.value) {
  console.log(error.value);
}

const markAsRead = async (notificationId: string) => {
  await $fetch(`/api/notifications/${notificationId}`, {
    body: JSON.stringify({
      action: "mark-as-read",
    }),
    method: "POST",
  })
    .then((_result) => {
      window.location.reload();
    })
    .catch((error) => {
      toast.add({
        title: "Something went wrong",
        color: "error",
        description: error.data.statusMessage,
        icon: "material-symbols:error",
      });
    });
};

const markAsUnread = async (notificationId: string) => {
  await $fetch(`/api/notifications/${notificationId}`, {
    body: JSON.stringify({
      action: "mark-as-unread",
    }),
    method: "POST",
  })
    .then((_result) => {
      window.location.reload();
    })
    .catch((error) => {
      toast.add({
        title: "Something went wrong",
        color: "error",
        description: error.data.statusMessage,
        icon: "material-symbols:error",
      });
    });
};

const deleteNotification = async (notificationId: string) => {
  await $fetch(`/api/notifications/${notificationId}`, {
    method: "DELETE",
  })
    .then((_result) => {
      window.location.reload();
    })
    .catch((error) => {
      toast.add({
        title: "Something went wrong",
        color: "error",
        description: error.data.statusMessage,
        icon: "material-symbols:error",
      });
    });
};
</script>

<template>
  <div class="flex flex-col gap-5">
    <UTabs
      :items="items"
      orientation="horizontal"
      variant="link"
      class="w-full gap-4"
      :ui="{ trigger: 'cursor-pointer' }"
    >
      <template #unread>
        <UCard
          v-for="notification in notifications?.unreadNotifications"
          :key="notification.id"
          class="mb-3"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Icon
                  v-if="notification.type === 'info'"
                  name="heroicons-outline:bell"
                  size="20"
                  class="text-blue-500"
                />

                <Icon
                  v-else-if="notification.type === 'warning'"
                  name="material-symbols:warning-rounded"
                  size="20"
                  class="text-yellow-500"
                />

                <Icon
                  v-else-if="notification.type === 'error'"
                  name="material-symbols:error"
                  size="20"
                  class="text-red-500"
                />

                <Icon
                  v-else-if="notification.type === 'success'"
                  name="material-symbols:check-circle-outline"
                  size="20"
                  class="text-green-500"
                />

                <span class="text-sm font-medium text-gray-900">
                  {{ notification.title }}
                </span>
              </div>

              <time
                :datetime="$dayjs('2023-01-01').utc().toString()"
                class="text-sm text-gray-500"
              >
                {{ $dayjs(notification.created).fromNow() }}
              </time>
            </div>
          </template>

          <p>
            {{ notification.body }}
          </p>

          <template #footer>
            <div class="flex items-center justify-end gap-2">
              <UButton
                label="Mark as read"
                color="success"
                icon="i-lucide-check"
                @click="markAsRead(notification.id)"
              />

              <UButton
                label="Delete"
                color="error"
                icon="i-lucide-trash"
                @click="deleteNotification(notification.id)"
              />
            </div>
          </template>
        </UCard>
      </template>

      <template #notifications>
        <UCard
          v-for="notification in notifications?.allNotifications"
          :key="notification.id"
          class="mb-3"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Icon
                  v-if="notification.type === 'info'"
                  name="heroicons-outline:bell"
                  size="20"
                  class="text-blue-500"
                />

                <Icon
                  v-else-if="notification.type === 'warning'"
                  name="material-symbols:warning-rounded"
                  size="20"
                  class="text-yellow-500"
                />

                <Icon
                  v-else-if="notification.type === 'error'"
                  name="material-symbols:error"
                  size="20"
                  class="text-red-500"
                />

                <Icon
                  v-else-if="notification.type === 'success'"
                  name="material-symbols:check-circle-outline"
                  size="20"
                  class="text-green-500"
                />

                <span class="text-sm font-medium text-gray-900">
                  {{ notification.title }}
                </span>
              </div>

              <time
                :datetime="$dayjs('2023-01-01').utc().toString()"
                class="text-sm text-gray-500"
              >
                {{
                  $dayjs(notification.created).format("MMMM D, YYYY - h:mm A")
                }}
              </time>
            </div>
          </template>

          <p>
            {{ notification.body }}
          </p>

          <template #footer>
            <div class="flex items-center justify-end gap-2">
              <UButton
                label="Mark as unread"
                color="primary"
                icon="i-lucide-check"
                @click="markAsUnread(notification.id)"
              />

              <UButton
                label="Delete"
                color="error"
                icon="i-lucide-trash"
                @click="deleteNotification(notification.id)"
              />
            </div>
          </template>
        </UCard>
      </template>
    </UTabs>
  </div>
</template>
