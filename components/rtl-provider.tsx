"use client"

import type { ReactNode } from "react"
import rtlPlugin from "stylis-plugin-rtl"
import { prefixer } from "stylis"
import { CacheProvider } from "@emotion/react"
import createEmotionCache from "@emotion/cache"

interface RTLProviderProps {
  children: ReactNode
}

export function RTLProvider({ children }: RTLProviderProps) {
  const cache = createEmotionCache({
    key: "rtl",
    stylisPlugins: [prefixer, rtlPlugin],
  })

  return <CacheProvider value={cache}>{children}</CacheProvider>
}
