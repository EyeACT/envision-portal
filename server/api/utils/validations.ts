// Build the dataset metadata validation schema by importing the schemas in server/api/utils/dataset_schemas.ts
// This schema will use all the schemas defined in dataset_schemas.ts
// Thus we will need to create a new schema that combines all the schemas
import z from "zod";
import {
  altIdentifierSchema,
  consentSchema,
  contributorSchema,
  aboutSchema,
  deIdentSchema,
  descriptionSchema,
  funderSchema,
  funderRefine,
  managingOrgSchema,
  managingOrgRefine,
  DatasetMetadataAboutSchema,
  relatedIdentSchema,
  relatedIdentRefine,
  rightsSchema,
  subjectSchema,
  subjectRefine,
  titleSchema,
  accessSchema,
  healthsheetSchema,
  validateNameIdentifier,
} from "@/server/utils/dataset_schemas";

import {
  PrimaryIdentifierSchema,
  secondaryIdentifierSchema,
  contractSchema,
  CollaboratorSchema,
  conditionsSchema,
  IdentificationRowSchema,
  InterventionRowSchema,
  keywordsSchema,
  LocationSchema,
  officialSchema,
  StudyDescriptionOnlySchema,
  DesignBase,
  designRefine,
  SponsorRefine,
  SponsorsBase,
  StatusSchemaRefine,
  StatusBase,
} from "@/server/utils/study_schemas";

const DatasetSchema = z.object({
  id: z.string().cuid2("Invalid dataset ID"),
  title: z.string().min(1, "Dataset title is required"),
  canonicalId: z.string().cuid2("Invalid canonical ID"),
  changelog: z.union([
    z.string().min(1, "Changelog is required"),
    z.literal(""),
  ]),
  DatasetAccess: accessSchema.strip(),
  DatasetAlternateIdentifier: z.array(altIdentifierSchema.strip()),
  DatasetConsent: consentSchema.strip(),
  DatasetContributor: z.array(
    contributorSchema.strip().superRefine(validateNameIdentifier),
  ),
  DatasetDate: z.array(aboutSchema),
  DatasetDeIdentLevel: deIdentSchema
    .extend({
      details: z.union([z.literal(""), z.string().min(1)]),
    })
    .strip(),
  DatasetDescription: z.array(descriptionSchema.strip()),
  DatasetFunder: z.array(funderSchema.strip().superRefine(funderRefine)),
  DatasetHealthsheet: healthsheetSchema.strip(),
  DatasetManagingOrganization: managingOrgSchema
    .strip()
    .superRefine(managingOrgRefine),
  DatasetOther: DatasetMetadataAboutSchema.strip(),
  DatasetRelatedIdentifier: z.array(
    relatedIdentSchema.strip().superRefine(relatedIdentRefine),
  ),
  DatasetRights: rightsSchema.strip(),
  DatasetSubject: z.array(subjectSchema.strip().superRefine(subjectRefine)),
  DatasetTitle: z.array(titleSchema.strip()),
  description: z.string().min(1, "Description is required"),
  doi: z.string().nullable(),
  imageUrl: z.string().url("Image URL must be a valid URL"),
  readme: z.union([z.string().min(1, "README is required"), z.literal("")]),
  status: z.enum(["draft", "published"]),
  version: z.string(),
});

export const StudyMetadataSchema = z.object({
  id: z.string().cuid2("Invalid dataset ID"),
  title: z.string().min(1, "Dataset title is required"),
  canonicalId: z.string().cuid2("Invalid canonical ID"),
  changelog: z.union([
    z.string().min(1, "Changelog is required"),
    z.literal(""),
  ]),
  description: z.string(),
  doi: z.string().nullable(),
  imageUrl: z.string().url("Image URL must be a valid URL"),
  primaryIdentifier: PrimaryIdentifierSchema.passthrough().optional(),
  publishedId: z.string().nullable().optional(),
  readme: z.union([z.string().min(1, "README is required"), z.literal("")]),
  secondaryIdentifiers: z.array(secondaryIdentifierSchema).optional(),
  status: z.enum(["draft", "published"]),
  StudyArm: z
    .array(studyArmSchema.strip())
    .min(1, { message: "At least one study arm is required" }),
  StudyCentralContact: z
    .array(contractSchema.strip())
    .min(1, { message: "At least one study central contact is required" }),
  StudyCollaborators: z.array(CollaboratorSchema.strip()).min(1),
  StudyConditions: z.array(conditionsSchema.strip()).min(1),

  StudyDescription: StudyDescriptionOnlySchema.strip(),
  StudyDesign: DesignBase.strip().superRefine(designRefine),
  StudyEligibility: StudyMetadataEligibilitySchema.strip(),
  StudyIdentification: z.array(IdentificationRowSchema).min(1).optional(),
  StudyIntervention: z
    .array(InterventionRowSchema)
    .min(1, { message: "At least one study intervention is required" }),
  StudyKeywords: z.array(keywordsSchema.strip()).min(1),
  StudyLocation: z
    .array(LocationSchema)
    .min(1, { message: "At least one study location is required" }),
  StudyOverallOfficials: z
    .array(officialSchema)
    .min(1, { message: "At least one study overall official is required" }),
  StudyOversight: z
    .object({})
    .passthrough()
    .transform((o: any) => ({
      humanSubjectReviewStatus: o.humanSubjectReviewStatus,
      isFDARegulatedDevice: o.isFDARegulatedDevice ?? o.fdaRegulatedDevice,
      isFDARegulatedDrug: o.isFDARegulatedDrug ?? o.fdaRegulatedDrug,
      oversightHasDMC: o.oversightHasDMC ?? o.hasDmc,
    }))
    .pipe(StudyMetadataOversightSchema),
  StudySponsors: SponsorsBase.omit({ collaborators: true })
    .strip()
    .superRefine(SponsorRefine),
  StudyStatus: StatusBase.strip().superRefine(StatusSchemaRefine),
  type: z.string().min(1, "Type is required"),
});

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
  const validationResult = DatasetSchema.safeParse(dataset);

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
  const validationResult = StudyMetadataSchema.safeParse(study);

  console.log("Below is the study metadata gathered");
  // console.log(JSON.stringify(study, null, 2));
  console.log(JSON.stringify(validationResult, null, 2));

  return {
    success: true,
    // valid: validationResult,
    // validations: validationResult?.error?.format(),
  };
}
