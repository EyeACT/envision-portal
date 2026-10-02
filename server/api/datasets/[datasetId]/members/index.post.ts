import { z } from "zod"

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const body = await readValidatedBody(event, memberSchema.safeParse)

  if (!body) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing member information"
    })
  }

  const memberToAdd = body.data!

  const invitation = await prisma.datasetInvitation.findUnique({
    where: {
      invitationToken: memberToAdd.invitationToken
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
      invitationToken: memberToAdd.invitationToken
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



const memberSchema = z.object({
  invitationToken: z.string()
})