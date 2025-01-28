export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { notificationId } = event.context.params as { notificationId: string };

  const notification = await prisma.notification.findUnique({
    where: {
      id: notificationId,
    },
  });

  if (!notification || notification.userId !== userId) {
    throw createError({
      statusCode: 404,
      statusMessage: "Notification not found",
    });
  }

  await prisma.notification.delete({
    where: {
      id: notificationId,
    },
  });

  return {
    notification,
  };
});
