import { DatasetMetadataDataManagementSchema } from "~/server/utils/dataset_schemas";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { datasetId } = event.context.params as {
    datasetId: string;
  };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    DatasetMetadataDataManagementSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      data: body.error.format(),
      statusCode: 400,
      statusMessage: "Invalid data",
    });
  }

  const { consent, deidentLevel, subjects } = body.data;

  // get the subjects that already have an id and update them
  const subjectsToUpdate = subjects.filter((subject) => subject.id);

  for (const subject of subjectsToUpdate) {
    await prisma.datasetSubject.update({
      data: {
        classificationCode: subject.classificationCode,
        scheme: subject.scheme,
        schemeUri: subject.schemeUri,
        subject: subject.subject,
        valueUri: subject.valueUri,
      },
      where: { id: subject.id },
    });
  }

  // get the subjects that don't have an id and create them
  const subjectsToCreate = subjects.filter((subject) => !subject.id);

  for (const subject of subjectsToCreate) {
    await prisma.datasetSubject.create({
      data: {
        classificationCode: subject.classificationCode || "",
        datasetId,
        scheme: subject.scheme || "",
        schemeUri: subject.schemeUri || "",
        subject: subject.subject || "",
        valueUri: subject.valueUri || "",
      },
    });
  }

  // get the subjects that are deleted and delete them
  const subjectsToDelete = subjects.filter((subject) => subject.deleted);

  for (const subject of subjectsToDelete) {
    await prisma.datasetSubject.delete({
      where: { id: subject.id },
    });
  }

  // update the consent
  await prisma.datasetConsent.update({
    data: {
      details: consent.details,
      geneticOnly: consent.geneticOnly,
      geogRestrict: consent.geogRestrict,
      noMethods: consent.noMethods,
      noncommercial: consent.noncommercial,
      researchType: consent.researchType,
      type: consent.type,
    },
    where: { datasetId },
  });

  // update the de-identification level
  await prisma.datasetDeIdentLevel.update({
    data: {
      dates: deidentLevel.dates,
      details: deidentLevel.details,
      direct: deidentLevel.direct,
      hipaa: deidentLevel.hipaa,
      kAnon: deidentLevel.kAnon,
      nonarr: deidentLevel.nonarr,
      type: deidentLevel.type,
    },
    where: { datasetId },
  });

  return {
    success: true,
  };
});
