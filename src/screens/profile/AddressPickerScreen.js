import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  StatusBar, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from '../../store';
import { reverseGeocode, searchAddress } from '../../services/geocoding';
import { isInDeliveryZone, getNearestCity } from '../../utils/distance';
import { updateProfile } from '../../store/slices/authSlice';
import { Colors } from '../../theme/colors';
import { PENCH_WAREHOUSE } from '../../data/mockData';
import { setStoredSession } from '../../utils/storage';
import { customerApi } from '../../services/api';

export default function AddressPickerScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const mapRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const reverseDebounceRef = useRef(null);
  const requestIdRef = useRef(0);
  const suppressNextRegionResolveRef = useRef(false);
  const [region, setRegion] = useState({
    latitude: 21.1458,
    longitude: 79.0882,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  });
  const [address, setAddress] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [nearestCity, setNearestCity] = useState('');
  const [inZone, setInZone] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [formAddress, setFormAddress] = useState({
    houseNumber: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    postcode: '',
    receiverName: user?.name || '',
    receiverPhone: user?.phone || '',
    addressType: 'Home',
  });

  const buildFallbackAddress = (latitude, longitude, city = getNearestCity(latitude, longitude)) => {
    const coordinateLabel = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    return {
      latitude,
      longitude,
      displayName: `Pinned location (${coordinateLabel}), ${city}, Maharashtra, India`,
      fullAddress: `Pinned location (${coordinateLabel}), ${city}, Maharashtra, India`,
      addressLine1: 'Pinned location',
      addressLine2: `${city}, Maharashtra`,
      locality: city,
      city,
      state: 'Maharashtra',
      country: 'India',
      shortAddress: `Pinned location, ${city}`,
      coordinatesText: coordinateLabel,
      isFallbackAddress: true,
    };
  };

  const reverseGeocodeWithFallback = async (latitude, longitude, fallbackAddress = null) => {
    if (fallbackAddress) {
      return { ...fallbackAddress, latitude, longitude };
    }

    const osmAddress = await reverseGeocode(latitude, longitude);
    if (osmAddress) {
      return { ...osmAddress, latitude, longitude };
    }

    try {
      const [deviceAddress] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (deviceAddress) {
        const city = deviceAddress.city || deviceAddress.subregion || getNearestCity(latitude, longitude);
        const addressLine1 = [
          deviceAddress.name,
          deviceAddress.streetNumber,
          deviceAddress.street,
        ].filter(Boolean).join(', ') || 'Pinned location';
        const addressLine2 = [
          deviceAddress.district,
          city,
          deviceAddress.region || 'Maharashtra',
        ].filter(Boolean).join(', ');

        return {
          latitude,
          longitude,
          displayName: [addressLine1, addressLine2, deviceAddress.postalCode, deviceAddress.country].filter(Boolean).join(', '),
          fullAddress: [addressLine1, addressLine2, deviceAddress.postalCode, deviceAddress.country].filter(Boolean).join(', '),
          addressLine1,
          addressLine2,
          locality: deviceAddress.district || city,
          city,
          state: deviceAddress.region || 'Maharashtra',
          postcode: deviceAddress.postalCode,
          country: deviceAddress.country || 'India',
          shortAddress: [addressLine1, city].filter(Boolean).join(', '),
        };
      }
    } catch {
      // Fall through to a coordinate-backed address so users can still save the pin.
    }

    return buildFallbackAddress(latitude, longitude);
  };

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
          accuracy: Location.Accuracy.BestForNavigation || Location.Accuracy.High,
        });
        if (cancelled) return;

        const { latitude, longitude } = location.coords;
        const city = getNearestCity(latitude, longitude);
        setNearestCity(city);
        const nextRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(nextRegion);
        suppressNextRegionResolveRef.current = true;
        mapRef.current?.animateToRegion(nextRegion, 600);
        setInZone(isInDeliveryZone(latitude, longitude));
        await resolveAddress(latitude, longitude);
      } catch {
        // Silently fail on auto-detect; user can tap GPS button manually
      }
      if (!cancelled) setLoadingLocation(false);
    };

    autoDetect();

    return () => {
      cancelled = true;
      clearTimeout(searchDebounceRef.current);
      clearTimeout(reverseDebounceRef.current);
    };
  }, []);

  const resolveAddress = async (latitude, longitude, fallbackAddress = null) => {
    const requestId = ++requestIdRef.current;
    setResolvingAddress(true);

    const geocodedAddress = await reverseGeocodeWithFallback(latitude, longitude, fallbackAddress);

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
      setAddress(buildFallbackAddress(latitude, longitude));
    }
    setResolvingAddress(false);
  };

  const onRegionChangeComplete = async (nextRegion) => {
    setRegion(nextRegion);
    const zone = isInDeliveryZone(nextRegion.latitude, nextRegion.longitude);
    setInZone(zone);
    const city = getNearestCity(nextRegion.latitude, nextRegion.longitude);
    setNearestCity(city);

    if (!zone) {
      setAddress(null);
      setResolvingAddress(false);
      return;
    }

    setAddress(buildFallbackAddress(nextRegion.latitude, nextRegion.longitude, city));

    if (suppressNextRegionResolveRef.current) {
      suppressNextRegionResolveRef.current = false;
      return;
    }

    clearTimeout(reverseDebounceRef.current);
    setResolvingAddress(true);
    reverseDebounceRef.current = setTimeout(() => {
      resolveAddress(nextRegion.latitude, nextRegion.longitude);
    }, 900);
  };

  const detectLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Enable location permission in Settings to auto-detect your address.',
        );
        setLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation || Location.Accuracy.High,
      });
      const { latitude, longitude } = location.coords;
      const city = getNearestCity(latitude, longitude);
      setNearestCity(city);
      const nextRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(nextRegion);
      suppressNextRegionResolveRef.current = true;
      mapRef.current?.animateToRegion(nextRegion, 600);
      setInZone(isInDeliveryZone(latitude, longitude));
      await resolveAddress(latitude, longitude);
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
    const nextRegion = {
      latitude: result.latitude,
      longitude: result.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    setRegion(nextRegion);
    suppressNextRegionResolveRef.current = true;
    mapRef.current?.animateToRegion(nextRegion, 600);
    setSearchText(result.shortName);
    setSearchResults([]);
    const zone = isInDeliveryZone(result.latitude, result.longitude);
    setInZone(zone);
    setNearestCity(getNearestCity(result.latitude, result.longitude));
    await resolveAddress(result.latitude, result.longitude, result.address);
  };

  const syncAddressForm = (nextAddress) => {
    setFormAddress({
      houseNumber: nextAddress?.houseNumber || '',
      addressLine1: nextAddress?.addressLine1 || nextAddress?.shortAddress || '',
      addressLine2: nextAddress?.addressLine2 || '',
      landmark: nextAddress?.landmark || '',
      city: nextAddress?.city || nearestCity || getNearestCity(region.latitude, region.longitude),
      postcode: nextAddress?.postcode || '',
      receiverName: user?.name || '',
      receiverPhone: user?.phone || '',
      addressType: nextAddress?.addressType || 'Home',
    });
  };

  const openAddressForm = async () => {
    if (!inZone) {
      Alert.alert(
        'Outside Delivery Zone',
        'Pench Foods currently delivers across Maharashtra. Please select a location within Maharashtra.',
      );
      return;
    }

    setResolvingAddress(true);
    const resolvedCurrentAddress = await reverseGeocodeWithFallback(
      region.latitude,
      region.longitude,
      address?.isFallbackAddress ? null : address,
    );
    setResolvingAddress(false);

    const exactAddress = {
      ...(resolvedCurrentAddress || buildFallbackAddress(region.latitude, region.longitude, nearestCity || getNearestCity(region.latitude, region.longitude))),
      latitude: region.latitude,
      longitude: region.longitude,
      isExactLocation: true,
    };

    setAddress(exactAddress);
    syncAddressForm(exactAddress);
    setShowAddressForm(true);
  };

  const updateFormAddress = (key, value) => {
    setFormAddress(current => ({ ...current, [key]: value }));
  };

  const saveAddressFromForm = async () => {
    const city = formAddress.city.trim() || nearestCity || getNearestCity(region.latitude, region.longitude);
    const addressLine1 = [
      formAddress.houseNumber.trim(),
      formAddress.addressLine1.trim(),
    ].filter(Boolean).join(', ') || 'Pinned location';
    const addressLine2 = [
      formAddress.addressLine2.trim(),
      city,
      'Maharashtra',
    ].filter(Boolean).join(', ');

    const confirmedAddress = {
      ...(address || buildFallbackAddress(region.latitude, region.longitude, city)),
      houseNumber: formAddress.houseNumber.trim(),
      addressLine1,
      addressLine2,
      landmark: formAddress.landmark.trim(),
      city,
      postcode: formAddress.postcode.trim(),
      receiverName: formAddress.receiverName.trim(),
      receiverPhone: formAddress.receiverPhone.trim(),
      addressType: formAddress.addressType,
      label: formAddress.addressType,
      shortAddress: [addressLine1, city].filter(Boolean).join(', '),
      fullAddress: [
        addressLine1,
        formAddress.landmark.trim(),
        addressLine2,
        formAddress.postcode.trim(),
        'India',
      ].filter(Boolean).join(', '),
      latitude: region.latitude,
      longitude: region.longitude,
      isExactLocation: true,
    };

    dispatch(updateProfile({ address: confirmedAddress }));

    let savedCustomer = null;
    try {
      savedCustomer = await customerApi.upsertCustomer({
        id: typeof user?.id === 'number' ? user.id : undefined,
        name: user?.name || confirmedAddress.receiverName || 'Customer',
        phone: user?.phone || confirmedAddress.receiverPhone,
        email: user?.email || '',
        address: confirmedAddress.fullAddress,
        address_line1: confirmedAddress.addressLine1,
        address_line2: confirmedAddress.addressLine2,
        landmark: confirmedAddress.landmark,
        city: confirmedAddress.city,
        postcode: confirmedAddress.postcode,
        address_type: confirmedAddress.addressType,
        receiver_name: confirmedAddress.receiverName,
        receiver_phone: confirmedAddress.receiverPhone,
        latitude: confirmedAddress.latitude,
        longitude: confirmedAddress.longitude,
      });
    } catch (error) {
      console.warn('Customer address sync failed:', error);
    }

    if (user?.token) {
      const nextUser = {
        ...user,
        id: savedCustomer?.id || user.id,
        address: confirmedAddress,
      };
      await setStoredSession(nextUser);
    }

    Alert.alert('Address Saved!', confirmedAddress?.shortAddress || 'Your address has been saved.', [
      { text: 'Done', onPress: () => navigation.goBack() },
    ]);
  };

  const canConfirmLocation = inZone && Number.isFinite(region.latitude) && Number.isFinite(region.longitude);
  const canSaveAddress = formAddress.houseNumber.trim().length > 0 && formAddress.addressLine1.trim().length > 0;

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

      <View style={styles.searchContainer}>
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
                <Text style={styles.dropdownText} numberOfLines={2}>{result.displayName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_DEFAULT}
          region={region}
          onRegionChangeComplete={onRegionChangeComplete}
          showsUserLocation
          showsMyLocationButton={false}
        >
          <Marker coordinate={PENCH_WAREHOUSE} title={PENCH_WAREHOUSE.label}>
            <View style={styles.warehouseMarker}>
              <MaterialCommunityIcons name="store" size={14} color="#fff" />
            </View>
          </Marker>
        </MapView>

        <View style={styles.centerPin}>
          <View style={styles.pin}>
            <MaterialCommunityIcons
              name="map-marker"
              size={36}
              color={inZone ? Colors.primary : Colors.error}
            />
          </View>
          <View
            style={[
              styles.pinShadow,
              { backgroundColor: inZone ? Colors.primary : Colors.error },
            ]}
          />
        </View>

        <TouchableOpacity style={styles.detectBtn} onPress={detectLocation}>
          {loadingLocation ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <MaterialCommunityIcons name="crosshairs-gps" size={22} color={Colors.primary} />
          )}
        </TouchableOpacity>

        <View style={styles.osmAttrib}>
          <Text style={styles.osmText}>(c) OpenStreetMap contributors</Text>
        </View>
      </View>

      <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.addressInfo}>
          <MaterialCommunityIcons
            name={inZone ? 'map-marker-check' : 'map-marker-off'}
            size={22}
            color={inZone ? Colors.primary : Colors.error}
          />
          <View style={{ flex: 1 }}>
            {inZone ? (
              <>
                <Text style={styles.addressMain} numberOfLines={1}>
                  {resolvingAddress ? 'Fetching address...' : address?.shortAddress || 'Move map to set location'}
                </Text>
                <Text style={styles.addressCity}>
                  {address?.addressLine2 || `${nearestCity || 'Maharashtra'}, India`}
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.addressMain, { color: Colors.error }]}>Outside Delivery Zone</Text>
                <Text style={styles.addressCity}>Pench Foods delivers across Maharashtra cities</Text>
              </>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.confirmBtn,
            !canConfirmLocation && { backgroundColor: Colors.border },
          ]}
          onPress={openAddressForm}
          disabled={!canConfirmLocation}
        >
          <Text style={styles.confirmBtnText}>Confirm Location</Text>
        </TouchableOpacity>
      </View>

      {showAddressForm && (
        <View style={styles.formOverlay}>
          <TouchableOpacity style={styles.formBackdrop} activeOpacity={1} onPress={() => setShowAddressForm(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
          >
            <View style={[styles.formSheet, { paddingBottom: insets.bottom + 16 }]}>
              <View style={styles.formHandle} />
              <View style={styles.formHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formTitle}>Enter complete address</Text>
                  <Text style={styles.formSub}>Your pin is locked for delivery accuracy</Text>
                </View>
                <TouchableOpacity style={styles.formCloseBtn} onPress={() => setShowAddressForm(false)}>
                  <MaterialCommunityIcons name="close" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.formScrollContent}
              >
                <View style={styles.pinnedCard}>
                  <View style={styles.pinnedIcon}>
                    <MaterialCommunityIcons name="map-marker" size={20} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pinnedTitle} numberOfLines={1}>
                      {address?.shortAddress || 'Pinned delivery location'}
                    </Text>
                    <Text style={styles.pinnedSub} numberOfLines={2}>
                      {address?.fullAddress || `${region.latitude.toFixed(6)}, ${region.longitude.toFixed(6)}`}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowAddressForm(false)}>
                    <Text style={styles.changePinText}>Change</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.fieldLabel}>House / Flat / Block No.</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Example: Flat 302, B Wing"
                  placeholderTextColor={Colors.textMuted}
                  value={formAddress.houseNumber}
                  onChangeText={value => updateFormAddress('houseNumber', value)}
                  returnKeyType="next"
                />

                <Text style={styles.fieldLabel}>Apartment / Road / Area</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Example: Shankar Nagar Road"
                  placeholderTextColor={Colors.textMuted}
                  value={formAddress.addressLine1}
                  onChangeText={value => updateFormAddress('addressLine1', value)}
                  returnKeyType="next"
                />

                <Text style={styles.fieldLabel}>Locality</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Example: Civil Lines"
                  placeholderTextColor={Colors.textMuted}
                  value={formAddress.addressLine2}
                  onChangeText={value => updateFormAddress('addressLine2', value)}
                  returnKeyType="next"
                />

                <Text style={styles.fieldLabel}>Landmark</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Optional"
                  placeholderTextColor={Colors.textMuted}
                  value={formAddress.landmark}
                  onChangeText={value => updateFormAddress('landmark', value)}
                  returnKeyType="next"
                />

                <View style={styles.formRow}>
                  <View style={styles.formHalfInput}>
                    <Text style={styles.fieldLabel}>City</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="City"
                      placeholderTextColor={Colors.textMuted}
                      value={formAddress.city}
                      onChangeText={value => updateFormAddress('city', value)}
                      returnKeyType="next"
                    />
                  </View>
                  <View style={styles.formHalfInput}>
                    <Text style={styles.fieldLabel}>Pincode</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Optional"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="number-pad"
                      value={formAddress.postcode}
                      onChangeText={value => updateFormAddress('postcode', value)}
                    />
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Save address as</Text>
                <View style={styles.addressTypeRow}>
                  {[
                    { label: 'Home', icon: 'home-outline' },
                    { label: 'Work', icon: 'briefcase-outline' },
                    { label: 'Other', icon: 'map-marker-outline' },
                  ].map(type => {
                    const active = formAddress.addressType === type.label;
                    return (
                      <TouchableOpacity
                        key={type.label}
                        style={[styles.addressTypeChip, active && styles.addressTypeChipActive]}
                        onPress={() => updateFormAddress('addressType', type.label)}
                      >
                        <MaterialCommunityIcons name={type.icon} size={16} color={active ? Colors.primary : Colors.textSecondary} />
                        <Text style={[styles.addressTypeText, active && styles.addressTypeTextActive]}>{type.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.receiverBox}>
                  <Text style={styles.receiverTitle}>Receiver details</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Receiver name"
                    placeholderTextColor={Colors.textMuted}
                    value={formAddress.receiverName}
                    onChangeText={value => updateFormAddress('receiverName', value)}
                    returnKeyType="next"
                  />
                  <TextInput
                    style={styles.formInput}
                    placeholder="Receiver mobile number"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="phone-pad"
                    value={formAddress.receiverPhone}
                    onChangeText={value => updateFormAddress('receiverPhone', value)}
                  />
                </View>
              </ScrollView>

              <View style={styles.formFooter}>
                <TouchableOpacity
                  style={[styles.saveAddressBtn, !canSaveAddress && styles.saveAddressBtnDisabled]}
                  onPress={saveAddressFromForm}
                  disabled={!canSaveAddress}
                  activeOpacity={0.9}
                >
                  <Text style={styles.saveAddressBtnText}>Save Exact Address</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
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
    zIndex: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  searchContainer: { position: 'absolute', top: 80, left: 16, right: 16, zIndex: 100 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  dropdown: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
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
  mapContainer: { flex: 1, position: 'relative' },
  centerPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -18,
    marginTop: -36,
    alignItems: 'center',
  },
  pin: { zIndex: 10 },
  pinShadow: { width: 12, height: 6, borderRadius: 6, opacity: 0.3, marginTop: -4 },
  warehouseMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.secondaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  detectBtn: {
    position: 'absolute',
    bottom: 90,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  osmAttrib: {
    position: 'absolute',
    bottom: 4,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  osmText: { fontSize: 9, color: '#555' },
  bottomPanel: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  addressInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  addressMain: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  addressCity: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  formOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 200,
  },
  formBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  formSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 20,
  },
  formHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  formHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  formCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formTitle: { fontSize: 20, fontWeight: '900', color: Colors.textPrimary },
  formSub: { fontSize: 12, color: Colors.textMuted, marginTop: 3 },
  formScrollContent: { paddingBottom: 10 },
  pinnedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.successLight,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D7EFD9',
  },
  pinnedIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinnedTitle: { fontSize: 14, fontWeight: '900', color: Colors.textPrimary },
  pinnedSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, lineHeight: 17 },
  changePinText: { color: Colors.primary, fontSize: 12, fontWeight: '900' },
  fieldLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '800',
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 13,
  },
  formRow: { flexDirection: 'row', gap: 10 },
  formHalfInput: { flex: 1 },
  addressTypeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  addressTypeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingVertical: 11,
  },
  addressTypeChipActive: { borderColor: Colors.primary, backgroundColor: Colors.successLight },
  addressTypeText: { fontSize: 13, fontWeight: '800', color: Colors.textSecondary },
  addressTypeTextActive: { color: Colors.primary },
  receiverBox: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 14,
    marginTop: 2,
  },
  receiverTitle: { fontSize: 14, fontWeight: '900', color: Colors.textPrimary, marginBottom: 10 },
  formFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 12,
    backgroundColor: Colors.surface,
  },
  saveAddressBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveAddressBtnDisabled: { backgroundColor: Colors.border },
  saveAddressBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
