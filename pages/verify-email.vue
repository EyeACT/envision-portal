<template>
  <div v-if="loading" class="loading-spinner">Loading...</div>
  <div v-else>
    <h1>Email Verification</h1>
    <p v-if="message" :class="messageClass">{{ message }}</p>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">

const route = useRoute();
const toast = useToast();
const token = route.query.token as string;  // Get token from query params
let loading = true;
let message = "";
let errorMessage = "";
let messageClass = "success";

// Handle token validation and verification
onMounted(async () => {
  if (!token) {
    loading = false;
    errorMessage = "No verification token found in the URL.";
    return;
  }

  try {
    const response = await $fetch("/api/auth/verify-email", {
      method: "POST",
      body: { token },
    });

    message = response.message;
    loading = false;
    toast.add({
      title: "Email Verified",
      description: response.message,
      color: "success",
      icon: "material-symbols:check-circle-outline",
    });

    // Redirect after verification
    navigateTo("/login");
  } catch (error) {
    loading = false;
    toast.add({
      title: "Verification Failed",
      description: "An error occurred. Please try again later",
      color: "error",
      icon: "material-symbols:error",
    });
  }
});
</script>
