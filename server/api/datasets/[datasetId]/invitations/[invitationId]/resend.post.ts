
import dayjs from "dayjs";
import { z } from "zod"
import { nanoid } from "nanoid";
import { InvitationStatuses } from "~~/shared/generated/enums";


export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  await datasetMinAdminPermission(event)

  const { datasetId, invitationId } = event.context.params as { datasetId: string, invitationId: string };

  const invitation = await prisma.datasetInvitation.findUnique({
    where: {
      id: invitationId
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


  // TODO: Eventually we will want to handle case where an invitee accidentally rejects an invitation.
  // Inviter must wait for invitation to expire before resending
  if (invitation.invitationExpires > new Date()) {
    throw createError({
      statusCode: 400,
      statusMessage: "Cannot send another invitation right now."
    })
  }

  let userId = invitation?.userId
  let emailAddress = invitation?.emailAddress

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


  if (user) {
    // TODO: Match platform invitation time later
    const invitationExpires = dayjs().add(30, "minute").toDate();
    const datasetInvitation = await prisma.datasetInvitation.update({
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
    const invitationLink = `${config.emailVerificationDomain}/app/invitations`

    // TOOD: EMAIL TEMPLATE
    // await sendEmail(
    //   datasetInvite.emailAddress,
    //   "Sick Invitation Subject",
    //   invitationLink
    // )

    return invitationLink

  } else {
    const invitationToken = nanoid();

    // TODO: Match platform invitation time later
    const invitationExpires = dayjs().add(60, "minute").toDate();

    const datasetInvitation = await prisma.datasetInvitation.update({
      where: {
        id: invitationId
      },
      data: {
        invitationExpires,
        status: InvitationStatuses.NORESPONSE,
        invitationToken: invitationToken
      }
    })


    const invitationLink = `${config.emailVerificationDomain}/signup?datasetInvitation=${invitationToken}`
    return invitationLink
  }


})