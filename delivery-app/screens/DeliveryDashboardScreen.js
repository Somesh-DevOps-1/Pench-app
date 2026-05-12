import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Linking, Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from '../../src/store';
import { updateProfile } from '../../src/store/slices/authSlice';
import { Colors } from '../../src/theme/colors';
import { PENCH_WAREHOUSE } from '../../src/data/mockData';
import { DELIVERY_ASSIGNMENTS } from '../data/deliveryData';
import DeliveryBrandLogo from '../components/DeliveryBrandLogo';

const { width } = Dimensions.get('window');

function getOpenStreetMapDirectionsUrl(origin, destination) {
  if (!origin || !destination) {
    return null;
  }

  const centerLatitude = ((origin.latitude || 0) + (destination.latitude || 0)) / 2;
  const centerLongitude = ((origin.longitude || 0) + (destination.longitude || 0)) / 2;

  return `https://www.openstreetmap.org/directions?engine=graphhopper_car&route=${origin.latitude},${origin.longitude};${destination.latitude},${destination.longitude}#map=15/${centerLatitude}/${centerLongitude}`;
}

function DeliveryStatCard({ icon, label, value, tone }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: tone }]}>
        <MaterialCommunityIcons name={icon} size={18} color="#fff" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DeliveryActionCard({ icon, label, sublabel, onPress, accent }) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.88}>
      <View style={[styles.actionIcon, { backgroundColor: accent }]}>
        <MaterialCommunityIcons name={icon} size={20} color="#fff" />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
      <Text style={styles.actionSub}>{sublabel}</Text>
    </TouchableOpacity>
  );
}

