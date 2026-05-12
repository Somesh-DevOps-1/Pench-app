import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  onboardingSeen: '@penchfoods/onboarding-seen',
  session: '@penchfoods/session',
  registeredCustomer: '@penchfoods/registered-customer',
};

export async function hasSeenOnboarding() {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.onboardingSeen);
  return value === 'true';
}

export function markOnboardingSeen() {
  return AsyncStorage.setItem(STORAGE_KEYS.onboardingSeen, 'true');
}

export async function getStoredSession() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.session);
  return raw ? JSON.parse(raw) : null;
}

export function setStoredSession(session) {
  return AsyncStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
}

export function clearStoredSession() {
  return AsyncStorage.removeItem(STORAGE_KEYS.session);
}

export async function getRegisteredCustomer() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.registeredCustomer);
  return raw ? JSON.parse(raw) : null;
}

export function setRegisteredCustomer(customer) {
  return AsyncStorage.setItem(STORAGE_KEYS.registeredCustomer, JSON.stringify(customer));
}
