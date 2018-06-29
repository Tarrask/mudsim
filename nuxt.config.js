
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
// const locale = require('locale');

const routerBase = process.env.DEPLOY_ENV === 'GH_PAGES' ? {
  base: '/mudsim/'
} : {}

module.exports = {
  head: {
    title: 'Mudsim - a bike riding in mud simulator',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'A bike riding in mud simulator. It let you see the movement of mud droplets when the bike accelerate.' },
      { name: 'theme-color', content: '#37382a' }
    ]
  },
  css: [
    '@/assets/styles/main.scss'
  ],
  build: {
    plugins: [
      new FaviconsWebpackPlugin('./art/wheel.svg')
    ]
  },
  plugins: [{ src: '~/plugins/pixi', ssr: false }, ], //'~/plugins/i18n'],
  modules: [
    ['@nuxtjs/google-analytics', { 
      id: 'UA-120939411-1',
      debug: {
        sendHitTask: process.env.NODE_ENV === 'production'
      } 
    }],
    ['nuxt-i18n', {
      locales: [
        { code: 'en', iso: 'en', name: 'English' },
        { code: 'fr', iso: 'fr', name: 'Français' },
        { code: 'de', iso: 'de', name: 'Deutch' }
      ],
      defaultLocale: 'en',
      strategy: 'prefix_except_default',
      rootRedirect: null,
      vueI18n: {
        messages: {
          en: require('./locales/en.json'),
          fr: require('./locales/fr.json'),
          de: require('./locales/de.json')
        }
      }
    }]
    /* ['@nuxtjs/pwa', {
      icon: false,
      manifest: false,
      meta: false
    }]*/
  ],
  router: {
    // middleware: 'i18n',
    ...routerBase
  }
};
