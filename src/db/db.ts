import { IronProtocolDB } from './schema'

// Singleton instance shared across the app.
// Import from here rather than constructing IronProtocolDB directly.
export const db = new IronProtocolDB()
