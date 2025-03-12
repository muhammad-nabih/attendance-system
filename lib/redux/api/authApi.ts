import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { setCredentials, logout } from "../slices/authSlice"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_KEY!)

export interface User {
  id: string
  email: string
  name: string
  role: "student" | "doctor"
}

export interface AuthResponse {
  user: User
  token: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  name: string
  email: string
  password: string
  role: "student" | "doctor"
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.token
      if (token) {
        headers.set("authorization", `Bearer ${token}`)
      }
      headers.set("apikey", process.env.NEXT_PUBLIC_SUPABASE_KEY || "")
      return headers
    },
  }),
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      queryFn: async (credentials) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })

          if (error) throw error

          // الحصول على بيانات المستخدم من جدول المستخدمين
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("email", credentials.email)
            .single()

          if (userError) throw userError

          return {
            data: {
              user: userData,
              token: data.session.access_token,
            },
          }
        } catch (error: any) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } }
        }
      },
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(setCredentials(data))
        } catch (err) {
          // يمكن إضافة معالجة الخطأ هنا
        }
      },
    }),
    signup: builder.mutation<AuthResponse, SignupRequest>({
      queryFn: async (userData) => {
        try {
          // إنشاء حساب في نظام المصادقة
          const { data, error } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
          })

          if (error) throw error

          // إضافة المستخدم إلى جدول المستخدمين
          const { data: newUser, error: userError } = await supabase
            .from("users")
            .insert([
              {
                id: data.user?.id,
                name: userData.name,
                email: userData.email,
                password: "hashed_password", // في الواقع يجب تشفير كلمة المرور
                role: userData.role,
              },
            ])
            .select()

          if (userError) throw userError

          return {
            data: {
              user: newUser[0],
              token: data.session?.access_token || "",
            },
          }
        } catch (error: any) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } }
        }
      },
    }),
    logout: builder.mutation<void, void>({
      queryFn: async () => {
        try {
          const { error } = await supabase.auth.signOut()
          if (error) throw error
          return { data: undefined }
        } catch (error: any) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } }
        }
      },
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          dispatch(logout())
        } catch (err) {
          // يمكن إضافة معالجة الخطأ هنا
        }
      },
    }),
  }),
})

export const { useLoginMutation, useSignupMutation, useLogoutMutation } = authApi

