const SCHEMA_URL = "https://schema.aireadi.org/v0.1.0/dataset_description.json";

const generateDatasetDescription = async (
  datasetId: string,
  userId: string,
) => {
  const datasetDescription: any = {};

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

  // Array fields in the dataset description that call for unique fields
  // are assumed to have been already validated.

  // Schema URL (required)
  datasetDescription.schema = SCHEMA_URL;

  // Identifier (required)
  datasetDescription.identifier = {
    identifierValue: `10.21384/envision.${datasetId}`, // TODO: Change to the actual DOI
    identifierType: "DOI",
  };

  // Title (required)
  //main titles should have no titleType
  const validTitleTypes = [
    "AlternativeTitle",
    "Subtitle",
    "TranslatedTitle",
    "Other",
  ];
  datasetDescription.title = dataset.DatasetTitle.map((title) => {
    return {
      titleValue: title.title,
      ...(title.type &&
        validTitleTypes.includes(title.type) && { titleType: title.type }),
    };
  });

  // Version (required)
  datasetDescription.version = dataset.version;

  // Alternate Identifier (optional)
  if (dataset.DatasetAlternateIdentifier.length > 0) {
    datasetDescription.alternateIdentifier =
      dataset.DatasetAlternateIdentifier.map((altId) => ({
        alternateIdentifierValue: altId.identifier,
        alternateIdentifierType: altId.type,
      }));
  }

  // Creator (required)
  const creators = dataset.DatasetContributor.filter(
    (contributor) => contributor.creator === true,
  );
  datasetDescription.creator = creators.map((creator) => {
    const affiliations = Array.isArray(creator.affiliations)
      ? creator.affiliations
      : JSON.parse(String(creator.affiliations || "[]"));

    // Only include nameIdentifier if values are non-empty
    const hasValidNameIdentifier =
      creator.nameIdentifier && creator.nameIdentifierScheme;

    return {
      creatorName: `${creator.familyName}, ${creator.givenName}`,
      nameType: creator.nameType,
      ...(hasValidNameIdentifier && {
        nameIdentifier: [
          {
            nameIdentifierValue: creator.nameIdentifier,
            nameIdentifierScheme: creator.nameIdentifierScheme,
            ...(creator.nameIdentifierSchemeUri && {
              schemeURI: creator.nameIdentifierSchemeUri,
            }),
          },
        ],
      }),
      ...(affiliations.length > 0 && {
        affiliation: affiliations.map((affiliation: any) => ({
          affiliationName: affiliation.affiliation,
          ...(affiliation.identifier && {
            affiliationIdentifier: {
              affiliationIdentifierValue: affiliation.identifier,
              affiliationIdentifierScheme: affiliation.identifierScheme,
              ...(affiliation.identifierSchemeUri && {
                schemeURI: affiliation.identifierSchemeUri,
              }),
            },
          }),
        })),
      }),
    };
  });

  // Contributor (optional)
  const contributors = dataset.DatasetContributor.filter(
    (contributor) => contributor.creator === false,
  );
  if (contributors.length > 0) {
    datasetDescription.contributor = contributors.map((contributor) => {
      const affiliations = Array.isArray(contributor.affiliations)
        ? contributor.affiliations
        : JSON.parse(String(contributor.affiliations || "[]"));

      // Only include nameIdentifier if values are non-empty
      const hasValidNameIdentifier =
        contributor.nameIdentifier && contributor.nameIdentifierScheme;

      return {
        contributorType: contributor.contributorType,
        contributorName: `${contributor.familyName}, ${contributor.givenName}`,
        nameType: contributor.nameType,
        ...(hasValidNameIdentifier && {
          nameIdentifier: [
            {
              nameIdentifierValue: contributor.nameIdentifier,
              nameIdentifierScheme: contributor.nameIdentifierScheme,
              ...(contributor.nameIdentifierSchemeUri && {
                schemeURI: contributor.nameIdentifierSchemeUri,
              }),
            },
          ],
        }),
        ...(affiliations.length > 0 && {
          affiliation: affiliations.map((affiliation: any) => ({
            affiliationName: affiliation.affiliation,
            ...(affiliation.identifier && {
              affiliationIdentifier: {
                affiliationIdentifierValue: affiliation.identifier,
                affiliationIdentifierScheme: affiliation.identifierScheme,
                ...(affiliation.identifierSchemeUri && {
                  schemeURI: affiliation.identifierSchemeUri,
                }),
              },
            }),
          })),
        }),
      };
    });
  }

  // Publication Year (required) - derive from dates or use current year
  const availableDate = dataset.DatasetDate.find(
    (date) => date.type === "Available",
  );
  const publicationYear = availableDate?.date
    ? new Date(availableDate.date).getFullYear().toString()
    : new Date().getFullYear().toString();
  datasetDescription.publicationYear = publicationYear;

  // Date (optional)
  if (dataset.DatasetDate.length > 0) {
    datasetDescription.date = dataset.DatasetDate.map((date) => ({
      dateValue: date.date ? date.date.toISOString().split("T")[0] : "",
      dateType: date.type,
      ...(date.information && { dateInformation: date.information }),
    }));
  }

  // Resource Type (required)
  if (dataset.DatasetOther) {
    datasetDescription.resourceType = {
      resourceTypeValue: dataset.DatasetOther.resourceTypeName,
      resourceTypeGeneral: "Dataset",
    };
  } else {
    datasetDescription.resourceType = {
      resourceTypeValue: "Clinical",
      resourceTypeGeneral: "Dataset",
    };
  }

  // Dataset De-Identification Level (required)
  if (dataset.DatasetDeIdentLevel) {
    datasetDescription.datasetDeIdentLevel = {
      deIdentType: dataset.DatasetDeIdentLevel.type,
      deIdentDirect: dataset.DatasetDeIdentLevel.direct,
      deIdentHIPAA: dataset.DatasetDeIdentLevel.hipaa,
      deIdentDates: dataset.DatasetDeIdentLevel.dates,
      deIdentNonarr: dataset.DatasetDeIdentLevel.nonarr,
      deIdentKAnon: dataset.DatasetDeIdentLevel.kAnon,
      ...(dataset.DatasetDeIdentLevel.details && {
        deIdentDetails: dataset.DatasetDeIdentLevel.details,
      }),
    };
  }

  // Dataset Consent (required)
  if (dataset.DatasetConsent) {
    datasetDescription.datasetConsent = {
      consentType: dataset.DatasetConsent.type,
      consentNoncommercial: dataset.DatasetConsent.noncommercial,
      consentGeogRestrict: dataset.DatasetConsent.geogRestrict,
      consentResearchType: dataset.DatasetConsent.researchType,
      consentGeneticOnly: dataset.DatasetConsent.geneticOnly,
      consentNoMethods: dataset.DatasetConsent.noMethods,
      ...(dataset.DatasetConsent.details && {
        consentsDetails: dataset.DatasetConsent.details,
      }),
    };
  }

  // Description (optional)
  if (dataset.DatasetDescription.length > 0) {
    datasetDescription.description = dataset.DatasetDescription.map((desc) => ({
      descriptionValue: desc.description,
      descriptionType: desc.type || "Abstract",
    }));
  }

  // Language (optional)
  if (dataset.DatasetOther?.language) {
    datasetDescription.language = dataset.DatasetOther.language;
  }

  // Related Identifier (optional)
  if (dataset.DatasetRelatedIdentifier.length > 0) {
    datasetDescription.relatedIdentifier = dataset.DatasetRelatedIdentifier.map(
      (relId) => ({
        relatedIdentifierValue: relId.identifier,
        relatedIdentifierType: relId.identifierType,
        relationType: relId.relationType,
        ...(relId.relatedMetadataScheme && {
          relatedMetadataScheme: relId.relatedMetadataScheme,
        }),
        ...(relId.schemeUri && { schemeURI: relId.schemeUri }),
        ...(relId.schemeType && { schemeType: relId.schemeType }),
        ...(relId.resourceType && { resourceTypeGeneral: relId.resourceType }),
      }),
    );
  }

  // Subject (optional)
  if (dataset.DatasetSubject.length > 0) {
    datasetDescription.subject = dataset.DatasetSubject.map((subject) => ({
      subjectValue: subject.subject,
      ...(subject.classificationCode && {
        subjectIdentifier: {
          classificationCode: subject.classificationCode,
          subjectScheme: subject.scheme,
          ...(subject.schemeUri && { schemeURI: subject.schemeUri }),
          ...(subject.valueUri && { valueURI: subject.valueUri }),
        },
      }),
    }));
  }

  // Managing Organization (required)
  if (dataset.DatasetManagingOrganization) {
    datasetDescription.managingOrganization = {
      name: dataset.DatasetManagingOrganization.name,
      ...(dataset.DatasetManagingOrganization.identifier && {
        managingOrganizationIdentifier: {
          managingOrganizationIdentifierValue:
            dataset.DatasetManagingOrganization.identifier,
          managingOrganizationScheme:
            dataset.DatasetManagingOrganization.identifierScheme,
          ...(dataset.DatasetManagingOrganization.identifierSchemeUri && {
            schemeURI: dataset.DatasetManagingOrganization.identifierSchemeUri,
          }),
        },
      }),
    };
  }

  // Access Type (required)
  if (dataset.DatasetAccess) {
    datasetDescription.accessType = dataset.DatasetAccess.type;

    // Access Details (required)
    datasetDescription.accessDetails = {
      description: dataset.DatasetAccess.description,
      ...(dataset.DatasetAccess.url && { url: dataset.DatasetAccess.url }),
      ...(dataset.DatasetAccess.urlLastChecked && {
        urlLastChecked: dataset.DatasetAccess.urlLastChecked.toISOString(),
      }),
    };
  }

  // Rights (required)
  if (dataset.DatasetRights) {
    datasetDescription.rights = [
      {
        rightsName: dataset.DatasetRights.rights,
        ...(dataset.DatasetRights.uri && {
          rightsURI: dataset.DatasetRights.uri,
        }),
        ...(dataset.DatasetRights.identifier && {
          rightsIdentifier: {
            rightsIdentifierValue: dataset.DatasetRights.identifier,
            rightsIdentifierScheme: dataset.DatasetRights.identifierScheme,
            ...(dataset.DatasetRights.identifierSchemeUri && {
              schemeURI: dataset.DatasetRights.identifierSchemeUri,
            }),
          },
        }),
      },
    ];
  }

  // Publisher (required) - use managing organization as publisher
  if (dataset.DatasetManagingOrganization) {
    datasetDescription.publisher = {
      publisherName: dataset.DatasetManagingOrganization.name,
      ...(dataset.DatasetManagingOrganization.identifier && {
        publisherIdentifier: {
          publisherIdentifierValue:
            dataset.DatasetManagingOrganization.identifier,
          publisherIdentifierScheme:
            dataset.DatasetManagingOrganization.identifierScheme,
          ...(dataset.DatasetManagingOrganization.identifierSchemeUri && {
            schemeURI: dataset.DatasetManagingOrganization.identifierSchemeUri,
          }),
        },
      }),
    };
  }

  // Size (optional)
  if (dataset.DatasetOther?.size && dataset.DatasetOther.size.length > 0) {
    datasetDescription.size = dataset.DatasetOther.size;
  }

  // Funding Reference (optional)
  if (dataset.DatasetFunder.length > 0) {
    datasetDescription.fundingReference = dataset.DatasetFunder.map(
      (funder) => ({
        funderName: funder.name,
        ...(funder.identifier && {
          funderIdentifier: {
            funderIdentifierValue: funder.identifier,
            funderIdentifierType: funder.identifierType,
            ...(funder.identifierSchemeUri && {
              schemeURI: funder.identifierSchemeUri,
            }),
          },
        }),
        ...(funder.awardNumber && {
          awardNumber: {
            awardNumberValue: funder.awardNumber,
            ...(funder.awardUri && { awardURI: funder.awardUri }),
          },
        }),
        ...(funder.awardTitle && { awardTitle: funder.awardTitle }),
      }),
    );
  }

  // Format (optional)
  if (dataset.DatasetOther?.format && dataset.DatasetOther.format.length > 0) {
    datasetDescription.format = dataset.DatasetOther.format;
  }

  const data = JSON.stringify(datasetDescription, null, 2);
  // console.log(data);
  return data;
};

export default generateDatasetDescription;
