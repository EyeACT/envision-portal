<script setup lang="ts">
useSeoMeta({
  title: "Privacy Policy - Envision Portal",
  description:
    "How the Envision Portal collects, uses, and protects personal information related to the use of the platform.",
});

definePageMeta({
  layout: "public",
});
</script>

<template>
  <UContainer class="py-12">
    <h1 class="mb-4 text-2xl font-bold">Privacy Policy</h1>

    <p class="mb-4">
      This Privacy Policy explains how the Envision Portal ("we", "our", or "us")
      collects, uses, and protects information when you use our platform and
      related services. By using the Envision Portal, you agree to the practices
      described in this policy.
    </p>

    <h2 class="mt-6 mb-2 text-xl font-semibold">1. What We Collect</h2>
    <p class="mb-2">
      We may collect the following types of information when you use the Envision
      Portal:
    </p>
    <ul class="mb-4 ml-5 list-disc space-y-1">
      <li>
        <strong>Account information:</strong> such as your name, email address,
        affiliation, and password when you create an account.
      </li>
      <li>
        <strong>Access request details:</strong> information you provide when
        requesting access to controlled datasets (for example, your name,
        affiliation, email, and intended use of the data).
      </li>
      <li>
        <strong>Usage information:</strong> technical information about how you
        use the platform, such as IP address, browser type, pages visited,
        timestamps, and basic analytics.
      </li>
      <li>
        <strong>Support and feedback:</strong> information you provide if you
        contact us with questions, feedback, or bug reports (for example via the
        contact form or GitHub issues).
      </li>
    </ul>

    <h2 class="mt-6 mb-2 text-xl font-semibold">2. How We Use Your Information</h2>
    <p class="mb-2">
      We use the information we collect for purposes including:
    </p>
    <ul class="mb-4 ml-5 list-disc space-y-1">
      <li>Creating and managing your user account;</li>
      <li>
        Processing and tracking dataset access requests and ensuring appropriate
        use of controlled data;
      </li>
      <li>
        Operating, maintaining, and improving the Envision Portal and its
        features;
      </li>
      <li>
        Monitoring service performance and security (for example, using logs and
        basic analytics);
      </li>
      <li>
        Communicating with you about your account, access requests, or updates to
        our services and policies;
      </li>
      <li>
        Supporting research reporting and platform evaluation in aggregate form
        (for example, number of users, dataset usage counts).
      </li>
    </ul>

    <h2 class="mt-6 mb-2 text-xl font-semibold">3. Cookies and Analytics</h2>
    <p class="mb-4">
      The Envision Portal may use cookies or similar technologies to keep you
      logged in, remember your preferences, and understand how the platform is
      used. Any analytics we use are intended to help improve usability,
      performance, and reliability. We do not sell your personal information.
    </p>

    <h2 class="mt-6 mb-2 text-xl font-semibold">4. Sharing of Information</h2>
    <p class="mb-2">
      We may share information in the following situations:
    </p>
    <ul class="mb-4 ml-5 list-disc space-y-1">
      <li>
        <strong>Project collaborators:</strong> with members of the FAIR Data
        Innovations Hub team and collaborating institutions (such as the
        University of Washington and Kaiser Permanente Washington) as needed to
        operate and improve the Envision Portal.
      </li>
      <li>
        <strong>Service providers:</strong> with trusted third-party vendors that
        provide infrastructure or related services (for example, cloud hosting)
        under appropriate agreements.
      </li>
      <li>
        <strong>Legal or safety reasons:</strong> if we are required to do so by
        law, regulation, or valid legal process, or if we believe disclosure is
        necessary to protect the rights, safety, or security of users, study
        participants, or our collaborators.
      </li>
    </ul>
    <p class="mb-4">
      We do not sell or rent your personal information to third parties.
    </p>

    <h2 class="mt-6 mb-2 text-xl font-semibold">5. Data Security</h2>
    <p class="mb-4">
      We use technical and organizational measures to help protect information
      processed through the Envision Portal, including encrypted connections
      (HTTPS/TLS), role-based access controls for non-public data, and regularly
      updated systems. However, no method of transmission or storage is
      completely secure, and we cannot guarantee absolute security.
    </p>

    <h2 class="mt-6 mb-2 text-xl font-semibold">6. Data Retention</h2>
    <p class="mb-4">
      We retain information for as long as reasonably necessary to operate the
      Portal, support research and reporting, meet legal or institutional
      requirements, and maintain auditability of dataset access. When information
      is no longer needed, we aim to delete or anonymize it in a reasonable
      timeframe.
    </p>

    <h2 class="mt-6 mb-2 text-xl font-semibold">7. Your Choices and Rights</h2>
    <p class="mb-2">
      Depending on your location and applicable laws, you may have certain
      rights regarding your personal information, such as:
    </p>
    <ul class="mb-4 ml-5 list-disc space-y-1">
      <li>Requesting access to the information we hold about you;</li>
      <li>Requesting corrections to inaccurate or incomplete information;</li>
      <li>Requesting deletion of certain information, where appropriate;</li>
      <li>
        Limiting or objecting to certain types of processing, where permitted by
        law.
      </li>
    </ul>
    <p class="mb-4">
      To exercise these rights or ask questions about your data, you can contact
      us using the details below.
    </p>

    <h2 class="mt-6 mb-2 text-xl font-semibold">8. Third-Party Links and Services</h2>
    <p class="mb-4">
      The Envision Portal may link to other websites or services, such as external
      documentation, code repositories, or dataset hosts. This Privacy Policy
      applies only to the Envision Portal. We are not responsible for the privacy
      practices of third-party sites or services.
    </p>

    <h2 class="mt-6 mb-2 text-xl font-semibold">9. Changes to This Policy</h2>
    <p class="mb-4">
      We may update this Privacy Policy from time to time to reflect changes to
      our practices or legal requirements. When we do, we will update the "Last
      updated" date below. Your continued use of the Envision Portal after
      changes are posted means you accept the updated policy.
    </p>
    <p class="mb-4 text-sm text-gray-500">
      Last updated: November 17, 2025
    </p>

    <h2 class="mt-6 mb-2 text-xl font-semibold">10. Contact Us</h2>
    <p class="mb-4">
      If you have questions about this Privacy Policy or how your information is
      handled, please contact us through our
      <NuxtLink to="/contact" class="text-blue-600 underline hover:text-blue-800">
        Contact page
      </NuxtLink>
      .
    </p>
  </UContainer>
</template>
