import { configureStore } from '@reduxjs/toolkit';
import { foodCoreAPI } from './services/foodCoreAPI';
import { subscribeCoreAPI } from './services/subscribeCoreAPI';

export const store = configureStore({
    reducer: {
        [foodCoreAPI.reducerPath]: foodCoreAPI.reducer,
        [subscribeCoreAPI.reducerPath]: subscribeCoreAPI.reducer,
    },
    middleware: (getDefaultMiddleware) => 
        getDefaultMiddleware().concat(foodCoreAPI.middleware, subscribeCoreAPI.middleware)
});

export default store;