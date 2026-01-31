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

  datasetDescription.identifier = {
    identifierValue: `10.21384/envision.${datasetId}`, // TODO: Change to the actual DOI
    identifierType: "DOI",
  };
  datasetDescription.title = dataset.DatasetTitle.map((title) => {
    return {
      ...(title.type && { titleType: title.type }),
      titleValue: title.title,
    };
  });
  datasetDescription.version = dataset.version;
  const creators = dataset.DatasetContributor.filter(
    (contributor) => contributor.creator === true,
  );
  datasetDescription.creator = creators.map((creator) => {
    const affiliations = JSON.parse(String(creator.affiliations || "[]"));
    return {
      creatorName: `${creator.familyName}, ${creator.givenName}`,
      nameType: creator.nameType,
      nameIdentifier: [
        {
          nameIdentifierValue: creator.nameIdentifier,
          nameIdentifierScheme: creator.nameIdentifierScheme,
          ...(creator.nameIdentifierSchemeUri && {
            schemeURI: creator.nameIdentifierSchemeUri,
          }),
        },
      ],
      affiliation: affiliations.map((affiliation: any) => {
        return {
          affiliationName: affiliation.affiliationName,
          affiliationIdentifierValue: affiliation.affiliationIdentifierValue,
          affiliationIdentifierScheme: affiliation.affiliationIdentifierScheme,
          ...(affiliation.schemeURI && { schemeURI: affiliation.schemeURI }),
        };
      }),
    };
  });
  const contributors = dataset.DatasetContributor.filter(
    (contributor) => contributor.creator === false,
  );
  datasetDescription.contributor = contributors.map((contributor) => {
    return {
      contributorName: `${contributor.familyName}, ${contributor.givenName}`,
      contributorType: contributor.contributorType,
      nameType: contributor.nameType,
      nameIdentifier: contributor.nameIdentifier,
      nameIdentifierScheme: contributor.nameIdentifierScheme,
      nameIdentifierSchemeUri: contributor.nameIdentifierSchemeUri,
    };
  });

  return JSON.stringify(datasetDescription, null, 2);
};

export default generateDatasetDescription;
