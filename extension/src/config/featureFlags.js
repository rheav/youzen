/**
 * Feature Flags — Build-time toggles
 *
 * These values are injected as compile-time constants by Vite's `define` option.
 * When a flag is false, Vite dead-code eliminates all code behind it.
 *
 * Usage in code:
 *   if (__DEBUG_MODE__) logger.verbose('...');
 *   if (__ENABLE_ANALYTICS__) trackEvent('...');
 *
 * To add a new flag:
 *   1. Add it here
 *   2. Add the __FLAG_NAME__ define in vite.config.js
 *   3. Add the global in eslint.config.js
 */
export const FLAGS = {
  // Analytics scaffolding ships with the extension but stays off in v1.
  // Enabling this flag wires up utils/analytics.js without exposing UI.
  ENABLE_ANALYTICS: false,

  // Extra logger output. Flip to true during development.
  DEBUG_MODE: false,
};
