const routerBase = process.env.DEPLOY_ENV === 'GH_PAGES' ? {
  router: {
    base: '/mudsim/'
  }
} : {}

module.exports = {
  plugins: [{ src: '~/plugins/pixi', ssr: false }],
  ...routerBase
};
