import { hash } from "bcrypt";
import { nanoid } from "nanoid";
import dayjs from "dayjs";
import { z } from "zod"

// TODO: Restrict platform invitations to platform members/some kind of elevated user
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const config = useRuntimeConfig()

  const body = await readValidatedBody(event, (b) =>
    platformInviteSchema.safeParse(b)
  )

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing invitation information"
    })
  }

  const platformInvite = body.data

  // TODO: Make sure email is not already platform member and does not have active platform invite


  // TODO: Hash token?
  const invitationToken = nanoid();
  // TODO: Up time to days later
  const invitationTokenExpires = dayjs().add(30, "minute").toDate();


  const platformInvitation = await prisma.platformInvitation.create({
    data: {
      ...platformInvite,
      invitationToken,
      invitationTokenExpires
    }
  })


  // Send invitation email
  const invitationLink = `${config.emailVerificationDomain}/signup?invitation=${invitationToken}`
  // TOOD: EMAIL TEMPLATE
  // await sendEmail(
  //   datasetInvite.emailAddress,
  //   "Sick Invitation Subject",
  //   invitationLink
  // )


  return invitationLink
})


let platformInviteSchema = z.object({
  emailAddress: z.email(),
})