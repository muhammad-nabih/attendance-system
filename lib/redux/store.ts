import { configureStore } from "@reduxjs/toolkit"
import { setupListeners } from "@reduxjs/toolkit/query"
import { authApi } from "./api/authApi"
import { attendanceApi } from "./api/attendanceApi"
import authReducer from "./slices/authSlice"
import attendanceReducer from "./slices/attendanceSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    attendance: attendanceReducer,
    [authApi.reducerPath]: authApi.reducer,
    [attendanceApi.reducerPath]: attendanceApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(authApi.middleware, attendanceApi.middleware),
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

