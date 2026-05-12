import { create } from 'zustand';
import type { AppAction } from './types';
import {
  AUTH_LOGOUT,
  authReducer,
  createInitialAuthState,
  type AuthState,
} from './slices/authSlice';
import {
  cartReducer,
  createInitialCartState,
  type CartState,
} from './slices/cartSlice';
import {
  createInitialProductsState,
  productsReducer,
  type ProductsState,
} from './slices/productsSlice';
import {
  createInitialOrdersState,
  ordersReducer,
  type OrdersState,
} from './slices/ordersSlice';
import {
  createInitialSubscriptionState,
  subscriptionReducer,
  type SubscriptionState,
} from './slices/subscriptionSlice';

export interface RootState {
  auth: AuthState;
  cart: CartState;
  products: ProductsState;
  orders: OrdersState;
  subscription: SubscriptionState;
}

interface AppStore extends RootState {
  dispatch: (action: AppAction) => void;
  reset: () => void;
}

function createInitialState(): RootState {
  return {
    auth: createInitialAuthState(),
    cart: createInitialCartState(),
    products: createInitialProductsState(),
    orders: createInitialOrdersState(),
    subscription: createInitialSubscriptionState(),
  };
}

function reduceState(state: RootState, action: AppAction): RootState {
  if (action.type === AUTH_LOGOUT) {
    return createInitialState();
  }

  return {
    auth: authReducer(state.auth, action),
    cart: cartReducer(state.cart, action),
    products: productsReducer(state.products, action),
    orders: ordersReducer(state.orders, action),
    subscription: subscriptionReducer(state.subscription, action),
  };
}

export const useAppStore = create<AppStore>()((set) => ({
  ...createInitialState(),
  dispatch: (action: AppAction) => {
    set(state => ({
      ...reduceState(state, action),
      dispatch: state.dispatch,
      reset: state.reset,
    }));
  },
  reset: () => {
    set(state => ({
      ...createInitialState(),
      dispatch: state.dispatch,
      reset: state.reset,
    }));
  },
}));

export function useSelector<T>(selector: (state: RootState) => T): T {
  return useAppStore(state => selector(state));
}

export function useDispatch() {
  return useAppStore(state => state.dispatch);
}
