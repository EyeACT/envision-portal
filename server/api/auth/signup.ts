import { z } from "zod";
import { hash } from "bcrypt";
import { nanoid } from "nanoid";
import dayjs from "dayjs";
import { sendEmail } from "../../utils/sendEmail";
import { InvitationStatuses } from "~~/shared/generated/client";

const signupSchema = z.object({
  emailAddress: z.string().email(),
  familyName: z.string(),
  givenName: z.string(),
  password: z.string().min(8),
  invitation: z.string().optional()
});

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const { environment } = config.public;

  const body = await readValidatedBody(event, (b) => signupSchema.safeParse(b));

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing or invalid signup details",
    });
  }

  if ((environment === "production" || environment === "staging") && !body.data.invitation) {
    throw createError({
      statusCode: 403,
      statusMessage: "Signup has been disabled",
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

  // TODO: Database transaction for consuming and creating a user
  // signups with successful invitation consumption skip email verification
  const validInvitation = await hasValidDatasetInvitation(body.data.invitation, body.data.emailAddress)

  const newUser = await prisma.user.create({
    data: {
      emailAddress: body.data.emailAddress,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpires: tokenExpiry,
      emailVerified: validInvitation ? true : false,
      familyName: body.data.familyName,
      givenName: body.data.givenName,
      password: hashedPassword,
    },
  });

  if (!newUser) {
    // TODO: IF user creation fails deconsume platform invitation and vice versa before throwing aka atomicity
    throw createError({
      statusCode: 500,
      statusMessage: "Error creating user",
    });
  }

  if (!validInvitation) {
    // Send verification email
    const verificationLink = `${config.emailVerificationDomain}/verify-email?token=${verificationToken}`;

    await sendEmail(
      newUser.emailAddress,
      "Verify Your Email Address",
      verificationLink,
    );

    return { message: "Verification email sent. Please check your inbox." };
  }


  return { message: "Email already verified. Please login." }
});


const hasValidDatasetInvitation = async (invitation: string | undefined, emailAddress: string) => {
  if (!invitation) {
    return false
  }

  // Check if the user has a platform invitation
  const datasetInvitation = await prisma.datasetInvitation.findUnique({
    where: {
      emailAddress: emailAddress,
      invitationToken: invitation
    },
  });

  if (!datasetInvitation) {
    throw createError({
      statusCode: 401,
      statusMessage: "User does not have a dataset invitation",
    });
  }

  // Check if the invitation has expired
  if (
    datasetInvitation.invitationExpires &&
    datasetInvitation.invitationExpires < new Date()
  ) {
    throw createError({
      statusCode: 410,
      statusMessage:
        "Invitation token has expired. Please request a new one.",
    });
  }

  if (datasetInvitation.status == InvitationStatuses.RESCINDED) {
    throw createError({
      statusCode: 410,
      statusMessage:
        "Invitation has been rescinded. Please contact the inviter for a new invitation.",
    });
  }

  if (datasetInvitation.status !== InvitationStatuses.NORESPONSE) {
    throw createError({
      statusCode: 410,
      statusMessage: "This invitation is no longer valid."
    })
  }


  return true
}
