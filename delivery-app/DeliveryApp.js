import React, { useEffect, useMemo, useState } from 'react';
import { Animated, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { registerRootComponent } from 'expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppProviders } from '../src/providers/AppProviders';
import { useSelector } from '../src/store';
import { Colors } from '../src/theme/colors';
import DeliveryDashboardScreen from './screens/DeliveryDashboardScreen';
import MyDeliveriesScreen from './screens/MyDeliveriesScreen';
import BottleCollectionsScreen from './screens/BottleCollectionsScreen';
import DeliveryProfileScreen from './screens/DeliveryProfileScreen';
import DeliveryLoginScreen from './screens/DeliveryLoginScreen';
import DeliverySplashScreen from './screens/DeliverySplashScreen';
import OrderTrackingScreen from '../src/screens/orders/OrderTrackingScreen';

const DELIVERY_TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'view-dashboard', screen: DeliveryDashboardScreen },
  { key: 'deliveries', label: 'Deliveries', icon: 'truck-delivery', screen: MyDeliveriesScreen },
  { key: 'bottles', label: 'Bottles', icon: 'bottle-tonic-outline', screen: BottleCollectionsScreen },
  { key: 'profile', label: 'Profile', icon: 'account-hard-hat', screen: DeliveryProfileScreen },
];

function createDeliveryNavigation(setRoute) {
  return {
    navigate: (name, params) => {
      if (name === 'DeliveryMain') {
        const screen = params?.screen;
        if (screen === 'my-deliveries' || screen === 'DeliveryDeliveries') setRoute('deliveries');
        else if (screen === 'bottle-collections' || screen === 'DeliveryBottles') setRoute('bottles');
        else if (screen === 'profile' || screen === 'DeliveryProfile') setRoute('profile');
        else setRoute('dashboard');
        return;
      }

      if (name === 'DeliveryDeliveries' || name === 'my-deliveries') setRoute('deliveries');
      else if (name === 'DeliveryBottles' || name === 'bottle-collections') setRoute('bottles');
      else if (name === 'DeliveryProfile' || name === 'Profile') setRoute('profile');
      else if (name === 'OrderTracking') setRoute('tracking');
      else setRoute('dashboard');
    },
    push: (name, params) => createDeliveryNavigation(setRoute).navigate(name, params),
    replace: (name, params) => createDeliveryNavigation(setRoute).navigate(name, params),
    goBack: () => setRoute('dashboard'),
    getParent: () => createDeliveryNavigation(setRoute),
  };
}

function DeliveryShell() {
  const isLoggedIn = useSelector(state => state.auth.isLoggedIn);
  const [isBooting, setIsBooting] = useState(true);
  const [route, setRoute] = useState('dashboard');
  const [routeParams, setRouteParams] = useState({});
  const insets = useSafeAreaInsets();

  const navigation = useMemo(() => ({
    ...createDeliveryNavigation(setRoute),
    navigate: (name, params) => {
      setRouteParams(params || {});
      createDeliveryNavigation(setRoute).navigate(name, params);
    },
    push: (name, params) => {
      setRouteParams(params || {});
      createDeliveryNavigation(setRoute).navigate(name, params);
    },
    replace: (name, params) => {
      setRouteParams(params || {});
      createDeliveryNavigation(setRoute).navigate(name, params);
    },
    goBack: () => {
      setRouteParams({});
      setRoute('dashboard');
    },
  }), []);

  useEffect(() => {
    if (!isLoggedIn) {
      setRoute('dashboard');
    }
  }, [isLoggedIn]);

  if (isBooting) {
    return <DeliverySplashScreen onFinish={() => setIsBooting(false)} />;
  }

  if (!isLoggedIn) {
    return <DeliveryLoginScreen navigation={navigation} />;
  }

  const activeTab = DELIVERY_TABS.find(tab => tab.key === route) || DELIVERY_TABS[0];
  const ActiveScreen = route === 'tracking' ? OrderTrackingScreen : activeTab.screen;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActiveScreen navigation={navigation} route={{ params: routeParams }} />
      </View>

      {route !== 'tracking' && (
        <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 10), height: 74 + Math.max(insets.bottom, 10) }]}>
          {DELIVERY_TABS.map(tab => {
            const active = tab.key === route;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, active && styles.tabItemActive]}
                onPress={() => {
                  setRouteParams({});
                  setRoute(tab.key);
                }}
                activeOpacity={0.85}
              >
                <Animated.View style={[styles.tabIconWrap, active && styles.tabIconWrapActive]}>
                  <MaterialCommunityIcons
                    name={tab.icon}
                    size={23}
                    color={active ? Colors.deliveryDark : Colors.tabInactive}
                  />
                </Animated.View>
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

function DeliveryApp() {
  return (
    <AppProviders>
      <DeliveryShell />
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 9,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 14,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 16 },
  tabItemActive: { backgroundColor: Colors.successLight },
  tabIconWrap: {
    width: 34,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapActive: { backgroundColor: Colors.deliveryAccent },
  tabLabel: { fontSize: 10, fontWeight: '800', color: Colors.tabInactive },
  tabLabelActive: { color: Colors.deliveryDark },
});

registerRootComponent(DeliveryApp);
