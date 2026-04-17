import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts'

const BASE = Deno.env.get('SUPABASE_URL')!
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!

async function getTestJwt(): Promise<string> {
  const res = await fetch(`${BASE}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@test.com', password: 'test1234' }),
  })
  return (await res.json()).access_token
}

Deno.test('plans-feedback: returns { ok: true } on valid request', async () => {
  const jwt = await getTestJwt()
  const res = await fetch(`${BASE}/functions/v1/plans-feedback`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ accepted: true, painFlag: false, goalTag: 'hypertrophy' }),
  })
  assertEquals(res.status, 200)
  assertEquals((await res.json()).ok, true)
})

Deno.test('plans-feedback: 401 without auth', async () => {
  const res = await fetch(`${BASE}/functions/v1/plans-feedback`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accepted: true, painFlag: false }),
  })
  assertEquals(res.status, 401)
})
