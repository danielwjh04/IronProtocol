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

Deno.test('plans-swap: 401 without auth', async () => {
  const res = await fetch(`${BASE}/functions/v1/plans-swap`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ exerciseId: 'x', reason: 'test', currentPlanExerciseIds: [] }),
  })
  assertEquals(res.status, 401)
})

Deno.test('plans-swap: options array has length 1-5', async () => {
  const jwt = await getTestJwt()
  const qRes = await fetch(`${BASE}/functions/v1/plans-query`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ goalText: 'build muscle' }),
  })
  const plan = (await qRes.json()).plan
  const exerciseId = plan.exercises[0].id

  const res = await fetch(`${BASE}/functions/v1/plans-swap`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ exerciseId, reason: 'equipment', currentPlanExerciseIds: [exerciseId], goalTag: 'hypertrophy' }),
  })
  assertEquals(res.status, 200)
  const body = await res.json()
  assert(body.options.length >= 1 && body.options.length <= 5)
})

Deno.test('plans-swap: no option id matches currentPlanExerciseIds', async () => {
  const jwt = await getTestJwt()
  const qRes = await fetch(`${BASE}/functions/v1/plans-query`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ goalText: 'build muscle' }),
  })
  const plan = (await qRes.json()).plan
  const allIds = plan.exercises.map((e: { id: string }) => e.id)
  const exerciseId = allIds[0]

  const res = await fetch(`${BASE}/functions/v1/plans-swap`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ exerciseId, reason: 'preference', currentPlanExerciseIds: allIds, goalTag: 'hypertrophy' }),
  })
  const body = await res.json()
  for (const opt of body.options) {
    assert(!allIds.includes(opt.exercise.id))
  }
})
