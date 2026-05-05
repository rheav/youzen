/**
 * Auto-init / data-attribute API.
 *
 * This entry produces the IIFE bundle that exposes a single global
 * `PocketForms`. Drop it on the page and it scans for any
 * `<form data-pocketforms="slug">` on DOMContentLoaded:
 *
 *   <script src="https://cdn.example.com/pocketforms.iife.js"
 *           data-pocketbase-url="https://pb.example.com"></script>
 *
 *   <form data-pocketforms="contact"
 *         data-pocketforms-mode="ajax"
 *         data-pocketforms-redirect="/thanks">
 *     <input type="email" name="email" required>
 *     <textarea name="message" required></textarea>
 *     <button>Send</button>
 *   </form>
 *
 * Per-form options can be set via data-pocketforms-* attributes — see
 * src/utils.js#readDataAttrs for the full list.
 *
 * The PocketBase URL is read from either:
 *   1. `data-pocketbase-url` on the <script> tag itself
 *   2. `window.POCKETFORMS_URL` set before the script loads
 *   3. The `data-pocketforms-url` attribute on the <form>
 *
 * If none of these is found, auto-init bails with a console warning so
 * the page still works.
 */
import { PocketForms } from "./index.js";
import { readDataAttrs } from "./utils.js";

function discoverPocketBaseUrl() {
  if (typeof window !== "undefined" && window.POCKETFORMS_URL) {
    return window.POCKETFORMS_URL;
  }
  // Look at every script that might be the PocketForms bundle.
  const scripts = document.querySelectorAll("script[data-pocketbase-url]");
  for (const s of scripts) {
    const u = s.getAttribute("data-pocketbase-url");
    if (u) return u;
  }
  return null;
}

function initOne(form, baseUrl) {
  const opts = readDataAttrs(form);
  if (!opts) return;
  const url = form.getAttribute("data-pocketforms-url") || baseUrl;
  if (!url) {
    console.warn(
      "[pocketforms] no PocketBase URL found for form; set " +
        "data-pocketbase-url on the script tag, window.POCKETFORMS_URL, " +
        "or data-pocketforms-url on the form.",
      form,
    );
    return;
  }
  const pf = PocketForms.init({ pocketbaseUrl: url });
  pf.attach(form, opts);
}

function autoInit() {
  const baseUrl = discoverPocketBaseUrl();
  for (const form of document.querySelectorAll("form[data-pocketforms]")) {
    initOne(form, baseUrl);
  }
  // Also pick up forms added later (SPA navigation, hydration, etc.).
  const observer = new MutationObserver((records) => {
    for (const r of records) {
      for (const node of r.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.matches?.("form[data-pocketforms]")) initOne(node, baseUrl);
        for (const f of node.querySelectorAll?.("form[data-pocketforms]") ||
          []) {
          initOne(f, baseUrl);
        }
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoInit, { once: true });
} else {
  autoInit();
}

// Re-export the programmatic API on the IIFE global for ad-hoc usage.
export default PocketForms;
export { PocketForms };
