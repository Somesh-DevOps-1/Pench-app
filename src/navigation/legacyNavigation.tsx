import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

type LegacyParams = Record<string, string | string[] | undefined>;

const TAB_ROUTE_MAP: Record<string, string> = {
  Home: '/(tabs)/home',
  Search: '/(tabs)/search',
  Subscriptions: '/(tabs)/subscriptions',
  Orders: '/(tabs)/orders',
  Profile: '/(tabs)/profile',
};

const STATIC_ROUTE_MAP: Record<string, string> = {
  Auth: '/(auth)/phone-login',
  Onboarding: '/onboarding',
  Cart: '/cart',
  Checkout: '/checkout',
  OrderTracking: '/order-tracking',
  AddressPicker: '/address-picker',
  PhoneLogin: '/(auth)/phone-login',
  ProfileSetup: '/(auth)/profile-setup',
};

function sanitizeParams(params?: Record<string, unknown>) {
  if (!params) {
    return undefined;
  }

  const nextParams: Record<string, string | string[]> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    nextParams[key] = Array.isArray(value)
      ? value.map(item => String(item))
      : String(value);
  });

  return nextParams;
}

function resolveHref(name: string, params?: Record<string, unknown>) {
  if (name === 'Main') {
    const screenName = typeof params?.screen === 'string' ? params.screen : 'Home';
    return TAB_ROUTE_MAP[screenName] || TAB_ROUTE_MAP.Home;
  }

  if (name === 'ProductDetail') {
    return {
      pathname: '/product/[productId]' as const,
      params: sanitizeParams({
        productId: params?.productId,
      }),
    };
  }

  if (name === 'OTP') {
    return {
      pathname: '/(auth)/otp' as const,
      params: sanitizeParams(params),
    };
  }

  if (name === 'ProfileSetup') {
    return {
      pathname: '/(auth)/profile-setup' as const,
      params: sanitizeParams(params),
    };
  }

  if (TAB_ROUTE_MAP[name]) {
    return TAB_ROUTE_MAP[name];
  }

  return STATIC_ROUTE_MAP[name] || TAB_ROUTE_MAP.Home;
}

function createNavigationProxy(expoRouter: ReturnType<typeof useRouter>) {
  const proxy = {
    navigate: (name: string, params?: Record<string, unknown>) => {
      expoRouter.push(resolveHref(name, params) as never);
    },
    push: (name: string, params?: Record<string, unknown>) => {
      expoRouter.push(resolveHref(name, params) as never);
    },
    replace: (name: string, params?: Record<string, unknown>) => {
      expoRouter.replace(resolveHref(name, params) as never);
    },
    goBack: () => {
      expoRouter.back();
    },
    getParent: () => proxy,
  };

  return proxy;
}

export function useLegacyScreenProps() {
  const expoRouter = useRouter();
  const params = useLocalSearchParams() as LegacyParams;
  const navigation = React.useMemo(() => createNavigationProxy(expoRouter), [expoRouter]);

  return React.useMemo(
    () => ({
      navigation,
      route: { params },
    }),
    [navigation, params],
  );
}

export function createLegacyRoute(ScreenComponent: React.ComponentType<any>) {
  return function LegacyRoute() {
    const props = useLegacyScreenProps();
    return <ScreenComponent {...props} />;
  };
}
