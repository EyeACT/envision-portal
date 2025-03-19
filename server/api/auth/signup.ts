import { z } from "zod";
import { hash } from "bcrypt";
import { nanoid } from "nanoid";
import { sendEmail } from "../../utils/sendEmail";
import dayjs from "dayjs";

const signupSchema = z.object({
  emailAddress: z.string().email(),
  familyName: z.string(),
  givenName: z.string(),
  password: z.string().min(8),
});

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readValidatedBody(event, (b) => signupSchema.safeParse(b));

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing or invalid signup details",
    });
  }

  // Check if the user already exists
  const user = await prisma.user.findUnique({
    where: {
      emailAddress: body.data.emailAddress,
    },
  });

  if (user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Email address already in use",
    });
  }

  // Create a new user
  const hashedPassword = await hash(body.data.password, 10);
  const verificationToken = nanoid();
  const tokenExpiry = dayjs().add(30, "minute").toDate();

  const newUser = await prisma.user.create({
    data: {
      emailAddress: body.data.emailAddress,
      familyName: body.data.familyName,
      givenName: body.data.givenName,
      password: hashedPassword,
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpires: tokenExpiry,
    },
  });

  if (!newUser) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error creating user",
    });
  }

  // Send verification email
  const verificationLink = `${config.emailVerificationDomain}/verify-email?token=${verificationToken}`;
  await sendEmail(
    newUser.emailAddress,
    "Verify Your Email Address",
    verificationLink
  );

  return { message: "Verification email sent. Please check your inbox." };
});
