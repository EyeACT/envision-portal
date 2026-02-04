<script setup lang="ts">
useSeoMeta({
  title: "Frequently Asked Questions",
});

definePageMeta({
  layout: "public",
});
</script>

<template>
  <UContainer class="py-12">
    <div class="mb-8">
      <h1 class="mb-4 text-3xl font-bold">Frequently Asked Questions</h1>

      <p>
        Have a different question and can't find the answer you're looking for?
        <br />
        <NuxtLink
          href="/contact"
          class="text-primary-500 font-medium hover:underline"
        >
          Contact us</NuxtLink
        >
        and we'll get back to you as soon as we can.
      </p>
    </div>

    <div class="grid-cols-12 gap-10 py-10 lg:grid">
      <dt class="col-span-5 text-xl font-medium">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.
      </dt>
      <dd class="col-span-7 mt-2 text-lg md:mt-0">
        Cupidatat sint ea duis mollit magna voluptate elit consequat. Deserunt
        laborum consectetur et duis laborum esse incididunt sit eu. Excepteur
        magna irure non reprehenderit aliquip. Amet voluptate veniam cupidatat
        magna commodo. Voluptate veniam excepteur id eu minim minim voluptate
        nisi in et eu enim. Est nisi velit in eiusmod sint eu id enim minim
        minim sit non.
      </dd>
    </div>

    <div class="grid-cols-12 gap-10 py-10 lg:grid">
      <dt class="col-span-5 text-xl font-medium">
        Ex nulla nisi aliqua mollit id aute minim mollit est ipsum labore.
      </dt>
      <dd class="col-span-7 mt-2 text-lg md:mt-0">
        Elit dolor adipisicing commodo fugiat commodo qui. Ipsum elit esse non
        laborum consectetur culpa excepteur consequat fugiat veniam consequat
        nisi dolor. Voluptate fugiat dolore adipisicing mollit et eiusmod elit
        in.
      </dd>
    </div>

    <div class="grid-cols-12 gap-10 py-10 lg:grid">
      <dt class="col-span-5 text-xl font-medium">
        Voluptate exercitation nostrud deserunt consectetur dolor occaecat.
      </dt>
      <dd class="col-span-7 mt-2 text-lg md:mt-0">
        Veniam mollit veniam ut nisi consectetur. Ullamco elit quis et ex veniam
        in. In reprehenderit amet aliqua quis. Cillum irure sit enim fugiat id
        magna.
      </dd>
    </div>
  </UContainer>
</template>
