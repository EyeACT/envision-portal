import { z } from "zod";

const StudyMetadataContactsSchema = z
  .object({
    studyContacts: z
      .array(
        z
          .object({
            id: z.string().optional(),
            affiliation: z
              .string()
              .trim()
              .min(1, { message: "Affiliation is required" }),
            affiliationIdentifier: z.string(),
            affiliationIdentifierScheme: z.string(),
            affiliationIdentifierSchemeUri: z.string(),
            degree: z.string(),
            deleted: z.boolean().optional(),
            emailAddress: z
              .string()
              .trim()
              .min(1, { message: "Email address is required" })
              .email({ message: "Email address is not valid" }),
            familyName: z
              .string()
              .trim()
              .min(1, { message: "Family name is required" }),
            givenName: z
              .string()
              .trim()
              .min(1, { message: "Given name is required" }),
            identifier: z.string(),
            identifierScheme: z.string(),
            identifierSchemeUri: z.string(),
            local: z.boolean().optional(),
            phone: z.string(),
            phoneExt: z.string(),
          })
          .strict()
          .superRefine((data, context) => {
            const id = data.identifier.trim();
            const sch = data.identifierScheme.trim();

            if ((id === "" && sch !== "") || (id !== "" && sch === "")) {
              context.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                  "Identifier and Identifier scheme must be provided together",
                path: ["identifier"],
              });
              context.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                  "Identifier and Identifier scheme must be provided together",
                path: ["identifierScheme"],
              });
            }
          }),
      )
      .min(1, {
        message: "At least one study central contact is required",
      }),
  })
  .strict();

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { studyId } = event.context.params as { studyId: string };

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    StudyMetadataContactsSchema.safeParse(b),
  );

  if (!body.success) {
    console.log(body.error);

    throw createError({
      data: body.error.format(),
      statusCode: 400,
      statusMessage: "Validation failed",
    });
  }

  const { studyContacts } = body.data;

  const studyContactsToUpdate = studyContacts.filter((contact) => contact.id);

  for (const contact of studyContactsToUpdate) {
    await prisma.studyCentralContact.update({
      data: {
        affiliation: contact.affiliation,
        affiliationIdentifier: contact.affiliationIdentifier,
        affiliationIdentifierScheme: contact.affiliationIdentifierScheme,
        affiliationIdentifierSchemeUri: contact.affiliationIdentifierSchemeUri,
        degree: contact.degree,
        emailAddress: contact.emailAddress,
        familyName: contact.familyName,
        givenName: contact.givenName,
        identifier: contact.identifier,
        identifierScheme: contact.identifierScheme,
        identifierSchemeUri: contact.identifierSchemeUri,
        phone: contact.phone,
        phoneExt: contact.phoneExt,
      },
      where: { id: contact.id },
    });
  }

  const studyContactsToCreate = studyContacts.filter((contact) => !contact.id);

  for (const contact of studyContactsToCreate) {
    await prisma.studyCentralContact.create({
      data: {
        affiliation: contact.affiliation,
        affiliationIdentifier: contact.affiliationIdentifier,
        affiliationIdentifierScheme: contact.affiliationIdentifierScheme,
        affiliationIdentifierSchemeUri: contact.affiliationIdentifierSchemeUri,
        degree: contact.degree,
        emailAddress: contact.emailAddress,
        familyName: contact.familyName,
        givenName: contact.givenName,
        identifier: contact.identifier,
        identifierScheme: contact.identifierScheme,
        identifierSchemeUri: contact.identifierSchemeUri,
        phone: contact.phone,
        phoneExt: contact.phoneExt,
        studyId,
      },
    });
  }

  const studyContactsToDelete = studyContacts.filter(
    (contact) => contact.deleted,
  );

  for (const contact of studyContactsToDelete) {
    await prisma.studyCentralContact.delete({
      where: { id: contact.id },
    });
  }

  return {
    studyContacts: studyContacts.filter((item) => !item.deleted),
  };
});
