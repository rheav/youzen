/**
 * Honeypot field injector.
 *
 * Adds a hidden text input named `_pf_honey` (configurable) inside the
 * form. Bots that fill every field will fill this one too — when the
 * server sees a non-empty value, the submission is silently flagged as
 * spam (returned 200 OK to the bot, but never stored / mailed).
 *
 * The field is hidden three ways:
 *   1. CSS  display: none
 *   2. CSS  position: absolute; left: -9999px
 *   3. tabindex=-1, autocomplete=off, aria-hidden=true
 * Belt + braces — some scrapers ignore one or two of these.
 */
export function installHoneypot(form, name = "_pf_honey") {
  if (form.querySelector(`input[name="${name}"]`)) return; // idempotent
  const input = document.createElement("input");
  input.type = "text";
  input.name = name;
  input.tabIndex = -1;
  input.autocomplete = "off";
  input.setAttribute("aria-hidden", "true");
  input.style.cssText =
    "display:none !important;position:absolute;left:-9999px;top:-9999px;height:0;width:0;opacity:0;";
  form.appendChild(input);
}
