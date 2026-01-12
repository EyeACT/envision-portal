import { externalDatasetSchema } from "#shared/utils/external_dataset";

export default defineEventHandler(async (event) => {
  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    externalDatasetSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid dataset data",
    });
  }

  const data = body.data;

  // Create a dataset record with all metadata
  // Status is set to "pending_review" (manual review required)
  const dataset = await prisma.dataset.create({
    data: {
      title: data.title,
      description: data.description,
      type: "external",
      version: data.version,
      status: "pending_review",
      readme: "",
      DatasetDeIdentLevel: {
        create: {
          type: data.deIdentType,
          direct: data.deIdentDirect,
          hipaa: data.deIdentHIPAA,
          dates: data.deIdentDates,
          nonarr: data.deIdentNonarr,
          kAnon: data.deIdentKAnon,
          details: "",
        },
      },
      DatasetConsent: {
        create: {
          type: data.consentType,
          noncommercial: data.consentNoncommercial,
          geogRestrict: data.consentGeogRestrict,
          researchType: data.consentResearchType,
          geneticOnly: data.consentGeneticOnly,
          noMethods: data.consentNoMethods,
          details: "",
        },
      },
      DatasetManagingOrganization: {
        create: {
          name: data.managingOrgName,
          identifier: "",
          identifierScheme: "",
          identifierSchemeUri: "",
        },
      },
      DatasetAccess: {
        create: {
          type: data.accessType,
          description: data.accessDescription,
          url: data.accessUrl,
        },
      },
      DatasetRights: {
        create: {
          rights: data.rightsName,
          uri: "",
          identifier: "",
          identifierScheme: "",
          identifierSchemeUri: "",
          licenseText: "",
        },
      },
      DatasetOther: {
        create: {
          resourceTypeName: data.resourceTypeValue,
          resourceType: "Dataset",
          standardsFollowed: "",
          acknowledgement: data.publisherName,
          size: [],
          format: [],
        },
      },
      DatasetDate: {
        create: {
          date: new Date(`${data.publicationYear}-01-01`),
          type: "Issued",
          information: "Publication year",
        },
      },
      DatasetContributor: {
        create: {
          givenName: data.creatorName,
          nameType: data.creatorNameType,
          nameIdentifier: "",
          nameIdentifierScheme: "",
          nameIdentifierSchemeUri: "",
          creator: true,
          affiliations: [],
        },
      },
    },
  });

  return {
    data: {
      datasetId: dataset.id,
      canonicalId: dataset.canonicalId,
      status: "pending_review",
    },
    statusCode: 201,
  };
});
