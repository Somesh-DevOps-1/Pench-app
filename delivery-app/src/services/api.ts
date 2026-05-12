import Constants from 'expo-constants';

type JsonBody = Record<string, unknown> | unknown[];

const expoExtra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;
const expoHostUri =
  Constants.expoConfig?.hostUri ||
  Constants.manifest2?.extra?.expoGo?.debuggerHost ||
  '';
const expoHost = expoHostUri ? String(expoHostUri).split(':')[0] : '';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  expoExtra.apiBaseUrl ||
  'http://localhost:8000/api/v1';

const API_BASE_URLS = Array.from(
  new Set(
    [
      API_BASE_URL,
      expoHost ? `http://${expoHost}:8000/api/v1` : '',
      'http://10.0.2.2:8000/api/v1',
      'http://127.0.0.1:8000/api/v1',
      'http://localhost:8000/api/v1',
    ].filter(Boolean),
  ),
);

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let lastNetworkError: unknown;
  let response: Response;

  for (const baseUrl of API_BASE_URLS) {
    const url = `${baseUrl}${path}`;

    try {
      response = await fetch(url, {
        ...options,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });
    } catch (error) {
      lastNetworkError = error;
      continue;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `API request failed with ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  throw new Error(
    `Network request failed. Tried: ${API_BASE_URLS.join(', ')}. Start Django with: python manage.py runserver 0.0.0.0:8000`,
  );
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: JsonBody) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: JsonBody) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
};

export const customerApi = {
  upsertCustomer: (payload: JsonBody) => api.post('/customers/upsert-by-phone/', payload),
  updateCustomer: (customerId: string | number, payload: JsonBody) =>
    api.patch(`/customers/${customerId}/`, payload),
  products: () => api.get('/products/'),
  categories: () => api.get('/categories/'),
  createOrder: (payload: JsonBody) => api.post('/orders/', payload),
  liveLocation: (orderId: string) => api.get(`/live-location/${orderId}/`),
};

export const authApi = {
  requestOtp: (phone: string, role = 'customer') =>
    api.post<{ phone: string; role: string; expires_in: number; dev_otp?: string }>(
      '/auth/request-otp/',
      { phone, role },
    ),
  verifyOtp: (phone: string, otp: string, role = 'customer') =>
    api.post<Record<string, unknown>>('/auth/verify-otp/', { phone, otp, role }),
  firebasePhoneLogin: (idToken: string, role = 'customer') =>
    api.post<Record<string, unknown>>('/auth/firebase-phone-login/', { idToken, role }),
};

export const deliveryApi = {
  assignments: (partnerId?: string | number) =>
    api.get(`/delivery-assignments/${partnerId ? `?partner=${partnerId}` : ''}`),
  updateAssignment: (assignmentId: string | number, payload: JsonBody) =>
    api.patch(`/delivery-assignments/${assignmentId}/`, payload),
  updateBottleCollection: (assignmentId: string | number, payload: JsonBody) =>
    api.patch(`/delivery-assignments/${assignmentId}/`, payload),
  publishLocation: (orderId: string | number, payload: JsonBody) =>
    api.post(`/live-location/${orderId}/`, payload),
  eta: (payload: JsonBody) => api.post('/eta/', payload),
};
