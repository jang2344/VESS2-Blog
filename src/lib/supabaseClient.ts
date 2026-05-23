import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let currentUrl = '';
let currentKey = '';

export function getSupabaseClient(url: string, anonKey: string): SupabaseClient {
  // If credentials changed or not initialized yet, let's create a new client
  if (!supabaseInstance || url !== currentUrl || anonKey !== currentKey) {
    if (!url || !anonKey) {
      throw new Error("Supabase URL and API Key are required to make real database queries.");
    }
    supabaseInstance = createClient(url, anonKey);
    currentUrl = url;
    currentKey = anonKey;
  }
  return supabaseInstance;
}

// Test configuration credentials and test connection
export async function testSupabaseConnection(url: string, anonKey: string): Promise<boolean> {
  try {
    const client = getSupabaseClient(url, anonKey);
    // Simple query to verify connection
    const { data, error } = await client
      .from('posts')
      .select('count', { count: 'exact', head: true });
    
    // If the table doesn't exist, we might get an error.
    // If it's a 401/403 or network error, connection failed.
    // Specifying head error is acceptable as long as we can read from it or if it responds.
    if (error && error.code === 'PGRST116') {
      // PGRST116 is just "no rows found", which is a success in connection!
      return true;
    }
    if (error && error.message.includes("does not exist")) {
      // Table doesn't exist, but connection to Supabase was successful!
      // This is a succesful credentials test because it reached Supabase.
      console.log("Supabase connected but 'posts' table is not created yet.");
      return true;
    }
    if (error) {
      console.error("Supabase connection error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Supabase verification failed:", err);
    return false;
  }
}
