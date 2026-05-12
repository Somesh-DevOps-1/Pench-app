import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from '../../store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import { formatCurrency } from '../../utils/formatters';

export default function OrderTrackingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { liveOrder } = useSelector(state => state.orders);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Order</Text>
        <Text style={styles.orderId}>#{liveOrder?.id?.slice(-6).toUpperCase()}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Estimated Arrival</Text>
          <Text style={styles.heroTime}>{liveOrder?.estimatedArrival || '6:45 AM'}</Text>
          <Text style={styles.heroSub}>
            Live route maps are available in the iOS and Android apps. This web view keeps the order timeline, delivery details, and items in sync.
          </Text>
        </View>

        <View style={styles.agentCard}>
          <View style={styles.agentAvatar}>
            <MaterialCommunityIcons name="account" size={30} color={Colors.primary} />
          </View>
          <View style={styles.agentInfo}>
            <Text style={styles.agentName}>{liveOrder?.deliveryAgent?.name}</Text>
            <Text style={styles.agentMeta}>
              Rating {liveOrder?.deliveryAgent?.rating} | {liveOrder?.deliveryAgent?.totalDeliveries} deliveries
            </Text>
          </View>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={() => Linking.openURL(`tel:${liveOrder?.deliveryAgent?.phone}`)}
          >
            <MaterialCommunityIcons name="phone" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Route Summary</Text>
          <View style={styles.routeRow}>
            <MaterialCommunityIcons name="store" size={18} color={Colors.primary} />
            <Text style={styles.routeText}>{liveOrder?.route?.origin?.label || 'Pench Farm'}</Text>
          </View>
          <View style={styles.routeDivider} />
          <View style={styles.routeRow}>
            <MaterialCommunityIcons name="home" size={18} color={Colors.secondary} />
            <Text style={styles.routeText}>{liveOrder?.route?.destination?.label || 'Your Home'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Status</Text>
          {liveOrder?.statusTimeline?.map((step, index) => (
            <View key={index} style={styles.timelineRow}>
              <View style={[styles.timelineDot, step.done && styles.timelineDotActive]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.timelineLabel, step.done && styles.timelineLabelActive]}>
                  {step.label}
                </Text>
                {step.time ? <Text style={styles.timelineTime}>{step.time}</Text> : null}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Order</Text>
          {liveOrder?.items?.map((item, index) => (
            <View key={index} style={styles.orderRow}>
              <Text style={styles.orderQty}>{item.qty}x</Text>
              <Text style={styles.orderName}>{item.name}</Text>
              <Text style={styles.orderPrice}>{formatCurrency(item.price)}</Text>
            </View>
          ))}
          <View style={[styles.orderRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(liveOrder?.total || 0)}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  orderId: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 40 },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  heroLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  heroTime: { fontSize: 30, fontWeight: '900', color: Colors.textPrimary, marginTop: 6, marginBottom: 8 },
  heroSub: { fontSize: 13, lineHeight: 20, color: Colors.textSecondary },
  agentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  agentAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentInfo: { flex: 1 },
  agentName: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  agentMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 14 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeDivider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 12 },
  routeText: { flex: 1, fontSize: 13, color: Colors.textPrimary },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.border,
    marginTop: 4,
  },
  timelineDotActive: { backgroundColor: Colors.primary },
  timelineLabel: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  timelineLabelActive: { color: Colors.textPrimary },
  timelineTime: { fontSize: 12, color: Colors.primary, marginTop: 2 },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  orderQty: { width: 24, fontSize: 13, fontWeight: '800', color: Colors.primary },
  orderName: { flex: 1, fontSize: 13, color: Colors.textPrimary },
  orderPrice: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.borderLight, marginTop: 8, paddingTop: 12 },
  totalLabel: { flex: 1, fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  totalValue: { fontSize: 15, fontWeight: '900', color: Colors.textPrimary },
});
