import { normalizeUserRole, USER_ROLES } from '../../utils/auth';
import type { AppAction } from '../types';

export const AUTH_SET_PHONE = 'auth/setPhone';
export const AUTH_LOGIN_SUCCESS = 'auth/loginSuccess';
export const AUTH_LOGOUT = 'auth/logout';
export const AUTH_UPDATE_PROFILE = 'auth/updateProfile';
export const AUTH_SET_LOADING = 'auth/setLoading';

export interface AuthState {
  user: Record<string, any> | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  phone: string;
  token: string | null;
}

export function createInitialAuthState(): AuthState {
  return {
    user: null,
    isLoggedIn: false,
    isLoading: false,
    phone: '',
    token: null,
  };
}

export const setPhone = (payload: string): AppAction<string> => ({ type: AUTH_SET_PHONE, payload });

export const loginSuccess = (payload: Record<string, any>): AppAction<Record<string, any>> => ({
  type: AUTH_LOGIN_SUCCESS,
  payload,
});

export const logout = (): AppAction => ({ type: AUTH_LOGOUT });

export const updateProfile = (payload: Record<string, any>): AppAction<Record<string, any>> => ({
  type: AUTH_UPDATE_PROFILE,
  payload,
});

export const setLoading = (payload: boolean): AppAction<boolean> => ({
  type: AUTH_SET_LOADING,
  payload,
});

export function authReducer(state: AuthState, action: AppAction): AuthState {
  switch (action.type) {
    case AUTH_SET_PHONE:
      return { ...state, phone: String(action.payload ?? '') };
    case AUTH_LOGIN_SUCCESS: {
      const payload = (action.payload || {}) as Record<string, any>;
      return {
        ...state,
        user: {
          ...payload,
          role: normalizeUserRole(payload.role),
        },
        isLoggedIn: true,
        phone: payload.phone || state.phone,
        token: payload.token || null,
      };
    }
    case AUTH_LOGOUT:
      return createInitialAuthState();
    case AUTH_UPDATE_PROFILE: {
      const payload = (action.payload || {}) as Record<string, any>;
      return {
        ...state,
        user: {
          ...(state.user || { role: USER_ROLES.CUSTOMER }),
          ...payload,
          role: normalizeUserRole(payload.role || state.user?.role),
        },
      };
    }
    case AUTH_SET_LOADING:
      return { ...state, isLoading: Boolean(action.payload) };
    default:
      return state;
  }
}
