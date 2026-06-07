/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kkwzsimfetaccrdfccvs.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_wu-2QSt3TAAvrkKb0GE70g_IDmujTxV';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
