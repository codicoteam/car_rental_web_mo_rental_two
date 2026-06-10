import { combineReducers } from "@reduxjs/toolkit";

import authReducer from "../features/auth/authSlice";
//import profileReducer from "../features/profile/profileSlice";
//import vehiclesReducer from "../features/vehicles/vehiclesSlice";
//import bookingsReducer from "../features/bookings/bookingsSlice";
//import dashboardReducer from "../features/dashboard/dashboardSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  //profile: profileReducer,
 // vehicles: vehiclesReducer,
 // bookings: bookingsReducer,
 // dashboard: dashboardReducer,
});

export default rootReducer;