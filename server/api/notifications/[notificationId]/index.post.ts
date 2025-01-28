import { z } from "zod";

const notificationSchema = z.object({
  action: z.union([z.literal("mark-as-read"), z.literal("mark-as-unread")]),
});

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const body = await readValidatedBody(event, (b) =>
    notificationSchema.safeParse(b),
  );

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid request body",
    });
  }

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

  if (body.data.action === "mark-as-read") {
    await prisma.notification.update({
      data: {
        read: true,
      },
      where: {
        id: notification.id,
      },
    });
  } else if (body.data.action === "mark-as-unread") {
    await prisma.notification.update({
      data: {
        read: false,
      },
      where: {
        id: notification.id,
      },
    });
  }

  return {
    notification,
  };
});
