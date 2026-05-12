import type { AppAction } from '../types';

export const FREE_DELIVERY_THRESHOLD = 200;

export const CART_ADD = 'cart/addToCart';
export const CART_REMOVE = 'cart/removeFromCart';
export const CART_DELETE = 'cart/deleteFromCart';
export const CART_CLEAR = 'cart/clearCart';
export const CART_APPLY_COUPON = 'cart/applyCoupon';
export const CART_REMOVE_COUPON = 'cart/removeCoupon';
export const CART_SET_DELIVERY_FEE = 'cart/setDeliveryFee';
export const CART_SET_SELECTED_ADDRESS = 'cart/setSelectedAddress';

export interface CartItem {
  id: string;
  skuId: string;
  name: string;
  unit: string;
  price: number;
  mrp: number;
  image?: string;
  quantity: number;
  category?: string;
}

export interface CartState {
  items: CartItem[];
  coupon: Record<string, any> | null;
  couponDiscount: number;
  deliveryFee: number;
  selectedAddressId: string | null;
}

export function createInitialCartState(): CartState {
  return {
    items: [],
    coupon: null,
    couponDiscount: 0,
    deliveryFee: 20,
    selectedAddressId: null,
  };
}

export const addToCart = (payload: Record<string, any>): AppAction<Record<string, any>> => ({
  type: CART_ADD,
  payload,
});

export const removeFromCart = (payload: string): AppAction<string> => ({ type: CART_REMOVE, payload });
export const deleteFromCart = (payload: string): AppAction<string> => ({ type: CART_DELETE, payload });
export const clearCart = (): AppAction => ({ type: CART_CLEAR });
export const applyCoupon = (payload: Record<string, any>): AppAction<Record<string, any>> => ({
  type: CART_APPLY_COUPON,
  payload,
});
export const removeCoupon = (): AppAction => ({ type: CART_REMOVE_COUPON });
export const setDeliveryFee = (payload: number): AppAction<number> => ({
  type: CART_SET_DELIVERY_FEE,
  payload,
});
export const setSelectedAddress = (payload: string): AppAction<string> => ({
  type: CART_SET_SELECTED_ADDRESS,
  payload,
});

export function cartReducer(state: CartState, action: AppAction): CartState {
  switch (action.type) {
    case CART_ADD: {
      const payload = (action.payload || {}) as Record<string, any>;
      const product = payload.product;
      const skuId = payload.skuId;
      const sku = product?.skus?.find((item: any) => item.id === skuId) || product?.skus?.[0];

      if (!product || !sku) {
        return state;
      }

      const existing = state.items.find(item => item.skuId === skuId);
      if (existing) {
        return {
          ...state,
          items: state.items.map(item =>
            item.skuId === skuId ? { ...item, quantity: item.quantity + 1 } : item,
          ),
        };
      }

      return {
        ...state,
        items: [
          ...state.items,
          {
            id: product.id,
            skuId,
            name: product.name,
            unit: sku.label,
            price: sku.price,
            mrp: sku.mrp,
            image: product.image,
            quantity: 1,
            category: product.category,
          },
        ],
      };
    }
    case CART_REMOVE: {
      const skuId = String(action.payload ?? '');
      const existing = state.items.find(item => item.skuId === skuId);
      if (!existing) {
        return state;
      }

      return {
        ...state,
        items:
          existing.quantity > 1
            ? state.items.map(item =>
                item.skuId === skuId ? { ...item, quantity: item.quantity - 1 } : item,
              )
            : state.items.filter(item => item.skuId !== skuId),
      };
    }
    case CART_DELETE:
      return {
        ...state,
        items: state.items.filter(item => item.skuId !== action.payload),
      };
    case CART_CLEAR:
      return {
        ...state,
        items: [],
        coupon: null,
        couponDiscount: 0,
      };
    case CART_APPLY_COUPON: {
      const payload = (action.payload || {}) as Record<string, any>;
      const coupon = payload.coupon;
      const subtotal = Number(payload.subtotal || 0);
      if (!coupon || subtotal < coupon.minOrder) {
        return state;
      }

      const couponDiscount =
        coupon.type === 'percent'
          ? Math.min(Math.round((subtotal * coupon.discount) / 100), coupon.maxDiscount)
          : coupon.discount;

      return {
        ...state,
        coupon,
        couponDiscount,
      };
    }
    case CART_REMOVE_COUPON:
      return {
        ...state,
        coupon: null,
        couponDiscount: 0,
      };
    case CART_SET_DELIVERY_FEE:
      return { ...state, deliveryFee: Number(action.payload || 0) };
    case CART_SET_SELECTED_ADDRESS:
      return { ...state, selectedAddressId: String(action.payload ?? '') };
    default:
      return state;
  }
}

export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartCount = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
export const selectCartSubtotal = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
export const selectCartDeliveryFee = (state: { cart: CartState }) =>
  selectCartSubtotal(state) >= FREE_DELIVERY_THRESHOLD ? 0 : state.cart.deliveryFee;
export const selectCartTotal = (state: { cart: CartState }) =>
  selectCartSubtotal(state) + selectCartDeliveryFee(state) - state.cart.couponDiscount;
