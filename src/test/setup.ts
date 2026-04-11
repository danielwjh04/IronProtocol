// Install a Node-compatible fake IndexedDB into the global scope.
// This must run before any Dexie code so that Dexie finds a working
// IndexedDB implementation when executing inside Vitest (Node env).
import 'fake-indexeddb/auto'
