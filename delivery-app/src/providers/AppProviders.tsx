import React, { useEffect, useState } from 'react';
import { AppState, Platform, Alert } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

/**
 * Request foreground location permission when the app launches.
 * This shows the native OS permission dialog (Allow / Don't Allow).
 * On web, uses the browser Geolocation API.
 */
async function requestLocationPermissionOnLaunch() {
  try {
    if (Platform.OS === 'web') {
      if (navigator?.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => {}, // granted — no action needed, AddressPicker handles it
          () => {}, // denied — silently ignore
          { timeout: 5000 },
        );
      }
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status === 'denied') {
      Alert.alert(
        'Location Access',
        'Pench Foods uses your location to detect your nearest delivery zone across Maharashtra. You can enable it anytime in Settings.',
        [{ text: 'OK' }],
      );
    }
  } catch (_) {
    // Silently ignore — permissions are re-requested in AddressPicker if needed
  }
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnReconnect: true,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    // Request location permission immediately on launch
    requestLocationPermissionOnLaunch();
    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
