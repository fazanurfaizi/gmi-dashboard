import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any | null,
    loading: false
  }),

  getters: {
    isLoggedIn: (state) => !!state.user
  },

  actions: {
    async login(credentials: any) {
      const api = useApi()
      this.loading = true
      try {
        const res: any = await api.post('auth/login', credentials)
        this.user = res.data
        const router = useRouter()
        router.push('/')
        return true
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchUser() {
      const api = useApi()
      try {
        const data = await api.get('auth/me')
        this.user = data
      } catch (error) {
        this.user = null
      }
    },

    async logout() {
      const api = useApi()
      try {
        await api.post('auth/logout', {})
      } catch (e) {
        // ignore error
      } finally {
        this.user = null
        const router = useRouter()
        router.push('/login')
      }
    },

    getCompanies() {
      // Mock helper for your existing dashboard code
      if (this.user?.companies === 'all') return ['Company A', 'Company B']
      return []
    }
  }
})