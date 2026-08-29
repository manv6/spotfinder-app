// Dynamic Expo config. Expo reads app.json first and hands it to us as `config`,
// so app.json stays the source of truth and we only override what depends on
// where the web build is being served from.
//
// The web export bakes asset URLs in at build time, so the base path can't be
// decided at runtime:
//   GitHub Pages -> served under /spotfinder-app  -> EXPO_BASE_URL=/spotfinder-app
//   Railway      -> served at the domain root     -> EXPO_BASE_URL unset
// Getting this wrong doesn't fail the build, it just 404s every asset.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    baseUrl: process.env.EXPO_BASE_URL ?? '',
  },
});
