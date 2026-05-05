/**
 * PocketForms — programmatic API.
 *
 * Usage:
 *
 *   import PocketForms from "@pocketforms/client";
 *   const pf = PocketForms.init({ pocketbaseUrl: "https://pb.example.com" });
 *   pf.attach("#contact", { slug: "contact", mode: "ajax",
 *     onSuccess: () => alert("Thanks!"),
 *     onError:   (e) => console.warn(e),
 *   });
 *
 * For the zero-config / data-attribute API, see ./auto-init.js (which is
 * what the IIFE bundle exposes).
 */
import {
  installHoneypot,
  installTiming,
  refreshTimingOnInteraction,
  mountTurnstile,
} from "./protection/index.js";
import { buildSubmitUrl, submitAjax } from "./client.js";
import { resolve, resolveAll, merge } from "./utils.js";

const VERSION = "0.1.0";

const DEFAULTS = {
  mode: "ajax",
  honeypotName: "_pf_honey",
  timingName: "_pf_t",
  minTimeMs: 3000,
};

function attachOne(form, baseOpts, instanceOpts) {
  if (form.dataset.pocketformsAttached === "true") return;
  form.dataset.pocketformsAttached = "true";

  const opts = merge(DEFAULTS, baseOpts, instanceOpts);
  if (!opts.slug) {
    console.warn("[pocketforms] no slug provided, skipping form", form);
    return;
  }
  const url = buildSubmitUrl(opts.pocketbaseUrl, opts.slug, opts.mode);

  // Always install protection fields. They're invisible to humans and
  // cheap to render; the server requires them.
  installHoneypot(form, opts.honeypotName);
  installTiming(form, opts.timingName);
  refreshTimingOnInteraction(form, opts.timingName);

  // Optional Turnstile widget. Mount lazily so the script only loads
  // when actually needed.
  if (opts.turnstileSiteKey) {
    mountTurnstile(form, opts.turnstileSiteKey).catch((e) => {
      console.warn("[pocketforms] turnstile failed to mount", e);
    });
  }

  // Wire the form action to the resolved URL so classic-mode forms POST
  // to the right place even if the author's `action` attribute is wrong
  // or empty.
  if (opts.mode === "classic") {
    form.setAttribute("action", url);
    form.setAttribute("method", "POST");
    return;
  }

  // AJAX mode: hijack submit, send via fetch, dispatch callbacks.
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitter = e.submitter;
    if (submitter && "disabled" in submitter) submitter.disabled = true;
    form.dataset.pocketformsState = "submitting";

    const fd = new FormData(form);
    const result = await submitAjax(url, fd);

    if (result.success) {
      form.dataset.pocketformsState = "success";
      // Reset only on success to preserve user input on errors.
      try { form.reset(); } catch {}
      // Re-install hidden fields after reset so the form remains
      // submittable a second time.
      installHoneypot(form, opts.honeypotName);
      installTiming(form, opts.timingName);
      refreshTimingOnInteraction(form, opts.timingName);
      if (typeof opts.onSuccess === "function") opts.onSuccess(result, form);
      else if (opts.redirect) window.location.href = opts.redirect;
    } else {
      form.dataset.pocketformsState = "error";
      if (typeof opts.onError === "function") opts.onError(result, form);
      else console.warn("[pocketforms] submit failed", result);
    }
    if (submitter && "disabled" in submitter) submitter.disabled = false;
  });
}

export const PocketForms = {
  version: VERSION,
  init(baseOpts) {
    if (!baseOpts || !baseOpts.pocketbaseUrl) {
      throw new Error("[pocketforms] init() requires { pocketbaseUrl }");
    }
    return {
      attach(target, instanceOpts) {
        for (const form of resolveAll(target)) {
          if (!(form instanceof HTMLFormElement)) {
            console.warn("[pocketforms] attach target is not a <form>", form);
            continue;
          }
          attachOne(form, baseOpts, instanceOpts);
        }
      },
      detach(target) {
        const el = resolve(target);
        if (el) delete el.dataset.pocketformsAttached;
      },
    };
  },
};

export default PocketForms;
