# 🛡️ IRONPROTOCOL: COMPLETE SYSTEM SPECIFICATION (v5.0)

**Project Identity:** A "Zero Friction" mobile PWA designed as an active digital coach for elite performance. It uses "Perceived Labor" (reasoning time) to build trust and high-contrast visuals to ensure focus.
**Tech Stack:** React, Vite, Tailwind CSS, Framer Motion, Dexie.js (Local-first).

## 🎨 I. VISUAL & INTERACTIVE DNA
* **Colors:** Deep Midnight Navy (#0A0E1A), Electric Blue (#3B71FE), Soft Pink (#FF89D6), Vivid Red (#FF3B3B).
* **Typography:** Inter (UI/Prose); Barlow Black (High-impact metrics: Weight, Reps, Countdown).
* **Physics:** Framer Motion spring physics (Stiffness: 300, Damping: 30), `whileTap={{ scale: 0.95 }}` on cards.

## 🛠️ II. NAVIGATION & GLOBAL LAYOUT
### The Settings Drawer (`SidebarNavigation.tsx`)
* **Trigger:** Top-Left "Hamburger" icon (staggered lines: 100%, 60%, 80%).
* **Interaction:** Left-to-right slide-in (80% width); `backdrop-blur(12px)` on the background.
* **Content:** User Hub (Name + North Star Goal), Unit Toggle (KG/LB), Haptic Slider, Engine Config (Deep Reasoning toggle), Export JSON / Purge Dexie.js.

## 🧠 III. THE "ARCHITECT" ENGINE (ROUTINE GENERATION)
### The 10-Second Reasoning Protocol
* **Step 1 (Input):** User name, "North Star" goal (text), Purpose chip, QoS Time Slider (15-120 mins).
* **Step 2 (The Handshake):** Data sent to Vercel Edge Function (or mock local function for Phase 1).
* **Step 3 (Terminal UI):**
  * 0-3s: `> Accessing Biomechanical Library...`
  * 3-6s: `> Mapping [Goal] to [Time] min QoS limit...`
  * 6-9s: `> Selecting Primary Lift... Optimizing rest intervals...`
  * 10s: Haptic thud → Transitions to Blueprint.

## 📝 IV. SCREEN-BY-SCREEN UI SPECIFICATIONS
### 1. Blueprint Audit Screen
* **Momentum Meter:** Sticky arc-gauge header.
* **The Technical "?" Button:** Triggers Anatomical Execution Pop-up (B&W 3D model wireframe where active muscles pulse Vivid Red during contraction).
* **Blueprint Actions:** Soft Pink "X" triggers "Quick Swap" chips or deletion.

### 2. The Active Logger (The Mission)
* **Ignition:** 3s Countdown overlay (LOAD → SET → GO) with heavy haptics.
* **Interaction:** Focus on ONE exercise. Floating "Set Progression Chips" above keyboard.
* **The Why Portal:** White slide-down blind with 3D model and biomechanical cue.
* **Rest Timer:** Dynamic background fade from Electric Blue to Midnight Navy.

## 🏆 V. THE VICTORY LAP (POST-WORKOUT)
Forced 3-stage loop:
1. **Vault Sync:** Power Cards update with PR sparks.
2. **The Pulse:** Momentum Meter fills with liquid-glow.
3. **Heatmap:** 3D Anatomy Heatmap showing total volume per muscle group.
4. **Exit:** Requires "DISMISS TO HOME BASE" button press.

## 💾 VI. DATA & PERSISTENCE (DEXIE.JS SCHEMA)
* `user_settings`: Name, North Star goal, units, QoS preference.
* `exercise_library`: Locally cached JSON of movements and biomechanical tags.
* `workout_history`: Every set, rep, and volume-per-muscle metric.
* `active_session`: Save current state every 2 seconds for resume capability.

## VII. BOOT SEQUENCE & ERROR HANDLING
### 1. The Core Ignition (2.5s Startup)
* Rendered BEFORE priority logic. 
* Pulsing Electric Blue barbell center-screen.
* Typewriter status logs matching ThinkingTerminal.tsx style.
* Purpose: To allow Dexie.js initialization and create the "Labor Illusion."

### 2. The Form Guard (Educational Mode Expansion)
* Toggle switch added to ExerciseCard/Educational view.
* When active, the 3D model execution changes to a "Common Mistake" loop.
* Color Palette shift: High-energy Electric Blue/Vivid Red fades out; Warning Soft Pink (#FF89D6) pulses on error joints.