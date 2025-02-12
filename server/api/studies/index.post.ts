// Create a new Study
// This endpoint creates a new study and returns the created study object
import { z } from "zod";

const createStudySchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  image: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

const createStudyResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  created: z.date(),
  description: z.string(),
  image: z.string().optional(),
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

  // Create the new study in the database
  const newStudy = await prisma.study.create({
    data: {
      title: body.data.title,
      description: body.data.description,
      image: body.data.image || "",
      keywords: body.data.keywords || [],
      ownerId: userId,
      role: "owner", // replace with appropriate role
    },
  });

  return newStudy;
});
