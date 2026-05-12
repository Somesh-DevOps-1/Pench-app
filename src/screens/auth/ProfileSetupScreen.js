import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  StatusBar, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from '../../store';
import { updateProfile } from '../../store/slices/authSlice';
import { resetToRootScreen } from '../../navigation/navigationHelpers';
import { Colors } from '../../theme/colors';
import { setStoredSession } from '../../utils/storage';
import { getDefaultUserName, getRoleLabel, normalizeUserRole } from '../../utils/auth';

export default function ProfileSetupScreen({ navigation }) {
  const dispatch = useDispatch();
  const { phone, user } = useSelector(state => state.auth);
  const role = normalizeUserRole(user?.role);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  const goToMain = () => resetToRootScreen(navigation, 'Main');

  const handleDone = async () => {
    const nextUser = {
      ...user,
      role,
      name: name || getDefaultUserName(role),
      email,
    };
    dispatch(updateProfile(nextUser));
    await setStoredSession(nextUser);
    goToMain();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account" size={56} color={Colors.primary} />
          </View>
          <Text style={styles.avatarHint}>Tell us a bit about yourself</Text>
        </View>

        <Text style={styles.title}>Complete Profile</Text>
        <Text style={styles.subtitle}>Finish your {getRoleLabel(role).toLowerCase()} setup to personalize the app</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Account Type</Text>
          <View style={[styles.inputRow, styles.inputRowReadonly]}>
            <MaterialCommunityIcons
              name="account-heart-outline"
              size={20}
              color={Colors.primary}
            />
            <Text style={styles.phoneText}>{getRoleLabel(role)}</Text>
            <MaterialCommunityIcons name="check-circle" size={18} color={Colors.success} />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="account-outline" size={20} color={Colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="Your full name"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email (Optional)</Text>
          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="email-outline" size={20} color={Colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Mobile Number</Text>
          <View style={[styles.inputRow, styles.inputRowReadonly]}>
            <MaterialCommunityIcons name="phone-outline" size={20} color={Colors.primary} />
            <Text style={styles.phoneText}>+91 {phone}</Text>
            <MaterialCommunityIcons name="check-circle" size={18} color={Colors.success} />
          </View>
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleDone} activeOpacity={0.85}>
          <Text style={styles.btnText}>
            Start Fresh Delivery {'->'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={goToMain}>
          <Text style={styles.skip}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60 },
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarHint: { color: Colors.textMuted, fontSize: 13 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 32 },
  fieldGroup: { marginBottom: 20 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
  },
  inputRowReadonly: {
    borderColor: Colors.successLight,
    backgroundColor: Colors.successLight,
  },
  input: { flex: 1, fontSize: 16, color: Colors.textPrimary },
  phoneText: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.primary },
  btn: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  skip: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 32 },
});
