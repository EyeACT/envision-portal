// Create a new Study
// This endpoint creates a new study and returns the created study object
import { z } from "zod";

const createStudySchema = z.object({
  title: z.string().min(1),
  bannerImageUrl: z.string().optional(),
  description: z.string(),
  keywords: z.array(z.string()).optional(),
});

// Create new study into the prisma database
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  // Validate the request body
  const body = await readValidatedBody(event, (b) =>
    createStudySchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid study data",
    });
  }

  console.log("Body:", body);

  // Create the new study in the database
  const newStudy = await prisma.study.create({
    data: {
      title: body.data.title,
      description: body.data.description,
      image: body.data.bannerImageUrl || "",
      keywords: body.data.keywords || [],
      ownerId: userId,
      role: "owner",
    },
  });

  // Convert updatedOn and CreatedOn to human readable format
  const createdOn = new Date(newStudy.createdOn).toLocaleString("en-US", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const updatedOn = new Date(newStudy.updatedOn).toLocaleString("en-US", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const { familyName, givenName } = session.user;
  const userName = `${givenName} ${familyName}`.trim();

  return {
    id: newStudy.id,
    title: newStudy.title,
    createdOn,
    description: newStudy.description,
    image: newStudy.image || "",
    keywords: newStudy.keywords,
    ownerId: newStudy.ownerId,
    role: newStudy.role,
    size: newStudy.size,
    updatedOn,
    userName,
  };
});
