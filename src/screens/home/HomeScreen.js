import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Animated, StatusBar, Dimensions, RefreshControl, Linking, Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from '../../store';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '../../theme/colors';
import { BANNERS, TESTIMONIALS, TOMORROW_DELIVERY } from '../../data/mockData';
import { selectFilteredProducts, setCategory } from '../../store/slices/productsSlice';
import { addToCart, removeFromCart, selectCartItems } from '../../store/slices/cartSlice';
import { formatCurrency, getDiscountPercent } from '../../utils/formatters';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - 32;

function getGreetingConfig(hour = new Date().getHours()) {
  if (hour < 12) {
    return {
      label: 'Good Morning',
      sub: 'Fresh milk for a fresh start',
      icon: 'weather-sunny',
      color: '#F9A825',
      bg: '#FFF8E1',
    };
  }

  if (hour < 17) {
    return {
      label: 'Good Afternoon',
      sub: 'Stock up for the rest of your day',
      icon: 'white-balance-sunny',
      color: '#F57F17',
      bg: '#FFF3E0',
    };
  }

  if (hour < 21) {
    return {
      label: 'Good Evening',
      sub: 'Plan tomorrow morning’s dairy',
      icon: 'weather-sunset',
      color: '#7C3AED',
      bg: '#F3E8FF',
    };
  }

  return {
    label: 'Good Night',
    sub: 'Set up tomorrow’s fresh delivery',
    icon: 'weather-night',
    color: '#2563EB',
    bg: '#E3F2FD',
  };
}

