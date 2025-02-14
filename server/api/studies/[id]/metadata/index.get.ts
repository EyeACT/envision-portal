export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const studyId = getRouterParam(event, "id");

  // Get the metadata for the study
  // const metadata = await prisma.studyMetadata.findUnique({
  //   where: {
  //     study: studyId,
  //   },
  // });
});
