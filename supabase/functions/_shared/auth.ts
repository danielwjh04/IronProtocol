import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function makeServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
}

export async function requireAuth(
  req: Request,
  supabase: SupabaseClient,
): Promise<{ id: string }> {
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!jwt) throw new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  const { data: { user }, error } = await supabase.auth.getUser(jwt)
  if (error || !user) throw new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  return { id: user.id }
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