// Banner carousel
function BannerCarousel({ navigation }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);
  const activeIndexRef = useRef(0);
  const directionRef = useRef(1);

  useEffect(() => {
    if (BANNERS.length < 2) {
      return undefined;
    }

    const timer = setInterval(() => {
      const isAtLast = activeIndexRef.current >= BANNERS.length - 1;
      const isAtFirst = activeIndexRef.current <= 0;

      if (isAtLast) {
        directionRef.current = -1;
      } else if (isAtFirst) {
        directionRef.current = 1;
      }

      const nextIndex = activeIndexRef.current + directionRef.current;
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
      scrollRef.current?.scrollToOffset({
        offset: nextIndex * (BANNER_WIDTH + 12),
        animated: true,
      });
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  return (
    <View style={bStyles.container}>
      <FlatList
        ref={scrollRef}
        data={BANNERS}
        horizontal pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={BANNER_WIDTH + 12}
        decelerationRate="fast"
        contentContainerStyle={{ gap: 12 }}
        keyExtractor={i => i.id}
        onMomentumScrollEnd={e => {
          const nextIndex = Math.round(e.nativeEvent.contentOffset.x / (BANNER_WIDTH + 12));
          activeIndexRef.current = nextIndex;
          setActiveIndex(nextIndex);
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => {
              if (item.productId) {
                navigation.navigate('ProductDetail', { productId: item.productId });
                return;
              }

              if (item.route) {
                navigation.navigate(item.route);
              }
            }}
          >
            <LinearGradient
              colors={[item.bgColor, item.bgColor + 'CC']}
              style={bStyles.banner}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <View style={bStyles.tagPill}>
                <Text style={bStyles.tagText}>{item.tag}</Text>
              </View>
              <Text style={bStyles.bannerTitle}>{item.title}</Text>
              <Text style={bStyles.bannerSub}>{item.subtitle}</Text>
              <View style={bStyles.arrowBtn}>
                <MaterialCommunityIcons name="arrow-right" size={16} color="#fff" />
              </View>
              {/* Decorative circle */}
              <View style={[bStyles.deco, { backgroundColor: item.accent + '18' }]} />
            </LinearGradient>
          </TouchableOpacity>
        )}
      />
      {/* Dots */}
      <View style={bStyles.dots}>
        {BANNERS.map((_, i) => (
          <View key={i} style={[bStyles.dot, i === activeIndex && bStyles.dotActive]} />
        ))}
      </View>
    </View>
  );
}
const bStyles = StyleSheet.create({
  container: { marginHorizontal: 16, marginBottom: 8 },
  banner: {
    width: BANNER_WIDTH, borderRadius: 22, padding: 20,
    minHeight: 152, justifyContent: 'flex-end', overflow: 'hidden',
  },
  tagPill: {
    position: 'absolute', top: 16, left: 16,
    backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  tagText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  bannerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 6 },
  bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 18, maxWidth: '75%' },
  arrowBtn: {
    position: 'absolute', right: 16, bottom: 16,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  deco: {
    position: 'absolute', right: -30, top: -30,
    width: 130, height: 130, borderRadius: 65,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  dotActive: { width: 20, backgroundColor: Colors.primary },
});

// Category bar
function CategoryBar({ categories, selected, onSelect }) {
  return (
    <FlatList
      data={categories}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingVertical: 4 }}
      keyExtractor={i => i.id}
      renderItem={({ item }) => {
        const active = item.id === selected;
        return (
          <TouchableOpacity
            style={[catStyles.chip, active && catStyles.chipActive]}
            onPress={() => onSelect(item.id)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={16}
              color={active ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[catStyles.chipText, active && catStyles.chipTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}
const catStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight,
  },
  chipActive: { backgroundColor: '#ECFDF5', borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '800', color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary },
});

function ServiceStrip({ navigation }) {
  const items = [
    { icon: 'repeat', label: 'Subscribe', tone: '#087344', route: 'Subscriptions' },
    { icon: 'bottle-tonic', label: 'Daily Milk', tone: '#2563EB', route: 'Search' },
    { icon: 'map-marker-radius', label: 'Address', tone: '#F57F17', route: 'AddressPicker' },
    { icon: 'truck-fast-outline', label: 'Track', tone: '#7C3AED', route: 'OrderTracking' },
  ];

  return (
    <View style={sStyles.strip}>
      {items.map(item => (
        <TouchableOpacity
          key={item.label}
          style={sStyles.item}
          onPress={() => navigation.navigate(item.route)}
          activeOpacity={0.86}
        >
          <View style={[sStyles.iconWrap, { backgroundColor: `${item.tone}14` }]}>
            <MaterialCommunityIcons name={item.icon} size={21} color={item.tone} />
          </View>
          <Text style={sStyles.label}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const sStyles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  item: { flex: 1, alignItems: 'center', gap: 7 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '800', color: Colors.textSecondary },
});

// Product card
function ProductCard({ item, onPress, cartItems, onAdd, onRemove }) {
  const cartItem = cartItems.find(c => c.id === item.id);
  const qty = cartItem?.quantity || 0;
  const disc = getDiscountPercent(item.mrp, item.price);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [imageFailed, setImageFailed] = useState(false);
  const productIcon = item.category === 'ghee' ? 'jar' : 'bottle-tonic';

  const pulse = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Animated.View style={[pStyles.card, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity activeOpacity={0.92} onPress={onPress}>
        {/* Image placeholder */}
        <View style={[pStyles.imageBg, item.category === 'ghee' && pStyles.gheeImageBg]}>
          {item.image && !imageFailed ? (
            <Image
              source={{ uri: item.image }}
              style={item.category === 'ghee' ? pStyles.gheeImage : pStyles.productImage}
              resizeMode="contain"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <View style={pStyles.productFallback}>
              <MaterialCommunityIcons name={productIcon} size={44} color={Colors.primary} />
              <Text style={pStyles.productFallbackText}>{item.category === 'ghee' ? 'A2 Ghee' : 'A2 Milk'}</Text>
            </View>
          )}
          {disc > 0 && (
            <View style={pStyles.discBadge}>
              <Text style={pStyles.discText}>{disc}% OFF</Text>
            </View>
          )}
        </View>

        <View style={pStyles.info}>
          {item.badge && (
            <View style={[pStyles.inlineBadge, { backgroundColor: item.badgeColor }]}>
              <Text style={pStyles.badgeText}>{item.badge}</Text>
            </View>
          )}
          <Text style={pStyles.name} numberOfLines={2}>{item.name}</Text>
          <Text style={pStyles.unit}>{item.unit}</Text>
          <View style={pStyles.ratingRow}>
            <MaterialCommunityIcons name="star" size={12} color={Colors.star} />
            <Text style={pStyles.rating}>{item.rating}</Text>
            <Text style={pStyles.reviews}>({item.reviewCount})</Text>
          </View>
          <View style={pStyles.priceRow}>
            <Text style={pStyles.price}>{formatCurrency(item.price)}</Text>
            {item.mrp > item.price && (
              <Text style={pStyles.mrp}>{formatCurrency(item.mrp)}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Add to Cart */}
      <View style={pStyles.cartRow}>
        {qty === 0 ? (
          <TouchableOpacity
            style={pStyles.addBtn}
            onPress={() => { pulse(); onAdd(); }}
            activeOpacity={0.85}
          >
            <Text style={pStyles.addBtnText}>ADD</Text>
            <MaterialCommunityIcons name="plus" size={16} color={Colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={pStyles.qtyControl}>
            <TouchableOpacity style={pStyles.qtyBtn} onPress={onRemove}>
              <MaterialCommunityIcons name="minus" size={16} color="#fff" />
            </TouchableOpacity>
            <Text style={pStyles.qtyText}>{qty}</Text>
            <TouchableOpacity style={pStyles.qtyBtn} onPress={() => { pulse(); onAdd(); }}>
              <MaterialCommunityIcons name="plus" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Animated.View>
  );
}
const pStyles = StyleSheet.create({
  card: {
    width: (width - 48) / 2, backgroundColor: Colors.surface,
    borderRadius: 18, overflow: 'hidden', margin: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  imageBg: {
    height: 124, backgroundColor: '#F8FAFC',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 8,
    paddingTop: 14,
  },
  gheeImageBg: { backgroundColor: Colors.surface },
  productImage: { width: 108, height: 98 },
  gheeImage: { width: 82, height: 82 },
  productFallback: {
    width: '82%',
    height: 106,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D7F3DF',
  },
  productFallbackText: { marginTop: 6, fontSize: 12, fontWeight: '900', color: Colors.primary },
  badge: {
    position: 'absolute', top: 8, left: 8, zIndex: 2,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    maxWidth: '72%',
  },
  inlineBadge: {
    alignSelf: 'flex-start',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginBottom: 6,
    marginTop: -2,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  discBadge: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: Colors.error, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  discText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  info: { padding: 11, paddingTop: 10 },
  name: { fontSize: 13, lineHeight: 17, minHeight: 34, fontWeight: '800', color: Colors.textPrimary, marginBottom: 3 },
  unit: { fontSize: 11, color: Colors.textMuted, marginBottom: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
  rating: { fontSize: 11, fontWeight: '700', color: Colors.textPrimary },
  reviews: { fontSize: 10, color: Colors.textMuted },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  price: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  mrp: { fontSize: 12, color: Colors.textMuted, textDecorationLine: 'line-through' },
  cartRow: { paddingHorizontal: 10, paddingBottom: 11 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 11,
    paddingVertical: 8, backgroundColor: '#F1F8E9',
  },
  addBtnText: { color: Colors.primary, fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, borderRadius: 11, paddingHorizontal: 4, paddingVertical: 2,
  },
  qtyBtn: { padding: 6 },
  qtyText: { color: '#fff', fontWeight: '800', fontSize: 15, minWidth: 24, textAlign: 'center' },
});

// Main home screen
export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const greetingOpacity = useRef(new Animated.Value(0)).current;
  const greetingLift = useRef(new Animated.Value(14)).current;
  const greetingIconScale = useRef(new Animated.Value(0.82)).current;

  const { categories, selectedCategory } = useSelector(s => s.products);
  const products = useSelector(selectFilteredProducts);
  const cartItems = useSelector(s => s.cart.items);
  const { hasLiveOrder } = useSelector(s => s.orders);
  const { user } = useSelector(s => s.auth);
  const greeting = getGreetingConfig();

  const headerBg = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [Colors.surface, Colors.surface],
    extrapolate: 'clamp',
  });
  const headerShadow = scrollY.interpolate({
    inputRange: [60, 80],
    outputRange: [0.06, 0.12],
    extrapolate: 'clamp',
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(greetingOpacity, {
        toValue: 1,
        duration: 520,
        useNativeDriver: true,
      }),
      Animated.spring(greetingLift, {
        toValue: 0,
        friction: 7,
        tension: 70,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.spring(greetingIconScale, {
          toValue: 1.08,
          friction: 5,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.spring(greetingIconScale, {
          toValue: 1,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [greetingIconScale, greetingLift, greetingOpacity]);

  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const locationLabel = 'Delivering to';
  const locationName = user?.address?.shortAddress || 'Choose your location';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Floating Header */}
      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
            backgroundColor: headerBg,
            shadowOpacity: headerShadow,
          },
        ]}
      >
        {/* Location Row */}
        <TouchableOpacity style={styles.locationRow} onPress={() => navigation.navigate('AddressPicker')}>
          <View style={styles.locationIcon}>
            <MaterialCommunityIcons name="map-marker" size={20} color={Colors.primary} />
          </View>
          <View style={styles.locationText}>
            <Text style={styles.locationLabel}>{locationLabel}</Text>
            <View style={styles.locationNameRow}>
              <Text style={styles.locationName} numberOfLines={1}>{locationName}</Text>
              <MaterialCommunityIcons name="chevron-down" size={16} color={Colors.textPrimary} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Cart Button */}
        <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
          <MaterialCommunityIcons name="cart-outline" size={24} color={Colors.textPrimary} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        decelerationRate="normal"
        bounces
        overScrollMode="always"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Animated.View
          style={[
            styles.greeting,
            {
              paddingTop: insets.top + 84,
              opacity: greetingOpacity,
              transform: [{ translateY: greetingLift }],
            },
          ]}
        >
          <View style={styles.greetingRow}>
            <Animated.View
              style={[
                styles.greetingIcon,
                { backgroundColor: greeting.bg, transform: [{ scale: greetingIconScale }] },
              ]}
            >
              <MaterialCommunityIcons name={greeting.icon} size={23} color={greeting.color} />
            </Animated.View>
            <View style={{ flex: 1 }}>
              <Text style={styles.greetText}>
                {greeting.label},{' '}
                <Text style={styles.greetName}>{user?.name || 'Guest'}!</Text>
              </Text>
              <Text style={styles.greetSub}>{greeting.sub}</Text>
            </View>
          </View>
        </Animated.View>

        <ServiceStrip navigation={navigation} />

        {/* Tomorrow's Delivery Card (Country Delight style) */}
        {TOMORROW_DELIVERY.items.length > 0 && (
          <View style={styles.tomorrowCard}>
            <View style={styles.tomorrowHeader}>
              <View style={styles.tomorrowHeaderLeft}>
                <MaterialCommunityIcons name="calendar-clock" size={18} color={Colors.primary} />
                <Text style={styles.tomorrowTitle}>Tomorrow's Delivery</Text>
              </View>
              <View style={styles.tomorrowSlotBadge}>
                <Text style={styles.tomorrowSlotText}>{TOMORROW_DELIVERY.slot}</Text>
              </View>
            </View>
            {TOMORROW_DELIVERY.items.map(item => (
              <View key={item.id} style={styles.tomorrowItem}>
                <View style={styles.tomorrowItemIcon}>
                  <MaterialCommunityIcons name="bottle-tonic" size={20} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tomorrowItemName}>{item.name}</Text>
                  <Text style={styles.tomorrowItemUnit}>{item.unit} × {item.qty}</Text>
                </View>
                <Text style={styles.tomorrowItemPrice}>{formatCurrency(item.price)}</Text>
                {item.isSubscription && (
                  <View style={styles.subPill}>
                    <Text style={styles.subPillText}>SUB</Text>
                  </View>
                )}
              </View>
            ))}
            <View style={styles.tomorrowActions}>
              <TouchableOpacity style={styles.tomorrowModifyBtn}>
                <MaterialCommunityIcons name="pencil-outline" size={14} color={Colors.primary} />
                <Text style={styles.tomorrowModifyText}>Modify</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tomorrowSkipBtn}>
                <MaterialCommunityIcons name="skip-next" size={14} color={Colors.warning} />
                <Text style={styles.tomorrowSkipText}>Skip Tomorrow</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.tomorrowCutoff}>Modify before {TOMORROW_DELIVERY.cutoffTime} tonight</Text>
          </View>
        )}

        {/* Live Order Banner */}
        {hasLiveOrder && (
          <TouchableOpacity style={styles.liveOrderBanner} onPress={() => navigation.navigate('OrderTracking')}>
            <View style={styles.liveOrderLeft}>
              <View style={styles.liveDot} />
              <View>
                <Text style={styles.liveOrderTitle}>Order Out for Delivery</Text>
                <Text style={styles.liveOrderSub}>Pench 1 Litre Milk | Tap to track</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.primary} />
          </TouchableOpacity>
        )}

        {/* Search Bar */}
        <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('Search')} activeOpacity={0.85}>
          <MaterialCommunityIcons name="magnify" size={20} color={Colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Search Pench milk or A2 ghee...</Text>
          <View style={styles.searchMic}>
            <MaterialCommunityIcons name="microphone-outline" size={18} color={Colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Banner Carousel */}
        <BannerCarousel navigation={navigation} />

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
        </View>
        <CategoryBar categories={categories} selected={selectedCategory} onSelect={id => dispatch(setCategory(id))} />

        {/* Products Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'all' ? 'All Products' : categories.find(c => c.id === selectedCategory)?.label}
          </Text>
          <Text style={styles.productCount}>{products.length} items</Text>
        </View>

        <View style={styles.productsGrid}>
          {products.map(item => (
            <ProductCard
              key={item.id}
              item={item}
              cartItems={cartItems}
              onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
              onAdd={() => dispatch(addToCart({ product: item, skuId: item.skus[0].id }))}
              onRemove={() => dispatch(removeFromCart(cartItems.find(c => c.id === item.id)?.skuId || item.skus[0].id))}
            />
          ))}
        </View>

        {/* Why Pench */}
        <View style={styles.whySection}>
          <Text style={[styles.sectionTitle, styles.whyTitle]}>Why Pench Foods?</Text>
          {[
            { icon: 'shield-check', title: 'A2 Certified', sub: 'Pure Gir cow milk, tested daily' },
            { icon: 'leaf', title: 'No Preservatives', sub: 'Fresh from farm, nothing added' },
            { icon: 'bottle-wine-outline', title: 'Glass Bottles', sub: 'Eco-friendly, BPA-free delivery' },
            { icon: 'alarm', title: 'By 6:30 AM', sub: 'Before you wake up' },
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <MaterialCommunityIcons name={f.icon} size={22} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureSub}>{f.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Testimonials */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Customer Stories</Text>
        </View>
        {TESTIMONIALS.map(t => (
          <View key={t.id} style={styles.testimonialCard}>
            <View style={styles.testimonialHeader}>
              <View style={styles.testimonialAvatar}>
                <Text style={styles.testimonialAvatarText}>{t.avatar}</Text>
              </View>
              <View>
                <Text style={styles.testimonialName}>{t.name}</Text>
                <Text style={styles.testimonialLoc}>{t.location}</Text>
              </View>
              <View style={styles.testimonialStars}>
                {Array(t.rating).fill(0).map((_, i) => (
                  <MaterialCommunityIcons key={i} name="star" size={12} color={Colors.star} />
                ))}
              </View>
            </View>
            <Text style={styles.testimonialText}>"{t.text}"</Text>
          </View>
        ))}
      </Animated.ScrollView>

      {/* Floating Cart Bar */}
      {cartCount > 0 && (
        <TouchableOpacity style={styles.floatingCart} onPress={() => navigation.navigate('Cart')} activeOpacity={0.92}>
          <View style={styles.floatingCartLeft}>
            <View style={styles.floatingCartBadge}><Text style={styles.floatingCartBadgeText}>{cartCount}</Text></View>
            <Text style={styles.floatingCartLabel}>View Cart</Text>
          </View>
          <Text style={styles.floatingCartTotal}>{formatCurrency(cartTotal)} {'->'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowRadius: 14, elevation: 5,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: { flex: 1 },
  locationLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  locationNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 0 },
  locationName: { flex: 1, fontSize: 15, fontWeight: '900', color: Colors.textPrimary },
  cartBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginLeft: 10,
  },
  cartBadge: {
    position: 'absolute', top: 2, right: 2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  greeting: { paddingHorizontal: 16, paddingBottom: 12 },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  greetingIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetText: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  greetName: { fontWeight: '900', color: Colors.primary },
  greetSub: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  liveOrderBanner: {
    marginHorizontal: 16, marginBottom: 12, backgroundColor: '#ECFDF5',
    borderRadius: 18, padding: 15, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderWidth: 1, borderColor: '#BBF7D0',
  },
  liveOrderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.success },
  liveOrderTitle: { fontSize: 14, fontWeight: '700', color: Colors.primaryDark },
  liveOrderSub: { fontSize: 12, color: Colors.primary },
  searchBar: {
    marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.surface,
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },
  searchPlaceholder: { flex: 1, color: Colors.textMuted, fontSize: 14 },
  searchMic: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: '#ECFDF5',
    alignItems: 'center', justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, marginTop: 22, marginBottom: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  productCount: { fontSize: 13, color: Colors.textMuted },
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 },
  whySection: {
    marginHorizontal: 16, marginTop: 24, backgroundColor: '#111827',
    borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 5,
  },
  whyTitle: { color: '#fff', marginBottom: 4 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  featureIcon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(34,197,94,0.16)',
    alignItems: 'center', justifyContent: 'center',
  },
  featureTitle: { fontSize: 14, fontWeight: '800', color: '#fff' },
  featureSub: { fontSize: 12, color: 'rgba(255,255,255,0.66)' },
  testimonialCard: {
    marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.surface,
    borderRadius: 18, padding: 16, borderWidth: 1, borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  testimonialHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  testimonialAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  testimonialAvatarText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  testimonialName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  testimonialLoc: { fontSize: 11, color: Colors.textMuted },
  testimonialStars: { flexDirection: 'row', gap: 2, marginLeft: 'auto' },
  testimonialText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, fontStyle: 'italic' },
  floatingCart: {
    position: 'absolute', bottom: 90, left: 16, right: 16,
    backgroundColor: '#111827', borderRadius: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    shadowColor: '#111827', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 12,
  },
  floatingCartLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  floatingCartBadge: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  floatingCartBadgeText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  floatingCartLabel: { color: '#fff', fontWeight: '700', fontSize: 15 },
  floatingCartTotal: { color: '#fff', fontWeight: '800', fontSize: 15 },
  // Tomorrow delivery card
  tomorrowCard: {
    marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.surface,
    borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#BBF7D0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 3,
  },
  tomorrowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  tomorrowHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tomorrowTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  tomorrowSlotBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  tomorrowSlotText: { fontSize: 11, fontWeight: '700', color: Colors.primaryDark },
  tomorrowItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  tomorrowItemIcon: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: '#ECFDF5',
    alignItems: 'center', justifyContent: 'center',
  },
  tomorrowItemName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  tomorrowItemUnit: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  tomorrowItemPrice: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  subPill: { backgroundColor: Colors.primary, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  subPillText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  tomorrowActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  tomorrowModifyBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 12, paddingVertical: 10,
  },
  tomorrowModifyText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  tomorrowSkipBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: Colors.warning, borderRadius: 12, paddingVertical: 10,
  },
  tomorrowSkipText: { color: Colors.warning, fontWeight: '700', fontSize: 13 },
  tomorrowCutoff: { fontSize: 11, color: Colors.textMuted, marginTop: 10, textAlign: 'center' },
});


