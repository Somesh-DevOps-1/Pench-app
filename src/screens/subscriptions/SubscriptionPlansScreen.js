import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from '../../store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  addSubscription,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  setVacation,
} from '../../store/slices/subscriptionSlice';
import { Colors } from '../../theme/colors';
import { formatCurrency } from '../../utils/formatters';
import { SUBSCRIPTION_PLANS } from '../../data/mockData';

export default function SubscriptionPlansScreen() {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { mySubscriptions } = useSelector(state => state.subscription);
  const [tab, setTab] = useState('plans');

  const handleSubscribe = (plan) => {
    Alert.alert(
      `Subscribe to ${plan.name}`,
      `${formatCurrency(plan.price)}/month. Your first delivery starts tomorrow at 6 AM.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe ->',
          onPress: () => {
            dispatch(addSubscription({
              planId: plan.id,
              planName: plan.name,
              productName: plan.features[0],
              nextDelivery: 'Tomorrow',
              deliveriesRemaining: 30,
              totalDeliveries: 30,
              address: 'Home - Civil Lines, Nagpur',
              frequency: plan.frequency === 'daily' ? 'Daily' : 'Alternate Day',
              price: plan.price,
            }));
            setTab('mine');
          },
        },
      ],
    );
  };

  const handleVacation = (subscription) => {
    Alert.alert(
      'Vacation Mode',
      'Skip deliveries while you are away. Your subscription will auto-resume after your vacation.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip 3 days',
          onPress: () => {
            const from = new Date();
            const to = new Date();
            to.setDate(to.getDate() + 3);
            dispatch(setVacation({
              id: subscription.id,
              vacationFrom: from.toISOString().split('T')[0],
              vacationTo: to.toISOString().split('T')[0],
            }));
            Alert.alert('Vacation Set!', `Deliveries paused for 3 days. Resumes on ${to.toLocaleDateString('en-IN')}.`);
          },
        },
        {
          text: 'Skip 7 days',
          onPress: () => {
            const from = new Date();
            const to = new Date();
            to.setDate(to.getDate() + 7);
            dispatch(setVacation({
              id: subscription.id,
              vacationFrom: from.toISOString().split('T')[0],
              vacationTo: to.toISOString().split('T')[0],
            }));
            Alert.alert('Vacation Set!', `Deliveries paused for 7 days. Resumes on ${to.toLocaleDateString('en-IN')}.`);
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Subscriptions</Text>
        <View style={styles.tabRow}>
          {['plans', 'mine'].map(currentTab => (
            <TouchableOpacity
              key={currentTab}
              style={[styles.tab, tab === currentTab && styles.tabActive]}
              onPress={() => setTab(currentTab)}
            >
              <Text style={[styles.tabText, tab === currentTab && styles.tabTextActive]}>
                {currentTab === 'plans'
                  ? 'Available Plans'
                  : `My Subscriptions (${mySubscriptions.filter(subscription => subscription.status === 'active').length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        {tab === 'plans' ? (
          <>
            <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={styles.heroBanner}>
              <MaterialCommunityIcons name="bottle-tonic" size={40} color="rgba(255,255,255,0.3)" />
              <View>
                <Text style={styles.heroTitle}>Fresh Milk Every Morning</Text>
                <Text style={styles.heroSub}>Subscribe & Save up to 15%</Text>
              </View>
            </LinearGradient>

            {SUBSCRIPTION_PLANS.map(plan => (
              <View key={plan.id} style={[styles.planCard, plan.popular && styles.planCardPopular]}>
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>Most Popular</Text>
                  </View>
                )}
                <View style={styles.planHeader}>
                  <View style={[styles.planIcon, { backgroundColor: `${plan.color}18` }]}>
                    <MaterialCommunityIcons name={plan.icon} size={28} color={plan.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planDesc}>{plan.description}</Text>
                  </View>
                </View>
                <View style={styles.planPriceRow}>
                  <Text style={styles.planPrice}>
                    {formatCurrency(plan.price)}
                    <Text style={styles.planPeriod}>/month</Text>
                  </Text>
                  <Text style={styles.planPerDelivery}>
                    {formatCurrency(plan.pricePerDelivery)}/delivery
                  </Text>
                </View>
                <View style={styles.planFeatures}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <MaterialCommunityIcons name="check-circle" size={16} color={plan.color} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
                {plan.savings > 0 && (
                  <View style={styles.savingsBanner}>
                    <Text style={styles.savingsText}>You save {plan.savings}% vs one-time orders</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.subscribeBtn, { backgroundColor: plan.color }]}
                  onPress={() => handleSubscribe(plan)}
                >
                  <Text style={styles.subscribeBtnText}>Subscribe Now {'->'}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        ) : (
          <>
            {mySubscriptions.length === 0 ? (
              <View style={styles.empty}>
                <MaterialCommunityIcons name="repeat-off" size={64} color={Colors.border} />
                <Text style={styles.emptyTitle}>No Active Subscriptions</Text>
                <Text style={styles.emptySub}>Subscribe to never run out of fresh milk!</Text>
                <TouchableOpacity style={styles.shopBtn} onPress={() => setTab('plans')}>
                  <Text style={styles.shopBtnText}>View Plans</Text>
                </TouchableOpacity>
              </View>
            ) : (
              mySubscriptions.map(subscription => (
                <View key={subscription.id} style={styles.subCard}>
                  <View style={styles.subHeader}>
                    <View
                      style={[
                        styles.subStatusDot,
                        {
                          backgroundColor:
                            subscription.status === 'active'
                              ? Colors.success
                              : subscription.status === 'paused'
                                ? Colors.warning
                                : Colors.error,
                        },
                      ]}
                    />
                    <Text style={styles.subName}>{subscription.planName}</Text>
                    <View
                      style={[
                        styles.subStatusBadge,
                        {
                          backgroundColor:
                            subscription.status === 'active'
                              ? Colors.successLight
                              : subscription.status === 'paused'
                                ? Colors.warningLight
                                : Colors.errorLight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.subStatusText,
                          {
                            color:
                              subscription.status === 'active'
                                ? Colors.primary
                                : subscription.status === 'paused'
                                  ? Colors.warning
                                  : Colors.error,
                          },
                        ]}
                      >
                        {subscription.status.toUpperCase()}
                      </Text>
                    </View>
                    {subscription.vacationFrom && subscription.status === 'active' && (
                      <View style={[styles.subStatusBadge, { backgroundColor: Colors.deliveryBlue + '20', marginLeft: 6 }]}>
                         <Text style={[styles.subStatusText, { color: Colors.deliveryBlue }]}>
                           VACATION
                         </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.subBody}>
                    <View style={styles.subInfoRow}>
                      <MaterialCommunityIcons name="calendar-today" size={15} color={Colors.textMuted} />
                      <Text style={styles.subInfo}>Next: {subscription.nextDelivery}</Text>
                    </View>
                    <View style={styles.subInfoRow}>
                      <MaterialCommunityIcons name="package-variant" size={15} color={Colors.textMuted} />
                      <Text style={styles.subInfo}>
                        {subscription.deliveriesRemaining} of {subscription.totalDeliveries} remaining
                      </Text>
                    </View>
                    <View style={styles.subInfoRow}>
                      <MaterialCommunityIcons name="map-marker-outline" size={15} color={Colors.textMuted} />
                      <Text style={styles.subInfo}>{subscription.address}</Text>
                    </View>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${((subscription.totalDeliveries - subscription.deliveriesRemaining) / subscription.totalDeliveries) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.subActions}>
                    {subscription.status === 'active' ? (
                      <>
                        <TouchableOpacity
                          style={styles.pauseBtn}
                          onPress={() => dispatch(pauseSubscription(subscription.id))}
                        >
                          <MaterialCommunityIcons name="pause" size={16} color={Colors.warning} />
                          <Text style={styles.pauseBtnText}>Pause</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.vacationBtn}
                          onPress={() => handleVacation(subscription)}
                        >
                          <MaterialCommunityIcons name="airplane" size={16} color={Colors.deliveryBlue} />
                          <Text style={styles.vacationBtnText}>Vacation</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity
                        style={styles.resumeBtn}
                        onPress={() => dispatch(resumeSubscription(subscription.id))}
                      >
                        <MaterialCommunityIcons name="play" size={16} color={Colors.primary} />
                        <Text style={styles.resumeBtnText}>Resume</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => Alert.alert('Cancel Subscription?', 'Are you sure?', [
                        { text: 'No' },
                        {
                          text: 'Yes, Cancel',
                          style: 'destructive',
                          onPress: () => dispatch(cancelSubscription(subscription.id)),
                        },
                      ])}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.textPrimary, marginBottom: 12 },
  tabRow: { flexDirection: 'row' },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2.5,
    borderBottomColor: Colors.transparent,
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.primary, fontWeight: '800' },
  heroBanner: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 3 },
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  planCardPopular: { borderColor: Colors.primary },
  popularBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  popularBadgeText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  planHeader: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 },
  planIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  planName: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  planDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  planPrice: { fontSize: 30, fontWeight: '900', color: Colors.textPrimary },
  planPeriod: { fontSize: 14, fontWeight: '400', color: Colors.textMuted },
  planPerDelivery: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  planFeatures: { gap: 8, marginBottom: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13, color: Colors.textSecondary },
  savingsBanner: { backgroundColor: Colors.successLight, borderRadius: 10, padding: 8, marginBottom: 14 },
  savingsText: { color: Colors.primaryDark, fontWeight: '700', fontSize: 13 },
  subscribeBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  subscribeBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  emptySub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  shopBtn: { backgroundColor: Colors.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  shopBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  subCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  subStatusDot: { width: 8, height: 8, borderRadius: 4 },
  subName: { flex: 1, fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  subStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  subStatusText: { fontSize: 11, fontWeight: '800' },
  subBody: { gap: 8, marginBottom: 14 },
  subInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subInfo: { fontSize: 13, color: Colors.textSecondary },
  progressBar: { height: 6, backgroundColor: Colors.borderLight, borderRadius: 3, marginBottom: 14 },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  subActions: { flexDirection: 'row', gap: 10 },
  pauseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.warning,
    borderRadius: 12,
    paddingVertical: 10,
  },
  pauseBtnText: { color: Colors.warning, fontWeight: '700' },
  resumeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
  },
  resumeBtnText: { color: Colors.primary, fontWeight: '700' },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: { color: Colors.textMuted, fontWeight: '600' },
});
