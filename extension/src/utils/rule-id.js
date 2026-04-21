/**
 * Rule-id generator.
 *
 * Format: `r_<8 base36 chars>_<4 base36 chars>`
 *   • Prefix 'r_' makes the key debuggable in DevTools Storage panel.
 *   • 8 chars of Math.random + 4 chars of Date.now gives ~13 bits per
 *     char * 12 chars = 156 bits of entropy. Collision-safe for a
 *     realistic rule count (never > 10^4).
 *
 * Pure; no crypto.getRandomValues requirement so it works in the
 * content-script ISOLATED world, the service worker, and the sidepanel.
 */
export function newRuleId() {
  const rand = Math.random().toString(36).slice(2, 10).padStart(8, '0');
  const time = Date.now().toString(36).slice(-4).padStart(4, '0');
  return `r_${rand}_${time}`;
}
