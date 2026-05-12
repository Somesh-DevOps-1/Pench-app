import { CATEGORIES, PRODUCTS } from '../../data/mockData';
import type { AppAction } from '../types';
import { cloneDeep } from '../utils';

export const PRODUCTS_SET_CATEGORY = 'products/setCategory';
export const PRODUCTS_SET_SEARCH_QUERY = 'products/setSearchQuery';
export const PRODUCTS_CLEAR_SEARCH = 'products/clearSearch';

export interface ProductsState {
  products: any[];
  categories: any[];
  selectedCategory: string;
  searchQuery: string;
  searchResults: any[];
  isSearching: boolean;
}

export function createInitialProductsState(): ProductsState {
  return {
    products: cloneDeep(PRODUCTS),
    categories: cloneDeep(CATEGORIES),
    selectedCategory: 'all',
    searchQuery: '',
    searchResults: [],
    isSearching: false,
  };
}

export const setCategory = (payload: string): AppAction<string> => ({
  type: PRODUCTS_SET_CATEGORY,
  payload,
});

export const setSearchQuery = (payload: string): AppAction<string> => ({
  type: PRODUCTS_SET_SEARCH_QUERY,
  payload,
});

export const clearSearch = (): AppAction => ({ type: PRODUCTS_CLEAR_SEARCH });

export function productsReducer(state: ProductsState, action: AppAction): ProductsState {
  switch (action.type) {
    case PRODUCTS_SET_CATEGORY:
      return { ...state, selectedCategory: String(action.payload ?? 'all') };
    case PRODUCTS_SET_SEARCH_QUERY: {
      const searchQuery = String(action.payload ?? '');
      const query = searchQuery.toLowerCase().trim();
      if (query.length === 0) {
        return {
          ...state,
          searchQuery,
          searchResults: [],
          isSearching: false,
        };
      }

      const searchResults = PRODUCTS.map(product => {
        let score = 0;
        if (product.name.toLowerCase().includes(query)) score += 10;
        if (product.category.toLowerCase().includes(query)) score += 5;
        if (product.description?.toLowerCase().includes(query)) score += 2;
        if (product.badge?.toLowerCase().includes(query)) score += 3;
        return { ...product, _score: score };
      })
        .filter(product => product._score > 0)
        .sort((a, b) => b._score - a._score || b.rating - a.rating);

      return {
        ...state,
        searchQuery,
        searchResults,
        isSearching: true,
      };
    }
    case PRODUCTS_CLEAR_SEARCH:
      return {
        ...state,
        searchQuery: '',
        searchResults: [],
        isSearching: false,
      };
    default:
      return state;
  }
}

export const selectFilteredProducts = (state: { products: ProductsState }) => {
  const { products, selectedCategory } = state.products;
  return selectedCategory === 'all'
    ? products
    : products.filter(product => product.category === selectedCategory);
};

export const selectProductById = (state: { products: ProductsState }, id: string) =>
  state.products.products.find(product => product.id === id);
