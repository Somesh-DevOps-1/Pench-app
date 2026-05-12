import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { PENCH_LOGO_URI } from '../constants/brand';

export default function BrandLogo({
  width = 150,
  height = 70,
  style,
  imageStyle,
  framed = false,
}) {
  return (
    <View style={[framed && styles.frame, style]}>
      <Image
        source={{ uri: PENCH_LOGO_URI }}
        style={[{ width, height }, imageStyle]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
});
