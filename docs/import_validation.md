# Security and Payload Validation (V3: Draft Hardened)

## 1. Zero Trust Zod Firewall
Apply strict schema validation to every data-write event, including background draft saves.
* **Temp Session Schema:** Must contain `workoutId`, `exerciseId`, `currentSet`, and a `sets` array.
* **Strict Objects:** Use `.strict()` on all schemas to prevent hidden property injection.

## 2. Validation Execution
* **Fail Fast:** If a `temp_session` payload is malformed, delete the draft and revert to the home dashboard rather than attempting recovery.
* **Sanitization:** * **UUID:** Verify all IDs are valid UUID v4.
    * **Numeric Constraints:** Tier must be 1, 2, or 3. Weights cannot be negative.
    * **Timestamps:** Prevent future-dated workout logs.

## 3. Data Portability Security
* **Export/Import:** All JSON backups must be validated through the same Zod pipeline used for real-time data to prevent "Backdoor" database corruption via malformed backup files.