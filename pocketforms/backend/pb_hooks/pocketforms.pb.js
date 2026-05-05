/// <reference path="../pb_data/types.d.ts" />

/**
 * PocketForms — PocketBase JS hook.
 *
 * Registers two HTTP routes that handle every form submission:
 *   POST /api/pf/submit/:slug    classic mode → 303 redirect / HTML
 *   POST /api/pf/ajax/:slug      AJAX mode    → JSON
 *
 * Both routes share the same pipeline:
 *   1. Resolve form by slug (must be enabled)
 *   2. Origin / referer check
 *   3. Honeypot check (silent success on trip)
 *   4. Time-trap check
 *   5. Per-IP rate limit (per-minute and per-day)
 *   6. Content blacklist
 *   7. Optional Turnstile token verification
 *   8. Persist submission record
 *   9. Send notification email (best-effort)
 *  10. Fire webhook (best-effort)
 *  11. Respond
 *
 * A nightly cron deletes pf_submissions and pf_rate_log rows older than
 * 30 days so the database doesn't grow unbounded.
 *
 * Conventions:
 *   - Any field whose name starts with `_pf_` is a control field and is
 *     stripped from the payload before storage.
 *   - The `email` field, if present, is used as the email Reply-To.
 *
 * No external dependencies; everything runs inside the PocketBase JSVM.
 */

routerAdd("POST", "/api/pf/submit/{slug}", (e) => handle(e, "classic"));
routerAdd("POST", "/api/pf/ajax/{slug}", (e) => handle(e, "ajax"));

// ─── Pipeline ────────────────────────────────────────────────────────
function handle(e, mode) {
  const slug = e.request.pathValue("slug");
  let form;
  try {
    form = $app.findFirstRecordByData("pf_forms", "slug", slug);
  } catch {
    return reply(e, mode, 404, { error: "form_not_found" });
  }
  if (!form.getBool("enabled")) {
    return reply(e, mode, 403, { error: "form_disabled" }, form);
  }

  // Parse multipart or urlencoded body into a flat field map.
  const payload = readPayload(e);

  // ── 2. Origin check ──
  const origin = e.request.header.get("Origin") || e.request.header.get("Referer") || "";
  if (!originAllowed(origin, form.getString("allowedOrigins"))) {
    log(form, payload, e, "blocked", ["origin"], "origin not allowed");
    return reply(e, mode, 403, { error: "origin_not_allowed" }, form);
  }

  const reasons = [];

  // ── 3. Honeypot ──
  const honey = payload["_pf_honey"];
  if (honey && honey.trim() !== "") {
    reasons.push("honeypot");
    log(form, payload, e, "spam", reasons);
    // Silent success — do NOT tell the bot it tripped.
    return reply(e, mode, 200, { success: true, id: null }, form, true);
  }

  // ── 4. Time-trap ──
  const minTime = form.getInt("minTimeMs") || 3000;
  const t = parseInt(payload["_pf_t"] || "0", 10);
  const dt = Date.now() - t;
  if (!t || dt < minTime) {
    reasons.push("timing");
    log(form, payload, e, "spam", reasons);
    return reply(e, mode, 400, { error: "too_fast" }, form);
  }

  // ── 5. Rate limit ──
  const ipHash = hashIp(e, form);
  const rate = checkRateLimit(form, ipHash);
  if (!rate.ok) {
    reasons.push("rate_limit:" + rate.bucket);
    log(form, payload, e, "blocked", reasons);
    return reply(e, mode, 429, { error: "rate_limited" }, form);
  }

  // ── 6. Content blacklist ──
  const blacklist = parseList(form.getString("blacklist"));
  const userText = stringifyValues(payload).toLowerCase();
  for (const phrase of blacklist) {
    if (!phrase) continue;
    if (userText.includes(phrase.toLowerCase())) {
      reasons.push("blacklist:" + phrase);
      log(form, payload, e, "spam", reasons);
      return reply(e, mode, 400, { error: "blacklisted" }, form);
    }
  }

  // ── 7. Turnstile ──
  if (form.getBool("requireTurnstile")) {
    const token =
      payload["_pf_turnstile"] || payload["cf-turnstile-response"];
    const secret = form.getString("turnstileSecret");
    if (!token || !secret || !verifyTurnstile(token, secret, e)) {
      reasons.push("turnstile");
      log(form, payload, e, "blocked", reasons);
      return reply(e, mode, 400, { error: "turnstile_failed" }, form);
    }
  }

  // ── 8. Allowed-fields filter ──
  const declared = parseList(form.getString("allowedFields"));
  const cleanData = stripControlFields(payload, declared);

  // ── 9. Persist ──
  const submissions = $app.findCollectionByNameOrId("pf_submissions");
  const rec = new Record(submissions);
  rec.set("form", form.id);
  rec.set("data", cleanData);
  rec.set("ipHash", ipHash);
  rec.set("userAgent", trunc(e.request.header.get("User-Agent") || "", 300));
  rec.set("origin", trunc(origin, 300));
  rec.set("status", "received");
  rec.set("spamReasons", []);
  $app.save(rec);

  bumpRateLimit(form, ipHash);

  // ── 10. Notification email (best-effort) ──
  try {
    sendNotification(form, cleanData, payload, rec);
  } catch (err) {
    console.warn("[pocketforms] mail failed", err);
  }

  // ── 11. Webhook (best-effort) ──
  const webhook = form.getString("webhookUrl");
  if (webhook) {
    try {
      $http.send({
        url: webhook,
        method: "POST",
        body: JSON.stringify({ form: form.getString("slug"), data: cleanData, id: rec.id }),
        headers: { "Content-Type": "application/json" },
        timeout: 10,
      });
    } catch (err) {
      console.warn("[pocketforms] webhook failed", err);
    }
  }

  // ── 12. Respond ──
  return reply(e, mode, 200, { success: true, id: rec.id }, form);
}

