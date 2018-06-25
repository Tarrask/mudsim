export default function({ isHMR, app, store, req, route, params, error, redirect }) {
  if(isHMR) return;

  console.log('negociated locale:', req.locale);
  
  /* const defaultLocale = app.i18n..fallbackLocale;

  const locale = params.lang || defaultLocale;
  if(store.state.locales.indexOf(locale ) === -1) {
    return error({ message: 'This page could not be found.', statusCode: 404 });
  }

  store.commit('SET_LOCALE', locale);
  app.i18n.locale = store.state.locale;

  if(locale === defaultLocale && route.fullPath.indexOf('/' + defaultLocale) === 0) {
    const toReplace = '^/' + defualtLocale;
    const re = new RegExp(toReplace);
    return redirect(route.fullPath.replace(re, '/'));
  } */
}
