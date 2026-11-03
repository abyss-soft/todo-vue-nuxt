// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  modules: ['@pinia/nuxt'],
  css: ['~/assets/scss/main.scss'],
  typescript: {
    strict: true,
    typeCheck: true,
  },
  app: {
    head: {
      title: 'Мои заметки',
      meta: [
        { name: 'description', content: 'Простой список заметок и дел' },
        { name: 'theme-color', content: '#f7f7f5' },
      ],
    },
  },
  compatibilityDate: '2025-06-01',
})

