import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Linking, Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/theme/colors';
import { DELIVERY_ASSIGNMENTS } from '../data/deliveryData';
import DeliveryBrandLogo from '../components/DeliveryBrandLogo';

const { width } = Dimensions.get('window');

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'Active' },
  { key: 'delivered', label: 'Done' },
];

function getStatusColor(status) {
  if (status === 'delivered') return Colors.success;
  if (status === 'in_progress') return Colors.deliveryAccent;
  return Colors.deliveryWarn;
}

function getStatusLabel(status) {
  if (status === 'delivered') return 'Delivered';
  if (status === 'in_progress') return 'In Progress';
  return 'Pending';
}

export default function MyDeliveriesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? DELIVERY_ASSIGNMENTS
    : DELIVERY_ASSIGNMENTS.filter(a => a.status === filter);

  const pendingCount = DELIVERY_ASSIGNMENTS.filter(a => a.status === 'pending').length;
  const activeCount = DELIVERY_ASSIGNMENTS.filter(a => a.status === 'in_progress').length;
  const doneCount = DELIVERY_ASSIGNMENTS.filter(a => a.status === 'delivered').length;
  const bottlesDue = DELIVERY_ASSIGNMENTS.reduce((sum, a) => sum + (a.bottlesDue || 0), 0);
  const bottlesCollected = DELIVERY_ASSIGNMENTS.reduce((sum, a) => sum + (a.bottlesCollected || 0), 0);
  const brokenBottles = DELIVERY_ASSIGNMENTS.reduce((sum, a) => sum + (a.brokenBottles || 0), 0);

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
        <LinearGradient colors={[Colors.deliveryDark, Colors.deliveryDarkAlt]} style={styles.topSection}>
          <DeliveryBrandLogo compact light />
          <Text style={styles.screenTitle}>My Deliveries</Text>
          <Text style={styles.screenSub}>Today's assignments</Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>{pendingCount + activeCount}</Text>
              <Text style={styles.summaryLabel}>Remaining</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>{doneCount}</Text>
              <Text style={styles.summaryLabel}>Completed</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: Colors.deliveryAccent }]}>{bottlesCollected}</Text>
              <Text style={styles.summaryLabel}>Bottles</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.filterRow}>
          {FILTER_TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterTab, filter === tab.key && styles.filterTabActive]}
              onPress={() => setFilter(tab.key)}
            >
              <Text style={[styles.filterTabText, filter === tab.key && styles.filterTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.contentPad}>
        <View style={styles.bottlePanel}>
          <View style={styles.bottlePanelHeader}>
            <MaterialCommunityIcons name="bottle-tonic-outline" size={20} color={Colors.deliveryDark} />
            <Text style={styles.bottlePanelTitle}>Glass bottle returns</Text>
          </View>
          <View style={styles.bottlePanelStats}>
            <View style={styles.bottlePanelStat}>
              <Text style={styles.bottlePanelNum}>{bottlesDue}</Text>
              <Text style={styles.bottlePanelLabel}>Due</Text>
            </View>
            <View style={styles.bottlePanelStat}>
              <Text style={[styles.bottlePanelNum, { color: Colors.success }]}>{bottlesCollected}</Text>
              <Text style={styles.bottlePanelLabel}>Collected</Text>
            </View>
            <View style={styles.bottlePanelStat}>
              <Text style={[styles.bottlePanelNum, { color: Colors.error }]}>{brokenBottles}</Text>
              <Text style={styles.bottlePanelLabel}>Broken</Text>
            </View>
          </View>
        </View>

        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="package-variant" size={56} color={Colors.border} />
            <Text style={styles.emptyTitle}>No deliveries found</Text>
            <Text style={styles.emptySub}>No deliveries match this filter</Text>
          </View>
        ) : (
          filtered.map(assignment => {
            const statusColor = getStatusColor(assignment.status);
            const isDone = assignment.status === 'delivered';
            return (
              <TouchableOpacity
                key={assignment.id}
                style={[styles.deliveryCard, isDone && styles.deliveryCardDone]}
                activeOpacity={0.88}
                onPress={() => {
                  if (!isDone && navigation) {
                    navigation.navigate('OrderTracking', { assignment });
                  }
                }}
              >
                {/* Status Badge */}
                <View style={styles.cardTop}>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {getStatusLabel(assignment.status)}
                    </Text>
                  </View>
                  <Text style={styles.slotText}>{assignment.slot}</Text>
                </View>

                {/* Customer Info */}
                <View style={styles.customerRow}>
                  <View style={styles.customerAvatar}>
                    <Text style={styles.customerAvatarText}>
                      {assignment.customer.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.customerName}>{assignment.customer.name}</Text>
                    <Text style={styles.customerAddress} numberOfLines={1}>
                      {assignment.customer.address}
                    </Text>
                  </View>
                  {!isDone && (
                    <TouchableOpacity
                      style={styles.callBtn}
                      onPress={() => Linking.openURL(`tel:${assignment.customer.phone}`)}
                    >
                      <MaterialCommunityIcons name="phone" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Items */}
                <View style={styles.cardBottom}>
                  <View style={styles.itemsInfo}>
                    <MaterialCommunityIcons name="package-variant-closed" size={16} color={Colors.textMuted} />
                    <Text style={styles.itemsText}>
                      {assignment.itemCount} item{assignment.itemCount > 1 ? 's' : ''} · {assignment.distance}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textMuted} />
                </View>

                <View style={styles.bottleRow}>
                  <View style={styles.bottleMetric}>
                    <MaterialCommunityIcons name="bottle-tonic-outline" size={15} color={Colors.textMuted} />
                    <Text style={styles.bottleMetricText}>Due {assignment.bottlesDue || 0}</Text>
                  </View>
                  <View style={styles.bottleMetric}>
                    <MaterialCommunityIcons name="check-circle-outline" size={15} color={Colors.success} />
                    <Text style={styles.bottleMetricText}>Collected {assignment.bottlesCollected || 0}</Text>
                  </View>
                  <View style={styles.bottleMetric}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={15} color={Colors.error} />
                    <Text style={styles.bottleMetricText}>Broken {assignment.brokenBottles || 0}</Text>
                  </View>
                </View>

                {/* OTP for active delivery */}
                {assignment.status === 'in_progress' && (
                  <View style={styles.otpRow}>
                    <MaterialCommunityIcons name="shield-key-outline" size={16} color={Colors.deliveryAccent} />
                    <Text style={styles.otpLabel}>Delivery OTP:</Text>
                    <Text style={styles.otpValue}>{assignment.otp}</Text>
                  </View>
                )}

                {/* Delivered time */}
                {isDone && assignment.deliveredAt && (
                  <View style={styles.deliveredRow}>
                    <MaterialCommunityIcons name="check-circle" size={14} color={Colors.success} />
                    <Text style={styles.deliveredText}>Delivered at {assignment.deliveredAt}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  contentPad: { paddingHorizontal: 16 },
  topSection: { paddingHorizontal: 16, paddingBottom: 18 },
  screenTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginTop: 12 },
  screenSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  summaryRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16,
    marginTop: 16, padding: 16,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryNum: { fontSize: 22, fontWeight: '900', color: '#fff' },
  summaryLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 3 },
  summaryDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.15)' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
  filterTabActive: { backgroundColor: Colors.deliveryDark, borderColor: Colors.deliveryDark },
  filterTabText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  filterTabTextActive: { color: '#fff' },
  bottlePanel: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  bottlePanelHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  bottlePanelTitle: { fontSize: 15, fontWeight: '900', color: Colors.textPrimary },
  bottlePanelStats: { flexDirection: 'row', gap: 10 },
  bottlePanelStat: { flex: 1, backgroundColor: Colors.surfaceElevated, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  bottlePanelNum: { fontSize: 20, fontWeight: '900', color: Colors.textPrimary },
  bottlePanelLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, marginTop: 2 },
  deliveryCard: {
    backgroundColor: Colors.surface, borderRadius: 18, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  deliveryCardDone: { opacity: 0.7 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '800' },
  slotText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  customerAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.deliveryDark, alignItems: 'center', justifyContent: 'center',
  },
  customerAvatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  customerName: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  customerAddress: { fontSize: 12, color: Colors.textMuted, marginTop: 2, maxWidth: width * 0.5 },
  callBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.successLight,
    alignItems: 'center', justifyContent: 'center',
  },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemsInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemsText: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  bottleRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  bottleMetric: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surfaceElevated, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5,
  },
  bottleMetricText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  otpRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  otpLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  otpValue: { fontSize: 16, fontWeight: '900', color: Colors.deliveryDark, letterSpacing: 3 },
  deliveredRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  deliveredText: { fontSize: 12, color: Colors.success, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  emptySub: { fontSize: 13, color: Colors.textMuted },
});
