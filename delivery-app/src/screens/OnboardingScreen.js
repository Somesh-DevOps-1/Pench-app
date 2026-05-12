import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  FlatList, Animated, StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { markOnboardingSeen } from '../utils/storage';
import BrandLogo from '../components/BrandLogo';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: 'bottle-tonic',
    iconBg: '#E8F5E9',
    title: 'Pure A2 Gir Cow Milk',
    subtitle: 'Straight from our farm in Nagpur.\nNo preservatives. No adulteration.\nJust pure, wholesome goodness.',
    accent: Colors.primary,
  },
  {
    id: '2',
    icon: 'clock-fast',
    iconBg: '#E3F2FD',
    title: 'Delivered by 6:30 AM',
    subtitle: 'Wake up to fresh milk every morning.\nSet up a daily subscription and\nnever worry again.',
    accent: '#1565C0',
  },
  {
    id: '3',
    icon: 'map-marker-radius',
    iconBg: '#FFF3E0',
    title: 'Track Every Delivery',
    subtitle: 'Live map tracking of your delivery agent.\nKnow exactly when your milk arrives\nat your doorstep.',
    accent: '#E65100',
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const finishOnboarding = async () => {
    await markOnboardingSeen();
    navigation.replace('Auth');
  };

  const goNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(prev => prev + 1);
      return;
    }

    await finishOnboarding();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {currentIndex < SLIDES.length - 1 && (
        <TouchableOpacity style={styles.skipBtn} onPress={finishOnboarding}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        onMomentumScrollEnd={event => {
          setCurrentIndex(Math.round(event.nativeEvent.contentOffset.x / width));
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <BrandLogo width={190} height={86} framed style={styles.slideLogo} />
            <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
              <MaterialCommunityIcons name={item.icon} size={80} color={item.accent} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
        decelerationRate="fast"
        scrollEventThrottle={16}
        bounces
      />

      <View style={styles.dotsRow}>
        {SLIDES.map((_, index) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });

          return <Animated.View key={index} style={[styles.dot, { width: dotWidth, opacity }]} />;
        })}
      </View>

      <TouchableOpacity style={styles.btn} onPress={goNext} activeOpacity={0.85}>
        <Text style={styles.btnText}>
          {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
        </Text>
        <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
      </TouchableOpacity>

      <View style={styles.bottomPad} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center' },
  skipBtn: { position: 'absolute', top: 54, right: 24, zIndex: 10 },
  skipText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  slide: { width, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  slideLogo: { marginBottom: 24 },
  iconCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  dotsRow: { flexDirection: 'row', gap: 6, marginBottom: 32 },
  dot: { height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 50,
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  bottomPad: { height: 20 },
});
