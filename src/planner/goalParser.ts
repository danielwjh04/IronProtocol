import type { GoalAim, ParsedGoal, TargetLift } from '../db/schema'

export function parseGoalText(rawText: string): ParsedGoal {
  const text = rawText.toLowerCase()
  const matched: string[] = []
  const lifts: TargetLift[] = []

  if (/bench|chest press/.test(text))                                     { lifts.push('Bench Press');     matched.push('bench') }
  if (/\bsquat/.test(text) && !/front\s*squat/.test(text))                { lifts.push('Back Squat');      matched.push('squat') }
  if (/deadlift|\bdl\b/.test(text))                                       { lifts.push('Deadlift');        matched.push('deadlift') }
  if (/overhead press|\bohp\b|shoulder press|press up/.test(text))        { lifts.push('Overhead Press'); matched.push('overhead press') }

  let aim: GoalAim = 'general'
  if (/1\s?rm|one\s+rep\s+max|\bpr\b|\bmax\b|\d+\s*(lb|lbs|kg|kgs|pounds?)/.test(text)) {
    aim = 'lift-pr'
    matched.push('strength-pr')
  } else if (/jump|plyo|vertical|dunk|\bhops\b/.test(text)) {
    aim = 'jump'
    matched.push('jump')
  } else if (/\brun(?:s|ning|ner)?\b|mile|5k|10k|sprint|jog|pace|\brace\b|faster|speed/.test(text)) {
    aim = 'run'
    matched.push('run')
  } else if (/stamina|endurance|cardio|gas tank|\bwind\b/.test(text)) {
    aim = 'stamina'
    matched.push('stamina')
  } else if (/fat\s*loss|lose .*?(lb|kg|pound|weight)|\bcut\b|leaner|shred/.test(text)) {
    aim = 'fat-loss'
    matched.push('fat-loss')
  } else if (/mobility|flexib|stretch|range of motion|\brom\b/.test(text)) {
    aim = 'mobility'
    matched.push('mobility')
  } else if (lifts.length > 0) {
    aim = 'lift-pr'
  }

  return { rawText, aim, targetLifts: lifts, matchedKeywords: matched }
}

export function describeParsedGoal(parsed: ParsedGoal | undefined): string | null {
  if (!parsed || parsed.aim === 'general') return null

  if (parsed.aim === 'lift-pr' && parsed.targetLifts.length > 0) {
    const list = parsed.targetLifts.join(', ')
    return `We'll prioritize ${list} and direct accessories.`
  }
  if (parsed.aim === 'lift-pr') {
    return `We'll bias toward heavy compound work.`
  }
  if (parsed.aim === 'jump') {
    return `We'll bias toward heavy lower-body and calf work — plyometric library lands later.`
  }
  if (parsed.aim === 'run' || parsed.aim === 'stamina') {
    return `Cardio modalities aren't supported yet — we'll tilt prescriptions toward higher-rep, shorter-rest strength.`
  }
  if (parsed.aim === 'fat-loss') {
    return `We'll tilt prescriptions toward higher-rep, shorter-rest work to keep heart rate up.`
  }
  if (parsed.aim === 'mobility') {
    return `Mobility-specific drills land later — for now we'll keep prescriptions in a controlled, full-ROM range.`
  }
  return null
}
