export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  // Get the study ID from the path
  const id = getRouterParam(event, "id");

  // Get the study from the database
  const study = await prisma.study.findUnique({
    where: {
      id,
    },
  });

  // Check if the study exists
  if (!study) {
    throw createError({
      statusCode: 404,
      statusMessage: "Study not found",
    });
  }

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

  const { familyName, givenName } = session.user;
  const userName = `${givenName} ${familyName}`.trim();

  // Return the study
  return {
    id: study.id,
    title: study.title,
    createdOn,
    description: study.description,
    image: study.image || "",
    keywords: study.keywords || [],
    ownerId: study.ownerId,
    role: study.role,
    updatedOn,
    userName,
  };
});
