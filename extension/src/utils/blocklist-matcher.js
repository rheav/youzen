/**
 * blocklist-matcher — pure rule compilation + text evaluation.
 *
 * A "rule" in chrome.storage.local looks like:
 *   { id: 'abc', text: 'reaction', mode: 'substring', caseSensitive: false }
 *
 * Supported modes (mutually exclusive per rule):
 *   • 'substring'  — indexOf / includes (default)
 *   • 'wholeWord'  — \bword\b word-boundary match
 *   • 'regex'      — user-supplied regular expression
 *
 * Plus:
 *   • caseSensitive: boolean — applies to substring + wholeWord. Regex users
 *     control flags themselves via RegExp literal syntax.
 *
 * Invalid regex is logged but treated as a never-match — the user should
 * see the rule highlighted in the UI (Phase 5) rather than get a crash here.
 */

import { warn } from './logger.js';

/**
 * @typedef {Object} BlocklistRule
 * @property {string}  id
 * @property {string}  text
 * @property {'substring' | 'wholeWord' | 'regex'} [mode='substring']
 * @property {boolean} [caseSensitive=false]
 */

/**
 * @typedef {Object} Matcher
 * @property {string}  id
 * @property {(text: string) => boolean} test
 * @property {boolean} valid    — false when a regex rule has a syntax error.
 * @property {string}  [error]  — error message when valid === false.
 */

/**
 * Compile a single rule to a matcher. Never throws; invalid regex rules
 * produce a matcher with { valid: false, test: () => false }.
 *
 * @param {BlocklistRule} rule
 * @returns {Matcher}
 */
export function compileRule(rule) {
  if (!rule || typeof rule.text !== 'string' || rule.text.length === 0) {
    return { id: rule?.id ?? '', test: () => false, valid: false };
  }
  const mode = rule.mode ?? 'substring';
  const caseSensitive = !!rule.caseSensitive;

  try {
    if (mode === 'regex') {
      // No automatic escaping — user-supplied regex.
      const re = new RegExp(rule.text, caseSensitive ? '' : 'i');
      return { id: rule.id, test: (t) => re.test(t), valid: true };
    }
    if (mode === 'wholeWord') {
      const escaped = escapeRegex(rule.text);
      const re = new RegExp(`\\b${escaped}\\b`, caseSensitive ? '' : 'i');
      return { id: rule.id, test: (t) => re.test(t), valid: true };
    }
    // 'substring' (default)
    if (caseSensitive) {
      const needle = rule.text;
      return {
        id: rule.id,
        test: (t) => typeof t === 'string' && t.includes(needle),
        valid: true,
      };
    }
    const needleLower = rule.text.toLowerCase();
    return {
      id: rule.id,
      test: (t) =>
        typeof t === 'string' && t.toLowerCase().includes(needleLower),
      valid: true,
    };
  } catch (err) {
    warn('invalid blocklist rule', rule.id, err?.message);
    return {
      id: rule.id,
      test: () => false,
      valid: false,
      error: err?.message ?? 'compile error',
    };
  }
}

/** Compile an array of rules, preserving order. */
export function compileRules(rules) {
  if (!Array.isArray(rules)) return [];
  return rules.map(compileRule);
}

/**
 * Return true if ANY matcher in the list matches the text.
 * Returns false for empty inputs / empty list.
 */
export function evaluateText(text, matchers) {
  if (!text || !Array.isArray(matchers) || matchers.length === 0) return false;
  for (const m of matchers) {
    if (!m.valid) continue;
    if (m.test(text)) return true;
  }
  return false;
}

/**
 * Return the first matcher that matches — useful when the UI wants to show
 * WHICH rule matched. Returns null if no matcher matches.
 */
export function firstMatch(text, matchers) {
  if (!text || !Array.isArray(matchers) || matchers.length === 0) return null;
  for (const m of matchers) {
    if (!m.valid) continue;
    if (m.test(text)) return m;
  }
  return null;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
