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
    .then((response: any) => {
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
      <iframe
        data-tally-src="https://tally.so/embed/44JZaX?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
        loading="lazy"
        width="100%"
        height="324"
        frameborder="0"
        marginheight="0"
        marginwidth="0"
        title="Envision Portal Contact Form"
      />

      <template #footer-hidden>
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
