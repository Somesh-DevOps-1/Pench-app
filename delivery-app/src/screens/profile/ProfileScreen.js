import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert, Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from '../../store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { logout } from '../../store/slices/authSlice';
import { navigateToAuth, resetToRootScreen } from '../../navigation/navigationHelpers';
import { Colors } from '../../theme/colors';
import { clearStoredSession } from '../../utils/storage';
import { getRoleLabel } from '../../utils/auth';
import BrandLogo from '../../components/BrandLogo';

const MENU_ITEMS = [
  { icon: 'map-marker-outline', label: 'Manage Addresses', route: 'AddressPicker', section: 'account' },
  { icon: 'bell-outline', label: 'Notifications', route: null, section: 'account' },
  { icon: 'repeat', label: 'My Subscriptions', route: 'Subscriptions', section: 'account' },
  { icon: 'receipt', label: 'Order History', route: 'Orders', section: 'account' },
  { icon: 'headset', label: 'Help & Support', route: null, section: 'support' },
  { icon: 'phone', label: '+91 9657673411', route: null, phone: '+919657673411', section: 'support' },
  { icon: 'email-outline', label: 'info@penchfoods.com', route: null, section: 'support' },
  { icon: 'information-outline', label: 'About Pench Foods', route: null, section: 'about' },
  { icon: 'shield-check-outline', label: 'Privacy Policy', route: null, section: 'about' },
  { icon: 'file-document-outline', label: 'Terms of Service', route: null, section: 'about' },
];

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { user, isLoggedIn } = useSelector(state => state.auth);
  const { mySubscriptions } = useSelector(state => state.subscription);
  const { orders } = useSelector(state => state.orders);

  const ratedOrders = orders.filter(order => order.rated);
  const avgRating = ratedOrders.length
    ? (ratedOrders.reduce((sum, order) => sum + order.userRating, 0) / ratedOrders.length).toFixed(1)
    : '-';
  const activeSubscriptions = mySubscriptions.filter(subscription => subscription.status === 'active').length;

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearStoredSession();
          } finally {
            dispatch(logout());
            resetToRootScreen(navigation, 'Auth');
          }
        },
      },
    ]);
  };

  const handleMenuPress = (item) => {
    if (item.phone) {
      Linking.openURL(`tel:${item.phone}`);
      return;
    }

    if (item.tabRoute && item.route) {
      navigation.navigate('Main', { screen: item.route });
      return;
    }

    if (item.route) {
      navigation.navigate(item.route);
      return;
    }

    Alert.alert('Coming Soon', 'This feature will be available soon!');
  };

  const sections = [
    { key: 'account', title: 'My Account', items: MENU_ITEMS.filter(item => item.section === 'account') },
    { key: 'support', title: 'Support', items: MENU_ITEMS.filter(item => item.section === 'support') },
    { key: 'about', title: 'About', items: MENU_ITEMS.filter(item => item.section === 'about') },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        decelerationRate="normal"
        bounces
        overScrollMode="always"
      >
        <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={styles.profileHeader}>
          <BrandLogo width={150} height={70} framed style={styles.profileLogo} />
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>
              {(user?.name || 'G').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
          <Text style={styles.userPhone}>+91 {user?.phone || '-'}</Text>
          {user?.role ? <Text style={styles.userMeta}>{getRoleLabel(user.role)}</Text> : null}
          {user?.email ? <Text style={styles.userEmail}>{user.email}</Text> : null}
          {user?.address?.shortAddress ? (
            <Text style={styles.userEmail}>{user.address.shortAddress}</Text>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{orders.length}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{activeSubscriptions}</Text>
              <Text style={styles.statLabel}>Active Subs</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{avgRating}</Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>
          </View>

          {!isLoggedIn && (
            <TouchableOpacity
              style={styles.loginCta}
              onPress={() => navigateToAuth(navigation)}
            >
              <Text style={styles.loginCtaText}>Login / Sign Up</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>

        <View style={styles.quickActions}>
          {[
                { icon: 'repeat', label: 'Subscribe', color: Colors.primary, route: 'Subscriptions' },
                { icon: 'receipt', label: 'Orders', color: '#1565C0', route: 'Orders' },
                { icon: 'map-marker', label: 'Address', color: '#E65100', route: 'AddressPicker' },
                { icon: 'headset', label: 'Support', color: '#6A1B9A', route: null },
              ].map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickAction}
              onPress={() => (action.route ? navigation.navigate(action.route) : null)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}18` }]}>
                <MaterialCommunityIcons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.brandCard} onPress={() => Linking.openURL('https://penchfoods.com')}>
          <BrandLogo width={92} height={42} />
          <View style={{ flex: 1 }}>
            <Text style={styles.brandCardTitle}>Pench Foods</Text>
            <Text style={styles.brandCardSub}>
              Pure A2 Milk | Nagpur, Maharashtra
            </Text>
            <Text style={styles.brandCardSub}>
              Shop No 1 & 2, Telangkhedi, Ram Nagar
            </Text>
          </View>
          <MaterialCommunityIcons name="open-in-new" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        {sections.map(section => (
          <View key={section.key} style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.menuRow, index < section.items.length - 1 && styles.menuRowBorder]}
                  onPress={() => handleMenuPress(item)}
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

        <Text style={styles.version}>Pench Foods App v1.0.0</Text>

        {isLoggedIn && (
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={20} color={Colors.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  profileHeader: { padding: 24, paddingTop: 24, alignItems: 'center' },
  profileLogo: { marginBottom: 16 },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: { fontSize: 32, fontWeight: '900', color: '#fff' },
  userName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  userPhone: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  userMeta: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
  },
  userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    marginTop: 20,
    padding: 16,
    width: '100%',
  },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '900', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.25)' },
  loginCta: {
    marginTop: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 12,
  },
  loginCtaText: { color: Colors.primary, fontWeight: '800', fontSize: 15 },
  quickActions: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 16 },
  quickAction: { flex: 1, alignItems: 'center', gap: 6 },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  brandCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  brandCardTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  brandCardSub: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  menuSection: { paddingHorizontal: 16, marginBottom: 8 },
  menuSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 8,
  },
  menuCard: { backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  version: { textAlign: 'center', color: Colors.textMuted, fontSize: 12, marginVertical: 16 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  logoutText: { color: Colors.error, fontWeight: '700', fontSize: 16 },
});

