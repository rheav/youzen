/**
 * Integration-test helper.
 *
 * Reads src/styles/youtube.css once, parses it, and provides:
 *   • injectCss(doc)        — clones the stylesheet into the jsdom document
 *   • mountSnippet(doc, html) — parses an HTML snippet into doc.body
 *   • isHidden(el)          — cross-checks display != 'none' via getComputedStyle
 *   • setAttr(doc, attr)    — toggles data-ytc-* on <html>, returns a disposer
 *
 * Tests use these to prove that a given CSS rule hides the nodes it
 * claims to hide — and only those nodes — when its data-ytc-* attribute
 * is set on <html>.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSS_PATH = path.resolve(__dirname, '../../src/styles/youtube.css');

let cachedCss = null;

export function readCss() {
  if (cachedCss === null) {
    cachedCss = fs.readFileSync(CSS_PATH, 'utf8');
  }
  return cachedCss;
}

export function injectCss(doc) {
  const style = doc.createElement('style');
  style.setAttribute('data-ytc-test', 'youtube-css');
  style.textContent = readCss();
  doc.head.appendChild(style);
  return style;
}

export function mountSnippet(doc, html) {
  const template = doc.createElement('template');
  template.innerHTML = html.trim();
  const frag = template.content.cloneNode(true);
  doc.body.appendChild(frag);
}

export function setAttr(doc, attr, value = '') {
  doc.documentElement.setAttribute(attr, value);
  return () => doc.documentElement.removeAttribute(attr);
}

/**
 * Returns true iff the element is hidden by `display: none` per the live
 * computed style. Walks ancestors because `display: none` on an ancestor
 * hides descendants regardless of their own computed value in most
 * browsers — but getComputedStyle in jsdom doesn't inherit that, so we
 * check ancestors manually.
 */
export function isHidden(el) {
  let cur = el;
  while (cur && cur.nodeType === 1) {
    const cs = cur.ownerDocument.defaultView.getComputedStyle(cur);
    if (cs.display === 'none') return true;
    cur = cur.parentElement;
  }
  return false;
}
