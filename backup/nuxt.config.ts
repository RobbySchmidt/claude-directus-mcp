import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: ['~/assets/css/tailwind.css'],

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  modules: ['shadcn-nuxt'],

  shadcn: {
    prefix: '',
    componentDir: '@/components/ui',
  },

  runtimeConfig: {
    directusToken: '',
    public: {
      directusUrl: '',
      siteName: 'Alpenpfad',
      siteUrl: 'https://alpenpfad.example.com',
    },
  },
})