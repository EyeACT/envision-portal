// import { faker } from "@faker-js/faker";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  // dev - add some notifications to the database
  // await prisma.notification.create({
  //   data: {
  //     title: faker.commerce.productName(),
  //     body: faker.lorem.sentence(),
  //     read: false,
  //     type: faker.helpers.arrayElement(["info", "success", "warning", "error"]),
  //     url: faker.internet.url(),
  //     userId,
  //   },
  // });

  const notifications = await prisma.notification.findMany({
    orderBy: {
      created: "desc",
    },
    where: {
      userId,
    },
  });

  const unreadNotifications = notifications.filter(
    (notification) => !notification.read,
  );
  const allNotifications = notifications.filter(
    (notification) => notification.read,
  );

  return {
    allNotifications,
    unreadNotifications,
  };
});
