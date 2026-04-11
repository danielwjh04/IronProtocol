# UI and Mobile Strict Guidelines (V4: Electric Navy)

## 1. Visual Identity and Design Tokens
* **Aesthetic:** Electric Navy (Deep Midnight & Neon Blue).
* **Colors:** Electric Blue (#3B71FE) for primary actions, active states, and slider thumbs. Deep Midnight Navy (#0A0E1A) for base backgrounds.
* **Accents:** Soft Pink-to-Blue linear gradients for card borders/highlights.
* **Geometry:** `rounded-3xl` (24px) for Bento cards; `h-16` for primary interaction zones.
* **Typography:** Clean, white Sans-Serif (Inter/Barlow) for high contrast against dark backgrounds.
* **Tactile Feedback:** Use `whileTap={{ scale: 0.95 }}` on all interactive Bento elements.

## 2. Tooltip & Onboarding Layout
* **Time Ceiling:** QoS slider ranges from 15m to 120m (2 hours). Tiers are unlocked progressively: T1 only < 30m, T1+T2 at 30–39m, all tiers ≥ 40m.
* **Slider Visibility:** Range inputs must have a translucent dark blue track and a solid, glowing Electric Blue (#3B71FE) thumb.
* **Safe Area:** Exclusively iPhone viewport. Tooltips must respect the notch and home bar.
* **Portaling:** All tooltips and tour popups must use **React Portals** to the document body to prevent container clipping.
* **Stacking & Width:** Fixed `z-[9999]` for tooltips to override the Bento grid context. Apply `w-[calc(100vw-2rem)]` with centering logic (`fixed left-1/2 -translate-x-1/2`).

## 3. Active Logger & Session Safety
* **Zero-Friction Logging:** The active logger must feature an interactive rest timer with a prominent "START NEXT SET" Electric Blue button to instantly skip the countdown.
* **Cognitive Offloading:** Render an "Active Set Progression Log" as compact, horizontal chips (e.g., "S1: 40kg x 3") directly above the Weight/Reps inputs so users don't have to rely on short-term memory.
* **Smart Inputs:** If an exercise is bodyweight (0kg), auto-focus the REPS field instantly.
* **Recovery UI:** Show an Electric Blue "Resume Active Workout" card if a `temp_session` exists.
* **The Escape Hatch:** Provide a low-emphasis "Discard Draft" or "Cancel Workout" button (muted gray) to break state loops.

## 4. Hierarchy & Readability
* **High-Fatigue Legibility:** Data points (Weight/Reps) must use heavy font weights (Barlow Black) and high-contrast white text to be legible from 3 feet away under gym lighting.