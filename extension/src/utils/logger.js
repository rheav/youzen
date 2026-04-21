/**
 * Logger utility — debug-gated console wrapper
 *
 * All log methods are no-ops when __DEBUG_MODE__ is false (compile-time flag
 * injected by Vite `define`). When the flag is true, messages are prefixed
 * with [ExtTemplate] so extension output is easy to filter in DevTools.
 *
 * Usage:
 *   import { log, warn, error } from '@/utils/logger';
 *   log('Initialised background worker');
 *   error('Request failed', err);
 */

const PREFIX = '[youZen]';

/**
 * Returns true when the compile-time debug flag is enabled.
 * Wrapped in a function so the typeof guard survives minification.
 */
const isDebug = () => typeof __DEBUG_MODE__ !== 'undefined' && __DEBUG_MODE__;

/** General informational log. */
export const log = (...args) => {
  if (isDebug()) {
    // eslint-disable-next-line no-console -- debug-gated logger
    console.log(PREFIX, ...args);
  }
};

/** Warning-level log. */
export const warn = (...args) => {
  if (isDebug()) {
    console.warn(PREFIX, ...args);
  }
};

/** Error-level log. */
export const error = (...args) => {
  if (isDebug()) {
    console.error(PREFIX, ...args);
  }
};

/** Opens a collapsed console group. */
export const group = (...args) => {
  if (isDebug()) {
    // eslint-disable-next-line no-console -- debug-gated logger
    console.groupCollapsed(PREFIX, ...args);
  }
};

/** Closes the current console group. */
export const groupEnd = () => {
  if (isDebug()) {
    // eslint-disable-next-line no-console -- debug-gated logger
    console.groupEnd();
  }
};
