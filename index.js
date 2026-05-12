if (process.env.EXPO_PUBLIC_APP_VARIANT === 'delivery') {
  require('./delivery-app/DeliveryApp');
} else {
  require('expo-router/entry');
}
