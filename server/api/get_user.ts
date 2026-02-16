export default defineEventHandler((event) => {
  const token = getCookie(event, 'auth_token')

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  // TODO: In a real app, verify the token or fetch session from SQLite here
  return {
    id: 1,
    username: 'admin',
    name: 'Administrator',
    role: 'admin',
    companies: 'all',
    profilePicture: 'https://cdn.quasar.dev/img/boy-avatar.png'
  }
})