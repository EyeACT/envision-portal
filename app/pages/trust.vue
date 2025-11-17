<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

useSeoMeta({
  title: 'TRUST Principles - Envision Portal',
  description:
    'How the Envision Portal implements the TRUST Principles (Transparency, Responsibility, User Focus, Sustainability, Technology) for trustworthy eye imaging data.',
});

definePageMeta({
  layout: 'public',
});

const sections = [
  { id: 'summary', label: 'Summary' },
  { id: 'about', label: 'About the Envision Portal & Eye ACT' },
  { id: 'transparency', label: 'Transparency' },
  { id: 'responsibility', label: 'Responsibility' },
  { id: 'user-focus', label: 'User Focus' },
  { id: 'sustainability', label: 'Sustainability' },
  { id: 'technology', label: 'Technology' },
  { id: 'self-assessment', label: 'TRUST Self-Assessment' },
  { id: 'references', label: 'References' },
  { id: 'questions-feedback', label: 'Questions & Feedback' },
];

const activeId = ref<string>('summary');
const isProgrammaticScroll = ref(false);
const HEADER_OFFSET = 96;

// Scrollspy: choose the section whose center is closest to viewport center,
// but force the first/last sections when near top/bottom.
function handleScroll() {
  if (isProgrammaticScroll.value) return;

  const viewportHeight = window.innerHeight;
  const viewportCenter = viewportHeight / 2;

  const docEl = document.documentElement;
  const scrollTop = window.scrollY || docEl.scrollTop || 0;
  const docHeight = docEl.scrollHeight;
  const scrollBottom = scrollTop + viewportHeight;

  if (scrollTop < 4) {
    if (sections.length > 0 && sections[0]?.id) {
      activeId.value = sections[0].id;
    }
    return;
  }

  // Near the very bottom -> last section is active
  if (docHeight - scrollBottom < 4) {
    activeId.value = 'questions-feedback';
    return;
  }

  let bestId = activeId.value;
  let smallestDist = Infinity;

  for (const { id } of sections) {
    const el = document.getElementById(id);
    if (!el) continue;

    const rect = el.getBoundingClientRect();

    // Skip sections completely off-screen
    if (rect.bottom <= 0 || rect.top >= viewportHeight) continue;

    const center = rect.top + rect.height / 2;
    const dist = Math.abs(center - viewportCenter);

    // <= so later sections win ties (slight downward bias)
    if (dist <= smallestDist) {
      smallestDist = dist;
      bestId = id;
    }
  }

  activeId.value = bestId;
}

// Click handler: scroll + set active, temporarily disabling scrollspy
const scrollToSection = (id: string) => {
  if (typeof window === 'undefined') return;

  isProgrammaticScroll.value = true;
  activeId.value = id;

  const el = document.getElementById(id);
  if (!el) {
    isProgrammaticScroll.value = false;
    return;
  }

  const y = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
  window.scrollTo({ top: y, behavior: 'smooth' });

  window.setTimeout(() => {
    isProgrammaticScroll.value = false;
    // sync once more at the end of the scroll
    handleScroll();
  }, 700);
};

