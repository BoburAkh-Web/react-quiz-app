import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://jotfndvnggihacuythwo.supabase.co";
const supabaseAnonKey = "sb_publishable_79lUB6RbyxMVhUZTjcx2fg_PHepX11n";
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
