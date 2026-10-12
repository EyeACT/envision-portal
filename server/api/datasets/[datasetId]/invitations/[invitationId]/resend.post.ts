
import dayjs from "dayjs";
import { nanoid } from "nanoid";
import { InvitationStatuses } from "~~/shared/generated/enums";


export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  await datasetMinAdminPermission(event)

  const { datasetId, invitationId } = event.context.params as { datasetId: string, invitationId: string };

  const invitation = await prisma.datasetInvitation.findUnique({
    where: {
      id: invitationId,
      datasetId: datasetId
    }
  })

  if (!invitation) {
    throw createError({
      statusCode: 404,
      statusMessage: "Cannot find invitation."
    })
  }

  if (invitation.status == InvitationStatuses.ACCEPTED) {
    throw createError({
      statusCode: 400,
      statusMessage: "Cannot send another invitation."
    })
  }

  // TODO: Eventually allow at least one resend if status is REJECTED without waiting.
  // Inviter must wait for invitation to expire before resending
  if (invitation.invitationExpires > new Date()) {
    throw createError({
      statusCode: 400,
      statusMessage: "Cannot send another invitation right now."
    })
  }

  let userId = invitation?.userId
  let emailAddress = invitation?.emailAddress?.toLocaleLowerCase()

  if (!userId && !emailAddress) {
    throw createError({
      statusCode: 404,
      statusMessage: "Could not find a user to invite."
    })
  }

  const condition = userId ? { id: userId! } : { emailAddress: emailAddress! }

  const user = await prisma.user.findUnique({
    where: {
      ...condition
    }
  })


  let invitationLink = ""
  let datasetInvitation = null

  if (user) {
    // TODO: Match platform invitation time later
    const invitationExpires = dayjs().add(30, "minute").toDate();
    datasetInvitation = await prisma.datasetInvitation.update({
      where: {
        id: invitationId
      },
      data: {
        invitationExpires,
        status: InvitationStatuses.NORESPONSE,
        invitationToken: null
      }
    })
    // Send invitation email
    // OPTIONALLY SEND TO INVITATIONS PAGE
    invitationLink = `${config.emailVerificationDomain}/invitations`

    // TOOD: EMAIL TEMPLATE
    // await sendEmail(
    //   datasetInvite.emailAddress,
    //   "Sick Invitation Subject",
    //   invitationLink
    // )

  } else {
    const invitationToken = nanoid();

    // TODO: Match platform invitation time later
    const invitationExpires = dayjs().add(60, "minute").toDate();

    datasetInvitation = await prisma.datasetInvitation.update({
      where: {
        id: invitationId
      },
      data: {
        invitationExpires,
        status: InvitationStatuses.NORESPONSE,
        invitationToken: invitationToken
      }
    })

    // TOOD: EMAIL TEMPLATE
    // await sendEmail(
    //   datasetInvite.emailAddress,
    //   "Sick Invitation Subject",
    //   invitationLink
    // )



    invitationLink = `${config.emailVerificationDomain}/signup?datasetInvitation=${invitationToken}`
  }

  return {
    url: invitationLink,
    invitation: {
      id: datasetInvitation.id,
      emailAddress: emailAddress,
      role: datasetInvitation.role,
      status: datasetInvitation.status,
      invitationExpires: datasetInvitation.invitationExpires
    }
  }
})