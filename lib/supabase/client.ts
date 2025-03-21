// Supabase client

'use client';

import { createBrowserClient } from '@supabase/ssr';

// Supabase client

// Define a function to create a Supabase client for client-side operations
export const createClient = () => {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!
  );

  supabase
    .channel('schema-db-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
      },
      () => {}
    )
    .subscribe();

  return supabase;
};
