// Returns a list of studies that the user is a member of
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  // Get the studies that the user is a member of
  const studies = await prisma.study.findMany({
    where: {
      ownerId: userId,
    },
  });

  const { familyName, givenName } = session.user;
  const userName = `${givenName} ${familyName}`.trim();

  // Map the studies to the desired format
  const mappedStudies = studies.map((study) => {
    // Convert updatedOn and CreatedOn to human readable format
    const createdOn = new Date(study.createdOn).toLocaleString("en-US", {
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const updatedOn = new Date(study.updatedOn).toLocaleString("en-US", {
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return {
      id: study.id,
      title: study.title,
      createdOn,
      description: study.description,
      image: study.image || "",
      keywords: study.keywords,
      ownerId: study.ownerId,
      role: study.role,
      size: study.size,
      updatedOn,
      userName,
    };
  });

  // Return the studies
  console.log("Mapped Studies:", mappedStudies);

  return mappedStudies;
});
