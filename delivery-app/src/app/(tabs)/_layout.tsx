import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from '../../store';
import { selectCartCount } from '../../store/slices/cartSlice';
import { Colors } from '../../theme/colors';

export default function TabsLayout() {
  const cartCount = useSelector(selectCartCount);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.primary,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 10,
          height: 72,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 14,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
          tabBarBadge: cartCount > 0 ? (cartCount > 9 ? '9+' : cartCount) : undefined,
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="magnify" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="subscriptions"
        options={{
          title: 'Subscribe',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="repeat" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="receipt" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
