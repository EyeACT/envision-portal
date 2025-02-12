<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <h1 class="text-2xl font-bold">
        {{ verifying ? "Verifying Email..." : successMessage || errorMessage }}
      </h1>
      <p v-if="errorMessage" class="text-red-500">{{ errorMessage }}</p>
      <p v-if="successMessage" class="text-green-500">{{ successMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const { loggedIn } = useUserSession();

if (loggedIn.value) {
  await navigateTo("/dashboard");
}

definePageMeta({
  layout: "auth",
});

useSeoMeta({
  title: "Email Verification",
});

const route = useRoute();
const toast = useToast();
const token = route.query.token as string;
const verifying = ref(true);
const successMessage = ref("");
const errorMessage = ref("");

// Verify email when the page loads
onMounted(async () => {
  if (!token) {
    verifying.value = false;
    errorMessage.value = "No verification token found.";
    return;
  }

  try {
    const response = await $fetch("/api/auth/verify-email", {
      method: "POST",
      body: { token },
    });

    successMessage.value = "Email verified successfully! Redirecting...";
    toast.add({
      title: "Email Verified",
      description: response.message,
      color: "success",
      icon: "material-symbols:check-circle-outline",
    });

    setTimeout(() => {
      navigateTo("/login");
    }, 3000); 
  } catch (error) {
    errorMessage.value = "Email verification failed. Please try again.";
    toast.add({
      title: "Verification Failed",
      description: errorMessage.value,
      color: "error",
      icon: "material-symbols:error",
    });
  } finally {
    verifying.value = false;
  }
});
</script>
