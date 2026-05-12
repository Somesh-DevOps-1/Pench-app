import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from '../src/store';
import { loginSuccess, setPhone } from '../src/store/slices/authSlice';
import { USER_ROLES } from '../src/utils/auth';
import { setStoredSession } from '../src/utils/storage';
import { Colors } from '../src/theme/colors';
import { authApi } from '../src/services/api';
import DeliveryBrandLogo from '../components/DeliveryBrandLogo';

const DEMO_USERNAME = 'delivery';
const DEMO_PASSWORD = '123456';

export default function DeliveryLoginScreen() {
  const dispatch = useDispatch();
  const [mode, setMode] = useState('otp');
  const [phone, setPhoneLocal] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const [otp, setOtp] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;

  const isValidPhone = phone.length === 10 && /^[6-9]\d{9}$/.test(phone);
  const canVerifyOtp = otp.length === 6;
  const canSignIn = username.trim().length > 0 && password.length > 0;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        tension: 70,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoFloat, {
            toValue: -8,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.timing(logoFloat, {
            toValue: 0,
            duration: 1400,
            useNativeDriver: true,
          }),
        ]),
      ),
    ]).start();
  }, [logoFloat, logoScale]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const completeLogin = async (sessionPhone = phone) => {
    const session = {
      id: 'delivery_partner_1',
      name: 'Delivery Partner',
      phone: sessionPhone || '9876543210',
      role: USER_ROLES.DELIVERY,
      email: '',
      token: 'delivery_app_session',
      isAvailable: true,
    };

    dispatch(setPhone(session.phone));
    dispatch(loginSuccess(session));
    await setStoredSession(session);
  };

  const handleSendOtp = async () => {
    if (!isValidPhone) {
      shake();
      return;
    }

    try {
      const challenge = await authApi.requestOtp(phone, USER_ROLES.DELIVERY);
      setDevOtp(challenge.dev_otp || '');
      setOtpSent(true);
      setOtp('');
    } catch (error) {
      Alert.alert('OTP Error', error.message || 'Unable to send OTP. Please try again.');
    }
  };

  const handleVerifyOtp = async () => {
    if (!canVerifyOtp) {
      shake();
      return;
    }

    try {
      const session = await authApi.verifyOtp(phone, otp, USER_ROLES.DELIVERY);
      dispatch(setPhone(session.phone));
      dispatch(loginSuccess(session));
      await setStoredSession(session);
    } catch (error) {
      Alert.alert('Invalid OTP', error.message || 'Invalid or expired OTP.');
    }
  };

  const handlePasswordSignIn = async () => {
    if (!canSignIn) {
      shake();
      return;
    }

    if (username.trim().toLowerCase() !== DEMO_USERNAME || password !== DEMO_PASSWORD) {
      Alert.alert('Invalid Login', `Use username "${DEMO_USERNAME}" and password "${DEMO_PASSWORD}".`);
      return;
    }

    await completeLogin('9876543210');
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setOtpSent(false);
    setDevOtp('');
    setOtp('');
    setFocusedField('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.deliveryDark} />
      <LinearGradient colors={[Colors.deliveryDark, Colors.deliveryDarkAlt]} style={styles.header}>
        <View style={styles.headerContent}>
          <Animated.View
            style={[
              styles.logoMotion,
              { transform: [{ scale: logoScale }, { translateY: logoFloat }] },
            ]}
          >
            <DeliveryBrandLogo light />
          </Animated.View>
          <Text style={styles.subtitle}>Partner sign in</Text>
        </View>
        <View style={styles.wave} />
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        alwaysBounceVertical
        scrollEventThrottle={16}
        decelerationRate="fast"
        bounces
        overScrollMode="always"
      >
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'otp' && styles.modeBtnActive]}
            onPress={() => switchMode('otp')}
            activeOpacity={0.85}
          >
            <Text style={[styles.modeText, mode === 'otp' && styles.modeTextActive]}>OTP Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'password' && styles.modeBtnActive]}
            onPress={() => switchMode('password')}
            activeOpacity={0.85}
          >
            <Text style={[styles.modeText, mode === 'password' && styles.modeTextActive]}>Password</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>{mode === 'otp' ? 'Login with OTP' : 'Sign In'}</Text>
        <Text style={styles.hint}>
          {mode === 'otp'
            ? otpSent
              ? devOtp
                ? `Development OTP: ${devOtp}`
                : 'Enter the OTP sent to your phone'
              : 'Enter your registered delivery partner mobile number'
            : `Demo username: ${DEMO_USERNAME} | password: ${DEMO_PASSWORD}`}
        </Text>

        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          {mode === 'otp' ? (
            <>
              <View style={[styles.inputRow, focusedField === 'phone' && styles.inputRowFocused]}>
                <View style={styles.countryCode}>
                  <Text style={styles.flag}>IN</Text>
                  <Text style={styles.code}>+91</Text>
                </View>
                <View style={styles.dividerVertical} />
                <TextInput
                  style={styles.input}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={(value) => {
                    setPhoneLocal(value);
                    setOtpSent(false);
                    setDevOtp('');
                    setOtp('');
                  }}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField('')}
                />
              </View>

              {otpSent && (
                <View style={[styles.inputRow, focusedField === 'otp' && styles.inputRowFocused]}>
                  <View style={styles.fieldIcon}>
                    <MaterialCommunityIcons name="shield-key" size={21} color={Colors.deliveryAccent} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter OTP"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={setOtp}
                    onFocus={() => setFocusedField('otp')}
                    onBlur={() => setFocusedField('')}
                  />
                </View>
              )}
            </>
          ) : (
            <>
              <View style={[styles.inputRow, focusedField === 'username' && styles.inputRowFocused]}>
                <View style={styles.fieldIcon}>
                  <MaterialCommunityIcons name="account" size={21} color={Colors.deliveryAccent} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="none"
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField('')}
                />
              </View>

              <View style={[styles.inputRow, focusedField === 'password' && styles.inputRowFocused]}>
                <View style={styles.fieldIcon}>
                  <MaterialCommunityIcons name="lock" size={21} color={Colors.deliveryAccent} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('')}
                />
              </View>
            </>
          )}
        </Animated.View>

        {mode === 'otp' ? (
          <TouchableOpacity
            style={[styles.btn, (otpSent ? canVerifyOtp : isValidPhone) && styles.btnActive]}
            onPress={otpSent ? handleVerifyOtp : handleSendOtp}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>{otpSent ? 'Verify OTP & Login' : 'Send OTP'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.btn, canSignIn && styles.btnActive]}
            onPress={handlePasswordSignIn}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { height: 270, justifyContent: 'flex-end' },
  headerContent: { alignItems: 'center', paddingBottom: 34 },
  logoMotion: { alignItems: 'center' },
  iconWrap: {
    width: 78,
    height: 78,
    borderRadius: 24,
    backgroundColor: 'rgba(34,197,94,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
  },
  brand: { fontSize: 28, fontWeight: '900', color: '#fff', marginTop: 12 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.72)', marginTop: 4 },
  wave: {
    height: 30,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 36 },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: Colors.borderLight,
    borderRadius: 14,
    padding: 4,
    marginBottom: 22,
  },
  modeBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 11 },
  modeBtnActive: { backgroundColor: Colors.surface },
  modeText: { fontSize: 14, fontWeight: '800', color: Colors.textMuted },
  modeTextActive: { color: Colors.deliveryDark },
  title: { fontSize: 25, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  hint: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 24 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    marginBottom: 16,
  },
  inputRowFocused: { borderColor: Colors.deliveryAccent },
  countryCode: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 8 },
  fieldIcon: {
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flag: { fontSize: 14, fontWeight: '800', color: Colors.textSecondary },
  code: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  dividerVertical: { width: 1, height: 28, backgroundColor: Colors.border },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 18,
    fontSize: 17,
    color: Colors.textPrimary,
    letterSpacing: 0,
  },
  btn: {
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: Colors.borderLight,
    marginTop: 4,
  },
  btnActive: {
    backgroundColor: Colors.deliveryAccent,
    shadowColor: Colors.deliveryAccent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  btnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
