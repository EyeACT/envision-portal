export default defineEventHandler(async (event) => {
  const { datasetId } = event.context.params as { datasetId: string };
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const studyValidation = await validateStudyMetadata(datasetId, userId);

  const studyDescription = await generateStudyDescription(datasetId, userId);

  return {
    studyValidation,
    studyDescription,
  };
});
