import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, TextInput, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../src/theme/colors';
import { DELIVERY_ASSIGNMENTS } from '../data/deliveryData';
import DeliveryBrandLogo from '../components/DeliveryBrandLogo';
import { deliveryApi } from '../../src/services/api';

function toNumber(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function BottleCollectionsScreen() {
  const insets = useSafeAreaInsets();
  const [savingId, setSavingId] = useState(null);
  const [records, setRecords] = useState(() => (
    DELIVERY_ASSIGNMENTS.reduce((acc, assignment) => {
      acc[assignment.id] = {
        collected: String(assignment.bottlesCollected || 0),
        broken: String(assignment.brokenBottles || 0),
      };
      return acc;
    }, {})
  ));

  const updateRecord = (assignmentId, key, value) => {
    setRecords(current => ({
      ...current,
      [assignmentId]: {
        ...current[assignmentId],
        [key]: value.replace(/[^0-9]/g, ''),
      },
    }));
  };

  const totals = DELIVERY_ASSIGNMENTS.reduce((summary, assignment) => {
    const record = records[assignment.id] || {};
    summary.due += assignment.bottlesDue || 0;
    summary.collected += toNumber(record.collected);
    summary.broken += toNumber(record.broken);
    return summary;
  }, { due: 0, collected: 0, broken: 0 });

  const saveBottleRecord = async (assignment) => {
    const record = records[assignment.id] || {};
    const collected = toNumber(record.collected);
    const broken = toNumber(record.broken);

    setSavingId(assignment.id);
    try {
      await deliveryApi.updateBottleCollection(assignment.backendId || assignment.id, {
        bottles_collected: collected,
        broken_bottles: broken,
      });
      Alert.alert('Saved', 'Bottle collection updated in database.');
    } catch (error) {
      Alert.alert(
        'Saved locally',
        'Bottle count is updated on this screen. Database sync will work when this assignment has a backend ID and the server is running.',
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.deliveryDark} />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        alwaysBounceVertical
        scrollEventThrottle={16}
        decelerationRate="fast"
        bounces
        overScrollMode="always"
        contentContainerStyle={{ paddingBottom: 132 + insets.bottom }}
      >
        <LinearGradient colors={[Colors.deliveryDark, Colors.deliveryDarkAlt]} style={styles.topSection}>
          <DeliveryBrandLogo compact light />
          <Text style={styles.screenTitle}>Bottle Collections</Text>
          <Text style={styles.screenSub}>Track returned and broken glass bottles</Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>{totals.due}</Text>
              <Text style={styles.summaryLabel}>Due</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: Colors.deliveryAccent }]}>{totals.collected}</Text>
              <Text style={styles.summaryLabel}>Collected</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: Colors.deliveryWarn }]}>{totals.broken}</Text>
              <Text style={styles.summaryLabel}>Broken</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.contentPad}>
        {DELIVERY_ASSIGNMENTS.map(assignment => {
          const record = records[assignment.id] || {};
          const expectedReturn = assignment.bottlesDue || 0;
          const collected = toNumber(record.collected);
          const broken = toNumber(record.broken);
          const pending = Math.max(expectedReturn - collected - broken, 0);

          return (
            <View key={assignment.id} style={styles.collectionCard}>
              <View style={styles.cardHeader}>
                <View style={styles.customerAvatar}>
                  <Text style={styles.customerAvatarText}>{assignment.customer.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.customerName}>{assignment.customer.name}</Text>
                  <Text style={styles.customerAddress} numberOfLines={1}>{assignment.customer.address}</Text>
                </View>
                <View style={styles.dueBadge}>
                  <MaterialCommunityIcons name="bottle-tonic-outline" size={15} color={Colors.deliveryDark} />
                  <Text style={styles.dueBadgeText}>{expectedReturn}</Text>
                </View>
              </View>

              <View style={styles.inputGrid}>
                <View style={styles.inputBox}>
                  <Text style={styles.inputLabel}>Collected</Text>
                  <View style={styles.inputRow}>
                    <MaterialCommunityIcons name="check-circle-outline" size={18} color={Colors.success} />
                    <TextInput
                      value={record.collected}
                      onChangeText={value => updateRecord(assignment.id, 'collected', value)}
                      keyboardType="number-pad"
                      style={styles.input}
                      placeholder="0"
                    />
                  </View>
                </View>

                <View style={styles.inputBox}>
                  <Text style={styles.inputLabel}>Broken</Text>
                  <View style={styles.inputRow}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={18} color={Colors.error} />
                    <TextInput
                      value={record.broken}
                      onChangeText={value => updateRecord(assignment.id, 'broken', value)}
                      keyboardType="number-pad"
                      style={styles.input}
                      placeholder="0"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.footerText}>Pending return: {pending}</Text>
                <TouchableOpacity
                  style={[styles.saveButton, savingId === assignment.id && { opacity: 0.7 }]}
                  activeOpacity={0.88}
                  onPress={() => saveBottleRecord(assignment)}
                  disabled={savingId === assignment.id}
                >
                  <MaterialCommunityIcons name="content-save-check" size={16} color="#fff" />
                  <Text style={styles.saveButtonText}>{savingId === assignment.id ? 'Saving' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  contentPad: { padding: 16 },
  topSection: { paddingHorizontal: 16, paddingBottom: 18 },
  screenTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginTop: 12 },
  screenSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, marginTop: 16, padding: 16 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryNum: { fontSize: 24, fontWeight: '900', color: '#fff' },
  summaryLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 3 },
  summaryDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.15)' },
  collectionCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.borderLight },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  customerAvatar: { width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.deliveryDark, alignItems: 'center', justifyContent: 'center' },
  customerAvatarText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  customerName: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  customerAddress: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  dueBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.warningLight, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6 },
  dueBadgeText: { fontSize: 13, fontWeight: '900', color: Colors.deliveryDark },
  inputGrid: { flexDirection: 'row', gap: 10, marginTop: 16 },
  inputBox: { flex: 1 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: Colors.textSecondary, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 12, backgroundColor: Colors.surfaceElevated },
  input: { flex: 1, fontSize: 18, fontWeight: '800', color: Colors.textPrimary, paddingVertical: 10 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.borderLight, marginTop: 14, paddingTop: 14 },
  footerText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  saveButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
  saveButtonText: { color: '#fff', fontSize: 12, fontWeight: '800' },
});
