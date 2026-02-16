import { useAuthStore } from "~/stores/auth"

export default defineNuxtRouteMiddleware(async (to, from) => {
  const auth = useAuthStore()

  // Skip middleware on login page
  if (to.path === '/login') return

  // Try to fetch user if not loaded (e.g. on page refresh)
  if (!auth.isLoggedIn) {
    await auth.fetchUser()
  }

  // If still not logged in, redirect to login
  if (!auth.isLoggedIn) {
    return navigateTo('/login')
  }
})