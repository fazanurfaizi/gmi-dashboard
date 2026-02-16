export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // TODO: Replace this with your SQLite database check later
  // e.g. const user = await db.select().from(users).where(...)
  if (body.username === 'admin' && body.password === 'admin') {
    const user = {
      id: 1,
      username: 'admin',
      name: 'Administrator',
      role: 'admin',
      companies: 'all',
      profilePicture: 'https://cdn.quasar.dev/img/boy-avatar.png'
    }

    // Set a secure HTTP-only cookie
    // This cookie is automatically sent with every request to the server
    setCookie(event, 'auth_token', 'mock-jwt-token-or-session-id', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    })

    return {
      status: 200,
      message: 'Login success',
      data: user
    }
  }

  throw createError({
    statusCode: 401,
    statusMessage: 'Invalid username or password'
  })
})