
import dayjs from "dayjs";
import { z } from "zod"
import { nanoid } from "nanoid";


export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  await datasetMinAdminPermission(event)

  const { datasetId } = event.context.params as { datasetId: string };


  const body = await readValidatedBody(event, (b) =>
    datasetInviteSchema.safeParse(b)
  )


  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid invitation"
    })
  }

  const datasetInvite = body.data


  const user = await prisma.user.findUnique({
    where: {
      emailAddress: datasetInvite.emailAddress
    }
  })


  let invitationLink = ""
  let datasetInvitation = null
  if (user) {
    // TOOD: EMAIL TEMPLATE
    // await sendEmail(
    //   datasetInvite.emailAddress,
    //   "Sick Invitation Subject",
    //   invitationLink
    // )
    // TODO: Match platform invitation time later
    const invitationExpires = dayjs().add(30, "minute").toDate();
    datasetInvitation = await prisma.datasetInvitation.create({
      data: {
        ...datasetInvite,
        invitationExpires,
        userId: user.id
      }
    })
    // Send invitation email
    // OPTIONALLY SEND TO INVITATIONS PAGE
    invitationLink = `${config.emailVerificationDomain}/invitations`
  } else {
    const invitationToken = nanoid();
    // TODO: Up time to days later

    // TODO: Match platform invitation time later
    const invitationExpires = dayjs().add(60, "minute").toDate();


    datasetInvitation = await prisma.datasetInvitation.create({
      data: {
        ...datasetInvite,
        invitationToken,
        invitationExpires,
        userId: null
      }
    })
    invitationLink = `${config.emailVerificationDomain}/signup?datasetInvitation=${invitationToken}`
  }


  return {
    url: invitationLink,
    invitation: {
      id: datasetInvitation.id,
      emailAddress: datasetInvitation.emailAddress,
      role: datasetInvitation.role,
      status: datasetInvitation.status
    }
  }
})


let datasetInviteSchema = z.object({
  datasetId: z.string(),
  emailAddress: z.email(),
  role: z.enum(DATASET_ROLES),
  userId: z.string().optional()
})