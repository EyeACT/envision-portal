import { z } from "zod";
import bcrypt from "bcrypt";

const signupSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (b) => signupSchema.safeParse(b));

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing login credentials",
    });
  }

  // Check if the user already exists
  const user = await prisma.user.findUnique({
    where: {
      username: body.data.username,
    },
  });

  if (user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Username already exists",
    });
  }

  // Create a new user
  const hashedPassword = await bcrypt.hash(body.data.password, 10);

  await prisma.user.create({
    data: {
      username: body.data.username,
      password: hashedPassword,
    },
  });

  // Create a new session for the user
  const userData = { username: body.data.username };

  await setUserSession(event, {
    loggedInAt: new Date(),
    user: userData,
    userSessionField: "",
  });

  return sendRedirect(event, "/login");
});
