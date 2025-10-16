<script setup lang="ts">
import { z } from "zod";
import type { FormSubmitEvent } from "#ui/types";

useSeoMeta({
  title: "Contact Us",
});

definePageMeta({
  layout: "public",
});

const toast = useToast();
const loading = ref(false);

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  subject: z.string().min(1, "Subject is required"),
});

type Schema = z.output<typeof schema>;

const state = reactive({
  name: "",
  email: "",
  message: "",
  subject: "",
});

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true;

  await $fetch("/api/contact", {
    body: event.data,
    method: "POST",
  })
    .then((response) => {
      toast.add({
        title: "Message sent successfully!",
        description: response.message,
        icon: "material-symbols:check-circle-outline",
      });

      // Reset form
      state.name = "";
      state.email = "";
      state.message = "";
      state.subject = "";
    })
    .catch((error) => {
      console.error(error);

      toast.add({
        title: "Error sending message",
        color: "error",
        description: error.data?.statusMessage || "Please try again later.",
        icon: "material-symbols:error",
      });
    })
    .finally(() => {
      loading.value = false;
    });
}
</script>

<template>
  <UContainer class="py-12">
    <div class="mb-8 text-center">
      <h1 class="mb-4 text-3xl font-bold">Contact Us</h1>

      <p class="text-lg">
        Have a question or need help? We'd love to hear from you. Send us a
        message and we'll respond as soon as possible.
      </p>
    </div>

    <UCard class="border border-slate-200 shadow-lg dark:border-slate-800">
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <UFormField label="Name" name="name">
            <UInput
              v-model="state.name"
              placeholder="Your full name"
              icon="i-heroicons-user"
            />
          </UFormField>

          <UFormField label="Email" name="email">
            <UInput
              v-model="state.email"
              type="email"
              placeholder="your.email@example.com"
              icon="i-heroicons-envelope"
            />
          </UFormField>
        </div>

        <UFormField label="Subject" name="subject">
          <UInput
            v-model="state.subject"
            placeholder="What's this about?"
            icon="i-heroicons-chat-bubble-left-right"
          />
        </UFormField>

        <UFormField label="Message" name="message">
          <UTextarea
            v-model="state.message"
            placeholder="Tell us more about your question or concern..."
            :rows="6"
            class="w-full"
            resize
          />
        </UFormField>

        <UButton type="submit" class="w-full" :loading="loading" size="lg">
          <template #leading>
            <Icon name="i-heroicons-paper-airplane" size="20" />
          </template>
          Send Message
        </UButton>
      </UForm>

      <template #footer>
        <div class="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            You can also reach us directly at
            <a
              href="mailto:info@envisionportal.io"
              class="text-primary-500 font-medium hover:underline"
            >
              info@envisionportal.io
            </a>
          </p>
        </div>
      </template>
    </UCard>
  </UContainer>
</template>
