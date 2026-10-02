import { z } from "zod"

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { invitationId } = event.context.params as {
    invitationId: string;
  };

  const invitation = await prisma.datasetInvitation.findUnique({
    where: {
      id: invitationId
    }
  })

  if (!invitation) {
    throw createError({
      statusCode: 401,
      statusMessage: "User does not have a platform invitation",
    });
  }

  // Check if the invitation has expired
  if (
    invitation.invitationTokenExpires &&
    invitation.invitationTokenExpires < new Date()
  ) {
    throw createError({
      statusCode: 410,
      statusMessage:
        "Invitation token has expired. Please request a new one.",
    });
  }


  // TODO: consume invitation token and add the userId
  await prisma.datasetInvitation.update({
    where: {
      id: invitationId
    },
    data: {
      invitationAccepted: true
    }
  })


  const addedMember = await prisma.datasetMember.create({
    data: {
      userId: session.user.id,
      role: invitation.role,
      datasetId: invitation.datasetId

    }
  })


  return addedMember
})