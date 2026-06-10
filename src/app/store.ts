import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import vehiclesReducer from '../features/vehicles/vehiclesSlice';
import driversReducer from '../features/driver/driverSlice';
import reservationsReducer from '../features/reservation/reservationSlice';
import chatReducer from '../features/chat/chatSlice';
import profileReducer from '../features/profile/profileSlice'; // Added profile slice

export const store = configureStore({
reducer: {
auth: authReducer,
vehicles: vehiclesReducer,
drivers: driversReducer,
reservations: reservationsReducer,
chat: chatReducer,
profile: profileReducer, // add profile reducer here
},
middleware: (getDefaultMiddleware) =>
getDefaultMiddleware({
serializableCheck: {
ignoredActions: [],
ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
ignoredPaths: ['drivers.currentDriver'],
},
}),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
