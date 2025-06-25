<script setup lang="ts">
import type { TimelineItem } from "@nuxt/ui";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { datasetId, studyId } = route.params as {
  datasetId: string;
  studyId: string;
};

const { data, error } = await useFetch(
  `/api/studies/${studyId}/datasets/${datasetId}/publish/study-metadata`,
  {},
);

if (error.value) {
  toast.add({
    title: "Error fetching study",
    description: "Please try again later",
    icon: "material-symbols:error",
  });

  // await navigateTo(`/app/study/${studyId}/datasets/${datasetId}`);
}

if (data.value) {
  useSeoMeta({
    title: data.value.title,
  });
}

const items = ref<TimelineItem[]>([
  {
    title: "Study Metadata",
    description: "Review added study metadata.",
    icon: "i-lucide-rocket",
  },
  {
    title: "Dataset Metadata",
    description: "Review added dataset metadata.",
    icon: "i-lucide-palette",
  },
  {
    title: "Changelog",
    description: "Add a changelog to the dataset.",
    icon: "i-lucide-code",
  },
]);
</script>

<template>
  <div>
    <UBreadcrumb
      class="mb-4 ml-2"
      :items="[
        { label: 'Dashboard', to: '/app/dashboard' },
        { label: data?.title, to: `/app/study/${studyId}` },
        {
          label: 'Datasets',
          to: `/app/study/${studyId}/datasets`,
        },
        {
          label: data?.title,
          to: `/app/study/${studyId}/datasets/${datasetId}`,
        },
        {
          label: 'Publish',
          to: `/app/study/${studyId}/datasets/${datasetId}/publish`,
        },
      ]"
    />

    <div class="flex w-full flex-col gap-6">
      <div
        class="flex w-full flex-wrap items-center justify-between rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <div class="flex w-full items-center justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ data?.title || "Untitled" }}
            </h1>

            <p class="text-lg font-normal">
              {{ data?.dataset?.description }}
            </p>
          </div>
        </div>
      </div>

      <UTimeline
        orientation="horizontal"
        :default-value="2"
        :items="items"
        class="w-full"
      />

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <CardCollapsible class="my-1 shadow-none" title="Identifiers" bordered>
          <div class="flex flex-col">
            <h3 class="mb-2 text-lg font-medium">Primary Identifier</h3>

            <table class="table-auto">
              <tbody>
                <tr>
                  <td>Identifier</td>

                  <td>{{ data?.primaryIdentifier?.identifier }}</td>
                </tr>

                <tr></tr>

                <tr>
                  <td>Type</td>

                  <td>{{ data?.primaryIdentifier?.identifierType }}</td>
                </tr>

                <tr>
                  <td>Link</td>

                  <td>{{ data?.primaryIdentifier?.identifierLink }}</td>
                </tr>

                <tr>
                  <td>Domain ID</td>

                  <td>{{ data?.primaryIdentifier?.identifierDomain }}</td>
                </tr>
              </tbody>
            </table>

            <h3 class="mt-8 text-lg font-medium">Secondary Identifiers</h3>

            <UTable
              :data="data?.secondaryIdentifiers"
              class="w-full"
              :columns="[
                {
                  accessorKey: 'identifier',
                  header: 'Identifier',
                },
                {
                  accessorKey: 'identifierType',
                  header: 'Type',
                },
                {
                  accessorKey: 'identifierLink',
                  header: 'Link',
                },
                {
                  accessorKey: 'identifierDomain',
                  header: 'Domain',
                },
              ]"
            />
          </div>
        </CardCollapsible>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <CardCollapsible class="my-1 shadow-none" title="Status" bordered>
          <div class="flex flex-col">
            <table class="table-auto">
              <tbody>
                <tr>
                  <td>Overall Status</td>

                  <td>{{ data?.StudyStatus?.overallStatus }}</td>
                </tr>

                <tr>
                  <td>Start Date</td>

                  <td>{{ data?.StudyStatus?.startDate }}</td>
                </tr>

                <tr>
                  <td>Start Date Type</td>

                  <td>{{ data?.StudyStatus?.startDateType }}</td>
                </tr>

                <tr>
                  <td>Completion Date</td>

                  <td>{{ data?.StudyStatus?.completionDate }}</td>
                </tr>

                <tr>
                  <td>Completion Date Type</td>

                  <td>{{ data?.StudyStatus?.completionDateType }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardCollapsible>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <CardCollapsible class="my-1 shadow-none" title="Sponsors" bordered>
          <div class="flex flex-col">
            <h3 class="mb-2 text-lg font-medium">Responsible Party</h3>

            <table class="table-auto">
              <tbody>
                <tr>
                  <td>Type</td>

                  <td>{{ data?.StudySponsors?.responsiblePartyType || "" }}</td>
                </tr>

                <tr>
                  <td>Name</td>

                  <td>
                    {{
                      data?.StudySponsors
                        ?.responsiblePartyInvestigatorGivenName +
                        " " +
                        data?.StudySponsors
                          ?.responsiblePartyInvestigatorFamilyName || ""
                    }}
                  </td>
                </tr>

                <tr>
                  <td>Title</td>

                  <td>
                    {{
                      data?.StudySponsors?.responsiblePartyInvestigatorTitle ||
                      ""
                    }}
                  </td>
                </tr>

                <tr>
                  <td>Affiliation</td>

                  <td>
                    {{
                      data?.StudySponsors
                        ?.responsiblePartyInvestigatorAffiliationName || ""
                    }}
                  </td>
                </tr>
              </tbody>
            </table>

            <h3 class="mt-8 mb-2 text-lg font-medium">Lead Sponsor</h3>

            <table class="table-auto">
              <tbody>
                <tr>
                  <td>Name</td>

                  <td>{{ data?.StudySponsors?.leadSponsorName || "" }}</td>
                </tr>

                <tr>
                  <td>Identifier</td>

                  <td>
                    {{ data?.StudySponsors?.leadSponsorIdentifier || "" }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardCollapsible>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <CardCollapsible
          class="my-1 shadow-none"
          title="Collaborators"
          bordered
        >
          <div class="flex flex-col">
            <UTable
              :data="data?.StudyCollaborators"
              class="w-full"
              :columns="[
                {
                  accessorKey: 'name',
                  header: 'Name',
                },
                {
                  accessorKey: 'identifier',
                  header: 'Identifier',
                },
                {
                  accessorKey: 'scheme',
                  header: 'Scheme',
                },
              ]"
            />
          </div>
        </CardCollapsible>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <CardCollapsible class="my-1 shadow-none" title="Oversight" bordered>
          <div class="flex flex-col">
            <table class="table-auto">
              <tbody>
                <tr>
                  <td>Human Subject Review Status</td>

                  <td>{{ data?.StudyOversight?.humanSubjectReviewStatus }}</td>
                </tr>

                <tr>
                  <td>Is this clinical study studying a drug product?</td>

                  <td>{{ data?.StudyOversight?.fdaRegulatedDrug }}</td>
                </tr>

                <tr>
                  <td>Is this clinical study studying a device product?</td>

                  <td>{{ data?.StudyOversight?.fdaRegulatedDevice }}</td>
                </tr>

                <tr>
                  <td>
                    Does this study have a Data Monitoring Committee (DMC)?
                  </td>

                  <td>{{ data?.StudyOversight?.hasDmc }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardCollapsible>
      </div>

      <pre
        >{{ data }}
      </pre>
    </div>
  </div>
</template>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
}

table tr {
  border: 1px solid #e5e7eb;
}

table td {
  padding: 0.75rem 1rem;
  vertical-align: top;
}

table td:first-child {
  background-color: #f9fafb;
  font-weight: 500;
  color: #374151;
  width: 30%;
}

table td:last-child {
  background-color: transparent;
  color: #1f2937;
  font-weight: 300;
}

/* Dark mode support */
.dark table td:first-child {
  background-color: #374151;
  color: #d1d5db;
}

.dark table td:last-child {
  color: #f9fafb;
}
</style>
