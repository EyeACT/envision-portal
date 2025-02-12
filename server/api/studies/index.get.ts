// Returns a list of studies that the user is a member of
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  console.log("User ID:", userId);
  console.log("Session:", session);

  // Get the studies that the user is a member of
  const studies = await prisma.study.findMany({
    where: {
      ownerId: userId,
    },
  });

  // Map the studies to the desired format
  const mappedStudies = studies.map((study) => {
    return {
      id: study.id,
      title: study.title,
      createdOn: study.createdOn,
      description: study.description,
      image: study.image || "",
      keywords: study.keywords,
      ownerId: study.ownerId,
      role: study.role,
      size: study.size,
      updatedOn: study.updatedOn,
    };
  });

  // Return the studies
  console.log("Mapped Studies:", mappedStudies);

  return mappedStudies;
});
