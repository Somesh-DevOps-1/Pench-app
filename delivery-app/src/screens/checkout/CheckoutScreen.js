import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from '../../store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  clearCart,
  selectCartDeliveryFee,
  selectCartItems,
  selectCartTotal,
  selectCartSubtotal,
} from '../../store/slices/cartSlice';
import { placeOrder } from '../../store/slices/ordersSlice';
import { Colors } from '../../theme/colors';
import { formatCurrency } from '../../utils/formatters';
import { SAVED_ADDRESSES } from '../../data/mockData';

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: 'qrcode', desc: 'PhonePe, GPay, Paytm' },
  { id: 'card', label: 'Card', icon: 'credit-card-outline', desc: 'Credit / Debit Card' },
  { id: 'cod', label: 'Cash on Delivery', icon: 'cash', desc: 'Pay when delivered' },
];

const DELIVERY_SLOTS = [
  { id: 'early', label: 'Early Morning', time: '6:00 AM - 7:30 AM', icon: 'weather-night' },
  { id: 'morning', label: 'Morning', time: '8:00 AM - 10:00 AM', icon: 'weather-sunset-up' },
  { id: 'express', label: 'Express', time: 'Within 60 mins', icon: 'lightning-bolt', fee: 20 },
];

export default function CheckoutScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const cartItems = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const total = useSelector(selectCartTotal);
  const deliveryFee = useSelector(selectCartDeliveryFee);
  const { couponDiscount } = useSelector(s => s.cart);
  const { user } = useSelector(s => s.auth);
  const deliveryAddresses = useMemo(() => {
    if (!user?.address) {
      return SAVED_ADDRESSES;
    }

    return [
      {
        id: 'current-location',
        label: 'Current Location',
        icon: 'crosshairs-gps',
        addressLine1: user.address.addressLine1 || user.address.shortAddress || 'Pinned location',
        addressLine2: user.address.addressLine2 || user.address.fullAddress || '',
        city: user.address.city || 'Nagpur',
        pincode: user.address.postcode || '',
        latitude: user.address.latitude,
        longitude: user.address.longitude,
        isDefault: true,
        isExactLocation: true,
      },
      ...SAVED_ADDRESSES.map(address => ({ ...address, isDefault: false })),
    ];
  }, [user?.address]);
  const [selectedAddress, setSelectedAddress] = useState(deliveryAddresses[0]);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [selectedSlot, setSelectedSlot] = useState('early');
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    setSelectedAddress(deliveryAddresses[0]);
  }, [deliveryAddresses]);

  const handlePlaceOrder = () => {
    setPlacing(true);
    setTimeout(() => {
      dispatch(placeOrder({
        items: cartItems,
        total,
        deliveryAddress: [selectedAddress.addressLine1, selectedAddress.addressLine2, selectedAddress.city]
          .filter(Boolean)
          .join(', '),
        deliveryCoordinates: {
          latitude: selectedAddress.latitude,
          longitude: selectedAddress.longitude,
        },
        paymentMethod,
      }));
      dispatch(clearCart());
      setPlacing(false);
      navigation.replace('OrderTracking');
    }, 1500);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        decelerationRate="normal"
        bounces
        overScrollMode="always"
      >
        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          {deliveryAddresses.map(addr => (
            <TouchableOpacity
              key={addr.id}
              style={[styles.addressCard, selectedAddress?.id === addr.id && styles.addressCardActive]}
              onPress={() => setSelectedAddress(addr)}
            >
              <View style={styles.addressLeft}>
                <View style={[styles.addressIconBox, selectedAddress?.id === addr.id && { backgroundColor: Colors.successLight }]}>
                  <MaterialCommunityIcons name={addr.icon} size={20} color={selectedAddress?.id === addr.id ? Colors.primary : Colors.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.addressLabel}>{addr.label}</Text>
                    {addr.isDefault && <View style={styles.defaultBadge}><Text style={styles.defaultBadgeText}>Default</Text></View>}
                  </View>
                  <Text style={styles.addressLine}>{addr.addressLine1}</Text>
                  <Text style={styles.addressLine}>{addr.addressLine2}, {addr.city} {addr.pincode}</Text>
                </View>
              </View>
              <View style={[styles.radioOuter, selectedAddress?.id === addr.id && styles.radioOuterActive]}>
                {selectedAddress?.id === addr.id && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addAddressBtn} onPress={() => navigation.navigate('AddressPicker')}>
            <MaterialCommunityIcons name="plus" size={18} color={Colors.primary} />
            <Text style={styles.addAddressText}>Add New Address</Text>
          </TouchableOpacity>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cartItems.map(item => (
            <View key={item.skuId} style={styles.orderItemRow}>
              <Text style={styles.orderItemQty}>{item.quantity}x</Text>
              <Text style={styles.orderItemName}>{item.name} ({item.unit})</Text>
              <Text style={styles.orderItemPrice}>{formatCurrency(item.price * item.quantity)}</Text>
            </View>
          ))}
        </View>

        {/* Delivery Slot Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Slot</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slotRow}>
            {DELIVERY_SLOTS.map(slot => (
              <TouchableOpacity
                key={slot.id}
                style={[styles.slotCard, selectedSlot === slot.id && styles.slotCardActive]}
                onPress={() => setSelectedSlot(slot.id)}
              >
                <MaterialCommunityIcons 
                  name={slot.icon} 
                  size={20} 
                  color={selectedSlot === slot.id ? Colors.primary : Colors.textMuted} 
                />
                <Text style={[styles.slotLabel, selectedSlot === slot.id && { color: Colors.primary }]}>{slot.label}</Text>
                <Text style={styles.slotTime}>{slot.time}</Text>
                {slot.fee ? (
                  <Text style={styles.slotFee}>+{formatCurrency(slot.fee)}</Text>
                ) : (
                  <Text style={styles.slotFree}>FREE</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {PAYMENT_METHODS.map(m => (
            <TouchableOpacity
              key={m.id}
              style={[styles.paymentCard, paymentMethod === m.id && styles.paymentCardActive]}
              onPress={() => setPaymentMethod(m.id)}
            >
              <MaterialCommunityIcons name={m.icon} size={24} color={paymentMethod === m.id ? Colors.primary : Colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.paymentLabel, paymentMethod === m.id && { color: Colors.primary }]}>{m.label}</Text>
                <Text style={styles.paymentDesc}>{m.desc}</Text>
              </View>
              <View style={[styles.radioOuter, paymentMethod === m.id && styles.radioOuterActive]}>
                {paymentMethod === m.id && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bill Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Details</Text>
          <View style={styles.billCard}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Total</Text>
              <Text style={styles.billValue}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Fee</Text>
              <Text style={[styles.billValue, subtotal >= 200 && { color: Colors.success }]}>
                {subtotal >= 200 ? 'FREE' : formatCurrency(deliveryFee)}
              </Text>
            </View>
            {couponDiscount > 0 && (
              <View style={styles.billRow}>
                <Text style={[styles.billLabel, { color: Colors.success }]}>Coupon Discount</Text>
                <Text style={[styles.billValue, { color: Colors.success }]}>-{formatCurrency(couponDiscount)}</Text>
              </View>
            )}
            <View style={[styles.billRow, { borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 12, marginTop: 4 }]}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.textPrimary }}>Total</Text>
              <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.textPrimary }}>{formatCurrency(total)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Place Order CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.placeOrderBtn, placing && { opacity: 0.7 }]}
          onPress={handlePlaceOrder}
          disabled={placing}
          activeOpacity={0.88}
        >
          {placing ? (
            <Text style={styles.placeOrderText}>Placing Order...</Text>
          ) : (
            <>
              <Text style={styles.placeOrderText}>Place Order</Text>
              <Text style={styles.placeOrderTotal}>{formatCurrency(total)}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  section: { margin: 16, marginBottom: 0 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12 },
  addressCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: Colors.border },
  addressCardActive: { borderColor: Colors.primary, backgroundColor: '#F1F8E9' },
  addressLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  addressIconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  addressLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  defaultBadge: { backgroundColor: Colors.successLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  defaultBadgeText: { fontSize: 10, color: Colors.primary, fontWeight: '700' },
  addressLine: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  radioOuterActive: { borderColor: Colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  addAddressBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: Colors.primary },
  addAddressText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  orderItemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  orderItemQty: { fontSize: 14, fontWeight: '800', color: Colors.primary, width: 24 },
  orderItemName: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  orderItemPrice: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  slotRow: { gap: 10, paddingRight: 16 },
  slotCard: { 
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14, 
    width: 140, alignItems: 'flex-start', gap: 6, borderWidth: 1.5, borderColor: Colors.border 
  },
  slotCardActive: { borderColor: Colors.primary, backgroundColor: '#F1F8E9' },
  slotLabel: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary },
  slotTime: { fontSize: 11, color: Colors.textSecondary },
  slotFee: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary, marginTop: 4 },
  slotFree: { fontSize: 12, fontWeight: '700', color: Colors.success, marginTop: 4 },
  paymentCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: Colors.border },
  paymentCardActive: { borderColor: Colors.primary, backgroundColor: '#F1F8E9' },
  paymentLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  paymentDesc: { fontSize: 12, color: Colors.textMuted },
  billCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  billLabel: { fontSize: 14, color: Colors.textSecondary },
  billValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  bottomBar: { backgroundColor: Colors.surface, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.borderLight, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 12 },
  placeOrderBtn: { backgroundColor: Colors.primary, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  placeOrderText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  placeOrderTotal: { color: '#fff', fontSize: 18, fontWeight: '900' },
});
