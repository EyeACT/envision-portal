

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
        "Invitation token has expired. Please request a new one.",
    });
  }

  if (invitation.invitationAccepted) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invitation already accepted.",
    });
  }


  // consume invitation and create new dataset membership
  const [consumedInvitation, addedMember] = await prisma.$transaction([
    prisma.datasetInvitation.update({
      where: {
        id: invitationId,
        emailAddress: userEmail
      },
      data: {
        invitationAccepted: true,
        userId: session.user.id
      }
    }),

    prisma.datasetMember.create({
      data: {
        userId: session.user.id,
        role: invitation.role,
        datasetId: invitation.datasetId

      }
    })
  ])


  return addedMember
})