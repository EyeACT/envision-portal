<script setup lang="ts">
import type { TimelineItem } from "@nuxt/ui";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const toast = useToast();

const { datasetId } = route.params as {
  datasetId: string;
};

const { data, error } = await useFetch(
  `/api/datasets/${datasetId}/publish/dataset-metadata`,
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

const timelineItems = ref<TimelineItem[]>([
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
  {
    title: "Readme",
    description: "Add a readme to the dataset.",
    icon: "i-lucide-file-text",
  },
  {
    title: "Publish",
    description: "Publish the dataset.",
    icon: "i-lucide-rocket",
  },
]);
</script>

<template>
  <div class="w-full">
    <UBreadcrumb
      class="mb-4 ml-2"
      :items="[
        { label: 'Dashboard', to: '/app/dashboard' },
        { label: data?.title, to: `/app/datasets/${datasetId}` },
        {
          label: 'Publish',
          to: `/app/datasets/${datasetId}/publish`,
        },
        {
          label: 'Review Dataset Metadata',
          to: `/app/datasets/${datasetId}/publish/dataset-metadata`,
        },
      ]"
    />

    <div class="flex w-full flex-col gap-6 pb-16">
      <UStepper
        orientation="horizontal"
        :default-value="1"
        :items="timelineItems"
        class="mx-5 w-full pt-5"
      />

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <CardCollapsible title="Identifiers" bordered no-shadow>
          <div class="flex flex-col">
            <h3 class="mb-2 text-lg font-medium">Primary Identifier</h3>

            <UAlert
              title="A primary identifier is generated after your dataset is published."
              color="primary"
              variant="soft"
            />

            <h3 class="mt-8 text-lg font-medium">Alternate Identifiers</h3>

            <UTable
              :data="data?.DatasetAlternateIdentifier"
              class="w-full"
              :columns="[
                {
                  accessorKey: 'identifier',
                  header: 'Identifier',
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
        <CardCollapsible title="Titles" bordered no-shadow>
          <div class="flex flex-col">
            <UTable
              :data="data?.DatasetTitle"
              class="w-full"
              :columns="[
                {
                  accessorKey: 'type',
                  header: 'Type',
                },
                {
                  accessorKey: 'title',
                  header: 'Title',
                },
              ]"
            />
          </div>
        </CardCollapsible>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <CardCollapsible title="Descriptions" bordered no-shadow>
          <div class="flex flex-col">
            <UTable
              :data="data?.DatasetDescription"
              class="w-full"
              :columns="[
                {
                  accessorKey: 'type',
                  header: 'Type',
                },
                {
                  accessorKey: 'description',
                  header: 'Description',
                },
              ]"
            />
          </div>
        </CardCollapsible>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <CardCollapsible title="Creators" bordered no-shadow>
          <div class="flex flex-col">
            <UTable
              :data="data?.creators"
              class="w-full"
              :columns="[
                {
                  accessorKey: 'givenName',
                  header: 'Given Name',
                },
                {
                  accessorKey: 'familyName',
                  header: 'Family Name',
                },
                {
                  accessorKey: 'nameType',
                  header: 'Type',
                },
                {
                  accessorKey: 'affiliations',
                  header: 'Affiliations',
                },
              ]"
            />
          </div>
        </CardCollapsible>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <CardCollapsible title="Dates" bordered no-shadow>
          <div class="flex flex-col">
            <UTable
              :data="data?.DatasetDate"
              class="w-full"
              :columns="[
                {
                  accessorKey: 'date',
                  header: 'Date',
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
        <CardCollapsible title="Managing Organization" bordered no-shadow>
          <div class="flex flex-col">
            <p>
              {{ data?.DatasetManagingOrganization?.name || "Not provided" }}
            </p>
          </div>
        </CardCollapsible>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <CardCollapsible title="De-Identification" bordered no-shadow>
          <div class="flex flex-col">
            <table class="table-auto">
              <tbody>
                <tr>
                  <td>Were direct identifiers removed?</td>

                  <td>
                    {{ data?.DatasetDeIdentLevel?.direct ? "Yes" : "No" }}
                  </td>
                </tr>

                <tr>
                  <td>Were US HIPAA de-identification rules applied?</td>

                  <td>{{ data?.DatasetDeIdentLevel?.hipaa ? "Yes" : "No" }}</td>
                </tr>

                <tr>
                  <td>Were dates rebased and/or replaced by integers?</td>

                  <td>{{ data?.DatasetDeIdentLevel?.dates ? "Yes" : "No" }}</td>
                </tr>

                <tr>
                  <td>Were narrative text fields removed?</td>

                  <td>
                    {{ data?.DatasetDeIdentLevel?.nonarr ? "Yes" : "No" }}
                  </td>
                </tr>

                <tr>
                  <td>Was k-anonymisation (k>=2) achieved?</td>

                  <td>{{ data?.DatasetDeIdentLevel?.kAnon ? "Yes" : "No" }}</td>
                </tr>

                <tr>
                  <td>Additional details</td>

                  <td>{{ data?.DatasetDeIdentLevel?.details }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardCollapsible>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <CardCollapsible title="Consent" bordered no-shadow>
          <div class="flex flex-col">
            <table class="table-auto">
              <tbody>
                <tr>
                  <td>Type</td>

                  <td>
                    {{ data?.DatasetConsent?.type || "Not provided" }}
                  </td>
                </tr>

                <tr>
                  <td>
                    Does the consent allow only non-commercial use of the data?
                  </td>

                  <td>
                    {{ data?.DatasetConsent?.noncommercial ? "Yes" : "No" }}
                  </td>
                </tr>

                <tr>
                  <td>
                    Does the consent allow only use of the data in a specific
                    geographic location?
                  </td>

                  <td>
                    {{ data?.DatasetConsent?.geogRestrict ? "Yes" : "No" }}
                  </td>
                </tr>

                <tr>
                  <td>
                    Does the consent allow only use of the data for a specific
                    type of research?
                  </td>

                  <td>
                    {{ data?.DatasetConsent?.researchType ? "Yes" : "No" }}
                  </td>
                </tr>

                <tr>
                  <td>
                    Does the consent allow only use of the data for genetic
                    research?
                  </td>

                  <td>
                    {{ data?.DatasetConsent?.geneticOnly ? "Yes" : "No" }}
                  </td>
                </tr>

                <tr>
                  <td>
                    Does the consent allow only use of the data for research
                    that does not involve the development of methods or
                    algorithms?
                  </td>

                  <td>{{ data?.DatasetConsent?.noMethods ? "Yes" : "No" }}</td>
                </tr>

                <tr>
                  <td>Additional details</td>

                  <td>{{ data?.DatasetConsent?.details }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardCollapsible>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <CardCollapsible title="Subjects" bordered no-shadow>
          <div class="flex flex-col">
            <UTable
              :data="data?.DatasetSubject"
              class="w-full"
              :columns="[
                {
                  accessorKey: 'subject',
                  header: 'Subject',
                },
                {
                  accessorKey: 'valueUri',
                  header: 'Value URI',
                },
                {
                  accessorKey: 'classificationCode',
                  header: 'Classification Code',
                },
              ]"
            />
          </div>
        </CardCollapsible>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <CardCollapsible title="Access & Rights" bordered no-shadow>
          <div class="flex flex-col">
            <h3 class="mb-2 text-lg font-medium">Access Type</h3>

            <p>
              {{ data?.DatasetAccess?.type || "Not provided" }}
            </p>

            <h3 class="mt-4 mb-2 text-lg font-medium">Access Details</h3>

            <p>
              {{ data?.DatasetAccess?.description || "Not provided" }}
            </p>

            <h3 class="mt-4 mb-2 text-lg font-medium">Rights</h3>

            <p>
              {{ data?.DatasetRights?.rights || "Not provided" }}
            </p>
          </div>
        </CardCollapsible>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <CardCollapsible title="Funders" bordered no-shadow>
          <div class="flex flex-col">
            <UTable
              :data="data?.DatasetFunder"
              class="w-full"
              :columns="[
                {
                  accessorKey: 'name',
                  header: 'Name',
                },
                {
                  accessorKey: 'awardNumber',
                  header: 'Award Number',
                },
                {
                  accessorKey: 'awardTitle',
                  header: 'Award Title',
                },
              ]"
            />
          </div>
        </CardCollapsible>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <CardCollapsible title="Related Identifiers" bordered no-shadow>
          <div class="flex flex-col">
            <UTable
              :data="data?.DatasetRelatedIdentifier"
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
                  accessorKey: 'relationType',
                  header: 'Relation Type',
                },
                {
                  accessorKey: 'resourceType',
                  header: 'Resource Type',
                },
              ]"
            />
          </div>
        </CardCollapsible>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <CardCollapsible title="Additional Details" bordered no-shadow>
          <div class="flex flex-col">
            <table class="table-auto">
              <tbody>
                <tr>
                  <td>Language</td>

                  <td>
                    {{ data?.DatasetOther?.language || "Not provided" }}
                  </td>
                </tr>

                <tr>
                  <td>Size</td>

                  <td class="flex flex-wrap gap-1">
                    <UBadge
                      v-for="size in data?.DatasetOther?.size"
                      v-show="
                        data?.DatasetOther?.size &&
                        data?.DatasetOther?.size.length > 0
                      "
                      :key="size"
                      :label="size"
                      color="primary"
                      variant="soft"
                    />

                    <p
                      v-show="
                        !data?.DatasetOther?.size ||
                        data?.DatasetOther?.size.length === 0
                      "
                    >
                      Not provided
                    </p>
                  </td>
                </tr>

                <tr>
                  <td>Format</td>

                  <td class="flex flex-wrap gap-1">
                    <UBadge
                      v-for="format in data?.DatasetOther?.format"
                      :key="format"
                      :label="format"
                      color="primary"
                      variant="soft"
                    />

                    <p
                      v-show="
                        !data?.DatasetOther?.format ||
                        data?.DatasetOther?.format.length === 0
                      "
                    >
                      Not provided
                    </p>
                  </td>
                </tr>

                <tr>
                  <td>Standards Followed</td>

                  <td>
                    {{
                      data?.DatasetOther?.standardsFollowed || "Not provided"
                    }}
                  </td>
                </tr>

                <tr>
                  <td>Acknowledgement</td>

                  <td>
                    {{ data?.DatasetOther?.acknowledgement || "Not provided" }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardCollapsible>
      </div>

      <div class="flex justify-end gap-5">
        <UButton
          :to="`/app/datasets/${datasetId}/publish/study-metadata`"
          class="w-full"
          size="lg"
          variant="outline"
          label="Review Study Metadata"
          icon="i-lucide-arrow-left"
        />

        <UButton
          :to="`/app/datasets/${datasetId}/publish/changelog`"
          class="w-full"
          size="lg"
          label="Review Changelog"
          icon="i-lucide-arrow-right"
        />
      </div>

      <pre class="hidden">{{ data }}</pre>
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
  width: 40%;
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
