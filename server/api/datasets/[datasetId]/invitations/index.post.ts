import { hash } from "bcrypt";
import { nanoid } from "nanoid";
import dayjs from "dayjs";
import { config, z } from "zod"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  // await datasetMinAdminPermission(event)

  const body = await readValidatedBody(event, (b) =>
    datasetInviteSchema.safeParse(b)
  )

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing invitation information"
    })
  }

  const datasetInvite = body.data


  // TODO: Hash token?
  const invitationToken = nanoid();
  // TODO: Up time to days later
  const invitationTokenExpires = dayjs().add(30, "minute").toDate();


  const datasetInvitation = await prisma.datasetInvitation.create({
    data: {
      ...datasetInvite,
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


let datasetInviteSchema = z.object({
  datasetId: z.string(),
  emailAddress: z.email(),
  role: z.string(),
  userId: z.string().optional()
})