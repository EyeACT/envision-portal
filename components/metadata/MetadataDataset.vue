<script lang="ts" setup>
import type { TableColumn } from "@nuxt/ui";
// Define props
const props = defineProps<{
  metadata: DatasetDescription;
}>();

const creatorColumns: TableColumn<DatasetDescription["creator"][number]>[] = [
  {
    accessorKey: "creatorName",
    header: "Name",
  },
  {
    accessorKey: "nameType",
    header: "Type",
  },
  {
    accessorKey: "nameIdentifier",
    cell: ({ row }) => {
      // Access the nameIdentifier array from the original row data
      const nameIdentifier = row.original?.nameIdentifier;

      if (nameIdentifier) {
        // Join all the identifier values from the array
        return nameIdentifier
          .map((identifier) => identifier.nameIdentifierValue)
          .join(", ");
      }

      return "";
    },
    header: "Identifier",
  },
  {
    accessorKey: "affiliation",
    cell: ({ row }) => {
      // Access the affiliation array from the original row data
      const affiliation = row.original?.affiliation;

      if (affiliation) {
        // Join all the affiliation names from the array
        return affiliation
          .map((affiliation) => affiliation?.affiliationName ?? "")
          .join(", ");
      }

      return "N/A";
    },
    header: "Affiliation",
  },
];

const contributorColumns: TableColumn<
  NonNullable<DatasetDescription["contributor"]>[number]
>[] = [
  {
    accessorKey: "contributorName",
    header: "Name",
  },
  {
    accessorKey: "contributorType",
    header: "Type",
  },
  {
    accessorKey: "nameIdentifier", // update key to match your interface
    cell: ({ row }) => {
      const identifiers = row.original.nameIdentifier;

      if (Array.isArray(identifiers)) {
        return identifiers
          .map((identifier) => identifier.nameIdentifierValue)
          .join(", ");
      }

      return "";
    },
    header: "Identifier",
  },
  {
    accessorKey: "affiliation",
    cell: ({ row }) => {
      const affiliations = row.original.affiliation;

      if (Array.isArray(affiliations)) {
        return affiliations.map((aff) => aff.affiliationName ?? "").join(", ");
      }

      return "N/A";
    },
    header: "Affiliation",
  },
];

const funderColumns: TableColumn<
  NonNullable<DatasetDescription["fundingReference"]>[number]
>[] = [
  {
    accessorKey: "funderName",
    header: "Name",
  },
  {
    accessorKey: "funderIdentifier",
    cell: ({ row }) => {
      const identifiers = row.original.funderIdentifier;

      return identifiers?.funderIdentifierValue || "N/A";
    },
    header: "Identifier",
  },
  {
    accessorKey: "awardNumber",
    cell: ({ row }) => {
      const awardNumbers = row.original.awardNumber;

      return awardNumbers?.awardNumberValue || "N/A";
    },
    header: "Award Number",
  },
  {
    accessorKey: "awardTitle",
    header: "Award Title",
  },
];
</script>

<template>
  <div class="h-auto space-y-6">
    <CardCollapsibleContent title="Creators">
      <UTable
        :data="props.metadata.creator"
        :columns="creatorColumns"
        class="flex-1"
      />
    </CardCollapsibleContent>

    <CardCollapsibleContent title="Contributors">
      <UAlert
        v-if="
          !props.metadata.contributor || props.metadata.contributor.length === 0
        "
        color="info"
        variant="subtle"
        title="No contributors"
        description="There are no contributors for this dataset."
      />

      <UTable
        v-else
        :data="props.metadata.contributor"
        :columns="contributorColumns"
        class="flex-1"
      />
    </CardCollapsibleContent>

    <CardCollapsibleContent title="Funders">
      <UTable
        :data="props.metadata.fundingReference"
        :columns="funderColumns"
      />
    </CardCollapsibleContent>

    <MetadataDeIdentifyCard :metadata="props.metadata.datasetDeIdentLevel" />

    <MetadataConsentCard :metadata="props.metadata.datasetConsent" />

    <CardCollapsibleContent
      title="View the full dataset_dsecription.json file"
      :collapse="true"
    >
      <pre>{{ props.metadata }}</pre>
    </CardCollapsibleContent>
  </div>
</template>
