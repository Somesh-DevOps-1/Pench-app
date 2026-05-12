import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from '../../store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { rateOrder } from '../../store/slices/ordersSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { Colors } from '../../theme/colors';
import {
  formatCurrency,
  formatDate,
  getOrderStatusColor,
  getOrderStatusLabel,
} from '../../utils/formatters';
import { PRODUCTS } from '../../data/mockData';

export default function OrderHistoryScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { orders, hasLiveOrder } = useSelector(state => state.orders);
  const [ratingOrder, setRatingOrder] = useState(null);
  const [tempRating, setTempRating] = useState(0);

  const submitRating = (orderId) => {
    if (tempRating === 0) {
      Alert.alert('Please select a rating');
      return;
    }

    dispatch(rateOrder({ orderId, rating: tempRating }));
    setRatingOrder(null);
    setTempRating(0);
  };

  const normalize = (value) =>
    value
      .toLowerCase()
      .replace(/\([^)]*\)/g, '')
      .replace(/litres?/g, 'l')
      .replace(/\s+/g, ' ')
      .trim();

  const handleReorder = (order) => {
    let addedCount = 0;

    order.items.forEach(item => {
      const normalizedItem = normalize(item.name);
      const product = PRODUCTS.find(candidate => normalizedItem.includes(normalize(candidate.name)));
      const sku = product?.skus.find(candidateSku => normalizedItem.includes(normalize(candidateSku.label)))
        || product?.skus?.[0];

      if (!product || !sku) {
        return;
      }

      const quantity = item.qty || 1;
      for (let index = 0; index < quantity; index += 1) {
        dispatch(addToCart({ product, skuId: sku.id }));
      }
      addedCount += quantity;
    });

    if (!addedCount) {
      Alert.alert('Unavailable', 'These items are no longer available for reorder.');
      return;
    }

    navigation.navigate('Cart');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        {hasLiveOrder && (
          <TouchableOpacity style={styles.liveCard} onPress={() => navigation.navigate('OrderTracking')}>
            <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={styles.liveCardGrad}>
              <View style={styles.liveCardLeft}>
                <View style={styles.liveDotBig} />
                <View>
                  <Text style={styles.liveCardTitle}>Order Out for Delivery</Text>
                  <Text style={styles.liveCardSub}>Pench 1 Litre Milk | Est. 6:45 AM</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="map-marker-path" size={22} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Past Orders ({orders.length})</Text>
        {orders.map(order => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: getOrderStatusColor(order.status, Colors) },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: getOrderStatusColor(order.status, Colors) },
                ]}
              >
                {getOrderStatusLabel(order.status)}
              </Text>
              <Text style={styles.orderDate}>{formatDate(order.date)} | {order.time}</Text>
            </View>

            <View style={styles.orderBody}>
              {order.items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <Text style={styles.itemQty}>{item.qty}x</Text>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.orderFooter}>
              <View>
                <Text style={styles.totalLabel}>Order Total</Text>
                <Text style={styles.totalVal}>{formatCurrency(order.total)}</Text>
              </View>
              <View style={styles.footerActions}>
                {order.status === 'delivered' && !order.rated && (
                  <TouchableOpacity
                    style={styles.rateBtn}
                    onPress={() => {
                      setRatingOrder(order.id);
                      setTempRating(0);
                    }}
                  >
                    <MaterialCommunityIcons name="star-outline" size={16} color={Colors.secondary} />
                    <Text style={styles.rateBtnText}>Rate</Text>
                  </TouchableOpacity>
                )}
                {order.rated && (
                  <View style={styles.ratedRow}>
                    {Array(order.userRating).fill(0).map((_, index) => (
                      <MaterialCommunityIcons key={index} name="star" size={14} color={Colors.star} />
                    ))}
                  </View>
                )}
                <TouchableOpacity style={styles.reorderBtn} onPress={() => handleReorder(order)}>
                  <Text style={styles.reorderText}>Reorder</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {ratingOrder && (
          <View style={styles.ratingModal}>
            <Text style={styles.ratingTitle}>How was your order?</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setTempRating(star)}>
                  <MaterialCommunityIcons
                    name={star <= tempRating ? 'star' : 'star-outline'}
                    size={36}
                    color={star <= tempRating ? Colors.star : Colors.border}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.ratingActions}>
              <TouchableOpacity style={styles.cancelRating} onPress={() => setRatingOrder(null)}>
                <Text style={styles.cancelRatingText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitRating} onPress={() => submitRating(ratingOrder)}>
                <Text style={styles.submitRatingText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.textPrimary },
  liveCard: { borderRadius: 18, overflow: 'hidden', marginBottom: 20 },
  liveCardGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  liveCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  liveDotBig: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.secondary },
  liveCardTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  liveCardSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12 },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { flex: 1, fontSize: 13, fontWeight: '700' },
  orderDate: { fontSize: 11, color: Colors.textMuted },
  orderBody: { padding: 14, paddingBottom: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  itemQty: { fontSize: 13, fontWeight: '800', color: Colors.primary, width: 22 },
  itemName: { flex: 1, fontSize: 13, color: Colors.textPrimary },
  itemPrice: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  totalLabel: { fontSize: 11, color: Colors.textMuted },
  totalVal: { fontSize: 16, fontWeight: '900', color: Colors.textPrimary },
  footerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  rateBtnText: { color: Colors.secondary, fontWeight: '700', fontSize: 13 },
  ratedRow: { flexDirection: 'row', gap: 2 },
  reorderBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10 },
  reorderText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  ratingModal: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  ratingTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginBottom: 16 },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  ratingActions: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelRating: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelRatingText: { color: Colors.textSecondary, fontWeight: '700' },
  submitRating: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  submitRatingText: { color: '#fff', fontWeight: '700' },
});
