import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from '../store';
import { loginSuccess } from '../store/slices/authSlice';
import { Colors } from '../theme/colors';
import { getStoredSession, hasSeenOnboarding } from '../utils/storage';
import BrandLogo from '../components/BrandLogo';

const { width } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const dispatch = useDispatch();
  const logoAnim = useRef(new Animated.Value(0)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;
  const circleAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const riderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;
    let timer;

    Animated.sequence([
      Animated.parallel([
        Animated.timing(circleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      ]),
      Animated.timing(logoAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(taglineAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(riderAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(riderAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    ).start();

    (async () => {
      const [session, seenOnboarding] = await Promise.all([
        getStoredSession(),
        hasSeenOnboarding(),
      ]);

      if (!isMounted) {
        return;
      }

      timer = setTimeout(() => {
        if (session?.token) {
          dispatch(loginSuccess(session));
          navigation.replace('Main');
          return;
        }

        navigation.replace(seenOnboarding ? 'Auth' : 'Onboarding');
      }, 2800);
    })();

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [circleAnim, dispatch, logoAnim, navigation, riderAnim, scaleAnim, taglineAnim]);

  const riderTranslate = riderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.28, width * 0.28],
  });
  const riderOpacity = riderAnim.interpolate({
    inputRange: [0, 0.12, 0.88, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary, '#43A047']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View style={[styles.circle1, { opacity: circleAnim }]} />
      <Animated.View style={[styles.circle2, { opacity: circleAnim }]} />

      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.iconBg}>
          <BrandLogo width={150} height={78} />
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.rider,
          {
            opacity: riderOpacity,
            transform: [{ translateX: riderTranslate }],
          },
        ]}
      >
        <MaterialCommunityIcons name="bike-fast" size={28} color={Colors.primaryDark} />
        <View style={styles.riderBag}>
          <MaterialCommunityIcons name="bottle-tonic" size={13} color="#fff" />
        </View>
      </Animated.View>

      <Animated.View style={{ opacity: logoAnim }}>
        <Text style={styles.brand}>PENCH</Text>
        <Text style={styles.brandSub}>FOODS</Text>
        <View style={styles.divider} />
      </Animated.View>

      <Animated.Text style={[styles.tagline, { opacity: taglineAnim }]}>
        Pure A2 Milk | Farm to Home
      </Animated.Text>

      <View style={styles.bottom}>
        <Text style={styles.bottomText}>Nagpur's Finest Dairy</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  circle1: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    top: -width * 0.3,
    right: -width * 0.3,
  },
  circle2: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    bottom: -width * 0.2,
    left: -width * 0.2,
  },
  logoContainer: { marginBottom: 20 },
  iconBg: {
    width: 190,
    height: 116,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  rider: {
    position: 'absolute',
    top: '58%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 12,
  },
  riderBag: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: 40,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 8,
  },
  brandSub: {
    fontSize: 18,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    letterSpacing: 14,
    marginTop: -4,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: Colors.secondary,
    alignSelf: 'center',
    marginTop: 12,
    borderRadius: 2,
  },
  tagline: {
    marginTop: 16,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
    fontWeight: '500',
  },
  bottom: { position: 'absolute', bottom: 50 },
  bottomText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, letterSpacing: 2 },
});