// ─── Helpers ─────────────────────────────────────────────────────────

function readPayload(e) {
  // The PocketBase Echo request exposes parsed form values via .request.form
  // for both multipart and urlencoded bodies.
  const out = {};
  try {
    const info = e.requestInfo();
    const body = info && info.body ? info.body : {};
    for (const k of Object.keys(body)) {
      const v = body[k];
      out[k] = Array.isArray(v) ? v.join(", ") : String(v);
    }
  } catch (err) {
    // Fall back to manual form parsing.
    try {
      const r = e.request;
      r.parseForm();
      const form = r.form;
      for (const k in form) {
        out[k] = form[k] && form[k].length ? form[k][0] : "";
      }
    } catch {}
  }
  return out;
}

function reply(e, mode, status, body, form, silentSuccess) {
  if (mode === "classic") {
    if (status >= 200 && status < 300) {
      const target =
        (body && body.success !== false ? null : null) ||
        resolveRedirect(form, e);
      if (target) {
        e.response.header().set("Location", target);
        return e.string(303, "");
      }
      return e.html(status, defaultThanksHtml(silentSuccess));
    }
    return e.html(status, defaultErrorHtml(body));
  }
  return e.json(status, body || {});
}

function resolveRedirect(form, e) {
  // Allow a `_pf_redirect` (or `_pf_next`) override only if the host
  // matches the form's allowedOrigins list.
  let override = "";
  try {
    const info = e.requestInfo();
    if (info && info.body) {
      override = info.body["_pf_redirect"] || info.body["_pf_next"] || "";
    }
  } catch {}
  if (override) {
    if (originAllowed(override, form.getString("allowedOrigins"))) return override;
  }
  return form.getString("redirect") || "";
}

