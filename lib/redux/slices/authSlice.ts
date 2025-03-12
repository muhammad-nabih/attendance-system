import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { AuthResponse, User } from "../api/authApi"

interface AuthState {
  user: User | null
  token: string | null
}

const initialState: AuthState = {
  user: null,
  token: null,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<AuthResponse>) => {
      state.user = action.payload.user
      state.token = action.payload.token
    },
    logout: (state) => {
      state.user = null
      state.token = null
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer

