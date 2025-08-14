import { z } from "zod";
import { DataLakeServiceClient } from "@azure/storage-file-datalake";

const createDatasetSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  imageUrl: z.string(),
  type: z.string(),
  version: z.string(),
});

export default defineEventHandler(async (event) => {
  const { AZURE_DRAFT_CONNECTION_STRING } = useRuntimeConfig();
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  // todo: add permissions check

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    createDatasetSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid study data",
    });
  }

  // TODO: remove this
  // delete the dataset if it already exists
  try {
    await prisma.dataset.delete({
      where: {
        id: "cm880mrva00000cl20uo80c7e",
      },
    });
  } catch (error) {
    console.error(error);
  }

  const newDataset = await prisma.dataset.create({
    data: {
      // id: "cm880mrva00000cl20uo80c7e", // todo: remove this
      title: body.data.title,
      DatasetAccess: {
        create: {
          description: "",
          type: "Access",
          url: "",
          urlLastChecked: new Date(),
        },
      },
      DatasetConsent: {
        create: {
          details: "",
          geneticOnly: false,
          geogRestrict: false,
          noMethods: false,
          noncommercial: false,
          researchType: false,
          type: "Consent",
        },
      },
      DatasetDeIdentLevel: {
        create: {
          dates: false,
          details: "",
          direct: false,
          hipaa: false,
          kAnon: false,
          nonarr: false,
          type: "DeIdentLevel",
        },
      },
      DatasetDescription: {
        create: {
          description: body.data.description,
          type: "Abstract",
        },
      },
      DatasetHealthsheet: {
        create: {
          collection: JSON.stringify({
            records: [],
            version: 1,
          }),
          composition: JSON.stringify({
            records: [],
            version: 1,
          }),
          distribution: JSON.stringify({
            records: [],
            version: 1,
          }),
          maintenance: JSON.stringify({
            records: [],
            version: 1,
          }),
          motivation: JSON.stringify({
            records: [],
            version: 1,
          }),
          preprocessing: JSON.stringify({
            records: [],
            version: 1,
          }),
          uses: JSON.stringify({
            records: [],
            version: 1,
          }),
        },
      },
      DatasetManagingOrganization: {
        create: {
          name: "",
          identifier: "",
          identifierScheme: "",
          identifierSchemeUri: "",
        },
      },
      DatasetMember: {
        create: {
          owner: true,
          role: "owner",
          userId,
        },
      },
      DatasetOther: {
        create: {
          acknowledgement: "",
          format: [],
          labelingMethod: "",
          language: "",
          resourceType: "Dataset",
          resourceTypeName: "",
          size: [],
          standardsFollowed: "",
          validationInfo: "",
        },
      },
      DatasetRights: {
        create: {
          identifier: "",
          identifierScheme: "",
          identifierSchemeUri: "",
          licenseText: "",
          rights: "",
          uri: "",
        },
      },
      DatasetTitle: {
        create: {
          title: body.data.title,
          type: "MainTitle",
        },
      },
      description: body.data.description,
      imageUrl: body.data.imageUrl,
      StudyDescription: {
        create: {
          briefSummary: body.data.description,
          detailedDescription: "",
        },
      },
      StudyDesign: {
        create: {
          allocation: null,
          bioSpecDescription: null,
          bioSpecRetention: null,
          enrollmentCount: null,
          enrollmentType: null,
          interventionModel: null,
          isPatientRegistry: null,
          masking: null,
          maskingDescription: null,
          numberOfArms: null,
          oberservationalModelList: [],
          phaseList: [],
          primaryPurpose: null,
          studyType: null,
          targetDuration: null,
          timePerspectiveList: [],
          whoMaskedList: [],
        },
      },
      StudyEligibility: {
        create: {
          exclusionCriteria: [],
          genderBased: null,
          genderDescription: null,
          healthyVolunteers: null,
          inclusionCriteria: [],
          maximumAgeUnit: null,
          maximumAgeValue: null,
          minimumAgeUnit: null,
          minimumAgeValue: null,
          samplingMethod: null,
          sex: null,
          studyPopulation: "",
        },
      },
      StudyStatus: {
        create: {
          completionDate: null,
          completionDateType: null,
          overallStatus: null,
          startDate: null,
          startDateType: null,
          whyStopped: null,
        },
      },
      type: body.data.type,
      version: body.data.version,
    },
  });

  // Create a new container for the dataset
  const datalakeServiceClient = DataLakeServiceClient.fromConnectionString(
    AZURE_DRAFT_CONNECTION_STRING,
  );

  const fileSystemClient = datalakeServiceClient.getFileSystemClient(
    newDataset.id,
  );

  await fileSystemClient.create();

  return {
    data: { datasetId: newDataset.id },
    statusCode: 201,
  };
});
