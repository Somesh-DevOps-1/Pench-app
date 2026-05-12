import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  StatusBar, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from '../../store';
import { reverseGeocode, searchAddress } from '../../services/geocoding';
import { isInDeliveryZone } from '../../utils/distance';
import { updateProfile } from '../../store/slices/authSlice';
import { Colors } from '../../theme/colors';
import { PENCH_WAREHOUSE } from '../../data/mockData';
import { setStoredSession } from '../../utils/storage';

export default function AddressPickerScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const searchDebounceRef = useRef(null);
  const requestIdRef = useRef(0);
  const [address, setAddress] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [inZone, setInZone] = useState(true);

  // Auto-detect live location on mount
  useEffect(() => {
    let cancelled = false;

    const autoDetect = async () => {
      setLoadingLocation(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || cancelled) {
          setLoadingLocation(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;

        await applyLocation(location.coords.latitude, location.coords.longitude);
      } catch {
        // Silently fail; user can tap the button manually
      }
      if (!cancelled) setLoadingLocation(false);
    };

    autoDetect();

    return () => {
      cancelled = true;
      clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const applyLocation = async (latitude, longitude, fallbackAddress = null) => {
    const zone = isInDeliveryZone(latitude, longitude);
    setInZone(zone);
    if (!zone) {
      setAddress(null);
      setResolvingAddress(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setResolvingAddress(true);
    const geocodedAddress = fallbackAddress || await reverseGeocode(latitude, longitude);
    if (requestId !== requestIdRef.current) {
      return;
    }

    if (geocodedAddress) {
      setAddress({
        ...geocodedAddress,
        latitude,
        longitude,
      });
      setSearchText(geocodedAddress.shortAddress || geocodedAddress.displayName || '');
    } else {
      setAddress(null);
    }
    setResolvingAddress(false);
  };

  const detectLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Enable location permission in your browser to auto-detect your address.',
        );
        setLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await applyLocation(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      Alert.alert('Error', 'Could not detect location. Please search manually.');
    }
    setLoadingLocation(false);
  };

  const handleSearch = (text) => {
    setSearchText(text);
    clearTimeout(searchDebounceRef.current);
    if (!text.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      const results = await searchAddress(text);
      setSearchResults(results);
      setSearching(false);
    }, 700);
  };

  const selectSearchResult = async (result) => {
    setSearchText(result.shortName);
    setSearchResults([]);
    await applyLocation(result.latitude, result.longitude, result.address);
  };

  const confirmAddress = async () => {
    if (!inZone) {
      Alert.alert(
        'Outside Delivery Zone',
        'Pench Foods currently delivers across Maharashtra. Please select a location within Maharashtra.',
      );
      return;
    }

    dispatch(updateProfile({ address }));

    if (user?.token) {
      const nextUser = {
        ...user,
        address,
      };
      await setStoredSession(nextUser);
    }

    Alert.alert('Address Saved!', address?.shortAddress || 'Your address has been saved.', [
      { text: 'Done', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Set Delivery Location</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search area, street, colony..."
            placeholderTextColor={Colors.textMuted}
            value={searchText}
            onChangeText={handleSearch}
          />
          {searching ? <ActivityIndicator size="small" color={Colors.primary} /> : null}
        </View>

        {searchResults.length > 0 && (
          <View style={styles.dropdown}>
            {searchResults.map(result => (
              <TouchableOpacity
                key={result.id}
                style={styles.dropdownRow}
                onPress={() => selectSearchResult(result)}
              >
                <MaterialCommunityIcons name="map-marker-outline" size={18} color={Colors.primary} />
                <Text style={styles.dropdownText}>{result.displayName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.webCard}>
          <View style={styles.webCardHeader}>
            <MaterialCommunityIcons name="monitor-dashboard" size={22} color={Colors.primary} />
            <Text style={styles.webCardTitle}>Web Address Selection</Text>
          </View>
          <Text style={styles.webCardBody}>
            Interactive map selection is available in the iOS and Android apps. On web, you can search for an address or use browser location detection.
          </Text>
          <TouchableOpacity style={styles.detectBtn} onPress={detectLocation}>
            {loadingLocation ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="crosshairs-gps" size={18} color="#fff" />
                <Text style={styles.detectBtnText}>Use My Current Location</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Delivery Coverage</Text>
          <Text style={styles.summaryCopy}>
            Pench Foods currently serves major cities across Maharashtra.
          </Text>
          <View style={styles.summaryRow}>
            <MaterialCommunityIcons name="store" size={18} color={Colors.primary} />
            <Text style={styles.summaryValue}>{PENCH_WAREHOUSE.label}</Text>
          </View>
          <View style={styles.summaryRow}>
            <MaterialCommunityIcons
              name={inZone ? 'check-circle' : 'alert-circle'}
              size={18}
              color={inZone ? Colors.success : Colors.error}
            />
            <Text style={[styles.summaryValue, !inZone && { color: Colors.error }]}>
              {inZone
                ? resolvingAddress
                  ? 'Fetching address...'
                  : address?.shortAddress || 'Search or detect a location to continue'
                : 'Selected address is outside the delivery zone'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.confirmBtn, (!address || !inZone || resolvingAddress) && styles.confirmBtnDisabled]}
          onPress={confirmAddress}
          disabled={!address || !inZone || resolvingAddress}
        >
          <Text style={styles.confirmBtnText}>
            {resolvingAddress ? 'Resolving Address...' : 'Confirm Location'}
          </Text>
        </TouchableOpacity>
      </View>
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
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  content: { padding: 16, paddingBottom: 120 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  dropdown: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    marginTop: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dropdownText: { flex: 1, fontSize: 13, color: Colors.textPrimary },
  webCard: {
    marginTop: 16,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  webCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  webCardTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  webCardBody: { fontSize: 13, lineHeight: 20, color: Colors.textSecondary, marginBottom: 16 },
  detectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  detectBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  summaryCard: {
    marginTop: 16,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
  },
  summaryTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  summaryCopy: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, marginBottom: 14 },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  summaryValue: { flex: 1, fontSize: 13, color: Colors.textPrimary, lineHeight: 18 },
  bottomPanel: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmBtnDisabled: { backgroundColor: Colors.border },
  confirmBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
