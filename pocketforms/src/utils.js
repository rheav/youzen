/**
 * Tiny utilities shared across the SDK. Kept dependency-free so the
 * minified bundle stays under ~3 KB.
 */

/** Resolve a target arg (string selector or element) to a single Element. */
export function resolve(target) {
  if (target instanceof HTMLElement) return target;
  if (typeof target === "string") return document.querySelector(target);
  return null;
}

/** Resolve to a list of elements (selector → all matches; element → [el]). */
export function resolveAll(target) {
  if (target instanceof HTMLElement) return [target];
  if (typeof target === "string") return [...document.querySelectorAll(target)];
  return [];
}

/** Shallow merge with overrides taking precedence; null/undefined are ignored. */
export function merge(...objects) {
  const out = {};
  for (const obj of objects) {
    if (!obj) continue;
    for (const k of Object.keys(obj)) {
      if (obj[k] != null) out[k] = obj[k];
    }
  }
  return out;
}

/** Read all data-pocketforms-* attributes off an element as an options object. */
export function readDataAttrs(el) {
  const slug = el.getAttribute("data-pocketforms");
  if (!slug) return null;
  const o = { slug };
  const map = {
    "data-pocketforms-mode": "mode",
    "data-pocketforms-honeypot": "honeypotName",
    "data-pocketforms-min-time": "minTimeMs",
    "data-pocketforms-turnstile": "turnstileSiteKey",
    "data-pocketforms-redirect": "redirect",
  };
  for (const [attr, key] of Object.entries(map)) {
    const v = el.getAttribute(attr);
    if (v == null) continue;
    o[key] = key === "minTimeMs" ? Number(v) : v;
  }
  return o;
}
