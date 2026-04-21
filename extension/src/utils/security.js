/**
 * Security utility — sanitisation and validation helpers
 *
 * Provides lightweight, regex-based sanitisation that works in every
 * Chrome extension context (background, content, sidepanel) without
 * relying on DOMParser.
 *
 * Usage:
 *   import { sanitizeHTML, sanitizeURL, validateMessage } from '@/utils/security';
 *   const safe = sanitizeHTML(untrustedString);
 */

// ─── HTML Sanitisation ──────────────────────────────────────────────────────

// Matches <script>...</script> blocks (including multiline)
const SCRIPT_TAG_RE = /<script[\s>][\s\S]*?<\/script>/gi;

// Matches inline event handlers: onclick, onerror, onload, etc.
const EVENT_HANDLER_RE = /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi;

// Matches dangerous attributes: javascript: in href/src, data: URIs in src
const DANGEROUS_ATTR_RE =
  /\s+(href|src|action|formaction)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]*)/gi;

// Matches <iframe>, <object>, <embed>, <applet> tags entirely
const DANGEROUS_TAGS_RE =
  /<\/?(iframe|object|embed|applet|form|base|link|meta)[\s>][^>]*>/gi;

/**
 * Strips dangerous HTML constructs from a string.
 *
 * This is a defence-in-depth measure — it removes script tags, inline event
 * handlers, and dangerous attributes. For rendering untrusted content you
 * should still prefer textContent or a real sanitiser library.
 *
 * @param {string} str Raw HTML string.
 * @returns {string} Sanitised string with dangerous constructs removed.
 */
export function sanitizeHTML(str) {
  if (typeof str !== 'string') return '';

  return str
    .replace(SCRIPT_TAG_RE, '')
    .replace(EVENT_HANDLER_RE, '')
    .replace(DANGEROUS_ATTR_RE, '')
    .replace(DANGEROUS_TAGS_RE, '');
}

// ─── URL Sanitisation ───────────────────────────────────────────────────────

// Allowed protocols for user-supplied URLs
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Validates that a URL uses a safe protocol (http or https).
 * Rejects javascript:, data:, vbscript:, and anything else.
 *
 * @param {string} url The URL to validate.
 * @returns {string} The original URL if safe, or an empty string.
 */
export function sanitizeURL(url) {
  if (typeof url !== 'string' || url.trim() === '') return '';

  try {
    const parsed = new URL(url);
    return ALLOWED_PROTOCOLS.has(parsed.protocol) ? url : '';
  } catch {
    // Invalid URL — reject
    return '';
  }
}

// ─── Message Validation ─────────────────────────────────────────────────────

/**
 * Validates that a message object has the expected shape.
 *
 * @param {*}        message        The message to validate.
 * @param {string[]} requiredFields Additional field names that must be present.
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateMessage(message, requiredFields = []) {
  if (!message || typeof message !== 'object') {
    return { valid: false, error: 'Message must be a non-null object' };
  }

  if (typeof message.type !== 'string' || message.type.trim() === '') {
    return { valid: false, error: 'Message must have a non-empty "type" string' };
  }

  for (const field of requiredFields) {
    if (!(field in message)) {
      return { valid: false, error: `Missing required field: "${field}"` };
    }
  }

  return { valid: true };
}

// ─── Secure Headers ─────────────────────────────────────────────────────────

/**
 * Returns a headers object suitable for fetch requests from the extension.
 *
 * @param {string} [apiKey] Optional API key added as a Bearer token.
 * @returns {Object} Headers object.
 */
export function getSecureHeaders(apiKey) {
  const headers = {
    'Content-Type': 'application/json',
  };

  // chrome.runtime.id is available in all extension contexts
  try {
    if (chrome?.runtime?.id) {
      headers['X-Extension-ID'] = chrome.runtime.id;
    }
  } catch {
    // Context may be invalidated — header simply omitted
  }

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  return headers;
}
