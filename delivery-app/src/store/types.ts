export interface AppAction<T = unknown> {
  type: string;
  payload?: T;
}
