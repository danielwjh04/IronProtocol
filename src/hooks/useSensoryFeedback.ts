import { useCallback, useRef } from 'react'

export function useSensoryFeedback() {
  const audioCtxRef = useRef<AudioContext | null>(null)

  const vibrate = useCallback((pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }, [])

  const crunch = useCallback((intensity: number) => {
    try {
      if (typeof AudioContext === 'undefined' && typeof (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext === 'undefined') return
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext()
      }
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(180, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.18)
      gain.gain.setValueAtTime(Math.min(0.6, Math.max(0.15, intensity * 0.6)), ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.18)
    } catch {
      // swallow: audio is optional; silently degrade on unsupported browsers
    }
  }, [])

  const heavyDouble = useCallback(() => vibrate([200, 100, 200]), [vibrate])
  const lightTap = useCallback(() => vibrate([50]), [vibrate])

  return { vibrate, crunch, heavyDouble, lightTap }
}
