import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const token = useCookie('cms_auth_token', {
    maxAge: 60 * 60 * 24 * 7
  })

  const isAuthenticated = computed(() => !!token.value)

  async function login(username: string, password: string) {
    try {
      const res = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { username, password }
      })
      
      if (res.token) {
        token.value = res.token
        return true
      }
      return false
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  function logout() {
    token.value = null
    const router = useRouter()
    router.push('/auth/login')
  }

  return { 
    token, 
    isAuthenticated, 
    login, 
    logout 
  }
})