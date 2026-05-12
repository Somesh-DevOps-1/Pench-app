import React, { useRef, useState } from 'react';
import {
  Alert,
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  StatusBar, KeyboardAvoidingView, Platform, Animated, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from '../../store';
import { loginSuccess, logout, setPhone } from '../../store/slices/authSlice';
import { resetToRootScreen } from '../../navigation/navigationHelpers';
import { Colors } from '../../theme/colors';
import {
  clearStoredSession,
  getRegisteredCustomer,
  setRegisteredCustomer,
  setStoredSession,
} from '../../utils/storage';
import { USER_ROLES } from '../../utils/auth';
import BrandLogo from '../../components/BrandLogo';
import { authApi } from '../../services/api';

const DEMO_USERNAME = 'customer';
const DEMO_PASSWORD = '123456';

export default function PhoneLoginScreen({ navigation }) {
  const [mode, setMode] = useState('otp');
  const [phone, setPhoneLocal] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPhone, setForgotPhone] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRetypePassword, setSignupRetypePassword] = useState('');
  const [signupAddress, setSignupAddress] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [focusedField, setFocusedField] = useState('');
  const dispatch = useDispatch();
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const isValid = phone.length === 10 && /^[6-9]\d{9}$/.test(phone);
  const isForgotPhoneValid = forgotPhone.length === 10 && /^[6-9]\d{9}$/.test(forgotPhone);
  const canSignIn = username.trim().length > 0 && password.length > 0;
  const canSignUp = signupName.trim().length > 0
    && signupEmail.trim().length > 0
    && signupPassword.length > 0
    && signupRetypePassword.length > 0
    && signupAddress.trim().length > 0
    && signupPhone.length > 0;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleContinue = async () => {
    if (!isValid) {
      shake();
      return;
    }

    try {
      const challenge = await authApi.requestOtp(phone, USER_ROLES.CUSTOMER);
      dispatch(setPhone(phone));
      navigation.navigate('OTP', { phone, role: USER_ROLES.CUSTOMER, devOtp: challenge.dev_otp });
    } catch (error) {
      Alert.alert('OTP Error', error.message || 'Unable to send OTP. Please try again.');
    }
  };

  const handlePasswordSignIn = async () => {
    if (!canSignIn) {
      shake();
      return;
    }

    const registeredCustomer = await getRegisteredCustomer();
    const isRegisteredCustomer = registeredCustomer
      && username.trim().toLowerCase() === registeredCustomer.name.toLowerCase()
      && password === registeredCustomer.password;
    const isDemoCustomer = username.trim().toLowerCase() === DEMO_USERNAME && password === DEMO_PASSWORD;

    if (!isRegisteredCustomer && !isDemoCustomer) {
      Alert.alert('Invalid Login', 'Use your full name and password after sign-up.');
      return;
    }

    const session = isRegisteredCustomer
      ? {
          id: registeredCustomer.id,
          name: registeredCustomer.name,
          phone: registeredCustomer.phone,
          role: USER_ROLES.CUSTOMER,
          email: registeredCustomer.email,
          token: 'registered_customer_session',
          address: registeredCustomer.address,
        }
      : {
          id: 'u1',
          name: 'Customer',
          phone: '9876543210',
          role: USER_ROLES.CUSTOMER,
          email: '',
          token: 'mock_token_abc123',
        };

    dispatch(setPhone(session.phone));
    dispatch(loginSuccess(session));
    await setStoredSession(session);
    resetToRootScreen(navigation, 'Main');
  };

  const handleForgotPasswordOtp = async () => {
    if (!isForgotPhoneValid) {
      shake();
      return;
    }

    const registeredCustomer = await getRegisteredCustomer();
    if (registeredCustomer && registeredCustomer.phone !== forgotPhone) {
      Alert.alert('Phone Not Found', 'Enter the mobile number used during sign-up.');
      return;
    }

    try {
      const challenge = await authApi.requestOtp(forgotPhone, USER_ROLES.CUSTOMER);
      dispatch(setPhone(forgotPhone));
      navigation.navigate('OTP', {
        phone: forgotPhone,
        role: USER_ROLES.CUSTOMER,
        devOtp: challenge.dev_otp,
      });
    } catch (error) {
      Alert.alert('OTP Error', error.message || 'Unable to send OTP. Please try again.');
    }
  };

  const handleSignUp = async () => {
    if (!canSignUp) {
      shake();
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(signupEmail.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email id.');
      return;
    }

    if (signupPassword !== signupRetypePassword) {
      Alert.alert('Password Mismatch', 'Password and re-type password must match.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(signupPhone)) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number.');
      return;
    }

    const cleanAddress = signupAddress.trim();
    const registeredCustomer = {
      id: `customer_${Date.now()}`,
      name: signupName.trim(),
      phone: signupPhone,
      role: USER_ROLES.CUSTOMER,
      email: signupEmail.trim(),
      password: signupPassword,
      address: {
        shortAddress: cleanAddress,
        fullAddress: cleanAddress,
        addressLine1: cleanAddress,
      },
    };

    await setRegisteredCustomer(registeredCustomer);
    await clearStoredSession();
    dispatch(logout());
    setUsername(registeredCustomer.name);
    setPassword('');
    setSignupName('');
    setSignupEmail('');
    setSignupPassword('');
    setSignupRetypePassword('');
    setSignupAddress('');
    setSignupPhone('');
    setMode('password');
    Alert.alert('Account Created', 'Please sign in with your full name and password.');
  };

  const handleBrowseAsGuest = async () => {
    try {
      await clearStoredSession();
    } finally {
      dispatch(logout());
      resetToRootScreen(navigation, 'Main');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={styles.header}>
        <View style={styles.headerContent}>
          <BrandLogo width={180} height={86} framed />
          <Text style={styles.headerTagline}>Pure A2 Milk | Nagpur</Text>
        </View>
        <View style={styles.wave} />
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        decelerationRate="normal"
        bounces
        overScrollMode="always"
      >
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'otp' && styles.modeBtnActive]}
            onPress={() => setMode('otp')}
            activeOpacity={0.85}
          >
            <Text style={[styles.modeText, mode === 'otp' && styles.modeTextActive]}>OTP Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'password' && styles.modeBtnActive]}
            onPress={() => setMode('password')}
            activeOpacity={0.85}
          >
            <Text style={[styles.modeText, mode === 'password' && styles.modeTextActive]}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'signup' && styles.modeBtnActive]}
            onPress={() => setMode('signup')}
            activeOpacity={0.85}
          >
            <Text style={[styles.modeText, mode === 'signup' && styles.modeTextActive]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>
          {mode === 'otp' ? 'Login / Sign Up' : mode === 'password' ? 'Sign In' : 'Create Account'}
        </Text>
        <Text style={styles.subtitle}>
          {mode === 'otp'
            ? 'Enter your mobile number to receive an OTP'
            : mode === 'password'
              ? 'Enter your full name and password'
              : 'Enter your details to create a customer account'}
        </Text>

        <Animated.View
          style={[
            styles.formWrap,
            { transform: [{ translateX: shakeAnim }] },
          ]}
        >
          {mode === 'otp' ? (
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
                onChangeText={setPhoneLocal}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField('')}
              />
            </View>
          ) : mode === 'password' ? (
            <>
              <View style={[styles.inputRow, focusedField === 'username' && styles.inputRowFocused]}>
                <View style={styles.fieldIcon}>
                  <MaterialCommunityIcons name="account" size={21} color={Colors.primary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="words"
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField('')}
                />
              </View>

              <View style={[styles.inputRow, focusedField === 'password' && styles.inputRowFocused]}>
                <View style={styles.fieldIcon}>
                  <MaterialCommunityIcons name="lock" size={21} color={Colors.primary} />
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

              <TouchableOpacity
                style={styles.forgotToggle}
                onPress={() => setForgotPasswordOpen(current => !current)}
                activeOpacity={0.8}
              >
                <Text style={styles.forgotToggleText}>Forgot password?</Text>
              </TouchableOpacity>

              {forgotPasswordOpen && (
                <View style={styles.forgotPanel}>
                  <View style={[styles.inputRow, focusedField === 'forgotPhone' && styles.inputRowFocused]}>
                    <View style={styles.fieldIcon}>
                      <MaterialCommunityIcons name="cellphone-key" size={21} color={Colors.primary} />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Registered mobile number"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={forgotPhone}
                      onChangeText={setForgotPhone}
                      onFocus={() => setFocusedField('forgotPhone')}
                      onBlur={() => setFocusedField('')}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.forgotBtn, isForgotPhoneValid && styles.forgotBtnActive]}
                    onPress={handleForgotPasswordOtp}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.forgotBtnText, isForgotPhoneValid && styles.forgotBtnTextActive]}>
                      Send OTP to Login
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <>
              <View style={[styles.inputRow, focusedField === 'signupName' && styles.inputRowFocused]}>
                <View style={styles.fieldIcon}>
                  <MaterialCommunityIcons name="account-outline" size={21} color={Colors.primary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={Colors.textMuted}
                  value={signupName}
                  onChangeText={setSignupName}
                  autoCapitalize="words"
                  onFocus={() => setFocusedField('signupName')}
                  onBlur={() => setFocusedField('')}
                />
              </View>

              <View style={[styles.inputRow, focusedField === 'signupEmail' && styles.inputRowFocused]}>
                <View style={styles.fieldIcon}>
                  <MaterialCommunityIcons name="email-outline" size={21} color={Colors.primary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Email ID"
                  placeholderTextColor={Colors.textMuted}
                  value={signupEmail}
                  onChangeText={setSignupEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('signupEmail')}
                  onBlur={() => setFocusedField('')}
                />
              </View>

              <View style={[styles.inputRow, focusedField === 'signupPassword' && styles.inputRowFocused]}>
                <View style={styles.fieldIcon}>
                  <MaterialCommunityIcons name="lock-outline" size={21} color={Colors.primary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry
                  value={signupPassword}
                  onChangeText={setSignupPassword}
                  onFocus={() => setFocusedField('signupPassword')}
                  onBlur={() => setFocusedField('')}
                />
              </View>

              <View style={[styles.inputRow, focusedField === 'signupRetypePassword' && styles.inputRowFocused]}>
                <View style={styles.fieldIcon}>
                  <MaterialCommunityIcons name="lock-check-outline" size={21} color={Colors.primary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Re-type Password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry
                  value={signupRetypePassword}
                  onChangeText={setSignupRetypePassword}
                  onFocus={() => setFocusedField('signupRetypePassword')}
                  onBlur={() => setFocusedField('')}
                />
              </View>

              <View style={[styles.inputRow, styles.addressInputRow, focusedField === 'signupAddress' && styles.inputRowFocused]}>
                <View style={styles.fieldIcon}>
                  <MaterialCommunityIcons name="map-marker-outline" size={21} color={Colors.primary} />
                </View>
                <TextInput
                  style={[styles.input, styles.addressInput]}
                  placeholder="Address"
                  placeholderTextColor={Colors.textMuted}
                  value={signupAddress}
                  onChangeText={setSignupAddress}
                  multiline
                  textAlignVertical="top"
                  onFocus={() => setFocusedField('signupAddress')}
                  onBlur={() => setFocusedField('')}
                />
              </View>

              <View style={[styles.inputRow, focusedField === 'signupPhone' && styles.inputRowFocused]}>
                <View style={styles.fieldIcon}>
                  <MaterialCommunityIcons name="phone-outline" size={21} color={Colors.primary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={signupPhone}
                  onChangeText={setSignupPhone}
                  onFocus={() => setFocusedField('signupPhone')}
                  onBlur={() => setFocusedField('')}
                />
              </View>
            </>
          )}
        </Animated.View>

        <TouchableOpacity
          style={[
            styles.btn,
            (mode === 'otp' ? isValid : mode === 'password' ? canSignIn : canSignUp) && styles.btnActive,
          ]}
          onPress={mode === 'otp' ? handleContinue : mode === 'password' ? handlePasswordSignIn : handleSignUp}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.btnText,
              (mode === 'otp' ? isValid : mode === 'password' ? canSignIn : canSignUp) && styles.btnTextActive,
            ]}
          >
            {mode === 'otp' ? (isValid ? 'Send OTP ->' : 'Enter Mobile Number') : mode === 'password' ? 'Sign In' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.link}>Terms of Service</Text> and{' '}
          <Text style={styles.link}>Privacy Policy</Text>
        </Text>

        <View style={styles.separator}>
          <View style={styles.sepLine} />
          <Text style={styles.sepText}>OR</Text>
          <View style={styles.sepLine} />
        </View>

        <TouchableOpacity
          style={styles.guestBtn}
          onPress={handleBrowseAsGuest}
        >
          <Text style={styles.guestText}>Browse as Guest</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { height: 240, justifyContent: 'flex-end' },
  headerContent: { alignItems: 'center', paddingBottom: 28 },
  headerTagline: { fontSize: 13, color: 'rgba(255,255,255,0.78)', marginTop: 10 },
  wave: {
    height: 30,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 28 },
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
  modeTextActive: { color: Colors.primary },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 28 },
  formWrap: { marginBottom: 20 },
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
  inputRowFocused: { borderColor: Colors.primary },
  forgotToggle: { alignSelf: 'flex-end', marginTop: -6, marginBottom: 14 },
  forgotToggleText: { color: Colors.primary, fontSize: 13, fontWeight: '800' },
  forgotPanel: {
    marginBottom: 4,
    paddingTop: 2,
  },
  forgotBtn: {
    alignItems: 'center',
    backgroundColor: Colors.borderLight,
    borderRadius: 12,
    marginBottom: 10,
    paddingVertical: 13,
  },
  forgotBtnActive: { backgroundColor: Colors.successLight },
  forgotBtnText: { color: Colors.textMuted, fontSize: 14, fontWeight: '800' },
  forgotBtnTextActive: { color: Colors.primary },
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
  addressInputRow: { alignItems: 'flex-start' },
  addressInput: { minHeight: 74, paddingTop: 18 },
  btn: {
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: Colors.borderLight,
    marginBottom: 16,
  },
  btnActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  btnText: { fontSize: 16, fontWeight: '700', color: Colors.textMuted },
  btnTextActive: { color: '#fff' },
  terms: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
  link: { color: Colors.primary, fontWeight: '600' },
  separator: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  sepLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  sepText: { color: Colors.textMuted, fontWeight: '600', fontSize: 13 },
  guestBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  guestText: { color: Colors.textSecondary, fontWeight: '700', fontSize: 15 },
});
