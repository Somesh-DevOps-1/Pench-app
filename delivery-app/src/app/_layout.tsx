import React from 'react';
import { Stack } from 'expo-router';
import { AppProviders } from '../providers/AppProviders';

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="product/[productId]" />
        <Stack.Screen name="cart" options={{ presentation: 'modal' }} />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="order-tracking" />
        <Stack.Screen name="address-picker" />
      </Stack>
    </AppProviders>
  );
}
