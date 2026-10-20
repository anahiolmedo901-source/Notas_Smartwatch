// @ts-check
const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Declara la app como app de reloj Wear OS en el AndroidManifest.
 * Solo se aplica con WEAR_OS=1, así el mismo proyecto sigue instalándose en un teléfono
 * para desarrollo:
 *
 *   WEAR_OS=1 npx expo prebuild --platform android --clean
 *
 * @type {import('expo/config-plugins').ConfigPlugin}
 */
const withWearOS = (config) => {
  if (process.env.WEAR_OS !== '1') return config;

  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    // 1) El APK solo se instala en relojes.
    manifest['uses-feature'] = manifest['uses-feature'] ?? [];
    const hasWatchFeature = manifest['uses-feature'].some(
      (feature) => feature.$['android:name'] === 'android.hardware.type.watch',
    );
    if (!hasWatchFeature) {
      manifest['uses-feature'].push({
        $: { 'android:name': 'android.hardware.type.watch', 'android:required': 'true' },
      });
    }

    const application = manifest.application?.[0];
    if (application) {
      // 2) Librería de Wear OS (opcional en tiempo de ejecución).
      application['uses-library'] = application['uses-library'] ?? [];
      if (
        !application['uses-library'].some(
          (lib) => lib.$['android:name'] === 'com.google.android.wearable',
        )
      ) {
        application['uses-library'].push({
          $: { 'android:name': 'com.google.android.wearable', 'android:required': 'false' },
        });
      }

      // 3) La app funciona sin teléfono emparejado.
      application['meta-data'] = application['meta-data'] ?? [];
      if (
        !application['meta-data'].some(
          (meta) => meta.$['android:name'] === 'com.google.android.wearable.standalone',
        )
      ) {
        application['meta-data'].push({
          $: { 'android:name': 'com.google.android.wearable.standalone', 'android:value': 'true' },
        });
      }
    }

    return cfg;
  });
};

module.exports = withWearOS;
