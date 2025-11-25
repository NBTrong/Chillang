import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabaseClient: SupabaseClient<Database> | null = null

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey)
} else {
  console.warn(
    'Supabase credentials are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.',
  )
}

export const supabase = supabaseClient

