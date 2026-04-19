/**
 * IronProtocol Design System — STRICT, EXCLUSIVE, SINGLE SOURCE OF TRUTH.
 *
 * Visual language: Apple Fitness (professional, calm, considered).
 * Typography: SF Pro stack with Inter fallback. No display serifs. No pixel fonts.
 * Palette: Apple-style dark neutrals, shared across the app. One accent
 *          color that swaps based on the user's `trainingGoal`:
 *            • Hypertrophy → Apple Green (volume, growth)
 *            • Power       → Apple Red (intensity, explosive effort)
 *          The accent is applied to CTAs, progress rings, active states.
 *
 * RULES (non-negotiable):
 *  1. No arbitrary px/rem in JSX or CSS. All spacing comes from `spacing`.
 *     Tailwind arbitrary values like `mt-[13px]` are BANNED.
 *  2. Every text node uses exactly ONE of: `display` | `body` | `label`.
 *     No bespoke sizes, no inline font-family, no one-off line-heights.
 *  3. Colors come ONLY from this file. No raw hex in JSX/CSS elsewhere.
 *     Reference via CSS vars (var(--color-…)); the accent block is re-emitted
 *     when `trainingGoal` changes so every `var(--color-accent-…)` updates
 *     everywhere at once.
 *  4. Goal theme is single-source: whatever the user's current `trainingGoal`
 *     is, that's what drives the accent. No local overrides in components.
 *  5. Any new semantic token must be added HERE first, then consumed.
 *
 * Consumption:
 *   - Tailwind config reads these tokens (follow-up wiring).
 *   - Components import { spacing, textStyles, neutrals, accent, buildRootCss,
 *     buildGoalCss } when runtime values are needed.
 *   - Load `buildRootCss()` once in main.tsx. Call `applyGoalTheme(goal)` from
 *     useHomePageController whenever `trainingGoal` changes; it writes a
 *     <style data-goal-theme> block so the accent swaps instantly.
 */

export type GoalTheme = 'hypertrophy' | 'power'

// ──────────────────────────────────────────────────────────────────────────
// SPACING — Apple 8pt grid, 4px base unit. Use nothing else.
// ──────────────────────────────────────────────────────────────────────────

export const spacing = {
  0: '0px',
  1: '4px',     // hairline gap
  2: '8px',     // tight inline
  3: '12px',    // compact stack
  4: '16px',    // default gutter (iOS standard margin)
  5: '24px',    // comfortable (iOS section inset)
  6: '32px',    // section break
  7: '48px',    // block separator
  8: '64px',    // hero margin
} as const

export type SpacingToken = keyof typeof spacing

export const space = {
  hairline: spacing[1],
  tight: spacing[2],
  compact: spacing[3],
  gutter: spacing[4],
  comfortable: spacing[5],
  section: spacing[6],
  block: spacing[7],
  hero: spacing[8],
} as const

// ──────────────────────────────────────────────────────────────────────────
// TYPOGRAPHY — exactly THREE styles, Apple Fitness-grade.
// Sizes mirror Apple HIG (Large Title / Body / Footnote) at a mobile-first scale.
//   display → screen titles, big numbers, hero headlines
//   body    → prose, list items, inputs
//   label   → buttons, tags, tabular numerics, microcopy
// ──────────────────────────────────────────────────────────────────────────

const SF_DISPLAY_STACK =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Helvetica Neue', sans-serif"
const SF_TEXT_STACK =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', 'Helvetica Neue', sans-serif"

export interface TextStyleSpec {
  fontFamily: string
  fontSize: string
  lineHeight: number
  letterSpacing: string
  fontWeight: number
  textTransform: 'none' | 'uppercase'
}

export const textStyles: Record<'display' | 'body' | 'label', TextStyleSpec> = {
  display: {
    fontFamily: SF_DISPLAY_STACK,
    fontSize: '34px',          // Apple HIG Large Title
    lineHeight: 1.1,
    letterSpacing: '-0.021em', // Apple's optical tracking at this size
    fontWeight: 700,
    textTransform: 'none',
  },
  body: {
    fontFamily: SF_TEXT_STACK,
    fontSize: '17px',          // Apple HIG Body
    lineHeight: 1.41,
    letterSpacing: '-0.01em',
    fontWeight: 400,
    textTransform: 'none',
  },
  label: {
    fontFamily: SF_TEXT_STACK,
    fontSize: '13px',          // Apple HIG Footnote, weighted
    lineHeight: 1.2,
    letterSpacing: '0.02em',
    fontWeight: 600,
    textTransform: 'none',
  },
}

export type TextStyleName = keyof typeof textStyles

// ──────────────────────────────────────────────────────────────────────────
// NEUTRALS — Apple dark-mode iOS system grays. Shared across goal themes.
//   surface:  3 depth levels (base → raised → overlay)
//   border:   2 weights (subtle / strong)
//   text:     3 emphasis levels (primary / secondary / muted)
// ──────────────────────────────────────────────────────────────────────────

