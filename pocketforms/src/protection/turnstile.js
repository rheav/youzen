/**
 * Cloudflare Turnstile loader + widget mounter.
 *
 * Optional — only used when a form opts in via `turnstileSiteKey`. The
 * Turnstile script is loaded once per page and the widget is mounted in
 * an empty <div class="cf-turnstile"> inside the form. The token gets
 * submitted automatically as a `cf-turnstile-response` field; the server
 * also accepts `_pf_turnstile`.
 *
 * Privacy note: Turnstile is the most privacy-respecting CAPTCHA-like
 * service available, but it still loads a Cloudflare script. If you don't
 * want any third-party requests, simply don't pass `turnstileSiteKey` —
 * the honeypot + time-trap + rate-limit + blacklist stack is already
 * effective on its own for ~95 % of spam.
 */
const TURNSTILE_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptPromise = null;

function loadScript() {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src^="${TURNSTILE_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const s = document.createElement("script");
    s.src = TURNSTILE_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("turnstile_script_failed"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export async function mountTurnstile(form, siteKey) {
  if (!siteKey) return;
  await loadScript();
  // Wait for the global to appear (script may resolve before the
  // turnstile object is exposed).
  await new Promise((resolve) => {
    if (window.turnstile) return resolve();
    const start = Date.now();
    const tick = () => {
      if (window.turnstile) return resolve();
      if (Date.now() - start > 5000) return resolve();
      requestAnimationFrame(tick);
    };
    tick();
  });
  if (!window.turnstile) return;

  let host = form.querySelector(".cf-turnstile, [data-pocketforms-turnstile-host]");
  if (!host) {
    host = document.createElement("div");
    host.className = "cf-turnstile";
    host.setAttribute("data-pocketforms-turnstile-host", "true");
    form.appendChild(host);
  }
  window.turnstile.render(host, {
    sitekey: siteKey,
    theme: "auto",
  });
}
