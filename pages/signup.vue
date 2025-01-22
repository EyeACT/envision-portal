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
  name: z.string().min(3, "Must be at least 3 characters"),
  password: z.string().min(8, "Must be at least 8 characters"),
});

type Schema = z.output<typeof schema>;

const state = reactive({
  username: "test",
  name: "Alessandra",
  password: "12345678",
});

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const body = {
    username: event.data.username,
    name: event.data.name,
    password: event.data.password,
  };

  loading.value = true;

  await $fetch("/api/auth/signup", {
    body,
    method: "POST",
  })
    .then(async () => {
      toast.add({
        id: "signup_success",
        title: "Account created successfully",
        description: "You can now login",
        icon: "material-symbols:check-circle-outline",
      });
      await navigateTo("/login");
    })
    .catch((error) => {
      console.error(error.data);
      toast.add({
        id: "signup_error",
        title: "Error creating account",
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
        <h2 class="my-1 text-2xl font-bold">Create an account</h2>

        <p class="font-medium text-slate-600">
          Already have an account?
          <NuxtLink
            to="/login"
            class="font-medium text-sky-500 hover:underline"
          >
            Login
          </NuxtLink>
        </p>
      </div>

      <UForm
        :schema="schema"
        :state="state"
        class="mt-6 space-y-4"
        @submit="onSubmit"
      >
        <UFormGroup label="Name" name="name">
          <UInput v-model="state.name" type="text" />
        </UFormGroup>

        <UFormGroup label="Username" name="username">
          <UInput v-model="state.username" type="text" />
        </UFormGroup>

        <UFormGroup label="Password" name="password">
          <template #trailing>
            <Icon name="solar:eye-linear" size="16" />
          </template>

          <UInput v-model="state.password" type="password" />
        </UFormGroup>

        <UButton
          type="submit"
          class="flex w-full justify-center"
          :loading="loading"
        >
          Create account
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
