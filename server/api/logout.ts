export default defineEventHandler((event) => {
  deleteCookie(event, 'auth_token')
  return {
    status: 200,
    message: 'Logged out successfully'
  }
})