export const neutrals = {
  surface: {
    base:    '#000000',  // true black — OLED-first, Apple Fitness default
    raised:  '#1C1C1E',  // iOS systemGray6 (dark)
    overlay: '#2C2C2E',  // iOS systemGray5 (dark)
  },
  border: {
    subtle: '#38383A',   // iOS separator (dark)
    strong: '#48484A',   // iOS systemGray3 (dark)
  },
  text: {
    primary:   '#FFFFFF',                    // iOS label (dark)
    secondary: 'rgba(235, 235, 245, 0.60)',  // iOS secondaryLabel (dark)
    muted:     'rgba(235, 235, 245, 0.30)',  // iOS tertiaryLabel (dark)
  },
} as const

// ──────────────────────────────────────────────────────────────────────────
// UTILITY — state only, never decoration. Apple iOS system colors (dark).
// ──────────────────────────────────────────────────────────────────────────

export const utility = {
  success: '#30D158',  // iOS systemGreen (dark)
  warning: '#FF9F0A',  // iOS systemOrange (dark)
  danger:  '#FF453A',  // iOS systemRed (dark)
} as const

// ──────────────────────────────────────────────────────────────────────────
// ACCENT — goal-driven. This is the ONLY color that differs between states.
//   hypertrophy → Apple systemGreen (dark) — growth, volume, sustained work
//   power       → Apple systemRed (dark)   — explosive intensity, max effort
//
// Each theme exposes the same 3 tokens:
//   primary   → main accent (CTA fill, active tab, progress ring)
//   soft      → 16% alpha tint (backgrounds, chips, focus rings)
//   on        → foreground color that sits on `primary` (text/icons)
// ──────────────────────────────────────────────────────────────────────────

export interface AccentTheme {
  primary: string
  soft: string
  on: string
}

export const accent: Record<GoalTheme, AccentTheme> = {
  hypertrophy: {
    primary: '#30D158',                   // Apple systemGreen (dark)
    soft:    'rgba(48, 209, 88, 0.16)',
    on:      '#002811',                   // deep green-black for AA contrast
  },
  power: {
    primary: '#FF453A',                   // Apple systemRed (dark)
    soft:    'rgba(255, 69, 58, 0.16)',
    on:      '#FFFFFF',
  },
}

// Map trainingGoal (from planner) → GoalTheme. Anything not 'Power' falls
// back to hypertrophy (safe default for Endurance, etc.).
export function resolveGoalTheme(trainingGoal: string | null | undefined): GoalTheme {
  return trainingGoal === 'Power' ? 'power' : 'hypertrophy'
}

// ──────────────────────────────────────────────────────────────────────────
// CSS VARIABLE GENERATORS
//   buildRootCss()  → emits :root block with spacing, neutrals, utility,
//                     text-style utilities (.text-display/.text-body/.text-label).
//                     Load once.
//   buildGoalCss()  → emits a :root[data-goal-theme="…"] block with accent
//                     vars. Rewrite the <style data-goal-theme> tag whenever
//                     trainingGoal changes.
// ──────────────────────────────────────────────────────────────────────────

function flattenSpacing(): string {
  return Object.entries(spacing)
    .map(([k, v]) => `  --space-${k}: ${v};`)
    .join('\n')
}

function flattenNeutrals(): string {
  return [
    `  --color-surface-base: ${neutrals.surface.base};`,
    `  --color-surface-raised: ${neutrals.surface.raised};`,
    `  --color-surface-overlay: ${neutrals.surface.overlay};`,
    `  --color-border-subtle: ${neutrals.border.subtle};`,
    `  --color-border-strong: ${neutrals.border.strong};`,
    `  --color-text-primary: ${neutrals.text.primary};`,
    `  --color-text-secondary: ${neutrals.text.secondary};`,
    `  --color-text-muted: ${neutrals.text.muted};`,
  ].join('\n')
}

function flattenUtility(): string {
  return [
    `  --color-utility-success: ${utility.success};`,
    `  --color-utility-warning: ${utility.warning};`,
    `  --color-utility-danger: ${utility.danger};`,
  ].join('\n')
}

function flattenTextStyle(name: TextStyleName): string {
  const s = textStyles[name]
  return [
    `  --text-${name}-font: ${s.fontFamily};`,
    `  --text-${name}-size: ${s.fontSize};`,
    `  --text-${name}-line-height: ${s.lineHeight};`,
    `  --text-${name}-letter-spacing: ${s.letterSpacing};`,
    `  --text-${name}-weight: ${s.fontWeight};`,
    `  --text-${name}-transform: ${s.textTransform};`,
  ].join('\n')
}

