import { assertEquals, assert } from 'https://deno.land/std@0.168.0/testing/asserts.ts'

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

Deno.test('plans-query: 401 without Authorization header', async () => {
  const res = await fetch(`${BASE}/functions/v1/plans-query`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goalText: 'build muscle' }),
  })
  assertEquals(res.status, 401)
})

Deno.test('plans-query: 200 with valid JWT and non-empty exercises', async () => {
  const jwt = await getTestJwt()
  const res = await fetch(`${BASE}/functions/v1/plans-query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ goalText: 'build muscle 4 days a week' }),
  })
  assertEquals(res.status, 200)
  const body = await res.json()
  assert(body.plan.exercises.length > 0)
})

Deno.test('plans-query: exercises include repScheme with repsMin and repsMax', async () => {
  const jwt = await getTestJwt()
  const res = await fetch(`${BASE}/functions/v1/plans-query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ goalText: 'hypertrophy 5 days a week' }),
  })
  const body = await res.json()
  for (const ex of body.plan.exercises) {
    assert(typeof ex.repScheme.repsMin === 'number')
    assert(typeof ex.repScheme.repsMax === 'number')
    assert(ex.repScheme.repsMin < ex.repScheme.repsMax)
  }
})
