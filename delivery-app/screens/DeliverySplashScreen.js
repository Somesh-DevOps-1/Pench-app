import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StatusBar, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from '../src/store';
import { loginSuccess } from '../src/store/slices/authSlice';
import { getStoredSession } from '../src/utils/storage';
import { USER_ROLES } from '../src/utils/auth';
import { Colors } from '../src/theme/colors';
import DeliveryBrandLogo from '../components/DeliveryBrandLogo';

const { width } = Dimensions.get('window');

export default function DeliverySplashScreen({ onFinish }) {
  const dispatch = useDispatch();
  const logoAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;
  const truckAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;
    let timer;

    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(logoAnim, {
          toValue: 1,
          duration: 520,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(taglineAnim, {
        toValue: 1,
        duration: 360,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(truckAnim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(truckAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    (async () => {
      try {
        const session = await getStoredSession();
        if (isMounted && session?.token && session?.role === USER_ROLES.DELIVERY) {
          dispatch(loginSuccess(session));
        }
      } finally {
        timer = setTimeout(() => {
          if (isMounted) {
            onFinish?.();
          }
        }, 1800);
      }
    })();

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [dispatch, logoAnim, onFinish, scaleAnim, taglineAnim, truckAnim]);

  const truckTranslate = truckAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.35, width * 0.35],
  });
  const truckOpacity = truckAnim.interpolate({
    inputRange: [0, 0.12, 0.88, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.deliveryDark} />
      <LinearGradient
        colors={[Colors.deliveryDark, Colors.deliveryDarkAlt, '#064E3B']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.ringTop} />
      <View style={styles.ringBottom} />

      <Animated.View
        style={[
          styles.logoWrap,
          {
            opacity: logoAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <DeliveryBrandLogo light />
      </Animated.View>

      <Animated.View
        style={[
          styles.routeBadge,
          {
            opacity: truckOpacity,
            transform: [{ translateX: truckTranslate }],
          },
        ]}
      >
        <MaterialCommunityIcons name="truck-fast" size={25} color={Colors.deliveryDark} />
        <View style={styles.bottleBadge}>
          <MaterialCommunityIcons name="bottle-tonic" size={13} color="#fff" />
        </View>
      </Animated.View>

      <Animated.Text style={[styles.tagline, { opacity: taglineAnim }]}>
        Fresh deliveries, tracked in real time
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ringTop: {
    position: 'absolute',
    top: -width * 0.28,
    right: -width * 0.24,
    width: width * 0.86,
    height: width * 0.86,
    borderRadius: width * 0.43,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  ringBottom: {
    position: 'absolute',
    bottom: -width * 0.22,
    left: -width * 0.28,
    width: width * 0.72,
    height: width * 0.72,
    borderRadius: width * 0.36,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.16)',
  },
  logoWrap: {
    alignItems: 'center',
  },
  routeBadge: {
    position: 'absolute',
    top: '61%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 14,
  },
  bottleBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.deliveryAccent,
  },
  tagline: {
    position: 'absolute',
    bottom: 54,
    paddingHorizontal: 24,
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.68)',
    textAlign: 'center',
    letterSpacing: 0,
  },
});
