import { PostgrestClient } from "@supabase/postgrest-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabaseConfig";

// Bizga faqat RPC kerak: to'liq supabase-js (Auth, Storage, Realtime) o'rniga yengil PostgREST mijozi
export const supabase = new PostgrestClient(`${SUPABASE_URL}/rest/v1`, {
  headers: { apikey: SUPABASE_ANON_KEY },
});
