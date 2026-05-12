import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from '../../store';
import { loginSuccess } from '../../store/slices/authSlice';
import { Colors } from '../../theme/colors';
import { setStoredSession } from '../../utils/storage';
import { getRoleLabel, normalizeUserRole } from '../../utils/auth';
import { authApi } from '../../services/api';

const OTP_LENGTH = 6;

export default function OTPScreen({ navigation, route }) {
  const { phone, role: rawRole, devOtp } = route.params;
  const role = normalizeUserRole(rawRole);
  const dispatch = useDispatch();
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
    const interval = setInterval(() => {
      setTimer(currentTimer => {
        if (currentTimer <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }

        return currentTimer - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const verifyOtp = async (code) => {
    try {
      const session = await authApi.verifyOtp(phone, code, role);
      dispatch(loginSuccess(session));
      await setStoredSession(session);
      navigation.replace('ProfileSetup');
    } catch (verifyError) {
      setError(verifyError.message || 'Invalid or expired OTP.');
    }
  };

  const handleInput = (value, index) => {
    const nextOtp = [...otp];
    nextOtp[index] = value.slice(-1);
    setOtp(nextOtp);
    setError('');

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (nextOtp.every(Boolean) && nextOtp.join('').length === OTP_LENGTH) {
      setTimeout(() => {
        verifyOtp(nextOtp.join(''));
      }, 200);
    }
  };

  const handleKeyPress = (event, index) => {
    if (event.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const resend = async () => {
    setTimer(30);
    setCanResend(false);
    setError('');
    setOtp(Array(OTP_LENGTH).fill(''));
    try {
      await authApi.requestOtp(phone, role);
    } catch (resendError) {
      setError(resendError.message || 'Unable to resend OTP.');
    }
    inputRefs.current[0]?.focus();
  };

  const filled = otp.join('');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="message-text" size={40} color={Colors.primary} />
        </View>
        <Text style={styles.title}>OTP Verification</Text>
        <Text style={styles.subtitle}>
          {getRoleLabel(role)} login for{'\n'}
          <Text style={styles.phone}>+91 {phone}</Text>
        </Text>
        <Text style={styles.hint}>
          {devOtp
            ? <>Development OTP: <Text style={{ fontWeight: '800' }}>{devOtp}</Text></>
            : 'Enter the OTP sent to your phone'}
        </Text>

        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => {
                inputRefs.current[index] = ref;
              }}
              style={[styles.otpBox, digit && styles.otpBoxFilled, error && styles.otpBoxError]}
              value={digit}
              onChangeText={value => handleInput(value, index)}
              onKeyPress={event => handleKeyPress(event, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, filled.length === OTP_LENGTH && styles.btnActive]}
          onPress={() => {
            verifyOtp(filled);
          }}
          disabled={filled.length < OTP_LENGTH}
        >
          <Text style={styles.btnText}>Verify OTP</Text>
        </TouchableOpacity>

        <View style={styles.resendRow}>
          {canResend ? (
            <TouchableOpacity onPress={resend}>
              <Text style={styles.resendLink}>Resend OTP</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.resendTimer}>
              Resend OTP in <Text style={styles.timer}>{timer}s</Text>
            </Text>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  back: { marginTop: 54, marginLeft: 20, padding: 4 },
  body: { flex: 1, paddingHorizontal: 28, paddingTop: 24 },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginBottom: 6 },
  phone: { fontWeight: '700', color: Colors.textPrimary },
  hint: { fontSize: 12, color: Colors.textMuted, marginBottom: 32 },
  otpRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  otpBox: {
    flex: 1,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  otpBoxFilled: { borderColor: Colors.primary, backgroundColor: Colors.successLight },
  otpBoxError: { borderColor: Colors.error, backgroundColor: Colors.errorLight },
  error: { color: Colors.error, fontSize: 13, marginBottom: 16, textAlign: 'center' },
  btn: {
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: Colors.borderLight,
    marginBottom: 20,
  },
  btnActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  btnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  resendRow: { alignItems: 'center' },
  resendTimer: { color: Colors.textMuted, fontSize: 14 },
  timer: { fontWeight: '700', color: Colors.primary },
  resendLink: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
});
