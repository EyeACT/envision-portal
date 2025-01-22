import { z } from "zod";
import bcrypt from "bcrypt";

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (b) => loginSchema.safeParse(b));

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing login credentials",
    });
  }

  // Get the user from the database
  const user = await prisma.user.findUnique({
    where: {
      username: body.data.username, // Access the parsed data correctly
    },
  });

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid username or password",
    });
  }

  // Check if the password matches
  if (!(await bcrypt.compare(body.data.password, user.password))) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid username or password",
    });
  }

  // Create a new session for the user
  const userData = { username: user.username };

  await setUserSession(event, {
    loggedInAt: new Date(),
    user: userData,
    userSessionField: "",
  });

  return sendRedirect(event, "/dashboard");
});
