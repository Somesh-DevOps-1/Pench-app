const fs = require('fs');
const baseConfig = require('./app.json');

const variant = process.env.EXPO_PUBLIC_APP_VARIANT || 'customer';
const isDelivery = variant === 'delivery';
const isProduction = process.env.NODE_ENV === 'production' || process.env.EXPO_PUBLIC_ENV === 'production';
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
const androidPackage = isDelivery ? 'com.penchfoods.deliveryapp' : baseConfig.expo.android.package;
const googleServicesFile = isDelivery
  ? process.env.EXPO_PUBLIC_DELIVERY_GOOGLE_SERVICES_FILE || './delivery-app/google-services.json'
  : process.env.EXPO_PUBLIC_GOOGLE_SERVICES_FILE || './google-services.json';
const hasMatchingGoogleServicesClient = (filePath, packageName) => {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  try {
    const googleServices = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return (googleServices.client || []).some(
      (client) => client?.client_info?.android_client_info?.package_name === packageName
    );
  } catch {
    return false;
  }
};
const androidGoogleServicesConfig = hasMatchingGoogleServicesClient(
  googleServicesFile,
  androidPackage
)
  ? { googleServicesFile }
  : {};

module.exports = {
  expo: {
    ...baseConfig.expo,
    name: isDelivery ? 'Pench Delivery' : baseConfig.expo.name,
    slug: isDelivery ? 'pench-delivery' : baseConfig.expo.slug,
    scheme: isDelivery ? 'penchdelivery' : baseConfig.expo.scheme,
    android: {
      ...baseConfig.expo.android,
      package: androidPackage,
      usesCleartextTraffic: !isProduction || apiBaseUrl.startsWith('http://'),
      ...androidGoogleServicesConfig,
    },
    ios: {
      ...baseConfig.expo.ios,
      bundleIdentifier: isDelivery
        ? 'com.penchfoods.deliveryapp'
        : baseConfig.expo.ios.bundleIdentifier,
    },
    extra: {
      ...(baseConfig.expo.extra || {}),
      appVariant: variant,
      apiBaseUrl,
      mapProvider: process.env.EXPO_PUBLIC_MAP_PROVIDER || 'osm',
      ...(isDelivery
        ? (process.env.EXPO_PUBLIC_DELIVERY_EAS_PROJECT_ID
            ? {
                eas: {
                  projectId: process.env.EXPO_PUBLIC_DELIVERY_EAS_PROJECT_ID,
                },
              }
            : {})
        : {
            eas: {
              projectId:
                process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
                'b6b6e356-e5e6-40f0-93af-3b33b4f3553d',
            },
          }),
    },
  },
};
