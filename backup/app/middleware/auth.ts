export default defineNuxtRouteMiddleware((to) => {
  const { isLoggedIn } = useUser()
  if (!isLoggedIn.value) {
    return navigateTo(`/anmelden?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
