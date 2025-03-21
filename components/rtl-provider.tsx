'use client';

import createEmotionCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';

import type { ReactNode } from 'react';

interface RTLProviderProps {
  children: ReactNode;
}

export function RTLProvider({ children }: RTLProviderProps) {
  const cache = createEmotionCache({
    key: 'rtl',
    stylisPlugins: [prefixer, rtlPlugin],
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
