import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

export default function DeliveryBrandLogo({ compact = false, light = false }) {
  const textColor = light ? '#fff' : Colors.deliveryDark;
  const mutedColor = light ? 'rgba(255,255,255,0.72)' : Colors.textSecondary;

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <View style={[styles.iconWrap, compact && styles.iconWrapCompact, light && styles.iconWrapLight]}>
        <MaterialCommunityIcons
          name="truck-delivery"
          size={compact ? 20 : 34}
          color={Colors.deliveryAccent}
        />
      </View>
      <View style={compact && styles.compactText}>
        <Text style={[styles.brand, compact && styles.brandCompact, { color: textColor }]}>
          Pench Delivery
        </Text>
        {!compact && <Text style={[styles.subtitle, { color: mutedColor }]}>Partner App</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.28)',
  },
  iconWrapLight: {
    backgroundColor: 'rgba(34,197,94,0.14)',
    borderColor: 'rgba(34,197,94,0.35)',
  },
  iconWrapCompact: {
    width: 38,
    height: 38,
    borderRadius: 13,
  },
  compactText: { justifyContent: 'center' },
  brand: {
    marginTop: 12,
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: 0,
  },
  brandCompact: {
    marginTop: 0,
    fontSize: 17,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
  },
});
