import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert, Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from '../../src/store';
import { logout } from '../../src/store/slices/authSlice';
import { Colors } from '../../src/theme/colors';
import { DELIVERY_ASSIGNMENTS } from '../data/deliveryData';
import { clearStoredSession } from '../../src/utils/storage';
import DeliveryBrandLogo from '../components/DeliveryBrandLogo';

export default function DeliveryProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { user } = useSelector(state => state.auth);
  const { orders } = useSelector(state => state.orders);

  const deliveredTrips = DELIVERY_ASSIGNMENTS.filter(a => a.status === 'delivered').length;
  const collectedBottles = DELIVERY_ASSIGNMENTS.reduce((sum, a) => sum + (a.bottlesCollected || 0), 0);
  const ratedOrders = orders.filter(order => order.rated);
  const avgRating = ratedOrders.length
    ? (ratedOrders.reduce((sum, order) => sum + order.userRating, 0) / ratedOrders.length).toFixed(1)
    : '4.9';

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await clearStoredSession();
          dispatch(logout());
        },
      },
    ]);
  };

  const sections = [
    {
      title: 'My Work',
      items: [
        { icon: 'truck-delivery', label: 'My Deliveries', route: 'DeliveryDeliveries' },
        { icon: 'bottle-tonic-outline', label: 'Bottle Collections', route: 'DeliveryBottles' },
        { icon: 'map-marker-radius', label: 'Live Delivery Run', route: 'OrderTracking' },
      ],
    },
    {
      title: 'Partner Settings',
      items: [
        { icon: 'map-marker-path', label: 'Service Zone', route: null },
        { icon: 'calendar-clock', label: 'Shift Preferences', route: null },
        { icon: 'file-document-outline', label: 'My Documents (KYC)', route: null },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: 'headset', label: 'Help & Support', route: null },
        { icon: 'phone', label: '+91 9657673411', phone: '+919657673411' },
        { icon: 'email-outline', label: 'info@penchfoods.com', route: null },
      ],
    },
  ];

  const handlePress = (item) => {
    if (item.phone) {
      Linking.openURL(`tel:${item.phone}`);
      return;
    }

    if (item.route) {
      navigation.navigate(item.route);
      return;
    }

    Alert.alert('Coming Soon', 'This feature will be available soon!');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.deliveryDark} />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        alwaysBounceVertical
        scrollEventThrottle={16}
        decelerationRate="fast"
        bounces
        overScrollMode="always"
        contentContainerStyle={{ paddingBottom: 132 + insets.bottom }}
      >
        <LinearGradient colors={[Colors.deliveryDark, Colors.deliveryDarkAlt]} style={styles.profileHeader}>
          <DeliveryBrandLogo compact light />
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{(user?.name || 'D').charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Delivery Partner'}</Text>
          <Text style={styles.userPhone}>+91 {user?.phone || '-'}</Text>
          <Text style={styles.userMeta}>Delivery Partner</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{deliveredTrips}</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{collectedBottles}</Text>
              <Text style={styles.statLabel}>Bottles</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{avgRating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.quickActions}>
          {[
            { icon: 'bike-fast', label: 'Live Run', color: Colors.primary, route: 'OrderTracking' },
            { icon: 'bottle-tonic-outline', label: 'Bottles', color: '#1565C0', route: 'DeliveryBottles' },
            { icon: 'truck-delivery', label: 'Deliveries', color: '#E65100', route: 'DeliveryDeliveries' },
            { icon: 'headset', label: 'Support', color: '#6A1B9A', route: null },
          ].map((action, index) => (
            <TouchableOpacity key={index} style={styles.quickAction} onPress={() => handlePress(action)}>
              <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}18` }]}>
                <MaterialCommunityIcons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.brandCard}>
          <DeliveryBrandLogo compact />
          <View style={{ flex: 1 }}>
            <Text style={styles.brandCardTitle}>Pench Partner Hub</Text>
            <Text style={styles.brandCardSub}>Morning delivery operations | Nagpur</Text>
          </View>
        </View>

        {sections.map(section => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.menuRow, index < section.items.length - 1 && styles.menuRowBorder]}
                  onPress={() => handlePress(item)}
                >
                  <View style={styles.menuIconBox}>
                    <MaterialCommunityIcons name={item.icon} size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  profileHeader: { padding: 24, paddingTop: 24, alignItems: 'center' },
  avatarWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center', marginTop: 18, marginBottom: 12,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: { fontSize: 32, fontWeight: '900', color: '#fff' },
  userName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  userPhone: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  userMeta: {
    marginTop: 8, backgroundColor: 'rgba(255,255,255,0.18)', color: '#fff',
    fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999, overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16, marginTop: 20, padding: 16, width: '100%',
  },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '900', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.25)' },
  quickActions: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 16 },
  quickAction: { flex: 1, alignItems: 'center', gap: 6 },
  quickActionIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  brandCard: {
    marginHorizontal: 16, marginBottom: 8, backgroundColor: Colors.surface,
    borderRadius: 16, padding: 16, flexDirection: 'row',
    alignItems: 'center', gap: 12, borderWidth: 1, borderColor: Colors.border,
  },
  brandCardTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  brandCardSub: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  menuSection: { paddingHorizontal: 16, marginBottom: 8 },
  menuSectionTitle: {
    fontSize: 12, fontWeight: '700', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 8,
  },
  menuCard: { backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  menuIconBox: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.successLight,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    margin: 16, paddingVertical: 16, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.error, backgroundColor: Colors.errorLight,
  },
  logoutText: { color: Colors.error, fontWeight: '700', fontSize: 16 },
});
