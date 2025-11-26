import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web
import onboardingReducer from './slices/onboardingSlice';

// Redux Persist configuration
const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  whitelist: ['onboarding'], // Only persist onboarding state
  // blacklist: [], // Add any reducers you don't want to persist
};

// Combine reducers
const rootReducer = combineReducers({
  onboarding: onboardingReducer,
  // Add other reducers here as your app grows
  // auth: authReducer,
  // products: productsReducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types from redux-persist
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        // Ignore these paths in the state
        ignoredPaths: ['onboarding.businessDocs', 'onboarding.directorDocuments'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Create persistor
export const persistor = persistStore(store);

// Export types for TypeScript (optional, but recommended)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;
