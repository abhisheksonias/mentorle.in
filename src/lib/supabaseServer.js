import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    const authCookies = allCookies.filter(cookie => 
      cookie.name.startsWith('sb-') || cookie.name.includes('auth')
    );
    console.log('🍪 Auth cookies found:', authCookies.length);

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            try {
              return cookieStore.getAll();
            } catch (error) {
              console.error('Error getting cookies:', error);
              return [];
            }
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                try {
                  cookieStore.set(name, value, options);
                } catch (setError) {
                  // Ignore set errors
                }
              });
            } catch (error) {
              // Ignore
            }
          },
        },
      }
    );
  } catch (error) {
    console.error('Error creating Supabase server client:', error);
    throw error;
  }
}
