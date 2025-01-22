<script setup lang="ts">
import { z } from "zod";
import type { FormSubmitEvent } from "#ui/types";

const { loggedIn } = useUserSession();

if (loggedIn.value) {
  await navigateTo("/dashboard");
}

definePageMeta({
  layout: "auth",
});

useSeoMeta({
  title: "Login",
});

const toast = useToast();
const loading = ref(false);

const schema = z.object({
  username: z.string().min(3, "Must be at least 3 characters"),
  password: z.string().min(8, "Must be at least 8 characters"),
});

type Schema = z.output<typeof schema>;

const state = reactive({
  username: "test",
  password: "12345678",
});

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const body = {
    username: event.data.username,
    password: event.data.password,
  };

  loading.value = true;

  await $fetch("/api/auth/login", {
    body,
    method: "POST",
  })
    .then(async () => {
      toast.add({
        id: "login_success",
        title: "Login successful",
        description: "You can now access your account",
        icon: "material-symbols:check-circle-outline",
      });

      window.location.href = "/dashboard";
    })
    .catch((error) => {
      console.error(error.data);

      toast.add({
        id: "login_error",
        title: "Error logging in",
        color: "red",
        description: error.data.statusMessage,
        icon: "material-symbols:error",
      });
    })
    .finally(() => {
      loading.value = false;
    });
}
</script>

<template>
  <UCard class="w-full max-w-sm bg-white/75 backdrop-blur dark:bg-white/5">
    <div class="w-full max-w-sm px-4 py-5 sm:p-6">
      <div class="flex flex-col items-center justify-center">
        <Icon name="iconoir:lock" :size="40" />

        <h2 class="my-1 text-2xl font-bold">Welcome back</h2>

        <p class="font-medium text-slate-600">
          Don't have an account?
          <NuxtLink
            to="/signup"
            class="font-medium text-sky-500 hover:underline"
          >
            Sign up
          </NuxtLink>
        </p>
      </div>

      <UForm
        :schema="schema"
        :state="state"
        class="mt-6 space-y-4"
        @submit="onSubmit"
      >
        <UFormGroup label="Username" name="username">
          <UInput v-model="state.username" type="text" />
        </UFormGroup>

        <UFormGroup label="Password" name="password">
          <template #hint>
            <NuxtLink
              to="/forgot-password"
              class="font-medium text-sky-500 hover:underline"
            >
              Forgot your password?
            </NuxtLink>
          </template>

          <UInput v-model="state.password" type="password" />
        </UFormGroup>

        <UButton
          type="submit"
          class="flex w-full justify-center"
          :loading="loading"
        >
          <template #trailing>
            <Icon name="i-heroicons-arrow-right-20-solid" size="20" />
          </template>
          Continue
        </UButton>
      </UForm>
    </div>

    <template #footer>
      By signing in, you agree to our
      <NuxtLink to="/" class="text-primary font-medium">
        Terms of Service </NuxtLink
      >.
    </template>
  </UCard>
</template>