export function buildRootCss(): string {
  const rootBlock = [
    ':root {',
    flattenSpacing(),
    flattenNeutrals(),
    flattenUtility(),
    flattenTextStyle('display'),
    flattenTextStyle('body'),
    flattenTextStyle('label'),
    '}',
  ].join('\n')

  const utilities = [
    '.text-display { font-family: var(--text-display-font); font-size: var(--text-display-size); line-height: var(--text-display-line-height); letter-spacing: var(--text-display-letter-spacing); font-weight: var(--text-display-weight); text-transform: var(--text-display-transform); -webkit-font-smoothing: antialiased; }',
    '.text-body { font-family: var(--text-body-font); font-size: var(--text-body-size); line-height: var(--text-body-line-height); letter-spacing: var(--text-body-letter-spacing); font-weight: var(--text-body-weight); text-transform: var(--text-body-transform); -webkit-font-smoothing: antialiased; }',
    '.text-label { font-family: var(--text-label-font); font-size: var(--text-label-size); line-height: var(--text-label-line-height); letter-spacing: var(--text-label-letter-spacing); font-weight: var(--text-label-weight); text-transform: var(--text-label-transform); -webkit-font-smoothing: antialiased; }',
  ].join('\n')

  return [rootBlock, utilities].join('\n\n')
}

export function buildGoalCss(theme: GoalTheme): string {
  const a = accent[theme]
  return [
    `:root[data-goal-theme="${theme}"] {`,
    `  --color-accent-primary: ${a.primary};`,
    `  --color-accent-soft: ${a.soft};`,
    `  --color-accent-on: ${a.on};`,
    `}`,
  ].join('\n')
}

// ──────────────────────────────────────────────────────────────────────────
// RUNTIME HELPER — apply goal theme by writing data attribute + style tag.
// Call from useHomePageController whenever trainingGoal changes.
// ──────────────────────────────────────────────────────────────────────────

const GOAL_STYLE_TAG_ID = 'ip-goal-theme'

export function applyGoalTheme(theme: GoalTheme): void {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-goal-theme', theme)

  let tag = document.getElementById(GOAL_STYLE_TAG_ID) as HTMLStyleElement | null
  if (!tag) {
    tag = document.createElement('style')
    tag.id = GOAL_STYLE_TAG_ID
    document.head.appendChild(tag)
  }
  tag.textContent = [buildGoalCss('hypertrophy'), buildGoalCss('power')].join('\n')
}

// ──────────────────────────────────────────────────────────────────────────
// FONT LOADING — Inter is the web fallback when SF Pro isn't available.
// Apple platforms get native SF Pro via the `-apple-system` stack; Android
// and Windows fall through to Inter. No other web fonts permitted.
// ──────────────────────────────────────────────────────────────────────────

export const REQUIRED_FONT_LINKS = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Pixelify+Sans:wght@400;500;600&display=swap',
] as const

// ──────────────────────────────────────────────────────────────────────────
// COMBAT SKIN — pixel-art overlay, SCOPED to Ignition + ActiveLogger combat
// moments + completion screens. Never global. Consumed by adding the class
// `combat-skin` to the component root; CSS vars for text and surfaces are
// overridden within that subtree only. Accent remains goal-driven.
// ──────────────────────────────────────────────────────────────────────────

export const COMBAT_SKIN_CLASS = 'combat-skin'

export const combatTextStyles: Record<TextStyleName, TextStyleSpec> = {
  display: {
    fontFamily: "'Press Start 2P', ui-monospace, monospace",
    fontSize: '24px',
    lineHeight: 1.35,
    letterSpacing: '0',
    fontWeight: 400,
    textTransform: 'uppercase',
  },
  body: {
    fontFamily: "'Pixelify Sans', ui-monospace, monospace",
    fontSize: '18px',
    lineHeight: 1.4,
    letterSpacing: '0',
    fontWeight: 500,
    textTransform: 'none',
  },
  label: {
    fontFamily: "'Press Start 2P', ui-monospace, monospace",
    fontSize: '10px',
    lineHeight: 1,
    letterSpacing: '0.06em',
    fontWeight: 400,
    textTransform: 'uppercase',
  },
}

export const COMBAT_ALLOWED_SURFACES = [
  'WorkoutIgnition',       // the 3-2-1 / "WORKOUT. BEGIN." transition
  'ActiveLogger.heavySet', // per-set flash on heavy lifts (useCombatTrigger)
  'WorkoutComplete',       // post-workout celebration screen (future)
] as const

// ──────────────────────────────────────────────────────────────────────────
// TYPE EXPORTS
// ──────────────────────────────────────────────────────────────────────────

export type SurfaceToken = keyof typeof neutrals.surface
export type BorderToken = keyof typeof neutrals.border
export type TextColorToken = keyof typeof neutrals.text
export type UtilityToken = keyof typeof utility
export type AccentToken = keyof AccentTheme