onMounted(() => {
  handleScroll(); // set initial section based on current scroll
  window.addEventListener('scroll', handleScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <UContainer class="py-12">
    <div class="flex flex-col gap-10 md:flex-row">
      <!-- nav -->
      <aside class="md:w-64 md:flex-shrink-0">
        <!-- Mobile -->
        <div class="mb-6 flex gap-2 overflow-x-auto md:hidden">
          <button v-for="section in sections" :key="section.id" type="button"
            class="whitespace-nowrap rounded-full px-3 py-2 text-xs" :class="section.id === activeId
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              " @click="scrollToSection(section.id)">
            {{ section.label }}
          </button>
        </div>

        <!-- Desktop -->
        <div class="hidden md:block sticky top-24">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Document sections
          </p>
          <ul class="space-y-1 border-l border-gray-200 pl-2">
            <li v-for="section in sections" :key="section.id">
              <button type="button" class="w-full rounded-md px-3 py-2 text-left text-sm transition-colors" :class="section.id === activeId
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
                " @click="scrollToSection(section.id)">
                {{ section.label }}
              </button>
            </li>
          </ul>
        </div>
      </aside>
      <div class="prose prose-lg max-w-none">
        <section id="summary" class="mb-10 ">
          <h1 class="mb-6 text-3xl font-bold">TRUST Principles</h1>

          <p class="mb-4 text-lg text-gray-700">
            The Envision Portal is an open-source platform designed to streamline
            the management and sharing of eye imaging data. It helps researchers
            manage, curate, and share their data following the FAIR principles so
            that datasets are ready for AI-driven analysis and collaborative
            studies.
          </p>

          <p class="mb-8 text-gray-600">
            This page describes how Envision Portal aligns with the
            <NuxtLink to="https://www.nature.com/articles/s41597-020-0486-7" target="_blank"
              class="text-blue-600 underline hover:text-blue-800">
              TRUST Principles for Digital Repositories
            </NuxtLink>
            (Transparency, Responsibility, User Focus, Sustainability, and
            Technology) and points to public evidence of our implementation.
          </p>
        </section>

        <!-- About Envision Portal & Eye ACT -->
        <section id="about" class="mb-10 rounded-lg border border-gray-200 bg-gray-50 p-5">
          <h2 class="mb-3 mt-3 text-xl font-semibold">
            About the Envision Portal &amp; Eye ACT
          </h2>
          <p class="mb-3">
            The Envision Portal is a cloud-based, open-source platform that
            provides tools for sharing, discovering, and reusing eye imaging
            datasets. It focuses on dataset sharing with guided submission
            workflows, data standardization and de-identification, rich metadata
            collection, access control for public and controlled datasets, and
            alignment with FAIR (Findable, Accessible, Interoperable, Reusable)
            data principles.
          </p>
          <p class="mb-3">
            The Envision Portal is developed by the FAIR Data Innovations Hub team
            as part of the Eye ACT study, in collaboration with the University of
            Washington and Kaiser Permanente Washington. The Eye ACT study aims to
            understand how ophthalmic conditions such as macular degeneration and
            diabetic retinopathy can provide early clues to Alzheimer’s disease
            and other neurodegenerative conditions.
          </p>
          <p class="mb-0">
            You can learn more on our
            <NuxtLink to="/about" class="text-blue-600 underline hover:text-blue-800">
              About page
            </NuxtLink>
            and explore publicly listed datasets at
            <NuxtLink to="/datasets" class="text-blue-600 underline hover:text-blue-800">
              /datasets
            </NuxtLink>
            .
          </p>
        </section>

        <!-- Transparency -->
        <section id="transparency" class="mb-12 ">
          <h2 class="mb-4 text-2xl font-semibold text-blue-700">
            <Icon name="heroicons:eye" class="mr-2 inline-block" />
            Transparency
          </h2>
          <p class="mb-4">
            We are committed to being open about how the Envision Portal is
            operated, governed, and developed, so that users understand what the
            platform does and how their data are handled.
          </p>

          <div class="mb-4 border-l-4 border-blue-400 bg-blue-50 p-4">
            <h3 class="mb-2 font-semibold">Our implementation:</h3>
            <ul class="list-disc space-y-2 pl-6">
              <li>
                <strong>Open platform information:</strong>
                The
                <NuxtLink to="/about" class="text-blue-700 underline hover:text-blue-900">
                  About page
                </NuxtLink>
                describes the Portal's purpose, designated community, key
                features, technology stack, and current development status.
              </li>
              <li>
                <strong>Policies &amp; data governance:</strong>
                Our
                <NuxtLink to="/terms" class="text-blue-700 underline hover:text-blue-900">
                  Terms of Use
                </NuxtLink>
                and
                <NuxtLink to="/privacy" class="text-blue-700 underline hover:text-blue-900">
                  Privacy Policy
                </NuxtLink>
                explain conditions of use, data protection, and responsibilities
                for users and operators.
              </li>
              <li>
                <strong>Repository documentation:</strong>
                The
                <NuxtLink to="https://docs.envision.io/" target="_blank"
                  class="text-blue-700 underline hover:text-blue-900">
                  Envision Portal documentation
                </NuxtLink>
                describes the repository's architecture, dataset workflows, and
                operational considerations, and will expand as the platform
                matures.
              </li>
              <li>
                <strong>Service status:</strong>
                Service uptime, response times, and planned maintenance are monitored and
                reported via our public status page, powered by Uptime Kuma, at
                <NuxtLink to="https://status.envisionportal.org/" target="_blank"
                  class="text-blue-700 underline hover:text-blue-900">
                  status.envisionportal.org
                </NuxtLink>
                .
              </li>
            </ul>
          </div>
        </section>

        <!-- Responsibility -->
        <section id="responsibility" class="mb-12 ">
          <h2 class="mb-4 text-2xl font-semibold text-green-700">
            <Icon name="heroicons:shield-check" class="mr-2 inline-block" />
            Responsibility
          </h2>
          <p class="mb-4">
            We take responsibility for the stewardship of eye imaging datasets and
            associated metadata, including their quality, preservation, and
            appropriate use.
          </p>

          <div class="mb-4 border-l-4 border-green-400 bg-green-50 p-4">
            <h3 class="mb-2 font-semibold">Our implementation:</h3>
            <ul class="list-disc space-y-2 pl-6">
              <li>
                <strong>FAIR-aligned curation &amp; standards:</strong>
                Envision Portal is built around the FAIR principles and supports
                community standards for clinical and imaging data (e.g., DICOM,
                OMOP, and structured clinical dataset models). Public examples of
                how we document complex datasets are available in metadata
                repositories such as our
                <NuxtLink to="https://github.com/EyeACT/ADDF-dataset-metadata-files/tree/main/main/v1.0.0"
                  target="_blank" class="text-blue-700 underline hover:text-blue-900">
                  metadata file examples
                </NuxtLink>
                .
              </li>
              <li>
                <strong>Preservation &amp; backups:</strong>
                We maintain daily snapshots of our database and store backups in
                Azure-backed object storage to support long-term preservation and
                disaster recovery. As the platform grows, we will continue to
                refine integrity monitoring and fixity checks.
              </li>
              <li>
                <strong>Access controls &amp; responsible reuse:</strong>
                Public and controlled datasets are clearly distinguished. For
                controlled datasets, access requests capture the requester’s name,
                affiliation, email, and reason for access, and are handled
                according to dataset-specific conditions and project-level
                governance.
              </li>
              <li>
                <strong>Dataset-level documentation:</strong>
                Each dataset overview page describes key metadata, access
                conditions, and links to external documentation where available,
                so that users understand how data may be used responsibly.
              </li>
            </ul>
          </div>
        </section>

        <!-- User Focus -->
        <section id="user-focus" class="mb-12 ">
          <h2 class="mb-4 text-2xl font-semibold text-purple-700">
            <Icon name="heroicons:users" class="mr-2 inline-block" />
            User Focus
          </h2>
          <p class="mb-4">
            Our services are designed around the needs of our designated
            community: ophthalmology and vision science researchers, AI/ML
            developers, and data stewards who work with eye imaging datasets.
          </p>

          <div class="mb-4 border-l-4 border-purple-400 bg-purple-50 p-4">
            <h3 class="mb-2 font-semibold">Our implementation:</h3>
            <ul class="list-disc space-y-2 pl-6">
              <li>
                <strong>Public dataset catalog:</strong>
                Users can discover and explore published datasets via the
                <NuxtLink to="/datasets" class="text-blue-700 underline hover:text-blue-900">
                  datasets catalog
                </NuxtLink>
                . Each dataset overview page provides key metadata, access
                conditions, and a metrics section with usage indicators (e.g.,
                views and downloads).
              </li>
              <li>
                <strong>Guided submission workflows:</strong>
                For invited contributors, Envision Portal offers guided workflows
                that support data standardization, de-identification, metadata
                completeness, and appropriate access controls, making it easier to
                share data that are responsibly reusable by the community.
              </li>
              <li>
                <strong>Support &amp; communication:</strong>
                General questions and access-related inquiries can be submitted
                via our
                <NuxtLink to="/contact" class="text-blue-700 underline hover:text-blue-900">
                  Contact page
                </NuxtLink>
                . Bugs and feature requests can be filed as GitHub issues at
                <NuxtLink to="https://github.com/EyeACT/envision-portal/issues" target="_blank"
                  class="text-blue-700 underline hover:text-blue-900">
                  github.com/EyeACT/envision-portal/issues
                </NuxtLink>
                .
              </li>
              <li>
                <strong>Iterative improvement:</strong>
                User feedback informs ongoing improvements to submission
                workflows, dataset presentation, and supporting documentation.
              </li>
            </ul>
          </div>
        </section>

        <!-- Sustainability -->
        <section id="sustainability" class="mb-12 ">
          <h2 class="mb-4 text-2xl font-semibold text-orange-700">
            <Icon name="heroicons:arrow-path" class="mr-2 inline-block" />
            Sustainability
          </h2>
          <p class="mb-4">
            We work with institutional and funding partners to ensure that
            Envision Portal remains a viable, well-governed service that can
            support long-term access to eye imaging datasets.
          </p>

          <div class="mb-4 border-l-4 border-orange-400 bg-orange-50 p-4">
            <h3 class="mb-2 font-semibold">Our implementation:</h3>
            <ul class="list-disc space-y-2 pl-6">
              <li>
                <strong>Institutional &amp; project partners:</strong>
                Envision Portal is developed by the FAIR Data Innovations Hub team
                as part of the Eye ACT study, in collaboration with the University
                of Washington and Kaiser Permanente Washington.
              </li>
              <li>
                <strong>Funding:</strong>
                Our contribution to Eye ACT is funded through a subaward from the
                National Institute on Aging (NIA) grant R01AG060942. Funding
                acknowledgements are included in project documentation and related
                materials.
              </li>
              <li>
                <strong>Long-term planning:</strong>
                Long-term access plans for datasets hosted in Envision Portal are
                developed in collaboration with our funding and institutional
                partners. As the platform matures, we will publish additional
                details on governance, risk management, and business continuity.
              </li>
              <li>
                <strong>Scalable architecture:</strong>
                The platform uses a modern, cloud-native architecture (Nuxt.js,
                Vue.js, TypeScript, PostgreSQL, and Azure Data Lake) that can
                scale with growing data volumes and user demand.
              </li>
            </ul>
          </div>
        </section>

        <!-- Technology -->
        <section id="technology" class="mb-12 ">
          <h2 class="mb-4 text-2xl font-semibold text-red-700">
            <Icon name="heroicons:cog-6-tooth" class="mr-2 inline-block" />
            Technology
          </h2>
          <p class="mb-4">
            We employ appropriate, standards-based technologies and security
            practices to ensure that Envision Portal is reliable, secure, and
            interoperable with the broader research ecosystem.
          </p>

          <div class="mb-4 border-l-4 border-red-400 bg-red-50 p-4">
            <h3 class="mb-2 font-semibold">Our implementation:</h3>
            <ul class="list-disc space-y-2 pl-6">
              <li>
                <strong>Open-source, modern stack:</strong>
                Envision Portal is built with Nuxt.js, Vue.js, and TypeScript,
                backed by PostgreSQL and Azure Data Lake for scalable storage. The
                platform is open-source and designed for extensibility, with
                source code hosted at
                <NuxtLink to="https://github.com/EyeACT/envision-portal" target="_blank"
                  class="text-blue-700 underline hover:text-blue-900">
                  github.com/EyeACT/envision-portal
                </NuxtLink>
                .
              </li>
              <li>
                <strong>Security &amp; access control:</strong>
                All traffic is served over HTTPS/TLS. Authentication and
                role-based access control protect non-public datasets, and
                Azure-managed encryption at rest is used for databases and
                storage. Systems are regularly updated with security patches.
              </li>
              <li>
                <strong>Identifiers &amp; metadata standards:</strong>
                We use globally recognized research identifiers (such as DOIs,
                ORCID IDs, and ROR identifiers where applicable) and adopt
                community standards for data formats and metadata (for example,
                DICOM for imaging and OMOP-based mappings for clinical data).
              </li>
              <li>
                <strong>Documentation-first approach:</strong>
                Technical architecture and repository operations are documented at
                <NuxtLink to="https://docs.envision.io/" target="_blank"
                  class="text-blue-700 underline hover:text-blue-900">
                  docs.envision.io
                </NuxtLink>
                , with further details to be added as additional functionality is
                introduced.
              </li>
            </ul>
          </div>
        </section>

        <!-- Compliance Self-Assessment -->
        <section id="self-assessment" class="mb-12 ">
          <h2 class="mb-4 text-2xl font-semibold">
            TRUST Principles – Compliance Self-Assessment
          </h2>
          <p class="mb-6">
            The table below provides a high-level self-assessment of how Envision
            Portal currently aligns with the TRUST Principles for Digital
            Repositories. It is intended as a living overview that will be updated
            as the platform evolves.
          </p>

          <div class="overflow-x-auto">
            <table class="min-w-full border border-gray-300">
              <thead class="bg-gray-50">
                <tr>
                  <th class="border border-gray-300 px-4 py-3 text-left font-semibold">
                    Principle
                  </th>
                  <th class="border border-gray-300 px-4 py-3 text-center font-semibold">
                    Status
                  </th>
                  <th class="border border-gray-300 px-4 py-3 text-left font-semibold">
                    Implementation Details
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="border border-gray-300 px-4 py-3 font-medium">
                    Transparency: Repository policies, scope, and operations are
                    clearly described and publicly accessible.
                  </td>
                  <td class="border border-gray-300 px-4 py-3 text-center">
                    <Icon name="heroicons:check-circle" class="text-xl text-green-500" />
                  </td>
                  <td class="border border-gray-300 px-4 py-3">
                    Platform purpose, scope, and current status are documented on
                    the About page; Terms of Use and Privacy Policy are public;
                    documentation is available at docs.envision.io; and service
                    status is reported via a public status page.
                  </td>
                </tr>
                <tr class="bg-gray-50">
                  <td class="border border-gray-300 px-4 py-3 font-medium">
                    Responsibility: Repository assumes responsibility for
                    long-term stewardship of datasets and associated metadata.
                  </td>
                  <td class="border border-gray-300 px-4 py-3 text-center">
                    <Icon name="heroicons:check-circle" class="text-xl text-green-500" />
                  </td>
                  <td class="border border-gray-300 px-4 py-3">
                    FAIR-aligned curation practices, daily database snapshots and
                    backups in Azure object storage, clear separation of public
                    vs. controlled datasets, and dataset-level documentation
                    support responsible reuse.
                  </td>
                </tr>
                <tr>
                  <td class="border border-gray-300 px-4 py-3 font-medium">
                    User Focus: Repository services are designed around the needs
                    of the designated community.
                  </td>
                  <td class="border border-gray-300 px-4 py-3 text-center">
                    <Icon name="heroicons:check-circle" class="text-xl text-green-500" />
                  </td>
                  <td class="border border-gray-300 px-4 py-3">
                    The Portal targets ophthalmology and vision science
                    researchers, AI/ML developers, and data stewards, with a
                    public dataset catalog, guided submission workflows for
                    invited contributors, metrics on dataset overview pages, and
                    multiple support channels (contact form and GitHub issues).
                  </td>
                </tr>
                <tr class="bg-gray-50">
                  <td class="border border-gray-300 px-4 py-3 font-medium">
                    Sustainability: Repository has a sustainable organizational
                    and funding context and plans for long-term operation.
                  </td>
                  <td class="border border-gray-300 px-4 py-3 text-center">
                    <Icon name="heroicons:check-circle" class="text-xl text-green-500" />
                  </td>
                  <td class="border border-gray-300 px-4 py-3">
                    Envision Portal is developed as part of the Eye ACT study by
                    the FAIR Data Innovations Hub team in collaboration with the
                    University of Washington and Kaiser Permanente Washington,
                    supported by a subaward from NIA grant R01AG060942, using a
                    cloud-native architecture designed for growth and long-term
                    use.
                  </td>
                </tr>
                <tr>
                  <td class="border border-gray-300 px-4 py-3 font-medium">
                    Technology: Repository uses appropriate, standards-based
                    technologies and security practices.
                  </td>
                  <td class="border border-gray-300 px-4 py-3 text-center">
                    <Icon name="heroicons:check-circle" class="text-xl text-green-500" />
                  </td>
                  <td class="border border-gray-300 px-4 py-3">
                    The platform is built on a modern, open-source stack
                    (Nuxt/Vue/TypeScript, PostgreSQL, Azure Data Lake) with
                    HTTPS/TLS, role-based access control, encryption at rest,
                    regular security updates, and use of community standards for
                    identifiers and data formats where applicable.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- References -->
        <section id="references" class="mb-8 ">
          <h2 class="mb-4 text-2xl font-semibold">References</h2>
          <div class="rounded-lg bg-gray-50 p-4">
            <p class="text-sm">
              TRUST Principles definition as referenced from: Lin, D., Crabtree,
              J., Dillo, I. et al.
              <em>The TRUST Principles for digital repositories.</em> Sci Data 7,
              144 (2020).
              <NuxtLink to="https://doi.org/10.1038/s41597-020-0486-7" target="_blank"
                class="text-blue-600 underline hover:text-blue-800">
                https://doi.org/10.1038/s41597-020-0486-7
              </NuxtLink>
            </p>
          </div>
        </section>

        <!-- Additional Information -->
        <section id="questions-feedback" class="mb-12 ">
          <div class="rounded-lg border border-blue-200 bg-blue-100 p-6">
            <h3 class="mb-2 text-lg font-semibold">
              Questions about our implementation of the TRUST Principles?
            </h3>
            <p class="mb-4">
              We welcome questions and feedback about how Envision Portal
              implements the TRUST Principles. This page and our practices will
              evolve as the platform grows and new features are introduced.
            </p>
            <UButton class="" size="lg" type="button">
              <template #leading>
                <Icon name="heroicons:envelope" size="20" />
              </template>
              <NuxtLink to="/contact" class="inline-flex items-center gap-2 text-white no-underline hover:no-underline">
                Contact Us
              </NuxtLink>
            </UButton>
          </div>
        </section>
      </div>
    </div>
  </UContainer>
</template>
