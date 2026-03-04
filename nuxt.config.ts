// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-30',
  devtools: { enabled: true },
  modules: ['nuxt-quasar-ui', '@vueuse/nuxt', '@pinia/nuxt', 'nuxt-auth-utils'],
  quasar: {
    plugins: [
      'Notify',
      'Dialog',
      'Loading',
      'Screen'
    ],
    extras: {
      font: 'roboto-font',
      fontIcons: ['material-icons'],
    },
    config: {
      brand: {
        primary: '#1976D2',
        secondary: '#26A69A',
        accent: '#9C27B0',
        positive: '#21BA45',
        negative: '#C10015',
        info: '#31CCEC',
        warning: '#F2C037'
      }
    }
  },
  ssr: true,
  nitro: {
    preset: 'cloudflare-pages',
    compatibilityDate: '2025-01-30',
    experimental: {
      tasks: true
    }
  },
  runtimeConfig: {
    spreadsheetId: '',
    username: '',
    password: '',
    public: {
      spreadsheetId: ''
    }
  }
})