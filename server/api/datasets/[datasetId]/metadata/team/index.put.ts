import { DatasetMetadataTeamSchema } from "~/server/utils/dataset_schemas";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { datasetId } = event.context.params as {
    datasetId: string;
  };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    DatasetMetadataTeamSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      data: body.error.format(),
      statusCode: 400,
      statusMessage: "Invalid data",
    });
  }

  const { contributors, creators, funders, managingOrganization } = body.data;

  // get the creators that already have an id and update them
  const creatorsToUpdate = creators.filter((creator) => creator.id);

  for (const creator of creatorsToUpdate) {
    await prisma.datasetContributor.update({
      data: {
        affiliations: JSON.stringify(creator.affiliations),
        familyName: creator.familyName,
        givenName: creator.givenName,
        nameIdentifier: creator.nameIdentifier,
        nameIdentifierScheme: creator.nameIdentifierScheme,
        nameIdentifierSchemeUri: creator.nameIdentifierSchemeUri,
        nameType: creator.nameType,
      },
      where: { id: creator.id, creator: true },
    });
  }

  // get the creators that don't have an id and create them
  const creatorsToCreate = creators.filter((creator) => !creator.id);

  for (const creator of creatorsToCreate) {
    await prisma.datasetContributor.create({
      data: {
        affiliations: JSON.stringify(creator.affiliations),
        contributorType: null,
        creator: true,
        datasetId,
        familyName: creator.familyName,
        givenName: creator.givenName,
        nameIdentifier: creator.nameIdentifier || "",
        nameIdentifierScheme: creator.nameIdentifierScheme || "",
        nameIdentifierSchemeUri: creator.nameIdentifierSchemeUri || "",
        nameType: creator.nameType,
      },
    });
  }

  // get the creators that are deleted and delete them
  const creatorsToDelete = creators.filter((creator) => creator.deleted);

  for (const creator of creatorsToDelete) {
    await prisma.datasetContributor.delete({
      where: { id: creator.id, creator: true },
    });
  }

  // get the contributors that already have an id and update them
  const contributorsToUpdate = contributors.filter(
    (contributor) => contributor.id,
  );

  for (const contributor of contributorsToUpdate) {
    await prisma.datasetContributor.update({
      data: {
        affiliations: JSON.stringify(contributor.affiliations),
        contributorType: contributor.contributorType,
        datasetId,
        familyName: contributor.familyName,
        givenName: contributor.givenName,
        nameIdentifier: contributor.nameIdentifier,
        nameIdentifierScheme: contributor.nameIdentifierScheme,
        nameIdentifierSchemeUri: contributor.nameIdentifierSchemeUri,
        nameType: contributor.nameType,
      },
      where: { id: contributor.id, creator: false },
    });
  }

  // get the contributors that don't have an id and create them
  const contributorsToCreate = contributors.filter(
    (contributor) => !contributor.id,
  );

  for (const contributor of contributorsToCreate) {
    await prisma.datasetContributor.create({
      data: {
        affiliations: JSON.stringify(contributor.affiliations),
        contributorType: contributor.contributorType,
        creator: false,
        datasetId,
        familyName: contributor.familyName,
        givenName: contributor.givenName,
        nameIdentifier: contributor.nameIdentifier || "",
        nameIdentifierScheme: contributor.nameIdentifierScheme || "",
        nameIdentifierSchemeUri: contributor.nameIdentifierSchemeUri || "",
        nameType: contributor.nameType,
      },
    });
  }

  // get the contributors that are deleted and delete them
  const contributorsToDelete = contributors.filter(
    (contributor) => contributor.deleted,
  );

  for (const contributor of contributorsToDelete) {
    await prisma.datasetContributor.delete({
      where: { id: contributor.id, creator: false },
    });
  }

  // get the funders that already have an id and update them
  const fundersToUpdate = funders.filter((funder) => funder.id);

  for (const funder of fundersToUpdate) {
    await prisma.datasetFunder.update({
      data: {
        name: funder.name,
        identifier: funder.identifier,
        identifierSchemeUri: funder.identifierSchemeUri,
        identifierType: funder.identifierType,
      },
      where: { id: funder.id },
    });
  }

  // get the funders that don't have an id and create them
  const fundersToCreate = funders.filter((funder) => !funder.id);

  for (const funder of fundersToCreate) {
    await prisma.datasetFunder.create({
      data: {
        name: funder.name,
        awardNumber: funder.awardNumber || "",
        awardTitle: funder.awardTitle || "",
        awardUri: funder.awardUri || "",
        datasetId,
        identifier: funder.identifier || "",
        identifierSchemeUri: funder.identifierSchemeUri || "",
        identifierType: funder.identifierType || "",
      },
    });
  }

  // get the funders that are deleted and delete them
  const fundersToDelete = funders.filter((funder) => funder.deleted);

  for (const funder of fundersToDelete) {
    await prisma.datasetFunder.delete({
      where: { id: funder.id },
    });
  }

  // update the managing organization
  await prisma.datasetManagingOrganization.update({
    data: {
      name: managingOrganization.name,
      identifier: managingOrganization.identifier,
      identifierScheme: managingOrganization.identifierScheme,
      identifierSchemeUri: managingOrganization.identifierSchemeUri,
    },
    where: { datasetId },
  });

  return {
    success: true,
  };
});
