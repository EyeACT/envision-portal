import { InvitationStatuses } from "~~/shared/generated/client";


export default defineEventHandler(async (event) => {
  await datasetMinAdminPermission(event)

  const { datasetId, userId } = event.context.params as {
    datasetId: string;
    userId: string;
  };

  const targetMember = await prisma.datasetMember.findUnique({
    where: {
      datasetId_userId: { datasetId, userId },
    }
  })

  if (targetMember?.owner) {
    throw createError({
      statusCode: 403,
      statusMessage: "Cannot remove dataset owner"
    })
  }


  await prisma.datasetMember.delete({
    where: {
      datasetId_userId: { datasetId, userId },
    }
  });


  // TODO: Make transaction for all 3 calls
  const invitation = await prisma.datasetInvitation.findUnique({
    where: {
      datasetId_userId: { datasetId, userId }
    }
  })


  if (invitation) {
    // prime invitation for a resend
    await prisma.datasetInvitation.update({
      where: {
        id: invitation.id
      },
      data: {
        status: InvitationStatuses.NORESPONSE
      }
    })
  }

  setResponseStatus(event, 204);
});
