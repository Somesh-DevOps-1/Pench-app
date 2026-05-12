import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, TextInput, Alert, Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from '../../store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  addToCart, removeFromCart, deleteFromCart,
  applyCoupon, removeCoupon, selectCartItems, selectCartSubtotal, selectCartTotal,
} from '../../store/slices/cartSlice';
import { Colors } from '../../theme/colors';
import { formatCurrency } from '../../utils/formatters';
import { COUPONS } from '../../data/mockData';

export default function CartScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const cartItems = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const total = useSelector(selectCartTotal);
  const { deliveryFee, coupon, couponDiscount } = useSelector(s => s.cart);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  const applyCouponCode = () => {
    const found = COUPONS.find(c => c.code === couponInput.toUpperCase().trim());
    if (!found) { setCouponError('Invalid coupon code'); return; }
    if (subtotal < found.minOrder) { setCouponError(`Minimum order Rs. ${found.minOrder} required`); return; }
    dispatch(applyCoupon({ coupon: found, subtotal }));
    setCouponInput('');
    setCouponError('');
  };

  if (cartItems.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <MaterialCommunityIcons name="cart-outline" size={80} color={Colors.border} />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySub}>Add some fresh dairy products!</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.shopBtnText}>Shop Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <Text style={styles.itemCount}>{cartItems.reduce((s, i) => s + i.quantity, 0)} items</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        decelerationRate="normal"
        bounces
        overScrollMode="always"
      >
        {/* Delivery info */}
        <View style={styles.deliveryBanner}>
          <MaterialCommunityIcons name="clock-fast" size={18} color={Colors.primary} />
          <Text style={styles.deliveryBannerText}>
            Delivery by <Text style={{ fontWeight: '800' }}>6:30 AM Tomorrow</Text> | Free above Rs. 200
          </Text>
        </View>

        {/* Cart Items */}
        <View style={styles.itemsSection}>
          {cartItems.map(item => (
            <View key={item.skuId} style={styles.itemRow}>
              <View style={styles.itemIcon}>
                <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="contain" />
              </View>

              {/* Info */}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemUnit}>{item.unit}</Text>
                <Text style={styles.itemPrice}>{formatCurrency(item.price)} each</Text>
              </View>

              {/* Qty Controls */}
              <View style={styles.qtyControl}>
                <TouchableOpacity
                  onPress={() => dispatch(removeFromCart(item.skuId))}
                  style={styles.qtyBtn}
                >
                  <MaterialCommunityIcons
                    name={item.quantity === 1 ? 'trash-can-outline' : 'minus'}
                    size={16} color="#fff"
                  />
                </TouchableOpacity>
                <Text style={styles.qty}>{item.quantity}</Text>
                <TouchableOpacity
                  onPress={() => dispatch(addToCart({
                    product: { id: item.id, skus: [{ id: item.skuId, price: item.price, mrp: item.mrp, label: item.unit }], name: item.name, image: item.image, category: item.category },
                    skuId: item.skuId,
                  }))}
                  style={styles.qtyBtn}
                >
                  <MaterialCommunityIcons name="plus" size={16} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Subtotal */}
              <Text style={styles.itemSubtotal}>{formatCurrency(item.price * item.quantity)}</Text>
            </View>
          ))}
        </View>

        {/* Coupon */}
        <View style={styles.couponSection}>
          {coupon ? (
            <View style={styles.couponApplied}>
              <View style={styles.couponAppliedLeft}>
                <MaterialCommunityIcons name="ticket-percent" size={20} color={Colors.primary} />
                <View>
                  <Text style={styles.couponCode}>{coupon.code} applied</Text>
                  <Text style={styles.couponSaving}>You save {formatCurrency(couponDiscount)}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => dispatch(removeCoupon())}>
                <MaterialCommunityIcons name="close-circle" size={22} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponRow}>
              <MaterialCommunityIcons name="ticket-percent-outline" size={20} color={Colors.primary} />
              <TextInput
                style={styles.couponInput}
                placeholder="Enter coupon code (try PENCH10)"
                placeholderTextColor={Colors.textMuted}
                value={couponInput}
                onChangeText={t => { setCouponInput(t); setCouponError(''); }}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.applyBtn} onPress={applyCouponCode}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          )}
          {couponError ? <Text style={styles.couponError}>{couponError}</Text> : null}
        </View>

        {/* Bill Details */}
        <View style={styles.billSection}>
          <Text style={styles.billTitle}>Bill Details</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={[styles.billValue, subtotal >= 200 && styles.freeText]}>
              {subtotal >= 200 ? 'FREE' : formatCurrency(deliveryFee)}
            </Text>
          </View>
          {couponDiscount > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: Colors.success }]}>Coupon Discount</Text>
              <Text style={[styles.billValue, { color: Colors.success }]}>-{formatCurrency(couponDiscount)}</Text>
            </View>
          )}
          <View style={[styles.billRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </View>
          {subtotal < 200 && (
            <View style={styles.freeDeliveryHint}>
              <MaterialCommunityIcons name="information-outline" size={14} color={Colors.warning} />
              <Text style={styles.freeDeliveryText}>
                Add {formatCurrency(200 - subtotal)} more for free delivery
              </Text>
            </View>
          )}
        </View>

        {/* Savings */}
        {(couponDiscount > 0 || subtotal >= 200) && (
          <View style={styles.savingsBanner}>
            <MaterialCommunityIcons name="piggy-bank-outline" size={20} color={Colors.success} />
            <Text style={styles.savingsText}>
              You're saving {formatCurrency(couponDiscount + (subtotal >= 200 ? deliveryFee : 0))} on this order
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Checkout Button */}
      <View style={[styles.checkoutBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('Checkout')}
          activeOpacity={0.88}
        >
          <View>
            <Text style={styles.checkoutItems}>{cartItems.reduce((s, i) => s + i.quantity, 0)} items</Text>
            <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          </View>
          <Text style={styles.checkoutTotal}>{formatCurrency(total)} {'->'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  itemCount: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  deliveryBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, backgroundColor: Colors.successLight, borderRadius: 12, padding: 12 },
  deliveryBannerText: { fontSize: 13, color: Colors.primaryDark },
  itemsSection: { backgroundColor: Colors.surface, marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  itemIcon: { width: 50, height: 50, borderRadius: 12, backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center' },
  itemImage: { width: 44, height: 44 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  itemUnit: { fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
  itemPrice: { fontSize: 12, color: Colors.textSecondary },
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 2 },
  qtyBtn: { padding: 8 },
  qty: { color: '#fff', fontWeight: '800', fontSize: 15, minWidth: 24, textAlign: 'center' },
  itemSubtotal: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, minWidth: 56, textAlign: 'right' },
  couponSection: { marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.surface, borderRadius: 16, padding: 16 },
  couponRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  couponInput: { flex: 1, fontSize: 14, color: Colors.textPrimary, paddingVertical: 4 },
  applyBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  couponApplied: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  couponAppliedLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  couponCode: { fontSize: 14, fontWeight: '700', color: Colors.primaryDark },
  couponSaving: { fontSize: 12, color: Colors.primary },
  couponError: { color: Colors.error, fontSize: 12, marginTop: 8 },
  billSection: { marginHorizontal: 16, backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12 },
  billTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 14 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  billLabel: { fontSize: 14, color: Colors.textSecondary },
  billValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  freeText: { color: Colors.success, fontWeight: '800' },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  totalValue: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  freeDeliveryHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: Colors.warningLight, padding: 8, borderRadius: 8 },
  freeDeliveryText: { fontSize: 12, color: Colors.warning, fontWeight: '600' },
  savingsBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, backgroundColor: Colors.successLight, borderRadius: 12, padding: 12, marginBottom: 12 },
  savingsText: { flex: 1, fontSize: 13, color: Colors.primaryDark, fontWeight: '600' },
  checkoutBar: { backgroundColor: Colors.surface, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.borderLight, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 12 },
  checkoutBtn: { backgroundColor: Colors.primary, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  checkoutItems: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '600' },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  checkoutTotal: { color: '#fff', fontSize: 17, fontWeight: '900' },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  emptySub: { fontSize: 14, color: Colors.textMuted },
  shopBtn: { backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  shopBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
