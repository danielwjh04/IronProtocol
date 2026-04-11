// ProgressIndicator<T> provides a reusable percentage-based completion engine
// for any numeric target (Kcal, Steps, Sets, etc.).
// T is constrained to number so arithmetic operations are always valid.
export class ProgressIndicator<T extends number> {
  private readonly target: T
  private readonly current: T

  constructor(target: T, current: T) {
    this.target = target
    this.current = current
  }

  // Percentage of target completed, clamped to [0, 100].
  get percent(): number {
    if (this.target <= 0) return 0
    return Math.min(100, Math.round((this.current / this.target) * 100))
  }

  // Units still needed to hit the target, floored at 0.
  get remaining(): number {
    return Math.max(0, this.target - this.current)
  }

  // True when current has reached or surpassed the target.
  get isComplete(): boolean {
    return this.current >= this.target
  }
}
