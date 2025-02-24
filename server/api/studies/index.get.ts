// Returns a list of studies that the user is a member of
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  // Get the studies that the user is a member of
  const studies = await prisma.study.findMany({
    include: {
      StudyDescription: true,
      StudyMember: true,
    },
    where: {
      StudyMember: {
        some: {
          userId,
        },
      },
    },
  });

  return studies || [];
});
