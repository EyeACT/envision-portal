<script setup lang="ts">
import { z } from "zod";
import type { FormSubmitEvent } from "#ui/types";
import { faker } from "@faker-js/faker";

const { loggedIn } = useUserSession();
const { environment } = useRuntimeConfig().public;

if (loggedIn.value) {
  await navigateTo("/app/dashboard");
}

definePageMeta({
  layout: "auth",
});

useSeoMeta({
  title: "Signup",
});

const toast = useToast();
const loading = ref(false);

const showPassword = ref(false);

const schema = z.object({
  emailAddress: z.string().email(),
  familyName: z.string(),
  givenName: z.string(),
  password: z.string().min(8, "Must be at least 8 characters"),
});

type Schema = z.output<typeof schema>;

const state = reactive({
  emailAddress: environment === "development" ? faker.internet.email() : "",
  familyName: environment === "development" ? faker.person.lastName() : "",
  givenName: environment === "development" ? faker.person.firstName() : "",
  password: environment === "development" ? faker.internet.password() : "",
});

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const body = {
    emailAddress: event.data.emailAddress,
    familyName: event.data.familyName,
    givenName: event.data.givenName,
    password: event.data.password,
  };

  loading.value = true;

  await $fetch("/api/auth/signup", {
    body,
    method: "POST",
  })
    .then(async () => {
      toast.add({
        title: "Account created successfully",
        color: "info",
        description:
          "Please check your email to verify your account before logging in.",
        icon: "material-symbols:mail-outline",
      });
    })
    .catch((error) => {
      console.error(error.data);
      toast.add({
        title: "Error creating account",
        color: "error",
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
    <div class="w-full max-w-sm px-4 py-5 sm:p-2">
      <UAlert
        color="warning"
        variant="subtle"
        title="This platform is currently invite only"
        description="As we are still in development, we are only allowing invited users to access the platform"
        class="mb-6"
        icon="material-symbols:lock-outline"
      />
      <div class="flex flex-col items-center justify-center">
        <h2 class="my-1 text-2xl font-bold">Create an account</h2>

        <p class="font-medium text-slate-600">
          Already have an account?
          <NuxtLink to="/login" class="text-primary-500 font-medium">
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
        <UFormField label="Given or First Name" name="givenName">
          <UInput v-model="state.givenName" type="text" />
        </UFormField>

        <UFormField label="Family or Last Name" name="familyName">
          <UInput v-model="state.familyName" type="text" />
        </UFormField>

        <UFormField label="Email Address" name="emailAddress">
          <UInput v-model="state.emailAddress" type="email" />
        </UFormField>

        <UFormField label="Password" name="password">
          <UInput
            v-model="state.password"
            :type="showPassword ? 'text' : 'password'"
          >
            <template #trailing>
              <Icon
                name="solar:eye-linear"
                size="16"
                class="cursor-pointer text-slate-400 transition-colors hover:text-slate-600"
                @mousedown="showPassword = true"
                @mouseup="showPassword = false"
              />
            </template>
          </UInput>
        </UFormField>

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
      <p class="text-center text-sm">
        By signing in, you agree to our
        <NuxtLink to="/signup" class="text-primary-500 text-sm font-medium">
          Terms of Service</NuxtLink
        >.
      </p>

      <hr class="my-4 border-gray-200" />

      <p class="text-center text-sm text-slate-600">
        Want to share an external dataset? No sign up required! Just
        <NuxtLink to="/share-dataset" class="text-primary-500 font-medium"
          >click here</NuxtLink
        >
        to fill a simple form and point us to your data.
      </p>
    </template>
  </UCard>
</template>
