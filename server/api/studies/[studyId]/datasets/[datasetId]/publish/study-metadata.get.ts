export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { datasetId, studyId } = event.context.params as {
    datasetId: string;
    studyId: string;
  };

  // Get the study from the database
  const study = await prisma.study.findUnique({
    include: {
      StudyArm: true,
      StudyCentralContact: true,
      StudyCollaborators: true,
      StudyConditions: true,
      StudyDescription: true,
      StudyDesign: true,
      StudyEligibility: true,
      StudyIdentification: true,
      StudyIntervention: true,
      StudyKeywords: true,
      StudyLocation: true,
      StudyOverallOfficials: true,
      StudyOversight: true,
      StudySponsors: true,
      StudyStatus: true,
    },
    where: {
      id: studyId,
      StudyMember: {
        some: {
          userId,
        },
      },
    },
  });

  // Check if the study exists
  if (!study) {
    throw createError({
      statusCode: 404,
      statusMessage: "Study not found",
    });
  }

  const dataset = await prisma.dataset.findUnique({
    where: {
      id: datasetId,
    },
  });

  const primaryIdentifier = study.StudyIdentification.find(
    (identifier) => identifier.isSecondary === false,
  );

  const secondaryIdentifiers = study.StudyIdentification.filter(
    (identifier) => identifier.isSecondary === true,
  );

  return {
    dataset,
    primaryIdentifier,
    ...study,
    secondaryIdentifiers,
  };
});
