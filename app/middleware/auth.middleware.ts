export default defineNuxtRouteMiddleware((to, from) => {
  const token = useCookie('cms_auth_token')

  if (to.path.startsWith('/cms') && !token.value) {
    return navigateTo('/auth/login')
  }

  if (to.path === '/auth/login' && token.value) {
    return navigateTo('/cms')
  }
})