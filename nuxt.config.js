const routerBase = process.env.DEPLOY_ENV === 'GH_PAGES' ? {
  router: {
    base: '/mudsim/'
  }
} : {}

module.exports = {
  head: {
    title: 'Mudsim - a bike riding in mud simulator',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'A bike riding in mud simulator. It let you see the movement of mud droplets when the bike accelerate.' },
      { name: 'theme-color', content: '#37382a' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },
  plugins: [{ src: '~/plugins/pixi', ssr: false }],
  modules: [
    ['@nuxtjs/google-analytics', { 
      id: 'UA-120939411-1',
      debug: {
        sendHitTask: process.env.NODE_ENV === 'production'
      } 
    }]
  ],
  ...routerBase
};
