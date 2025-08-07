// Build the dataset metadata validation schema by importing the schemas in server/api/utils/dataset_schemas.ts
// This schema will use all the schemas defined in dataset_schemas.ts
// Thus we will need to create a new schema that combines all the schemas

/**
 * Validate a dataset's metadata before publishing.
 * @param datasetId - The id of the dataset to validate
 * @returns {boolean, json} - Returns true or false based on validation and a JSON object of the dataset metadata.
 */
export async function validateDatasetMetadata(
  datasetId: string,
  userId: string,
) {
  // Get the dataset from the database
  const dataset = await prisma.dataset.findUnique({
    include: {
      DatasetAccess: true,
      DatasetAlternateIdentifier: true,
      DatasetConsent: true,
      DatasetContributor: true,
      DatasetDate: true,
      DatasetDeIdentLevel: true,
      DatasetDescription: true,
      DatasetFunder: true,
      DatasetHealthsheet: true,
      DatasetManagingOrganization: true,
      DatasetOther: true,
      DatasetRelatedIdentifier: true,
      DatasetRights: true,
      DatasetSubject: true,
      DatasetTitle: true,
    },
    where: {
      id: datasetId,
      DatasetMember: {
        some: {
          userId,
        },
      },
    },
  });

  if (!dataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset not found",
    });
  }

  // Validate the dataset metadata

  return {
    data: dataset,
    valid: true,
  };
}
