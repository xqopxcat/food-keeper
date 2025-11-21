import { configureStore } from '@reduxjs/toolkit';
import { foodCoreAPI } from './services/foodCoreAPI';

export const store = configureStore({
    reducer: {
        [foodCoreAPI.reducerPath]: foodCoreAPI.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(foodCoreAPI.middleware)
});

export default store;