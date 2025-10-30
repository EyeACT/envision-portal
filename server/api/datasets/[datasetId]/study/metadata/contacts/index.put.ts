import { StudyMetadataContactsSchema } from "#shared/utils/study_schemas";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { datasetId } = event.context.params as { datasetId: string };

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
        datasetId,
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
