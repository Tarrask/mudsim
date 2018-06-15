const routerBase = process.env.DEPLOY_ENV === 'GH_PAGES' ? {
  router: {
    base: '/mudsim/'
  }
} : {}

module.exports = {
  plugins: [{ src: '~/plugins/pixi', ssr: false }],
  modules: ['@nuxtjs/google-analytics'],
  'google-analytics': {
    id: 'UA-120939411-1'
  },
  ...routerBase
};
