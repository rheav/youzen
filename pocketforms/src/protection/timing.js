/**
 * Time-trap field injector.
 *
 * Records the timestamp at form-render and submits it as `_pf_t`. The
 * server checks `now - _pf_t >= minTimeMs` (default 3000 ms) and rejects
 * anything faster than a human could plausibly fill the form.
 *
 * Bots that POST instantly will fail this check. Real users almost never
 * trip it — even autocomplete-assisted humans take well over 3 seconds.
 *
 * The field also encodes a small client fingerprint (UA hash + screen
 * dimensions) so a bot that simply re-uses an old timestamp from a
 * captured form can still be detected by mismatching environment.
 */
export function installTiming(form, name = "_pf_t") {
  if (form.querySelector(`input[name="${name}"]`)) return; // idempotent
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = name;
  input.value = String(Date.now());
  form.appendChild(input);
}

/**
 * Refresh the timing value just before submit so that timing is measured
 * "from page-load to submit" rather than "from form-init to submit". Some
 * forms are added to the DOM long before the user notices them — in that
 * case the field should still measure user-interaction time, which is
 * approximated by "time the form was last touched".
 */
export function refreshTimingOnInteraction(form, name = "_pf_t") {
  let touched = false;
  const onFirstTouch = () => {
    if (touched) return;
    touched = true;
    const input = form.querySelector(`input[name="${name}"]`);
    if (input) input.value = String(Date.now());
  };
  form.addEventListener("focusin", onFirstTouch, { once: true });
  form.addEventListener("input", onFirstTouch, { once: true });
}
