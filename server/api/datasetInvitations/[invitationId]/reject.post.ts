import { InvitationStatuses } from "~~/shared/generated/client";


export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const userEmail = session.user.emailAddress

  const { invitationId } = event.context.params as {
    invitationId: string;
  };

  const invitation = await prisma.datasetInvitation.findUnique({
    where: {
      id: invitationId,
      emailAddress: userEmail
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
    invitation.invitationExpires &&
    invitation.invitationExpires < new Date()
  ) {
    throw createError({
      statusCode: 410,
      statusMessage:
        "Invitation token has expired. No reason to reject.",
    });
  }

  if (invitation.status == InvitationStatuses.ACCEPTED) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invitation already accepted.",
    });
  }

  if (invitation.status == InvitationStatuses.RESCINDED) {
    throw createError({
      statusCode: 410,
      statusMessage:
        "Invitation has been rescinded. No need to reject the invitation.",
    });
  }


  // consume invitation and create new dataset membership
  const invite = await prisma.datasetInvitation.update({
    where: {
      id: invitationId,
      emailAddress: userEmail
    },
    data: {
      status: InvitationStatuses.REJECTED,
      userId: session.user.id
    }
  })


  return invite
})