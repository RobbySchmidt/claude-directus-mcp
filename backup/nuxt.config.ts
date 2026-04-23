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

  modules: ['shadcn-nuxt', '@nuxtjs/i18n'],

  shadcn: {
    prefix: '',
    componentDir: '@/components/ui',
  },

  i18n: {
    strategy: 'prefix',
    defaultLocale: 'de',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      cookieSecure: true,
      redirectOn: 'root',
      fallbackLocale: 'de',
    },
    locales: [
      { code: 'de', iso: 'de-DE', language: 'de-DE', name: 'Deutsch', file: 'de.json' },
      { code: 'en', iso: 'en-US', language: 'en-US', name: 'English', file: 'en.json' },
    ],
    lazy: true,
    restructureDir: false,
    langDir: 'locales/',
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL ?? 'https://alpenpfad.example.com',
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