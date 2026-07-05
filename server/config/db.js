import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

export const supabase =
  supabaseUrl && supabaseKey && !supabaseUrl.includes('your_supabase')
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export function isSupabaseConfigured() {
  return supabase !== null;
}
