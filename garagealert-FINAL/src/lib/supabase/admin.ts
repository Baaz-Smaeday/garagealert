import { createClient, SupabaseClient } from '@supabase/supabase-js'

// IMPORTANT: This client bypasses Row Level Security.
// Only use in server-side code (API routes, cron jobs, webhooks).
// NEVER import this in client components or pages.
let _supabaseAdmin: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
    )
  }
  return _supabaseAdmin
}

// Backward compat
export const supabaseAdmin = null as any // Use getSupabaseAdmin() instead
