import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Dimensions, Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from '../../store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { addToCart, removeFromCart, selectCartItems } from '../../store/slices/cartSlice';
import { selectProductById } from '../../store/slices/productsSlice';
import { Colors } from '../../theme/colors';
import { formatCurrency, getDiscountPercent } from '../../utils/formatters';
import { PRODUCTS } from '../../data/mockData';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ navigation, route }) {
  const { productId } = route.params;
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const product = useSelector(s => selectProductById(s, productId));
  const cartItems = useSelector(selectCartItems);
  const [selectedSku, setSelectedSku] = useState(product?.skus[0]);

  if (!product) return null;

  const cartItem = cartItems.find(c => c.skuId === selectedSku?.id);
  const qty = cartItem?.quantity || 0;
  const disc = getDiscountPercent(selectedSku?.mrp || product.mrp, selectedSku?.price || product.price);

  // Related products
  const related = PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 3);

  const handleAdd = () => dispatch(addToCart({ product, skuId: selectedSku.id }));
  const handleRemove = () => dispatch(removeFromCart(selectedSku.id));

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
        <TouchableOpacity style={styles.shareBtn}>
          <MaterialCommunityIcons name="share-variant-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Product Image */}
        <LinearGradient colors={[Colors.successLight, Colors.background]} style={styles.imageSection}>
          {product.badge && (
            <View style={[styles.badge, { backgroundColor: product.badgeColor }]}>
              <Text style={styles.badgeText}>{product.badge}</Text>
            </View>
          )}
          <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="contain" />
          {disc > 0 && (
            <View style={styles.discPill}>
              <Text style={styles.discText}>{disc}% OFF</Text>
            </View>
          )}
        </LinearGradient>

        {/* Info */}
        <View style={styles.infoSection}>
          <View style={styles.nameRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productUnit}>{selectedSku?.label || product.unit}</Text>
            </View>
            <View style={styles.ratingPill}>
              <MaterialCommunityIcons name="star" size={14} color={Colors.star} />
              <Text style={styles.ratingText}>{product.rating}</Text>
            </View>
          </View>

          {/* Price Row */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatCurrency(selectedSku?.price || product.price)}</Text>
            {selectedSku?.mrp > selectedSku?.price && (
              <Text style={styles.mrp}>{formatCurrency(selectedSku?.mrp)}</Text>
            )}
            {disc > 0 && (
              <View style={styles.savePill}>
                <Text style={styles.saveText}>Save {formatCurrency(selectedSku.mrp - selectedSku.price)}</Text>
              </View>
            )}
          </View>

          {/* Delivery info */}
          <View style={styles.deliveryRow}>
            <MaterialCommunityIcons name="clock-fast" size={16} color={Colors.primary} />
            <Text style={styles.deliveryText}>Delivery: {product.deliveryTime}</Text>
            <MaterialCommunityIcons name="shield-check" size={14} color={Colors.success} style={{ marginLeft: 10 }} />
            <Text style={styles.deliveryText}>A2 Certified</Text>
          </View>

          {/* SKU Selector */}
          {product.skus.length > 1 && (
            <View style={styles.skuSection}>
              <Text style={styles.skuLabel}>Select Pack Size</Text>
              <View style={styles.skuRow}>
                {product.skus.map(sku => (
                  <TouchableOpacity
                    key={sku.id}
                    style={[styles.skuChip, selectedSku?.id === sku.id && styles.skuChipActive]}
                    onPress={() => setSelectedSku(sku)}
                  >
                    <Text style={[styles.skuChipLabel, selectedSku?.id === sku.id && styles.skuChipLabelActive]}>
                      {sku.label}
                    </Text>
                    <Text style={[styles.skuChipPrice, selectedSku?.id === sku.id && styles.skuChipPriceActive]}>
                      {formatCurrency(sku.price)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Highlights */}
          <View style={styles.highlights}>
            {product.highlights?.map((h, i) => (
              <View key={i} style={styles.highlightChip}>
                <MaterialCommunityIcons name="check-circle" size={14} color={Colors.primary} />
                <Text style={styles.highlightText}>{h}</Text>
              </View>
            ))}
          </View>

          {/* Description */}
          <View style={styles.descSection}>
            <Text style={styles.descTitle}>About this Product</Text>
            <Text style={styles.descText}>{product.description}</Text>
          </View>

          {/* Nutrition (if milk) */}
          {product.nutritionPer100ml && (
            <View style={styles.nutritionSection}>
              <Text style={styles.descTitle}>Nutrition per 100ml</Text>
              <View style={styles.nutritionGrid}>
                {Object.entries(product.nutritionPer100ml).map(([key, val]) => (
                  <View key={key} style={styles.nutritionCell}>
                    <Text style={styles.nutritionVal}>{val}</Text>
                    <Text style={styles.nutritionKey}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Subscribe CTA */}
          {product.subscriptionAvailable && (
            <TouchableOpacity
              style={styles.subscribeCard}
              onPress={() => navigation.navigate('Main', { screen: 'Subscriptions' })}
            >
              <View>
                <Text style={styles.subscribeCta}>Subscribe & Save 15%</Text>
                <Text style={styles.subscribeDesc}>Get this delivered daily. Pause anytime.</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.primary} />
            </TouchableOpacity>
          )}

          {/* Reviews */}
          <View style={styles.reviewMeta}>
            <Text style={styles.descTitle}>Ratings & Reviews</Text>
            <View style={styles.reviewSummary}>
              <Text style={styles.bigRating}>{product.rating}</Text>
              <View>
                <View style={{ flexDirection: 'row', gap: 2 }}>
                  {Array(5).fill(0).map((_, i) => (
                    <MaterialCommunityIcons key={i} name="star" size={16}
                      color={i < Math.floor(product.rating) ? Colors.star : Colors.border} />
                  ))}
                </View>
                <Text style={styles.reviewCount}>{product.reviewCount} ratings</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Add to Cart */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        {qty === 0 ? (
          <TouchableOpacity style={styles.addToCartBtn} onPress={handleAdd} activeOpacity={0.85}>
            <MaterialCommunityIcons name="cart-plus" size={22} color="#fff" />
            <Text style={styles.addToCartText}>Add to Cart - {formatCurrency(selectedSku?.price)}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.bottomRow}>
            <View style={styles.qtyControl}>
              <TouchableOpacity style={styles.qtyBtn} onPress={handleRemove}>
                <MaterialCommunityIcons name="minus" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={handleAdd}>
                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.viewCartBtn} onPress={() => navigation.navigate('Cart')}>
              <Text style={styles.viewCartText}>View Cart {'->'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.background,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginHorizontal: 8 },
  shareBtn: { padding: 4 },
  imageSection: {
    height: 280, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  productImage: { width: width * 0.78, height: 230 },
  badge: {
    position: 'absolute', top: 16, left: 16,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  discPill: {
    position: 'absolute', bottom: 16, right: 16,
    backgroundColor: Colors.error, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  discText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  infoSection: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, padding: 20 },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  productName: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  productUnit: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  ratingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.success, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  ratingText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  price: { fontSize: 28, fontWeight: '900', color: Colors.textPrimary },
  mrp: { fontSize: 16, color: Colors.textMuted, textDecorationLine: 'line-through', marginTop: 4 },
  savePill: { backgroundColor: Colors.successLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  saveText: { color: Colors.primaryDark, fontWeight: '700', fontSize: 12 },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16, backgroundColor: Colors.background, padding: 10, borderRadius: 12 },
  deliveryText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  skuSection: { marginBottom: 16 },
  skuLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  skuRow: { flexDirection: 'row', gap: 10 },
  skuChip: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 12, alignItems: 'center' },
  skuChipActive: { borderColor: Colors.primary, backgroundColor: Colors.successLight },
  skuChipLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  skuChipLabelActive: { color: Colors.primary },
  skuChipPrice: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
  skuChipPriceActive: { color: Colors.primaryDark },
  highlights: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  highlightChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.successLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  highlightText: { fontSize: 12, fontWeight: '600', color: Colors.primaryDark },
  descSection: { marginBottom: 20 },
  descTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10 },
  descText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  nutritionSection: { marginBottom: 20 },
  nutritionGrid: { flexDirection: 'row', backgroundColor: Colors.background, borderRadius: 14, overflow: 'hidden' },
  nutritionCell: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRightWidth: 1, borderRightColor: Colors.border },
  nutritionVal: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  nutritionKey: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  subscribeCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.successLight, borderRadius: 14, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.primaryLight,
  },
  subscribeCta: { fontSize: 15, fontWeight: '800', color: Colors.primaryDark },
  subscribeDesc: { fontSize: 12, color: Colors.primary, marginTop: 2 },
  reviewMeta: { marginBottom: 20 },
  reviewSummary: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  bigRating: { fontSize: 48, fontWeight: '900', color: Colors.textPrimary },
  reviewCount: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface, paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.borderLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 12,
  },
  addToCartBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  addToCartText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  bottomRow: { flexDirection: 'row', gap: 12 },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary,
    borderRadius: 14, paddingHorizontal: 6,
  },
  qtyBtn: { padding: 12 },
  qtyText: { color: '#fff', fontWeight: '800', fontSize: 18, minWidth: 30, textAlign: 'center' },
  viewCartBtn: { flex: 1, backgroundColor: Colors.secondary, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  viewCartText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
