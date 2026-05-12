import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList,
  TouchableOpacity, StatusBar, Keyboard, Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from '../../store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setSearchQuery, clearSearch } from '../../store/slices/productsSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { Colors } from '../../theme/colors';
import { formatCurrency } from '../../utils/formatters';

const QUICK_SEARCHES = ['Pench Milk', 'Half Litre Milk', 'A2 Ghee', '1 KG Ghee', 'Glass Bottle'];

export default function SearchScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const inputRef = useRef(null);
  const { searchQuery, searchResults, isSearching } = useSelector(s => s.products);
  const cartItems = useSelector(s => s.cart.items);

  const debounceRef = useRef(null);

  const handleSearch = useCallback((text) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      dispatch(setSearchQuery(text));
    }, 250);
  }, []);

  const handleClear = () => {
    dispatch(clearSearch());
    inputRef.current?.clear();
  };

  const renderResult = ({ item }) => {
    const cartItem = cartItems.find(c => c.id === item.id);
    const qty = cartItem?.quantity || 0;
    return (
      <TouchableOpacity
        style={rStyles.row}
        onPress={() => { Keyboard.dismiss(); navigation.navigate('ProductDetail', { productId: item.id }); }}
        activeOpacity={0.85}
      >
        <View style={rStyles.iconBox}>
          <Image source={{ uri: item.image }} style={rStyles.productImage} resizeMode="contain" />
        </View>
        <View style={rStyles.info}>
          <Text style={rStyles.name}>{item.name}</Text>
          <Text style={rStyles.meta}>{item.unit} | Rating {item.rating}</Text>
        </View>
        <View style={rStyles.priceCol}>
          <Text style={rStyles.price}>{formatCurrency(item.price)}</Text>
          {qty > 0 ? (
            <Text style={rStyles.inCart}>In cart: {qty}</Text>
          ) : (
            <TouchableOpacity
              style={rStyles.addBtn}
              onPress={() => dispatch(addToCart({ product: item, skuId: item.skus[0].id }))}
            >
              <Text style={rStyles.addBtnText}>ADD</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      {/* Search Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.inputWrap}>
          <MaterialCommunityIcons name="magnify" size={20} color={Colors.primary} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Search Pench milk or A2 ghee..."
            placeholderTextColor={Colors.textMuted}
            onChangeText={handleSearch}
            autoFocus
            returnKeyType="search"
          />
          {isSearching && (
            <TouchableOpacity onPress={handleClear}>
              <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!isSearching ? (
        <View style={styles.body}>
          <Text style={styles.sectionTitle}>Popular Searches</Text>
          <View style={styles.chipsRow}>
            {QUICK_SEARCHES.map(q => (
              <TouchableOpacity
                key={q}
                style={styles.chip}
                onPress={() => { inputRef.current?.setNativeProps({ text: q }); dispatch(setSearchQuery(q)); }}
              >
                <MaterialCommunityIcons name="trending-up" size={14} color={Colors.primary} />
                <Text style={styles.chipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={i => i.id}
          renderItem={renderResult}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="magnify-close" size={56} color={Colors.border} />
              <Text style={styles.emptyText}>No results found</Text>
              <Text style={styles.emptySub}>Try "milk", "half litre" or "ghee"</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </View>
  );
}

const rStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  iconBox: {
    width: 52, height: 52, borderRadius: 14, backgroundColor: Colors.successLight,
    alignItems: 'center', justifyContent: 'center',
  },
  productImage: { width: 46, height: 46 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 3 },
  meta: { fontSize: 12, color: Colors.textMuted },
  priceCol: { alignItems: 'flex-end', gap: 6 },
  price: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  inCart: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  addBtn: { borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  addBtnText: { color: Colors.primary, fontWeight: '800', fontSize: 12 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { padding: 4 },
  inputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.background, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  input: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  body: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 14 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 50 },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, color: Colors.textMuted },
});
