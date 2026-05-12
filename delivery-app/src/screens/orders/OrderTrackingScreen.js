import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar,
  Animated, ScrollView, Linking, Dimensions,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from '../../store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { updateAgentLocation, deliverLiveOrder } from '../../store/slices/ordersSlice';
import { Colors } from '../../theme/colors';
import { interpolateCoords } from '../../utils/distance';
import { formatCurrency } from '../../utils/formatters';
import { USER_ROLES } from '../../utils/auth';
import DeliveryBrandLogo from '../../components/DeliveryBrandLogo';
import { DELIVERY_ASSIGNMENTS } from '../../data/deliveryData';

const { height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.52;

const STATUS_STEPS = [
  { key: 'placed', label: 'Order Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'out_for_delivery', label: 'Picked Up & Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

function isValidCoordinate(coordinate) {
  return (
    coordinate &&
    Number.isFinite(coordinate.latitude) &&
    Number.isFinite(coordinate.longitude)
  );
}

function getCustomerCoordinate(assignment, liveOrder, user) {
  const customer = assignment?.customer || liveOrder?.customer;
  if (isValidCoordinate(customer)) {
    return {
      latitude: customer.latitude,
      longitude: customer.longitude,
      label: customer.address || liveOrder?.deliveryAddress || liveOrder?.route?.destination?.label,
    };
  }

  if (isValidCoordinate(user?.address)) {
    return {
      latitude: user.address.latitude,
      longitude: user.address.longitude,
      label: user.address.shortAddress || user.address.fullAddress || liveOrder?.deliveryAddress,
    };
  }

  return liveOrder?.route?.destination;
}

export default function OrderTrackingScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { liveOrder, hasLiveOrder } = useSelector(state => state.orders);
  const user = useSelector(state => state.auth.user);
  const mapRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const animFrame = useRef(null);
  const locationSubscriptionRef = useRef(null);
  const progress = useRef(0);
  const isDeliveryPartner = user?.role === USER_ROLES.DELIVERY;
  const assignment = isDeliveryPartner
    ? route?.params?.assignment
      || DELIVERY_ASSIGNMENTS.find(item => item.orderId === liveOrder?.id || item.id === route?.params?.assignmentId)
    : null;
  const [agentCoords, setAgentCoords] = useState(liveOrder?.route?.agentLocation);
  const [locationMode, setLocationMode] = useState(isDeliveryPartner ? 'requesting' : 'simulated');
  const routeOrigin = liveOrder?.route?.origin;
  const routeDestination = getCustomerCoordinate(assignment, liveOrder, user);
  const hasRoute = isValidCoordinate(routeOrigin) && isValidCoordinate(routeDestination);
  const isDelivered = liveOrder?.status === 'delivered' || hasLiveOrder === false;
  const customerAddress = assignment?.customer?.address
    || user?.address?.shortAddress
    || user?.address?.fullAddress
    || liveOrder?.deliveryAddress
    || routeDestination?.label
    || 'Customer destination';
  const customerPhone = assignment?.customer?.phone || liveOrder?.customer?.phone || liveOrder?.deliveryAgent?.phone;

  useEffect(() => {
    Animated.timing(slideAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [slideAnim]);

  useEffect(() => {
    if (!hasRoute) {
      return undefined;
    }

    if (isDelivered) {
      locationSubscriptionRef.current?.remove();
      locationSubscriptionRef.current = null;
      if (animFrame.current) {
        cancelAnimationFrame(animFrame.current);
      }
      setAgentCoords(routeDestination);
      setLocationMode('delivered');
      return undefined;
    }

    if (isDeliveryPartner) {
      let isMounted = true;

      const startLiveTracking = async () => {
        try {
          setLocationMode('requesting');
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (!isMounted) {
            return;
          }

          if (status !== 'granted') {
            setLocationMode('permission_denied');
            return;
          }

          const currentPosition = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.BestForNavigation || Location.Accuracy.High,
          });

          if (!isMounted) {
            return;
          }

          const currentCoords = {
            latitude: currentPosition.coords.latitude,
            longitude: currentPosition.coords.longitude,
          };

          setAgentCoords(currentCoords);
          dispatch(updateAgentLocation(currentCoords));
          setLocationMode('live');
          mapRef.current?.animateToRegion(
            {
              latitude: currentCoords.latitude,
              longitude: currentCoords.longitude,
              latitudeDelta: 0.015,
              longitudeDelta: 0.015,
            },
            500,
          );

          const subscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.BestForNavigation || Location.Accuracy.High,
              timeInterval: 2500,
              distanceInterval: 5,
            },
            position => {
              const nextCoords = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
              setAgentCoords(nextCoords);
              dispatch(updateAgentLocation(nextCoords));
            },
          );

          if (!isMounted) {
            subscription.remove();
            return;
          }

          locationSubscriptionRef.current = subscription;
        } catch (error) {
          if (isMounted) {
            setLocationMode('error');
          }
        }
      };

      startLiveTracking();

      return () => {
        isMounted = false;
        locationSubscriptionRef.current?.remove();
        locationSubscriptionRef.current = null;
      };
    }

    setLocationMode('simulated');
    const animateAgent = () => {
      progress.current += 0.003;
      if (progress.current >= 1) {
        progress.current = 1;
        const finalCoords = interpolateCoords(routeOrigin, routeDestination, 1);
        setAgentCoords(finalCoords);
        dispatch(updateAgentLocation(finalCoords));
        if (!isDeliveryPartner) {
          setTimeout(() => dispatch(deliverLiveOrder()), 3000);
        }
        return;
      }

      const nextCoords = interpolateCoords(routeOrigin, routeDestination, progress.current);
      setAgentCoords(nextCoords);
      dispatch(updateAgentLocation(nextCoords));
      animFrame.current = requestAnimationFrame(animateAgent);
    };

    animFrame.current = requestAnimationFrame(animateAgent);
    return () => cancelAnimationFrame(animFrame.current);
  }, [
    dispatch,
    hasRoute,
    isDelivered,
    isDeliveryPartner,
    routeOrigin?.latitude,
    routeOrigin?.longitude,
    routeDestination?.latitude,
    routeDestination?.longitude,
  ]);

  const initialRegion = useMemo(() => ({
    latitude: hasRoute ? (routeOrigin.latitude + routeDestination.latitude) / 2 : 21.143,
    longitude: hasRoute ? (routeOrigin.longitude + routeDestination.longitude) / 2 : 79.089,
    latitudeDelta: 0.025,
    longitudeDelta: 0.025,
  }), [
    hasRoute,
    routeOrigin?.latitude,
    routeOrigin?.longitude,
    routeDestination?.latitude,
    routeDestination?.longitude,
  ]);

  const currentStep = STATUS_STEPS.findIndex(step => step.key === liveOrder?.status);
  const visibleAgentCoords = isValidCoordinate(agentCoords) ? agentCoords : liveOrder?.route?.agentLocation;
  const routeLineCoordinates = hasRoute ? [routeOrigin, routeDestination] : [];
  const travelledLineCoordinates = hasRoute && isValidCoordinate(visibleAgentCoords)
    ? [routeOrigin, visibleAgentCoords]
    : [];

  useEffect(() => {
    if (!hasRoute || !mapRef.current) {
      return;
    }

    const coordinates = [routeOrigin, routeDestination];
    if (isValidCoordinate(visibleAgentCoords)) {
      coordinates.push(visibleAgentCoords);
    }

    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 70, right: 50, bottom: 190, left: 50 },
        animated: true,
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [
    hasRoute,
    routeOrigin?.latitude,
    routeOrigin?.longitude,
    routeDestination?.latitude,
    routeDestination?.longitude,
    visibleAgentCoords?.latitude,
    visibleAgentCoords?.longitude,
  ]);

  const handleMarkDelivered = useCallback(() => {
    if (isDelivered) {
      return;
    }

    locationSubscriptionRef.current?.remove();
    locationSubscriptionRef.current = null;
    if (animFrame.current) {
      cancelAnimationFrame(animFrame.current);
    }
    if (isValidCoordinate(routeDestination)) {
      setAgentCoords(routeDestination);
    }
    setLocationMode('delivered');
    dispatch(deliverLiveOrder());
  }, [dispatch, isDelivered, routeDestination]);

  const openRouteInOsm = () => {
    const origin = visibleAgentCoords || routeOrigin;
    const destination = routeDestination;
    if (!isValidCoordinate(origin) || !isValidCoordinate(destination)) {
      return;
    }

    const centerLatitude = (origin.latitude + destination.latitude) / 2;
    const centerLongitude = (origin.longitude + destination.longitude) / 2;
    const osmUrl = `https://www.openstreetmap.org/directions?engine=graphhopper_car&route=${origin.latitude},${origin.longitude};${destination.latitude},${destination.longitude}#map=15/${centerLatitude}/${centerLongitude}`;
    Linking.openURL(osmUrl);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        {isDeliveryPartner ? (
          <DeliveryBrandLogo compact />
        ) : (
          <Text style={styles.headerTitle}>Track Order</Text>
        )}
        <Text style={styles.orderId}>#{liveOrder?.id?.slice(-6).toUpperCase()}</Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={initialRegion}
          showsUserLocation={isDeliveryPartner && !isDelivered}
          showsMyLocationButton={false}
          mapType="standard"
        >
          {hasRoute && (
            <>
              <Marker
                coordinate={routeOrigin}
                title="Pench Foods Farm"
                description="Telangkhedi, Ram Nagar, Nagpur"
              >
                <View style={styles.markerWarehouse}>
                  <MaterialCommunityIcons name="store" size={18} color="#fff" />
                </View>
              </Marker>

              <Marker
                coordinate={routeDestination}
                title={assignment?.customer?.name || 'Customer'}
                description={customerAddress}
              >
                <View style={styles.markerHome}>
                  <MaterialCommunityIcons name="home" size={18} color="#fff" />
                </View>
              </Marker>
            </>
          )}

          {isValidCoordinate(visibleAgentCoords) && (
            <Marker coordinate={visibleAgentCoords} title="Delivery Agent" anchor={{ x: 0.5, y: 0.5 }}>
              <View style={styles.agentMarker}>
                <MaterialCommunityIcons name="bike-fast" size={20} color="#fff" />
              </View>
            </Marker>
          )}

          {routeLineCoordinates.length === 2 && (
            <Polyline
              coordinates={routeLineCoordinates}
              strokeColor={Colors.primary}
              strokeWidth={3}
              lineDashPattern={[8, 4]}
            />
          )}

          {travelledLineCoordinates.length === 2 && (
            <Polyline
              coordinates={travelledLineCoordinates}
              strokeColor={Colors.primaryLight}
              strokeWidth={4}
            />
          )}
        </MapView>

        {isDeliveryPartner && (
          <View style={styles.deliveryMapOverlay}>
            <View style={styles.deliveryMapChip}>
              <MaterialCommunityIcons
                name={
                  locationMode === 'live'
                    ? 'map-marker-up'
                    : locationMode === 'permission_denied'
                      ? 'map-marker-alert-outline'
                      : 'crosshairs-gps'
                }
                size={16}
                color={Colors.primaryDark}
              />
              <Text style={styles.deliveryMapChipText}>
                {locationMode === 'live'
                  ? 'Live location active'
                  : locationMode === 'delivered'
                    ? 'Delivery completed'
                  : locationMode === 'permission_denied'
                    ? 'Location permission needed'
                    : locationMode === 'error'
                      ? 'Location temporarily unavailable'
                      : 'Connecting live location'}
              </Text>
            </View>
            <View style={styles.deliveryMapCard}>
              <Text style={styles.deliveryMapLabel}>Next drop</Text>
              <Text style={styles.deliveryMapValue} numberOfLines={2}>
                {customerAddress}
              </Text>
              <Text style={styles.deliveryMapHint}>
                {locationMode === 'live'
                  ? 'Your marker updates from device GPS.'
                  : locationMode === 'delivered'
                    ? 'Map updates paused after delivery is completed.'
                  : 'Enable foreground location to send live position on the map.'}
              </Text>
              <TouchableOpacity style={styles.deliveryMapBtn} onPress={openRouteInOsm} activeOpacity={0.88}>
                <MaterialCommunityIcons name="open-in-new" size={16} color="#fff" />
                <Text style={styles.deliveryMapBtnText}>OpenStreetMap route</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0],
                }),
              },
            ],
          },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          <View style={styles.etaRow}>
            <View>
              <Text style={styles.etaLabel}>{isDeliveryPartner ? 'Delivery ETA' : 'Estimated Arrival'}</Text>
              <Text style={styles.etaTime}>{liveOrder?.estimatedArrival || '6:45 AM'}</Text>
            </View>
            <View style={styles.liveChip}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>

          {isDeliveryPartner ? (
            <View style={styles.deliveryMissionCard}>
              <View style={styles.deliveryMissionTop}>
                <View style={styles.deliveryMissionBadge}>
                  <MaterialCommunityIcons name="shield-check" size={18} color="#166534" />
                  <Text style={styles.deliveryMissionBadgeText}>Delivery verified</Text>
                </View>
                <Text style={styles.deliveryMissionOrder}>COD ready | handle with care</Text>
              </View>

              <View style={styles.deliveryStopRow}>
                <View style={styles.deliveryStopRail}>
                  <View style={[styles.deliveryStopDot, { backgroundColor: '#10B981' }]} />
                  <View style={styles.deliveryStopLine} />
                  <View style={[styles.deliveryStopDot, { backgroundColor: '#F97316' }]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.deliveryStopLabel}>Pickup</Text>
                  <Text style={styles.deliveryStopValue}>Pench Foods Farm, Telangkhedi</Text>
                  <Text style={[styles.deliveryStopLabel, { marginTop: 12 }]}>Customer drop</Text>
                  <Text style={styles.deliveryStopValue}>
                    {customerAddress}
                  </Text>
                </View>
              </View>

              <View style={styles.deliveryActionRow}>
                <TouchableOpacity
                  style={[styles.deliveryActionBtn, styles.deliveryActionBtnSoft]}
                  onPress={() => customerPhone && Linking.openURL(`tel:${customerPhone}`)}
                >
                  <MaterialCommunityIcons name="phone-outline" size={18} color={Colors.primary} />
                  <Text style={styles.deliveryActionBtnSoftText}>Customer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deliveryActionBtn, styles.deliveryActionBtnSoft]}
                  onPress={openRouteInOsm}
                >
                  <MaterialCommunityIcons name="map-search-outline" size={18} color={Colors.primary} />
                  <Text style={styles.deliveryActionBtnSoftText}>OSM Route</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.deliveryActionBtn,
                  styles.deliveryActionBtnPrimary,
                  isDelivered && styles.deliveryActionBtnDisabled,
                ]}
                onPress={handleMarkDelivered}
                activeOpacity={0.9}
                disabled={isDelivered}
              >
                <MaterialCommunityIcons name="check-circle-outline" size={20} color="#fff" />
                <Text style={styles.deliveryActionBtnPrimaryText}>
                  {isDelivered ? 'Delivered' : 'Mark Delivered'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.agentCard}>
              <View style={styles.agentAvatar}>
                <MaterialCommunityIcons name="account" size={28} color={Colors.primary} />
              </View>
              <View style={styles.agentInfo}>
                <Text style={styles.agentName}>{liveOrder?.deliveryAgent?.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialCommunityIcons name="star" size={12} color={Colors.star} />
                  <Text style={styles.agentRating}>{liveOrder?.deliveryAgent?.rating}</Text>
                  <Text style={styles.agentDeliveries}>| {liveOrder?.deliveryAgent?.totalDeliveries} deliveries</Text>
                </View>
              </View>
              <View style={styles.agentActions}>
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => Linking.openURL(`tel:${liveOrder?.deliveryAgent?.phone}`)}
                >
                  <MaterialCommunityIcons name="phone" size={20} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.chatBtn}>
                  <MaterialCommunityIcons name="message-text-outline" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.timeline}>
            <Text style={styles.timelineTitle}>{isDeliveryPartner ? 'Run Checklist' : 'Order Status'}</Text>
            {liveOrder?.statusTimeline?.map((step, index) => {
              const isActive = step.done;
              const isLast = index === liveOrder.statusTimeline.length - 1;
              return (
                <View key={index} style={styles.timelineStep}>
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.timelineDot,
                        isActive && styles.timelineDotActive,
                        !isActive && index === currentStep + 1 && styles.timelineDotCurrent,
                      ]}
                    >
                      {isActive && <MaterialCommunityIcons name="check" size={12} color="#fff" />}
                    </View>
                    {!isLast && (
                      <View style={[styles.timelineLine, isActive && styles.timelineLineActive]} />
                    )}
                  </View>
                  <View style={styles.timelineRight}>
                    <Text style={[styles.timelineLabel, isActive && styles.timelineLabelActive]}>
                      {step.label}
                    </Text>
                    {step.time ? <Text style={styles.timelineTime}>{step.time}</Text> : null}
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.orderItems}>
            <Text style={styles.timelineTitle}>{isDeliveryPartner ? 'Items To Carry' : 'Your Order'}</Text>
            {liveOrder?.items?.map((item, index) => (
              <View key={index} style={styles.orderItemRow}>
                <Text style={styles.orderItemQty}>{item.qty}x</Text>
                <Text style={styles.orderItemName}>{item.name}</Text>
                <Text style={styles.orderItemPrice}>{formatCurrency(item.price)}</Text>
              </View>
            ))}
            <View
              style={[
                styles.orderItemRow,
                {
                  borderTopWidth: 1,
                  borderTopColor: Colors.borderLight,
                  marginTop: 8,
                  paddingTop: 10,
                },
              ]}
            >
              <Text style={{ flex: 1, fontWeight: '800', color: Colors.textPrimary }}>Total</Text>
              <Text style={{ fontWeight: '900', fontSize: 16, color: Colors.textPrimary }}>
                {formatCurrency(liveOrder?.total || 0)}
              </Text>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
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
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  orderId: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  mapContainer: { height: MAP_HEIGHT, position: 'relative' },
  map: { ...StyleSheet.absoluteFillObject },
  markerWarehouse: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerHome: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  agentMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  deliveryMapOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    gap: 10,
  },
  deliveryMapChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deliveryMapChipText: { color: Colors.primaryDark, fontSize: 12, fontWeight: '800' },
  deliveryMapCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 18,
    padding: 14,
    alignSelf: 'flex-start',
    maxWidth: '82%',
  },
  deliveryMapLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  deliveryMapValue: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary, marginTop: 5, lineHeight: 19 },
  deliveryMapHint: { fontSize: 12, color: Colors.textMuted, marginTop: 8, lineHeight: 18 },
  deliveryMapBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primaryDark,
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  deliveryMapBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  sheet: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  etaLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  etaTime: { fontSize: 28, fontWeight: '900', color: Colors.textPrimary },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.error },
  liveText: { color: Colors.error, fontWeight: '800', fontSize: 12 },
  deliveryMissionCard: {
    backgroundColor: Colors.background,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  deliveryMissionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  deliveryMissionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deliveryMissionBadgeText: { color: '#166534', fontWeight: '800', fontSize: 12 },
  deliveryMissionOrder: { color: Colors.textMuted, fontSize: 12, fontWeight: '700' },
  deliveryStopRow: { flexDirection: 'row', gap: 14, marginBottom: 18 },
  deliveryStopRail: { alignItems: 'center', width: 20 },
  deliveryStopDot: { width: 12, height: 12, borderRadius: 6 },
  deliveryStopLine: { flex: 1, width: 2, backgroundColor: Colors.border, marginVertical: 4, minHeight: 44 },
  deliveryStopLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  deliveryStopValue: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary, marginTop: 4, lineHeight: 20 },
  deliveryActionRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  deliveryActionBtn: {
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deliveryActionBtnSoft: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 14,
  },
  deliveryActionBtnSoftText: { color: Colors.primary, fontWeight: '800', fontSize: 13 },
  deliveryActionBtnPrimary: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
  },
  deliveryActionBtnPrimaryText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  agentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  agentAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentInfo: { flex: 1 },
  agentName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 3 },
  agentRating: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  agentDeliveries: { fontSize: 11, color: Colors.textMuted },
  agentActions: { flexDirection: 'row', gap: 8 },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeline: { marginBottom: 20 },
  timelineTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 14 },
  timelineStep: { flexDirection: 'row', gap: 14, minHeight: 52 },
  timelineLeft: { alignItems: 'center', width: 20 },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timelineDotCurrent: { borderColor: Colors.primary, borderWidth: 2 },
  timelineLine: { flex: 1, width: 2, backgroundColor: Colors.border, marginVertical: 4 },
  timelineLineActive: { backgroundColor: Colors.primary },
  timelineRight: { flex: 1, paddingBottom: 16 },
  timelineLabel: { fontSize: 14, color: Colors.textMuted, fontWeight: '500' },
  timelineLabelActive: { color: Colors.textPrimary, fontWeight: '700' },
  timelineTime: { fontSize: 12, color: Colors.primary, marginTop: 2, fontWeight: '600' },
  orderItems: { backgroundColor: Colors.background, borderRadius: 16, padding: 14 },
  orderItemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  orderItemQty: { fontSize: 14, fontWeight: '800', color: Colors.primary, width: 24 },
  orderItemName: { flex: 1, fontSize: 13, color: Colors.textPrimary },
  orderItemPrice: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
});
