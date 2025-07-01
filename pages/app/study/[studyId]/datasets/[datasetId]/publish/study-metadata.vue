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

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <CardCollapsible class="my-1 shadow-none" title="Description" bordered>
          <div class="flex flex-col">
            <h3 class="mb-2 text-lg font-medium">Brief Summary</h3>

            <p>
              {{ data?.StudyDescription?.briefSummary }}
            </p>

            <h3 class="mt-8 mb-2 text-lg font-medium">Detailed Description</h3>

            <p>
              {{ data?.StudyDescription?.detailedDescription }}
            </p>
          </div>
        </CardCollapsible>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <CardCollapsible class="my-1 shadow-none" title="Conditions" bordered>
          <div class="flex flex-col">
            <div class="flex flex-wrap gap-2">
              <div
                v-for="condition in data?.StudyConditions"
                :key="condition.id"
              >
                <UBadge
                  :label="condition.name"
                  color="primary"
                  variant="outline"
                />
              </div>
            </div>
          </div>
        </CardCollapsible>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <CardCollapsible class="my-1 shadow-none" title="Keywords" bordered>
          <div class="flex flex-col">
            <div class="flex flex-wrap gap-2">
              <div v-for="keyword in data?.StudyKeywords" :key="keyword.id">
                <UBadge
                  :label="keyword.name"
                  color="primary"
                  variant="outline"
                />
              </div>
            </div>
          </div>
        </CardCollapsible>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <CardCollapsible class="my-1 shadow-none" title="Design" bordered>
          <div class="flex flex-col">
            <table class="table-auto">
              <tbody>
                <tr>
                  <td>Study Type</td>

                  <td>{{ data?.StudyDesign?.studyType }}</td>
                </tr>

                <tr v-if="data?.StudyDesign?.allocation">
                  <td>Design Allocation</td>

                  <td>{{ data?.StudyDesign?.allocation }}</td>
                </tr>

                <tr v-if="data?.StudyDesign?.interventionModel">
                  <td>Intervention Model</td>

                  <td>{{ data?.StudyDesign?.interventionModel }}</td>
                </tr>

                <tr v-if="data?.StudyDesign?.primaryPurpose">
                  <td>Primary Purpose</td>

                  <td>{{ data?.StudyDesign?.primaryPurpose }}</td>
                </tr>

                <tr v-if="data?.StudyDesign?.masking">
                  <td>Masking</td>

                  <td>{{ data?.StudyDesign?.masking }}</td>
                </tr>

                <tr v-if="data?.StudyDesign?.maskingDescription">
                  <td>Masking Description</td>

                  <td>{{ data?.StudyDesign?.maskingDescription }}</td>
                </tr>

                <tr v-if="data?.StudyDesign?.whoMaskedList">
                  <td>Who Masked List</td>

                  <td>
                    <div
                      v-for="who in data?.StudyDesign?.whoMaskedList"
                      :key="who"
                    >
                      <UBadge :label="who" color="primary" variant="outline" />
                    </div>
                  </td>
                </tr>

                <tr v-if="data?.StudyDesign?.phaseList">
                  <td>Phase List</td>

                  <td>
                    <div
                      v-for="phase in data?.StudyDesign?.phaseList"
                      :key="phase"
                    >
                      <UBadge
                        :label="phase"
                        color="primary"
                        variant="outline"
                      />
                    </div>
                  </td>
                </tr>

                <tr v-if="data?.StudyDesign?.enrollmentCount">
                  <td>Enrollment Count</td>

                  <td>{{ data?.StudyDesign?.enrollmentCount }}</td>
                </tr>

                <tr v-if="data?.StudyDesign?.enrollmentType">
                  <td>Enrollment Type</td>

                  <td>{{ data?.StudyDesign?.enrollmentType }}</td>
                </tr>

                <tr v-if="data?.StudyDesign?.numberOfArms">
                  <td>Number of Arms</td>

                  <td>{{ data?.StudyDesign?.numberOfArms }}</td>
                </tr>

                <tr
                  v-if="
                    data?.StudyDesign?.oberservationalModelList &&
                    data?.StudyDesign?.oberservationalModelList.length > 0
                  "
                >
                  <td>Observational Model List</td>

                  <td>{{ data?.StudyDesign?.oberservationalModelList }}</td>
                </tr>

                <tr
                  v-if="
                    data?.StudyDesign?.timePerspectiveList &&
                    data?.StudyDesign?.timePerspectiveList.length > 0
                  "
                >
                  <td>Time Perspective List</td>

                  <td>{{ data?.StudyDesign?.timePerspectiveList }}</td>
                </tr>

                <tr v-if="data?.StudyDesign?.bioSpecRetention">
                  <td>Bio Spec Retention</td>

                  <td>{{ data?.StudyDesign?.bioSpecRetention }}</td>
                </tr>

                <tr v-if="data?.StudyDesign?.bioSpecDescription">
                  <td>Bio Spec Description</td>

                  <td>{{ data?.StudyDesign?.bioSpecDescription }}</td>
                </tr>

                <tr v-if="data?.StudyDesign?.targetDuration">
                  <td>Target Duration</td>

                  <td>{{ data?.StudyDesign?.targetDuration }}</td>
                </tr>

                <tr v-if="data?.StudyDesign?.isPatientRegistry">
                  <td>Is Patient Registry</td>

                  <td>{{ data?.StudyDesign?.isPatientRegistry }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardCollapsible>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <CardCollapsible class="my-1 shadow-none" title="Arms" bordered>
          <div class="flex flex-col">
            <UTable
              :data="data?.StudyArm"
              class="w-full"
              :columns="[
                {
                  accessorKey: 'label',
                  header: 'Name',
                },
                {
                  accessorKey: 'type',
                  header: 'Type',
                },
              ]"
            />
          </div>
        </CardCollapsible>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <CardCollapsible
          class="my-1 shadow-none"
          title="Interventions"
          bordered
        >
          <div class="flex flex-col">
            <UTable
              :data="data?.StudyIntervention"
              class="w-full"
              :columns="[
                {
                  accessorKey: 'label',
                  header: 'Name',
                },
                {
                  accessorKey: 'type',
                  header: 'Type',
                },
              ]"
            />
          </div>
        </CardCollapsible>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <CardCollapsible class="my-1 shadow-none" title="Eligibility" bordered>
          <div class="flex flex-col">
            <table class="table-auto">
              <tbody>
                <tr>
                  <td>Sex</td>

                  <td>{{ data?.StudyEligibility?.sex }}</td>
                </tr>

                <tr>
                  <td>Based on Gender?</td>

                  <td>{{ data?.StudyEligibility?.genderBased }}</td>
                </tr>

                <tr>
                  <td>Minimum Age</td>

                  <td>
                    {{ data?.StudyEligibility?.minimumAgeValue }}
                    {{ data?.StudyEligibility?.minimumAgeUnit }}
                  </td>
                </tr>

                <tr>
                  <td>Maximum Age</td>

                  <td>
                    {{ data?.StudyEligibility?.maximumAgeValue }}
                    {{ data?.StudyEligibility?.maximumAgeUnit }}
                  </td>
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
