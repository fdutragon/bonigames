import { createClient } from '@supabase/supabase-js';

// Carrega variáveis de ambiente (NEXT_PUBLIC_*)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase env vars não configuradas. Adicione NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
