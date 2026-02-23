import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Temporary logs to debug the 403 error
console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key exists:", !!supabaseKey); 

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file')
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '')