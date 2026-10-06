export default defineNuxtRouteMiddleware((to, _from) => {
  const { loggedIn } = useUserSession();

  // todo: safe redirects whitelist
  if (!loggedIn.value) {
    return navigateTo(
      `/login${to ? "?redirect=" + encodeURIComponent(to.fullPath) : ""}`,
    );
  }
});
