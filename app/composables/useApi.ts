import { useAuthStore } from "~/stores/auth"

export const useApi = () => {
  const auth = useAuthStore()

  // Wrapper around $fetch
  const request = async <T>(url: string, options: any = {}) => {
    const defaults = {
      baseURL: '/api', // Points to our local Nuxt server
      headers: {},
      onResponseError(ctx: any = {}) {
        const { response } = ctx
        // Only check status if response actually exists (it won't on network errors)
        if (response && response.status === 401) {
          auth.logout()
        }
      }
    }

    const params = { ...defaults, ...options }

    return await $fetch<T>(url, params)
  }

  return {
    get: <T>(url: string) => request<T>(url, { method: 'GET' }),
    post: <T>(url: string, body: any) => request<T>(url, { method: 'POST', body }),
    put: <T>(url: string, body: any) => request<T>(url, { method: 'PUT', body }),
    delete: <T>(url: string) => request<T>(url, { method: 'DELETE' })
  }
}