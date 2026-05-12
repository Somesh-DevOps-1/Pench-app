import { LIVE_ORDER, ORDER_HISTORY } from '../../data/mockData';
import type { AppAction } from '../types';
import { cloneDeep } from '../utils';

export const ORDERS_PLACE = 'orders/placeOrder';
export const ORDERS_RATE = 'orders/rateOrder';
export const ORDERS_UPDATE_STATUS = 'orders/updateLiveOrderStatus';
export const ORDERS_UPDATE_AGENT_LOCATION = 'orders/updateAgentLocation';
export const ORDERS_DELIVER = 'orders/deliverLiveOrder';

export interface OrdersState {
  orders: any[];
  liveOrder: Record<string, any> | null;
  hasLiveOrder: boolean;
}

export function createInitialOrdersState(): OrdersState {
  return {
    orders: cloneDeep(ORDER_HISTORY),
    liveOrder: cloneDeep(LIVE_ORDER),
    hasLiveOrder: true,
  };
}

export const placeOrder = (payload: Record<string, any>): AppAction<Record<string, any>> => ({
  type: ORDERS_PLACE,
  payload,
});
export const rateOrder = (payload: Record<string, any>): AppAction<Record<string, any>> => ({
  type: ORDERS_RATE,
  payload,
});
export const updateLiveOrderStatus = (payload: string): AppAction<string> => ({
  type: ORDERS_UPDATE_STATUS,
  payload,
});
export const updateAgentLocation = (payload: Record<string, any>): AppAction<Record<string, any>> => ({
  type: ORDERS_UPDATE_AGENT_LOCATION,
  payload,
});
export const deliverLiveOrder = (): AppAction => ({ type: ORDERS_DELIVER });

export function ordersReducer(state: OrdersState, action: AppAction): OrdersState {
  switch (action.type) {
    case ORDERS_PLACE: {
      const payload = (action.payload || {}) as Record<string, any>;
      const newOrder = {
        id: `ord_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        status: 'placed',
        ...payload,
        rated: false,
        userRating: null,
      };

      return {
        ...state,
        orders: [newOrder, ...state.orders],
        liveOrder: {
          ...cloneDeep(LIVE_ORDER),
          id: newOrder.id,
          items: payload.items,
          total: payload.total,
          status: 'placed',
          deliveryAddress: payload.deliveryAddress || LIVE_ORDER.deliveryAddress,
          route: {
            ...cloneDeep(LIVE_ORDER.route),
            destination: payload.deliveryCoordinates?.latitude && payload.deliveryCoordinates?.longitude
              ? {
                  latitude: payload.deliveryCoordinates.latitude,
                  longitude: payload.deliveryCoordinates.longitude,
                  label: payload.deliveryAddress || 'Customer location',
                }
              : cloneDeep(LIVE_ORDER.route.destination),
          },
          statusTimeline: [
            { label: 'Order Placed', time: newOrder.time, done: true },
            { label: 'Confirmed', time: null, done: false },
            { label: 'Picked Up', time: null, done: false },
            { label: 'Out for Delivery', time: null, done: false },
            { label: 'Delivered', time: null, done: false },
          ],
        },
        hasLiveOrder: true,
      };
    }
    case ORDERS_RATE: {
      const payload = (action.payload || {}) as Record<string, any>;
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === payload.orderId
            ? { ...order, rated: true, userRating: payload.rating }
            : order,
        ),
      };
    }
    case ORDERS_UPDATE_STATUS:
      if (!state.liveOrder) {
        return state;
      }
      return {
        ...state,
        liveOrder: {
          ...state.liveOrder,
          status: action.payload,
        },
      };
    case ORDERS_UPDATE_AGENT_LOCATION:
      if (!state.liveOrder) {
        return state;
      }
      return {
        ...state,
        liveOrder: {
          ...state.liveOrder,
          route: {
            ...state.liveOrder.route,
            agentLocation: action.payload,
          },
        },
      };
    case ORDERS_DELIVER:
      if (!state.liveOrder) {
        return state;
      }
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === state.liveOrder?.id ? { ...order, status: 'delivered' } : order,
        ),
        liveOrder: {
          ...state.liveOrder,
          status: 'delivered',
        },
        hasLiveOrder: false,
      };
    default:
      return state;
  }
}
