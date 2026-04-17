    🚀 IRONPROTOCOL: COMPLETE SYSTEM SPECIFICATION (v5.1)
    Project Identity: A Hybrid "Offline-First" PWA designed as an active digital coach. It uses Online AI APIs to handle complex macrocycle planning (The Lab), but strictly enforces a 100% Offline local-first execution environment (The Gantry) to ensure zero friction on the gym floor. It uses "Perceived Labor" to build trust, tactile haptics to ground the user, and high-contrast visuals to ensure absolute focus.

    🎨 I. VISUAL & INTERACTIVE DNA
    Base Colors: Deep Midnight Navy (#0A0E1A) for the void.

    Action/System: Electric Blue (#3B71FE) for active elements and perfect form.

    Danger/Warning: Soft Pink (#FF89D6) strictly reserved for Form Guard errors and destructive actions.

    Muscle Intensity: Vivid Red (#FF3B3B) for peak muscle activation glows.

    Typography: Tailwind tokens (font-display for headers, mono for terminal).

    Asset Pipeline [✅ BUILT]: High-fidelity .webm looping video assets for execution models, with a dynamic, lightweight SVG AnatomyPlaceholder fallback.

    ⚙️ II. THE BOOT SEQUENCE & GLOBAL NAVIGATION
    Core Ignition (App Boot) [✅ BUILT]: A 2.5-second forced loading state (CoreIgnition.tsx). Features a breathing Electric Blue barbell SVG, a sequential typewriter terminal logging system checks, a 50ms haptic "tick" per line, and a cinematic scale: 3 blur zoom-in transition.

    The Settings Drawer [🚧 PENDING]:

    Trigger: "Hamburger" icon in Top-Left. Left-to-right slide-in.

    Content: User Hub (Name + North Star), Unit switch, Haptic slider, Database JSON export/purge.

    🧠 III. ONBOARDING & THE AI "ARCHITECT" ENGINE
    The Identity Splash (Onboarding) [🚧 PENDING]: Renders if no profile exists. This UI constructs the strict Prompt Contract required for the AI API.
    Inputs: Call Sign (Name), North Star (Text area goal), Purpose (Selectable chips), Session Budget / QoS (15-120 min tactile slider), Training Frequency (3, 4, or 5 days), Equipment Available, Injury Constraints.

    Baseline Calibration [🚧 PENDING]: High-friction, tactile UI scroll "Dials" for the user to input their starting 1RM/Working weights for the Big Three (Squat, Bench, Deadlift) after onboarding.

    The AI Architect Pipeline (Lab - Online Required) [🚧 PENDING]:
    The app takes the V11 AppSettings constraints and sends them to the AI API. The AI generates a 12-week `SessionBlueprint` and seeds a fallback pool of alternatives.

    The 10-Second Reasoning Protocol [✅ PARTIAL - ThinkingTerminal.tsx built]:
    While the AI API is fetching the workout, the ThinkingTerminal.tsx forces a visual labor window to build trust.
    UI: Terminal feed (> Mapping [Goal] to [Time] min QoS limit...) matching the boot sequence aesthetic, masking the network latency of the API call.

    📝 IV. SCREEN-BY-SCREEN UI SPECIFICATIONS
    1. Blueprint Pipeline (Lab vs Gantry) [✅ BUILT]:

    Drafting Lab: SessionBlueprint.tsx is the interactive planning surface (time pacing, goal tuning, exercise reorder, and swap).

    Launch Gantry: DraftBlueprintReview.tsx is a read-only final check before workout ignition.

    Flow Contract: HomePage routes idle -> review -> ignition -> logging, keeping drafting and launch confirmation fully separated.

    2. The Workout Ignition [🚧 PENDING]:

    Full-screen overlay countdown before a workout starts (3: LOAD → 2: SET → 1: GO).

    3. The Active Logger (The Mission) [✅ BUILT]:

    Focus on ONE exercise card at a time (ActiveLogger.tsx).

    The "Why" Portal & Form Guard (FunctionalWhy.tsx):

    Educational Mode (Default): Shows .webm of perfect execution. UI accents are Electric Blue. Text explains the biomechanical purpose.

    Form Guard Mode (Toggled): UI instantly shifts to dark card with Soft Pink (#FF89D6) accents. Swaps to a "Mistake" .webm video (e.g., knee valgus collapse) pulsing pink on the error joints. Text shifts to a "Correction Cue".

    🏆 V. THE VICTORY LAP (POST-WORKOUT) [🚧 PENDING]
    A forced 3-stage loop to celebrate progress before returning to the home screen:

    Stage 1 (Vault Sync): Power Cards update with PR sparks.

    Stage 2 (The Pulse): Weekly Momentum Meter arc fills with liquid-glow animation.

    Stage 3 (Heatmap): 3D Anatomy Heatmap showing total volume per muscle group.

    The Exit: A required "DISMISS TO HOME BASE" button.

    💾 VI. DATA & PERSISTENCE (DEXIE.JS SCHEMA) [✅ BUILT]
    Database Engine: Upgraded to Dexie v11 (db.ts).

    settings table: Row id: 'app' perfectly configured to store userName, northStar, qosMinutes, and purpose.

    exercise_library: Locally mapped via functionalMapping.ts.

    active_session: Save current state to allow "Resume Active Workout" on refresh.

    🎬 VII. ASSET DIRECTORY STATUS
    back-squat-correct.webm [✅ RENDERED]

    back-squat-mistake.webm [✅ RENDERED]

    deadlift-mistake.webm [✅ RENDERED]

    deadlift-correct.webm [🚧 PENDING VEO GEN]

    bench-press-correct.webm [🚧 PENDING VEO GEN]

    bench-press-mistake.webm [🚧 PENDING VEO GEN]