function originAllowed(origin, allowedCsv) {
  // Empty allowlist = wildcard (only sensible for local dev / classic
  // forms where Origin is missing). In production each form should set
  // allowedOrigins to its frontend host(s).
  if (!allowedCsv || !allowedCsv.trim()) return true;
  if (!origin) return false;
  let host;
  try {
    host = new URL(origin).host;
  } catch {
    return false;
  }
  for (const allowed of parseList(allowedCsv)) {
    let allowedHost;
    try {
      allowedHost = new URL(allowed).host || allowed;
    } catch {
      allowedHost = allowed;
    }
    if (host === allowedHost) return true;
  }
  return false;
}

function parseList(csv) {
  if (!csv) return [];
  return csv
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function stripControlFields(payload, declared) {
  const out = {};
  for (const k of Object.keys(payload)) {
    if (k.startsWith("_pf_")) continue;
    if (k === "cf-turnstile-response") continue;
    if (declared.length > 0 && !declared.includes(k)) continue;
    out[k] = payload[k];
  }
  return out;
}

function stringifyValues(payload) {
  return Object.keys(payload)
    .filter((k) => !k.startsWith("_pf_"))
    .map((k) => payload[k])
    .join(" \n ");
}

function trunc(s, n) {
  return s.length > n ? s.slice(0, n) : s;
}

function hashIp(e, form) {
  const ip = e.realIp ? e.realIp() : (e.request.remoteAddr || "");
  const salt = form.getString("ipSalt") || form.id;
  // PocketBase JSVM exposes Go crypto via $security.
  return $security.hs256(ip, salt);
}

// ─── Rate limiting ───────────────────────────────────────────────────
function checkRateLimit(form, ipHash) {
  const perMin = form.getInt("rateLimitPerMin") || 3;
  const perDay = form.getInt("rateLimitPerDay") || 20;
  const now = new Date();
  const minBucket = "min:" + now.toISOString().slice(0, 16);
  const dayBucket = "day:" + now.toISOString().slice(0, 10);
  const minCount = readBucket(form.id, ipHash, minBucket);
  if (minCount >= perMin) return { ok: false, bucket: "minute" };
  const dayCount = readBucket(form.id, ipHash, dayBucket);
  if (dayCount >= perDay) return { ok: false, bucket: "day" };
  return { ok: true };
}

function bumpRateLimit(form, ipHash) {
  const now = new Date();
  bumpBucket(form.id, ipHash, "min:" + now.toISOString().slice(0, 16));
  bumpBucket(form.id, ipHash, "day:" + now.toISOString().slice(0, 10));
}

function readBucket(formId, ipHash, bucket) {
  try {
    const rec = $app.findFirstRecordByFilter(
      "pf_rate_log",
      "form = {:f} && ipHash = {:i} && bucket = {:b}",
      { f: formId, i: ipHash, b: bucket },
    );
    return rec.getInt("count");
  } catch {
    return 0;
  }
}

function bumpBucket(formId, ipHash, bucket) {
  const col = $app.findCollectionByNameOrId("pf_rate_log");
  let rec;
  try {
    rec = $app.findFirstRecordByFilter(
      "pf_rate_log",
      "form = {:f} && ipHash = {:i} && bucket = {:b}",
      { f: formId, i: ipHash, b: bucket },
    );
    rec.set("count", rec.getInt("count") + 1);
  } catch {
    rec = new Record(col);
    rec.set("form", formId);
    rec.set("ipHash", ipHash);
    rec.set("bucket", bucket);
    rec.set("count", 1);
  }
  $app.save(rec);
}

// ─── Turnstile ───────────────────────────────────────────────────────
function verifyTurnstile(token, secret, e) {
  try {
    const ip = e.realIp ? e.realIp() : "";
    const res = $http.send({
      url: "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      method: "POST",
      body: new URLSearchParams({ secret, response: token, remoteip: ip }).toString(),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 10,
    });
    if (!res || res.statusCode !== 200) return false;
    const body = JSON.parse(res.raw);
    return body && body.success === true;
  } catch {
    return false;
  }
}

// ─── Mail ────────────────────────────────────────────────────────────
function sendNotification(form, cleanData, raw, rec) {
  const to = form.getString("notifyEmail");
  if (!to) return;
  const subject =
    raw["_pf_subject"] ||
    form.getString("subject") ||
    `New submission · ${form.getString("name") || form.getString("slug")}`;
  const replyTo = raw["_pf_replyto"] || cleanData.email || "";
  const cc = parseList(raw["_pf_cc"] || form.getString("ccEmails") || "");

  let body = `New submission for "${form.getString("slug")}"\n\n`;
  for (const k of Object.keys(cleanData)) {
    body += `${k}:\n  ${String(cleanData[k]).replace(/\n/g, "\n  ")}\n\n`;
  }
  body += `\n— PocketForms · submission ${rec.id}`;

  const message = new MailerMessage({
    from: { address: $app.settings().meta.senderAddress, name: "PocketForms" },
    to: [{ address: to }],
    cc: cc.map((a) => ({ address: a })),
    subject,
    text: body,
  });
  if (replyTo) message.headers = { "Reply-To": replyTo };
  $app.newMailClient().send(message);
}

// ─── Logging spam / blocked ──────────────────────────────────────────
function log(form, payload, e, status, reasons, errorMessage) {
  try {
    const submissions = $app.findCollectionByNameOrId("pf_submissions");
    const rec = new Record(submissions);
    rec.set("form", form.id);
    rec.set("data", stripControlFields(payload, []));
    rec.set("ipHash", hashIp(e, form));
    rec.set("userAgent", trunc(e.request.header.get("User-Agent") || "", 300));
    rec.set("origin", trunc(e.request.header.get("Origin") || e.request.header.get("Referer") || "", 300));
    rec.set("status", status);
    rec.set("spamReasons", reasons);
    if (errorMessage) rec.set("errorMessage", errorMessage);
    $app.save(rec);
  } catch (err) {
    console.warn("[pocketforms] log failed", err);
  }
}

// ─── Default HTML (fallback for classic mode w/o redirect) ───────────
function defaultThanksHtml(silentSuccess) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Thanks</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:480px;margin:6rem auto;padding:0 1.5rem;color:#292524}
h1{font-weight:500;letter-spacing:-0.02em}
small{color:#78716c}</style></head>
<body><h1>Thanks — your message is on its way.</h1>
<p>You can close this tab now. Set <code>_pf_redirect</code> on the form to come back to your own page next time.</p>
<small>Powered by PocketForms</small></body></html>`;
}

function defaultErrorHtml(body) {
  const code = (body && body.error) || "error";
  return `<!doctype html><html><head><meta charset="utf-8"><title>Submission rejected</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:480px;margin:6rem auto;padding:0 1.5rem;color:#292524}
h1{font-weight:500;letter-spacing:-0.02em}
code{background:#f5f5f4;padding:2px 6px;border-radius:4px}</style></head>
<body><h1>That didn't go through.</h1>
<p>The form was rejected with code <code>${code}</code>.</p>
<p><a href="javascript:history.back()">Back to the form</a></p></body></html>`;
}

// ─── Cleanup cron ────────────────────────────────────────────────────
// Daily, 03:00 UTC: prune submissions and rate-log rows older than 30 d.
cronAdd("pocketforms_cleanup", "0 3 * * *", () => {
  const cutoff = new Date(Date.now() - 30 * 86400_000)
    .toISOString()
    .replace("T", " ")
    .replace("Z", "");
  try {
    const stale = $app.findRecordsByFilter(
      "pf_submissions",
      "created < {:c} && status != 'received'",
      "-created",
      5000,
      0,
      { c: cutoff },
    );
    for (const r of stale) $app.delete(r);
  } catch (e) {
    console.warn("[pocketforms cleanup] submissions", e);
  }
  try {
    const stale = $app.findRecordsByFilter(
      "pf_rate_log",
      "created < {:c}",
      "-created",
      5000,
      0,
      { c: cutoff },
    );
    for (const r of stale) $app.delete(r);
  } catch (e) {
    console.warn("[pocketforms cleanup] rate_log", e);
  }
});
