import { z } from "zod";

const StudyMetadataAboutSchema = z.object({
  consent: z.object({
    details: z.string(),
    geneticOnly: z.boolean(),
    geogRestrict: z.boolean(),
    noMethods: z.boolean(),
    noncommercial: z.boolean(),
    researchType: z.boolean(),
    type: z.string(),
  }),
  deidentLevel: z.object({
    dates: z.boolean(),
    details: z.string(),
    direct: z.boolean(),
    hipaa: z.boolean(),
    kAnon: z.boolean(),
    nonarr: z.boolean(),
    type: z.string(),
  }),
  subjects: z.array(
    z.object({
      id: z.string().optional(),
      classificationCode: z.string(),
      deleted: z.boolean().optional(),
      scheme: z.string(),
      schemeUri: z.string(),
      subject: z.string(),
      valueUri: z.string(),
    }),
  ),
});

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { datasetId, studyId } = event.context.params as {
    datasetId: string;
    studyId: string;
  };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    StudyMetadataAboutSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid  data",
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
        classificationCode: subject.classificationCode,
        datasetId,
        scheme: subject.scheme,
        schemeUri: subject.schemeUri,
        subject: subject.subject,
        valueUri: subject.valueUri,
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
