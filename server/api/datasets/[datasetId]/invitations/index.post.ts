
import dayjs from "dayjs";
import { z } from "zod"
import { nanoid } from "nanoid";
import { sendInvitationEmail } from "~~/server/utils/sendInvitationEmail";


export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  await datasetMinAdminPermission(event)

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

  const { datasetId } = event.context.params as { datasetId: string };
  if (datasetId !== datasetInvite.datasetId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid request"
    })
  }

  const normalizedEmailAddress = datasetInvite.emailAddress.toLocaleLowerCase()

  const user = await prisma.user.findUnique({
    where: {
      emailAddress: normalizedEmailAddress
    }
  })

  const dataset = await prisma.dataset.findUnique({
    where: {
      id: datasetId
    }
  })

  if (!dataset) {
    throw createError({
      statusCode: 404,
      statusMessage: "Dataset not found."
    })
  }

  const datasetTitle = dataset.title

  let invitationLink = ""
  let datasetInvitation = null
  if (user) {
    // await sendInvitationEmail(
    //   normalizedEmailAddress,
    //   `You Have Been Invited to Collaborate on an Envision Portal Dataset`,
    //   "internal",
    //   datasetTitle,
    //   invitationLink
    // )
    // TODO: Match platform invitation time later
    const invitationExpires = dayjs().add(30, "minute").toDate();
    datasetInvitation = await prisma.datasetInvitation.create({
      data: {
        datasetId: datasetInvite.datasetId,
        role: datasetInvite.role,
        emailAddress: normalizedEmailAddress,
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
        datasetId: datasetInvite.datasetId,
        role: datasetInvite.role,
        emailAddress: normalizedEmailAddress,
        invitationToken,
        invitationExpires,
        userId: null
      }
    })
    invitationLink = `${config.emailVerificationDomain}/signup?datasetInvitation=${invitationToken}`

    // await sendInvitationEmail(
    //   normalizedEmailAddress,
    //   `You Have Been Invited to Collaborate on an Envision Portal Dataset`,
    //   "external",
    //   datasetTitle,
    //   invitationLink
    // )
  }


  return {
    url: invitationLink,
    invitation: {
      id: datasetInvitation.id,
      emailAddress: normalizedEmailAddress,
      role: datasetInvitation.role,
      status: datasetInvitation.status,
      invitationExpires: datasetInvitation.invitationExpires
    }
  }
})


let datasetInviteSchema = z.object({
  datasetId: z.string(),
  emailAddress: z.email(),
  role: z.enum(DATASET_ROLES),
})