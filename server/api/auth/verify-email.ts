import { z } from "zod";

const verifySchema = z.object({
  token: z.string(),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (b) => verifySchema.safeParse(b));

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid or missing verification token",
    });
  }

  // Find the user by verification token
  const user = await prisma.user.findUnique({
    where: {
      emailVerificationToken: body.data.token,
    },
  });

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: "Invalid or expired verification token",
    });
  }

  // Check if the token has expired
  if (user.emailVerificationTokenExpires && user.emailVerificationTokenExpires < new Date()) {
    throw createError({
      statusCode: 410,
      statusMessage: "Verification token has expired. Please request a new one.",
    });
  }

  // Mark email as verified and clear the token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationTokenExpires: null,
    },
  });

  return { message: "Email successfully verified! You can now log in." };
});
