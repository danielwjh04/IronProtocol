/**
 * Formats a total-volume value (in kilograms) for Home display.
 *
 * Rules (matches design-sketch-home.html v2):
 *   < 10,000 kg → "5,200 kg"  (toLocaleString, full unit)
 *   ≥ 10,000 kg → "10.2k kg"  (one decimal, lowercase "k kg", rounded to nearest 100)
 *
 * A value of 0 or negative returns "0 kg".
 */
export function formatVolume(totalKg: number): string {
  if (!Number.isFinite(totalKg) || totalKg <= 0) {
    return '0 kg'
  }

  const rounded = Math.round(totalKg)

  if (rounded < 10_000) {
    return `${rounded.toLocaleString('en-US')} kg`
  }

  const inThousands = rounded / 1000
  // One decimal, rounded to nearest hundred kg.
  const formatted = (Math.round(inThousands * 10) / 10).toFixed(1)
  return `${formatted}k kg`
}
