import { MY_SUBSCRIPTIONS } from '../../data/mockData';
import type { AppAction } from '../types';
import { cloneDeep } from '../utils';

export const SUBSCRIPTION_ADD = 'subscription/addSubscription';
export const SUBSCRIPTION_PAUSE = 'subscription/pauseSubscription';
export const SUBSCRIPTION_RESUME = 'subscription/resumeSubscription';
export const SUBSCRIPTION_CANCEL = 'subscription/cancelSubscription';
export const SUBSCRIPTION_VACATION = 'subscription/setVacation';

export interface SubscriptionState {
  mySubscriptions: any[];
}

export function createInitialSubscriptionState(): SubscriptionState {
  return {
    mySubscriptions: cloneDeep(MY_SUBSCRIPTIONS),
  };
}

export const addSubscription = (payload: Record<string, any>): AppAction<Record<string, any>> => ({
  type: SUBSCRIPTION_ADD,
  payload,
});
export const pauseSubscription = (payload: string): AppAction<string> => ({
  type: SUBSCRIPTION_PAUSE,
  payload,
});
export const resumeSubscription = (payload: string): AppAction<string> => ({
  type: SUBSCRIPTION_RESUME,
  payload,
});
export const cancelSubscription = (payload: string): AppAction<string> => ({
  type: SUBSCRIPTION_CANCEL,
  payload,
});
export const setVacation = (payload: { id: string; vacationFrom: string; vacationTo: string }): AppAction<any> => ({
  type: SUBSCRIPTION_VACATION,
  payload,
});

export function subscriptionReducer(
  state: SubscriptionState,
  action: AppAction,
): SubscriptionState {
  switch (action.type) {
    case SUBSCRIPTION_ADD:
      return {
        ...state,
        mySubscriptions: [
          ...state.mySubscriptions,
          {
            id: `mysub_${Date.now()}`,
            status: 'active',
            startDate: new Date().toISOString().split('T')[0],
            ...(action.payload || {}),
          },
        ],
      };
    case SUBSCRIPTION_PAUSE:
      return {
        ...state,
        mySubscriptions: state.mySubscriptions.map(subscription =>
          subscription.id === action.payload
            ? { ...subscription, status: 'paused' }
            : subscription,
        ),
      };
    case SUBSCRIPTION_RESUME:
      return {
        ...state,
        mySubscriptions: state.mySubscriptions.map(subscription =>
          subscription.id === action.payload
            ? { ...subscription, status: 'active' }
            : subscription,
        ),
      };
    case SUBSCRIPTION_CANCEL:
      return {
        ...state,
        mySubscriptions: state.mySubscriptions.map(subscription =>
          subscription.id === action.payload
            ? { ...subscription, status: 'cancelled' }
            : subscription,
        ),
      };
    case SUBSCRIPTION_VACATION:
      const vacationPayload = action.payload as { id: string; vacationFrom: string; vacationTo: string };
      return {
        ...state,
        mySubscriptions: state.mySubscriptions.map(subscription =>
          subscription.id === vacationPayload.id
            ? { 
                ...subscription, 
                vacationFrom: vacationPayload.vacationFrom,
                vacationTo: vacationPayload.vacationTo,
              }
            : subscription,
        ),
      };
    default:
      return state;
  }
}
