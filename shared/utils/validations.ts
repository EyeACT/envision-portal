import { StudyMetadataPublishValidation } from "#shared/utils/study_schemas";
import { DatasetMetadataPublishSchema } from "#shared/utils/dataset_schemas";

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
  const validationResult = DatasetMetadataPublishSchema.safeParse(dataset);

  // console.log("Below is the dataset metadata gathered");
  // console.log(JSON.stringify(dataset, null, 2));
  // console.log(JSON.stringify(validationResult, null, 2));

  return {
    // data: dataset,
    valid: validationResult,
    validations: validationResult?.error?.format(),
  };
}

export async function validateStudyMetadata(datasetId: string, userId: string) {
  // Get the study from the database
  const study = await prisma.dataset.findUnique({
    include: {
      StudyArm: true,
      StudyCentralContact: true,
      StudyCollaborators: true,
      StudyConditions: true,
      StudyDescription: true,
      StudyDesign: true,
      StudyEligibility: true,
      StudyIdentification: true,
      StudyIntervention: true,
      StudyKeywords: true,
      StudyLocation: true,
      StudyOverallOfficials: true,
      StudyOversight: true,
      StudySponsors: true,
      StudyStatus: true,
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

  if (!study) {
    throw createError({
      statusCode: 404,
      statusMessage: "Study not found",
    });
  }

  // Validate the study metadata
  const validationResult = StudyMetadataPublishValidation.safeParse(study);

  console.log("Below is the study metadata gathered");
  // console.log(JSON.stringify(study, null, 2));
  console.log(JSON.stringify(validationResult, null, 2));

  return {
    valid: validationResult,
    validations: validationResult?.error?.format(),
  };
}
