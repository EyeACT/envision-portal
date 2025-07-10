import { z } from "zod";
import FORM_JSON from "@/assets/data/form.json";

const deIdentTypeOptions = FORM_JSON.datasetDeIdentTypeOptions.map(
  (opt) => opt.value,
);

const consentTypeOptions = FORM_JSON.datasetConsentTypeOptions.map(
  (opt) => opt.value,
);

const deIdentSchema = z
  .object({
    dates: z.boolean(),
    details: z.string().optional(),
    direct: z.boolean(),
    hipaa: z.boolean(),
    kAnon: z.boolean(),
    nonarr: z.boolean(),
    type: z.string().refine((v) => deIdentTypeOptions.includes(v), {
      message: `De-identification type must be one of: ${deIdentTypeOptions.join(", ")}`,
    }),
  })
  .strict();

const consentSchema = z
  .object({
    details: z.string().optional(),
    geneticOnly: z.boolean(),
    geogRestrict: z.boolean(),
    noMethods: z.boolean(),
    noncommercial: z.boolean(),
    researchType: z.boolean(),
    type: z.string().refine((v) => consentTypeOptions.includes(v), {
      message: `Consent type must be one of: ${consentTypeOptions.join(", ")}`,
    }),
  })
  .strict();

const subjectSchema = z
  .object({
    id: z.string().optional(),
    classificationCode: z.string().optional(),
    deleted: z.boolean().optional(),
    scheme: z.string().optional(),
    schemeUri: z.string().optional(),
    subject: z.string().min(1, "Subject is required"),
    valueUri: z.string().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      (data.classificationCode && !data.scheme) ||
      (!data.classificationCode && data.scheme)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Both classificationCode and scheme must be provided together",
      });
    }
  });

const DatasetMetadataDataManagementSchema = z
  .object({
    consent: consentSchema,
    deidentLevel: deIdentSchema,
    subjects: z.array(subjectSchema),
  })
  .strict();

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