export default function DeliveryDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { liveOrder, orders } = useSelector(s => s.orders);

  const completedTrips = DELIVERY_ASSIGNMENTS.filter(a => a.status === 'delivered').length;
  const pendingDeliveries = DELIVERY_ASSIGNMENTS.filter(a => a.status === 'pending' || a.status === 'in_progress');
  const activeDelivery = DELIVERY_ASSIGNMENTS.find(a => a.status === 'in_progress');
  const bottlesToCollect = DELIVERY_ASSIGNMENTS.reduce((sum, a) => sum + (a.bottlesDue || 0), 0);
  const bottlesCollected = DELIVERY_ASSIGNMENTS.reduce((sum, a) => sum + (a.bottlesCollected || 0), 0);
  const brokenBottles = DELIVERY_ASSIGNMENTS.reduce((sum, a) => sum + (a.brokenBottles || 0), 0);
  const ratedOrders = orders.filter(order => order.userRating);
  const averageRating = ratedOrders.length
    ? (ratedOrders.reduce((sum, order) => sum + order.userRating, 0) / ratedOrders.length).toFixed(1)
    : '4.9';
  const isOnline = user?.isAvailable !== false;
  const activeDropAddress = activeDelivery?.customer?.address || liveOrder?.deliveryAddress || 'Customer location';
  const routeUrl = getOpenStreetMapDirectionsUrl(
    liveOrder?.route?.agentLocation || liveOrder?.route?.origin,
    liveOrder?.route?.destination,
  );

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
        <LinearGradient colors={[Colors.deliveryDark, Colors.deliveryDarkAlt]} style={styles.topShell}>
          <View style={styles.topRow}>
            <View>
              <DeliveryBrandLogo compact light />
              <Text style={styles.partnerName}>{user?.name || 'Partner'}</Text>
              <Text style={styles.partnerSub}>Nagpur morning shift</Text>
            </View>
            <TouchableOpacity
              style={[styles.onlinePill, isOnline ? styles.onlinePillActive : styles.onlinePillInactive]}
              onPress={() => dispatch(updateProfile({ isAvailable: user?.isAvailable === false }))}
              activeOpacity={0.88}
            >
              <View style={[styles.onlineDot, !isOnline && { backgroundColor: Colors.deliveryWarn }]} />
              <Text style={styles.onlineText}>{isOnline ? 'Online' : 'Paused'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View>
                <Text style={styles.heroEyebrow}>Current assignment</Text>
                <Text style={styles.heroTitle}>
                  {activeDelivery ? '1 active delivery in progress' : 'No active order right now'}
                </Text>
              </View>
              <View style={styles.heroBadge}>
                <MaterialCommunityIcons name="bike-fast" size={16} color={Colors.deliveryAccent} />
                <Text style={styles.heroBadgeText}>{activeDelivery ? 'LIVE' : 'READY'}</Text>
              </View>
            </View>

            <View style={styles.heroRouteRow}>
              <View style={styles.routeStopCol}>
                <View style={[styles.routeStopDot, { backgroundColor: '#10B981' }]} />
                <View style={styles.routeLine} />
                <View style={[styles.routeStopDot, { backgroundColor: '#F97316' }]} />
              </View>
              <View style={styles.routeTextCol}>
                <Text style={styles.routeTitle}>Pickup</Text>
                <Text style={styles.routeValue}>{PENCH_WAREHOUSE.label}</Text>
                <Text style={[styles.routeTitle, { marginTop: 12 }]}>Drop</Text>
                <Text style={styles.routeValue}>{activeDropAddress}</Text>
              </View>
            </View>

            <View style={styles.heroFooter}>
              <View>
                <Text style={styles.heroMetricLabel}>Stops remaining</Text>
                <Text style={styles.heroMetricValue}>{pendingDeliveries.length}</Text>
              </View>
              <TouchableOpacity
                style={styles.primaryAction}
                onPress={() => navigation.navigate('OrderTracking', { assignment: activeDelivery })}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryActionText}>Open live run</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.statsGrid}>
          <DeliveryStatCard icon="check-decagram" label="Completed trips" value={String(completedTrips)} tone="#2563EB" />
          <DeliveryStatCard icon="star-circle" label="Partner rating" value={averageRating} tone="#F59E0B" />
          <DeliveryStatCard icon="truck-delivery-outline" label="Pending stops" value={String(pendingDeliveries.length)} tone="#0F766E" />
        </View>

        <View style={styles.bottleSummary}>
          <View style={styles.bottleHeader}>
            <View>
              <Text style={styles.sectionTitle}>Bottle collection</Text>
              <Text style={styles.sectionSub}>Glass bottle returns from today's stops</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('DeliveryBottles')} style={styles.viewBottlesBtn}>
              <Text style={styles.viewBottlesText}>Open</Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color={Colors.deliveryDark} />
            </TouchableOpacity>
          </View>
          <View style={styles.bottleStatsRow}>
            <View style={styles.bottleStat}>
              <Text style={styles.bottleStatValue}>{bottlesToCollect}</Text>
              <Text style={styles.bottleStatLabel}>Due</Text>
            </View>
            <View style={styles.bottleStat}>
              <Text style={[styles.bottleStatValue, { color: Colors.success }]}>{bottlesCollected}</Text>
              <Text style={styles.bottleStatLabel}>Collected</Text>
            </View>
            <View style={styles.bottleStat}>
              <Text style={[styles.bottleStatValue, { color: Colors.error }]}>{brokenBottles}</Text>
              <Text style={styles.bottleStatLabel}>Broken</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.actionGrid}>
            <DeliveryActionCard
              icon="map-marker-path"
              label="OSM Route"
              sublabel="Open route on OpenStreetMap"
              accent="#0F766E"
              onPress={() => routeUrl && Linking.openURL(routeUrl)}
            />
            <DeliveryActionCard
              icon="bottle-tonic-outline"
              label="Bottles"
              sublabel="Collected and broken bottles"
              accent="#D97706"
              onPress={() => navigation.navigate('DeliveryBottles')}
            />
            <DeliveryActionCard
              icon="account-phone"
              label="Customer"
              sublabel="Call customer before drop"
              accent="#1D4ED8"
              onPress={() => Linking.openURL(`tel:${activeDelivery?.customer?.phone || liveOrder?.customer?.phone || '+919657673411'}`)}
            />
            <DeliveryActionCard
              icon="warehouse"
              label="Hub support"
              sublabel="Talk to dispatch team"
              accent="#7C3AED"
              onPress={() => Linking.openURL('tel:+919657673411')}
            />
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Upcoming stops ({pendingDeliveries.length})</Text>
          {pendingDeliveries.map((assignment, index) => (
            <TouchableOpacity
              key={assignment.id}
              style={styles.queueCard}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('DeliveryDeliveries')}
            >
              <View style={styles.queueNum}>
                <Text style={styles.queueNumText}>{index + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.queueName}>{assignment.customer.name}</Text>
                <Text style={styles.queueAddr} numberOfLines={1}>{assignment.customer.address}</Text>
                <View style={styles.queueMeta}>
                  <MaterialCommunityIcons name="package-variant-closed" size={13} color={Colors.textMuted} />
                  <Text style={styles.queueMetaText}>{assignment.itemCount} item | {assignment.distance}</Text>
                  <MaterialCommunityIcons name="bottle-tonic-outline" size={13} color={Colors.textMuted} />
                  <Text style={styles.queueMetaText}>{assignment.bottlesDue || 0} bottles</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7F9' },
  scroll: { flex: 1 },
  topShell: { paddingHorizontal: 16, paddingBottom: 18 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  partnerLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  partnerName: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 4 },
  partnerSub: { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 4 },
  onlinePill: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  onlinePillActive: { backgroundColor: 'rgba(34,197,94,0.18)' },
  onlinePillInactive: { backgroundColor: 'rgba(245,158,11,0.18)' },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.deliveryAccent },
  onlineText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  heroCard: { marginTop: 12, backgroundColor: '#fff', borderRadius: 20, padding: 18 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroEyebrow: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  heroTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '900', marginTop: 4, maxWidth: 220 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  heroBadgeText: { color: '#166534', fontWeight: '800', fontSize: 12 },
  heroRouteRow: { flexDirection: 'row', marginTop: 18 },
  routeStopCol: { alignItems: 'center', width: 20, marginRight: 14 },
  routeStopDot: { width: 12, height: 12, borderRadius: 6 },
  routeLine: { flex: 1, width: 2, backgroundColor: Colors.border, marginVertical: 4, minHeight: 42 },
  routeTextCol: { flex: 1 },
  routeTitle: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  routeValue: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginTop: 3, lineHeight: 20 },
  heroFooter: { marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.borderLight, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroMetricLabel: { fontSize: 12, color: Colors.textMuted },
  heroMetricValue: { fontSize: 22, color: Colors.textPrimary, fontWeight: '900', marginTop: 4 },
  primaryAction: { backgroundColor: Colors.primary, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 14 },
  primaryActionText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  statsGrid: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 18, gap: 10 },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 16, padding: 16, alignItems: 'flex-start' },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  statLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  bottleSummary: { marginHorizontal: 16, marginTop: 16, backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.borderLight },
  bottleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  sectionSub: { fontSize: 12, color: Colors.textMuted, marginTop: 3 },
  viewBottlesBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.warningLight, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  viewBottlesText: { color: Colors.deliveryDark, fontWeight: '800', fontSize: 12 },
  bottleStatsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  bottleStat: { flex: 1, backgroundColor: Colors.surfaceElevated, borderRadius: 12, padding: 12, alignItems: 'center' },
  bottleStatValue: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary },
  bottleStatLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '700', marginTop: 2 },
  sectionBlock: { paddingHorizontal: 16, marginTop: 22 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  actionCard: { width: (width - 42) / 2, backgroundColor: Colors.surface, borderRadius: 16, padding: 16 },
  actionIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  actionLabel: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  actionSub: { fontSize: 12, color: Colors.textMuted, marginTop: 5, lineHeight: 17 },
  queueCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: 16, padding: 14, marginTop: 10, borderWidth: 1, borderColor: Colors.borderLight },
  queueNum: { width: 30, height: 30, borderRadius: 10, backgroundColor: Colors.deliveryDark, alignItems: 'center', justifyContent: 'center' },
  queueNumText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  queueName: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  queueAddr: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  queueMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  queueMetaText: { fontSize: 12, color: Colors.textMuted },
});
