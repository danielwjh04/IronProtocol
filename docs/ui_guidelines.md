# UI and Mobile Strict Guidelines (V3: Tactile & Responsive)

## 1. Visual Identity and Design Tokens
* **Aesthetic:** Cyber-Brutalist Bento Box.
* **Colors:** Safety Orange (#FF6B00) for primary actions; Pure Black (#000000) for deep contrast.
* **Geometry:** `rounded-3xl` (24px) for cards; `h-16` for primary interaction zones.
* **Tactile Feedback:** Use `whileTap={{ scale: 0.95 }}` on all interactive Bento elements.

## 2. Tooltip & Onboarding Layout
* **Time Ceiling:** QoS slider ranges from 15m to 120m (2 hours). Tiers are unlocked progressively: T1 only < 30m, T1+T2 at 30–39m, all tiers ≥ 40m.
* **Safe Area:** Exclusively iPhone viewport. Tooltips must respect the notch and home bar.
* **Portaling:** All tooltips and tour popups must use **React Portals** to the document body.
* **Stacking:** Fixed `z-[9999]` for tooltips to override the Bento grid context.
* **Responsive Width:** `w-[calc(100vw-2rem)]` with centering logic (`left-1/2 -translate-x-1/2`).

## 3. Active Logger & Escape Hatch
* **Smart Inputs:** If exercise is bodyweight (0kg), auto-focus the REPS field instantly.
* **Recovery UI:** Show a Safety Orange "Resume Active Workout" card if a `temp_session` exists.
* **The Escape Hatch:** Provide a low-emphasis "Discard Draft" or "Cancel Workout" button (muted gray) to break state loops.

## 4. Hierarchy & Readability
* **High-Fatigue Readability:** Data points (Weight/Reps) must use heavy font weights (Barlow Black) to be legible from 3 feet away.