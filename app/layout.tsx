import type React from "react"
import "@/app/globals.css"
import type { Metadata } from "next"
import { Cairo } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { ReduxProvider } from "@/lib/redux/provider"
import { cn } from "@/lib/utils"
import './globals.css'
import { UserProvider } from "@/providers/userContext"
import { QueryProvider } from "@/providers/query-provider"

const cairo = Cairo({
  subsets: ["arabic"],
  display: "swap",
  variable: "--font-cairo",
})

export const metadata: Metadata = {
  title: "نظام حضور معهد راية",
  description: "نظام تتبع الحضور والغياب للطلبة في معهد راية",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" >
      <body className={cn("min-h-screen bg-background font-cairo antialiased", cairo.variable)}>
      <QueryProvider>
        <ReduxProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <UserProvider>
            {children}
          </UserProvider>
            <Toaster />
          </ThemeProvider>
        </ReduxProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
