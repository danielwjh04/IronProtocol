import fs from 'fs'
import path from 'path'
import type { Exercise } from '../db/schema'

const RAW_DIR  = path.resolve('src/data/raw')
const OUT_FILE = path.resolve('src/data/exercises.json')

type RawEntry = { id: string; name: string; technical_cues: string[]; biomechanical_why: string }

const FILE_META: Record<string, { baseMuscleGroup: string; tags: string[] }> = {
  'chest_back.json':        { baseMuscleGroup: 'chest',     tags: [] },
  'legs_core.json':         { baseMuscleGroup: 'legs',      tags: [] },
  'shoulders_arms.json':    { baseMuscleGroup: 'shoulders', tags: [] },
  'functional_cables.json': { baseMuscleGroup: 'back',      tags: ['functional', 'cable'] },
  'power_strongman.json':   { baseMuscleGroup: 'back',      tags: ['compound', 'power'] },
}

function inferMuscleGroup(filename: string, name: string): string {
  const lc = name.toLowerCase()
  if (filename === 'chest_back.json') {
    return /row|pull|lat|deadlift/.test(lc) ? 'back' : 'chest'
  }
  if (filename === 'legs_core.json') {
    return /crunch|plank|\bab\b|core/.test(lc) ? 'core' : 'legs'
  }
  if (filename === 'shoulders_arms.json') {
    return /curl|tricep|hammer|pressdown|pushdown/.test(lc) ? 'arms' : 'shoulders'
  }
  return FILE_META[filename]?.baseMuscleGroup ?? 'other'
}

function inferTier(name: string, tags: string[]): 1 | 2 | 3 {
  const lc = name.toLowerCase()
  const isT1 = ['bench press', 'squat', 'deadlift', 'overhead press', 'barbell row',
    'clean', 'snatch', 'jerk', 'log press', 'yoke'].some(k => lc.includes(k))
  if (isT1 || tags.includes('power')) return 1
  if (tags.includes('compound') || tags.includes('cable') || tags.includes('functional')) return 2
  return 3
}

export async function mergeRawExercises(): Promise<Exercise[]> {
  const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.json')).sort()
  const allRaw: Array<RawEntry & { _file: string }> = []

  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(RAW_DIR, file), 'utf-8')) as RawEntry[]
    raw.forEach(e => allRaw.push({ ...e, _file: file }))
  }

  const seenIds   = new Set<string>()
  const seenNames = new Set<string>()

  return allRaw.map(raw => {
    if (seenIds.has(raw.id)) throw new Error(`Duplicate id: ${raw.id}`)
    if (seenNames.has(raw.name.toLowerCase())) throw new Error(`Duplicate name: ${raw.name}`)
    seenIds.add(raw.id)
    seenNames.add(raw.name.toLowerCase())
    const tags        = [...(FILE_META[raw._file]?.tags ?? [])]
    const muscleGroup = inferMuscleGroup(raw._file, raw.name)
    const tier        = inferTier(raw.name, tags)
    return {
      id: raw.id, name: raw.name,
      muscleGroup, mediaType: 'none', mediaRef: '',
      tags, tier,
    } satisfies Exercise
  })
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('mergeExercises.ts')) {
  mergeRawExercises().then(merged => {
    fs.writeFileSync(OUT_FILE, JSON.stringify(merged, null, 2))
    console.log(`Written ${merged.length} exercises to ${OUT_FILE}`)
  }).catch(e => { console.error(e); process.exit(1) })
}
