import { z } from "zod";
import FORM_JSON from "~/assets/data/form.json";

const validRoles = FORM_JSON.studyMetadataContactsOverallOfficialRole.map(
  (opt) => opt.value,
);

const OfficialSchema = z
  .object({
    id: z.string().optional(),
    affiliation: z
      .string()
      .trim()
      .min(1, { message: "Affiliation is required" }),
    affiliationIdentifier: z.string().trim(),
    affiliationIdentifierScheme: z.string().trim(),
    affiliationIdentifierSchemeUri: z.string().trim(),
    degree: z.string().trim(),
    deleted: z.boolean().optional(),
    familyName: z
      .string()
      .trim()
      .min(1, { message: "Family name is required" }),
    givenName: z.string().trim().min(1, { message: "Given name is required" }),
    identifier: z.string().trim(),
    identifierScheme: z.string().trim(),
    identifierSchemeUri: z.string().trim(),
    role: z
      .string({
        invalid_type_error: "Role is required",
        required_error: "Role is required",
      })
      .trim()
      .refine((v) => validRoles.includes(v), {
        message: `Role must be one of the following: ${validRoles.join(", ")}`,
      }),
  })
  .strict()
  .superRefine((data, context) => {
    // affiliationIdentifier and affiliationIdentifierScheme if provided must be together
    const hasAffId = data.affiliationIdentifier !== "";
    const hasAffSch = data.affiliationIdentifierScheme !== "";
    const hasAffSchUri = data.affiliationIdentifierSchemeUri !== "";

    if (hasAffId && (!hasAffSch || !hasAffSchUri)) {
      [
        "affiliationIdentifier",
        "affiliationIdentifierScheme",
        "affiliationIdentifierSchemeUri",
      ].forEach((path) =>
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "If affiliation identifier is provided, scheme and scheme URI must also be provided",
          path: [path],
        }),
      );
    }

    // identifier and identifierScheme if provided must be together
    const hasId = data.identifier !== "";
    const hasIdSch = data.identifierScheme !== "";

    if (hasId !== hasIdSch) {
      ["identifier", "identifierScheme"].forEach((path) =>
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Identifier and Identifier scheme must be provided together",
          path: [path],
        }),
      );
    }
  });

const StudyMetadataOverallOfficialsSchema = z.object({
  studyOverallOfficials: z
    .array(OfficialSchema, {
      invalid_type_error: "`studyOverallOfficials` must be an array",
      required_error: "`studyOverallOfficials` array is required",
    })
    .min(1, {
      message: "At least one study overall official is required",
    }),
});

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { datasetId } = event.context.params as { datasetId: string };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    StudyMetadataOverallOfficialsSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      data: body.error.format(),
      statusCode: 400,
      statusMessage: "Validation failed",
    });
  }

  const { studyOverallOfficials } = body.data;

  const studyOverallOfficialsToUpdate = studyOverallOfficials.filter(
    (official) => official.id,
  );

  for (const official of studyOverallOfficialsToUpdate) {
    await prisma.studyOverallOfficials.update({
      data: {
        affiliation: official.affiliation,
        affiliationIdentifier: official.affiliationIdentifier,
        affiliationIdentifierScheme: official.affiliationIdentifierScheme,
        affiliationIdentifierSchemeUri: official.affiliationIdentifierSchemeUri,
        degree: official.degree,
        familyName: official.familyName,
        givenName: official.givenName,
        identifier: official.identifier,
        identifierScheme: official.identifierScheme,
        identifierSchemeUri: official.identifierSchemeUri,
        role: official.role,
      },
      where: { id: official.id },
    });
  }

  const studyOverallOfficialsToCreate = studyOverallOfficials.filter(
    (official) => !official.id,
  );

  for (const official of studyOverallOfficialsToCreate) {
    await prisma.studyOverallOfficials.create({
      data: {
        affiliation: official.affiliation,
        affiliationIdentifier: official.affiliationIdentifier,
        affiliationIdentifierScheme: official.affiliationIdentifierScheme,
        affiliationIdentifierSchemeUri: official.affiliationIdentifierSchemeUri,
        datasetId,
        degree: official.degree,
        familyName: official.familyName,
        givenName: official.givenName,
        identifier: official.identifier,
        identifierScheme: official.identifierScheme,
        identifierSchemeUri: official.identifierSchemeUri,
        role: official.role,
      },
    });
  }

  const studyOverallOfficialsToDelete = studyOverallOfficials.filter(
    (official) => official.deleted,
  );

  for (const official of studyOverallOfficialsToDelete) {
    await prisma.studyOverallOfficials.delete({
      where: { id: official.id },
    });
  }

  return {
    studyOverallOfficials: studyOverallOfficials.filter(
      (item) => !item.deleted,
    ),
  };
});
