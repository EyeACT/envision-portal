<script setup lang="ts">
useSeoMeta({
  title: 'Terms of Use - Envision Portal',
  description:
    'Terms and conditions governing the use of the Envision Portal platform and associated services.',
});

definePageMeta({
  layout: 'public',
});
</script>

<template>
  <UContainer class="py-12">
    <h1 class="mb-4 text-3xl font-bold">Terms of Use</h1>
    <p class="mb-4 text-gray-700">
      These Terms of Use (the “Terms”) govern your access to and use of the
      Envision Portal (the “Portal”) and related services. By accessing or
      using the Portal, you agree to be bound by these Terms. If you do not
      agree to these Terms, you must not use the Portal.
    </p>
    <p class="mb-6 text-sm text-gray-500">
      <strong>Note:</strong> The Envision Portal is a research-focused platform
      for managing and sharing eye imaging datasets. It is not intended for
      clinical decision-making, diagnosis, or patient care.
    </p>

    <h2 class="mt-8 mb-2 text-2xl font-semibold">1. Definitions</h2>
    <p class="mb-2">
      For the purposes of these Terms:
    </p>
    <ul class="mb-4 ml-5 list-disc space-y-1">
      <li>
        <strong>“Envision Portal” or “Portal”</strong> means the cloud-based,
        open-source platform for managing, curating, and sharing eye imaging
        data and associated metadata.
      </li>
      <li>
        <strong>“Services”</strong> means all functionality provided through
        the Portal, including dataset browsing, access request workflows,
        submission workflows for invited contributors, and related tools.
      </li>
      <li>
        <strong>“User”, “you”</strong> means any individual or entity that
        accesses or uses the Portal.
      </li>
      <li>
        <strong>“Dataset”</strong> means any collection of data, files,
        documentation, or metadata made available through the Portal.
      </li>
      <li>
        <strong>“Contributor”</strong> means a User who submits or manages
        Datasets in the Portal.
      </li>
    </ul>

    <h2 class="mt-8 mb-2 text-2xl font-semibold">2. Eligibility and Accounts</h2>
    <p class="mb-4">
      By using the Portal, you represent and warrant that you are legally
      permitted to do so under applicable law and any institutional policies
      that apply to you.
    </p>
    <p class="mb-4">
      Certain features of the Portal may require you to create an account. You
      agree to:
    </p>
    <ul class="mb-4 ml-5 list-disc space-y-1">
      <li>Provide accurate and up-to-date registration information;</li>
      <li>
        Maintain the confidentiality of your login credentials; and
      </li>
      <li>
        Be responsible for all activities that occur under your account.
      </li>
    </ul>

    <h2 class="mt-8 mb-2 text-2xl font-semibold">3. Nature of the Service</h2>
    <p class="mb-4">
      The Envision Portal is designed to support researchers, data stewards,
      and AI/ML developers working with eye imaging datasets. The Portal:
    </p>
    <ul class="mb-4 ml-5 list-disc space-y-1">
      <li>
        Provides tools for sharing, discovering, and reusing eye imaging
        datasets;
      </li>
      <li>
        Supports guided submission workflows for invited Contributors, including
        data standardization, de-identification, and metadata completeness;
      </li>
      <li>
        Distinguishes between public and controlled-access Datasets; and
      </li>
      <li>
        Aligns with FAIR (Findable, Accessible, Interoperable, Reusable) data
        principles and the TRUST Principles for Digital Repositories.
      </li>
    </ul>
    <p class="mb-4">
      The Portal is currently under active development and may be labeled as a
      preview or early version. Features may change, be added, or be removed
      without prior notice.
    </p>

    <h2 class="mt-8 mb-2 text-2xl font-semibold">4. Data Access and Use</h2>
    <h3 class="mt-4 mb-1 text-lg font-semibold">4.1 Public Datasets</h3>
    <p class="mb-4">
      Some Datasets may be made publicly discoverable through the Portal’s
      dataset catalog at
      <NuxtLink to="/datasets" class="text-blue-600 underline hover:text-blue-800">
        /datasets
      </NuxtLink>
      . Access to and reuse of public Datasets is subject to the license and
      terms specified on the corresponding dataset overview page and any linked
      documentation or license files.
    </p>

    <h3 class="mt-4 mb-1 text-lg font-semibold">4.2 Controlled-Access Datasets</h3>
    <p class="mb-4">
      Certain Datasets may be designated as controlled-access due to
      sensitivity, agreement terms, or other restrictions. Access to such
      Datasets may require:
    </p>
    <ul class="mb-4 ml-5 list-disc space-y-1">
      <li>Submitting an access request form through the Portal;</li>
      <li>
        Providing information such as your name, affiliation, contact details,
        and intended use; and
      </li>
      <li>
        Agreeing to dataset-specific terms, licenses, or data use agreements.
      </li>
    </ul>
    <p class="mb-4">
      By requesting or receiving access to controlled-access Datasets, you
      agree to:
    </p>
    <ul class="mb-4 ml-5 list-disc space-y-1">
      <li>
        Use the data only for the purposes and within the scope you described
        and that are allowed by the applicable license or agreement;
      </li>
      <li>
        Not attempt to re-identify individuals or link data to identifiable
        persons;
      </li>
      <li>
        Implement reasonable technical and organizational safeguards to protect
        the data; and
      </li>
      <li>
        Not share the data with others except as explicitly allowed by the
        relevant license or agreement.
      </li>
    </ul>

    <h3 class="mt-4 mb-1 text-lg font-semibold">4.3 Attribution and Citation</h3>
    <p class="mb-4">
      You agree to follow any citation or acknowledgement instructions
      associated with a Dataset, including citing DOIs or other identifiers
      provided in the dataset overview page or linked documentation.
    </p>

    <h2 class="mt-8 mb-2 text-2xl font-semibold">5. Contributor Responsibilities</h2>
    <p class="mb-4">
      At this time, dataset submission is typically available to invited
      Contributors. If you submit or manage Datasets in the Portal, you agree
      that:
    </p>
    <ul class="mb-4 ml-5 list-disc space-y-1">
      <li>
        You have the necessary rights, approvals, and permissions (including
        any required ethics or institutional approvals) to share the data in
        the manner enabled by the Portal;
      </li>
      <li>
        Any required de-identification or anonymization has been performed in
        accordance with applicable laws, policies, and guidance;
      </li>
      <li>
        You will not upload data that contains protected health information
        (PHI) or other directly identifiable personal data unless there is an
        appropriate legal and ethical basis and the Portal explicitly supports
        such handling;
      </li>
      <li>
        You will provide accurate and sufficiently detailed metadata and
        documentation to support responsible reuse; and
      </li>
      <li>
        You will comply with any additional project-specific policies that
        apply to your study or dataset.
      </li>
    </ul>

    <h2 class="mt-8 mb-2 text-2xl font-semibold">6. Acceptable Use</h2>
    <p class="mb-4">
      You agree not to use the Portal or Services to:
    </p>
    <ul class="mb-4 ml-5 list-disc space-y-1">
      <li>
        Violate any applicable laws, regulations, or institutional policies;
      </li>
      <li>
        Upload or distribute malware, malicious code, or content that could
        harm systems or data;
      </li>
      <li>
        Attempt to gain unauthorized access to the Portal, Datasets, or other
        users’ accounts;
      </li>
      <li>
        Interfere with or disrupt the normal operation of the Portal, including
        by excessive automated requests or scraping beyond what is reasonably
        necessary for research purposes;
      </li>
      <li>
        Misrepresent your identity, affiliation, or your intended use of data;
      </li>
      <li>
        Attempt to re-identify individuals in de-identified datasets; or
      </li>
      <li>
        Use the Portal in any way that could harm study participants, other
        users, or collaborating institutions.
      </li>
    </ul>

    <h2 class="mt-8 mb-2 text-2xl font-semibold">7. Intellectual Property</h2>
    <h3 class="mt-4 mb-1 text-lg font-semibold">7.1 Platform and Software</h3>
    <p class="mb-4">
      The Envision Portal software, design, and infrastructure are protected by
      applicable intellectual property and open-source licenses. The source
      code is made available at
      <NuxtLink to="https://github.com/EyeACT/envision-portal" target="_blank"
        class="text-blue-600 underline hover:text-blue-800">
        github.com/EyeACT/envision-portal
      </NuxtLink>
      and may be used subject to the terms of the applicable license(s).
    </p>

    <h3 class="mt-4 mb-1 text-lg font-semibold">7.2 Datasets and Content</h3>
    <p class="mb-4">
      Ownership and licensing of Datasets and associated metadata are
      determined by the Contributors and/or their institutions and funding
      bodies. Each Dataset may be subject to its own license or terms of use,
      which are indicated in the dataset overview page or linked documentation.
      You agree to comply with such dataset-specific terms.
    </p>

    <h2 class="mt-8 mb-2 text-2xl font-semibold">8. Privacy and Data Protection</h2>
    <p class="mb-4">
      Your use of the Portal is also governed by our Privacy Policy, which
      describes how we collect, use, and protect personal information. Please
      review the Privacy Policy at
      <NuxtLink to="/privacy" class="text-blue-600 underline hover:text-blue-800">
        /privacy
      </NuxtLink>
      .
    </p>

    <h2 class="mt-8 mb-2 text-2xl font-semibold">9. Service Availability and Changes</h2>
    <p class="mb-4">
      We aim to provide a reliable service, but the Portal may experience
      downtime, maintenance windows, or technical issues. Service status and
      planned maintenance are reported via our public status page at
      <NuxtLink to="https://status.envisionportal.org/" target="_blank"
        class="text-blue-600 underline hover:text-blue-800">
        status.envisionportal.org
      </NuxtLink>
      .
    </p>
    <p class="mb-4">
      We may modify, suspend, or discontinue any part of the Services at any
      time, with or without notice, including in response to security concerns,
      technical issues, or changes in funding or project scope.
    </p>

    <h2 class="mt-8 mb-2 text-2xl font-semibold">10. Disclaimers</h2>
    <ul class="mb-4 ml-5 list-disc space-y-1">
      <li>
        The Portal and all Datasets are provided “as is” and “as available”
        without warranties of any kind, whether express or implied.
      </li>
      <li>
        We do not guarantee the completeness, accuracy, or suitability of any
        Dataset for a particular purpose.
      </li>
      <li>
        The Portal does not provide medical advice and is not intended to
        replace clinical judgment or professional medical guidance.
      </li>
      <li>
        To the fullest extent permitted by law, we disclaim all warranties,
        including implied warranties of merchantability, fitness for a
        particular purpose, and non-infringement.
      </li>
    </ul>

    <h2 class="mt-8 mb-2 text-2xl font-semibold">11. Limitation of Liability</h2>
    <p class="mb-4">
      To the fullest extent permitted by law, in no event shall the operators
      of the Envision Portal, the FAIR Data Innovations Hub, Eye ACT
      collaborators, or their respective institutions, funders, employees, or
      affiliates be liable for any indirect, incidental, consequential, special,
      exemplary, or punitive damages, or any loss of data, profits, or
      opportunities, arising out of or in connection with your use of or
      inability to use the Portal or any Dataset.
    </p>

    <h2 class="mt-8 mb-2 text-2xl font-semibold">12. Indemnification</h2>
    <p class="mb-4">
      You agree to indemnify, defend, and hold harmless the operators of the
      Envision Portal and their collaborators and institutions from and against
      any claims, liabilities, damages, losses, and expenses (including
      reasonable attorneys’ fees) arising out of or in any way connected with
      your use of the Portal or Datasets, your violation of these Terms, or
      your violation of any applicable law or third-party rights.
    </p>

    <h2 class="mt-8 mb-2 text-2xl font-semibold">13. Third-Party Services</h2>
    <p class="mb-4">
      The Portal may link to or integrate with third-party services, platforms,
      or resources (such as external documentation, code repositories, or
      dataset hosts). We do not control and are not responsible for the
      content, policies, or practices of any third-party services. Your use of
      such services is subject to their own terms and policies.
    </p>

    <h2 class="mt-8 mb-2 text-2xl font-semibold">14. Changes to These Terms</h2>
    <p class="mb-4">
      We may update these Terms from time to time. When we do so, we will
      update the “last updated” date below and may provide additional notice as
      appropriate. Your continued use of the Portal after changes take effect
      constitutes your acceptance of the revised Terms.
    </p>
    <p class="mb-4 text-sm text-gray-500">
      Last updated: <!-- fill in date when you publish --> [Month Day, Year]
    </p>

    <h2 class="mt-8 mb-2 text-2xl font-semibold">15. Contact</h2>
    <p class="mb-4">
      If you have questions about these Terms or about the Envision Portal,
      please contact us through our
      <NuxtLink to="/contact" class="text-blue-600 underline hover:text-blue-800">
        Contact page
      </NuxtLink>
      . You may also report technical issues or feature requests via our GitHub
      issues at
      <NuxtLink to="https://github.com/EyeACT/envision-portal/issues" target="_blank"
        class="text-blue-600 underline hover:text-blue-800">
        github.com/EyeACT/envision-portal/issues
      </NuxtLink>
      .
    </p>
  </UContainer>
</template>
