/// <reference path="../pb_data/types.d.ts" />

/**
 * PocketForms — initial collection schema.
 *
 * Three collections:
 *   - pf_forms       : admin-managed form definitions
 *   - pf_submissions : received payloads (anonymous insert via the hook)
 *   - pf_rate_log    : per-IP/form counters used by the rate limiter
 *
 * All collections are non-public (no list/view via the standard API). All
 * writes happen exclusively through the custom routes in
 * pb_hooks/pocketforms.pb.js, which use the admin-level $app DAO.
 */
migrate(
  (app) => {
    // ─── pf_forms ───────────────────────────────────────────────────
    const forms = new Collection({
      type: "base",
      name: "pf_forms",
      system: false,
      // No public access. Manage via the PocketBase admin UI.
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "slug", type: "text", required: true, presentable: true,
          unique: true, max: 80,
          pattern: "^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$" },
        { name: "name", type: "text", max: 200 },
        { name: "enabled", type: "bool", required: false },
        { name: "notifyEmail", type: "email", required: false },
        { name: "ccEmails", type: "text", max: 500 },
        { name: "subject", type: "text", max: 200 },
        { name: "redirect", type: "url", required: false,
          onlyDomains: null, exceptDomains: null },
        { name: "allowedOrigins", type: "text", max: 1000,
          presentable: false },
        { name: "allowedFields", type: "text", max: 1000 },
        { name: "blacklist", type: "text", max: 5000 },
        { name: "minTimeMs", type: "number", min: 0, max: 60000 },
        { name: "rateLimitPerMin", type: "number", min: 0, max: 1000 },
        { name: "rateLimitPerDay", type: "number", min: 0, max: 100000 },
        { name: "requireTurnstile", type: "bool" },
        { name: "turnstileSecret", type: "text", max: 200 },
        { name: "webhookUrl", type: "url" },
        { name: "ipSalt", type: "text", max: 200 },
        { name: "autoCreate", type: "bool" },
      ],
      indexes: [
        "CREATE UNIQUE INDEX `idx_pf_forms_slug` ON `pf_forms` (`slug`)",
      ],
    });
    app.save(forms);

    // ─── pf_submissions ────────────────────────────────────────────
    const submissions = new Collection({
      type: "base",
      name: "pf_submissions",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "form", type: "relation",
          collectionId: forms.id,
          cascadeDelete: true, required: true, maxSelect: 1 },
        // Submitted user data, with `_pf_*` fields stripped.
        { name: "data", type: "json", maxSize: 200000 },
        // sha256(ip + form.ipSalt) — not the raw IP.
        { name: "ipHash", type: "text", max: 100 },
        { name: "userAgent", type: "text", max: 300 },
        { name: "origin", type: "text", max: 300 },
        // received | spam | blocked | error
        { name: "status", type: "select", required: true, maxSelect: 1,
          values: ["received", "spam", "blocked", "error"] },
        { name: "spamReasons", type: "json", maxSize: 5000 },
        { name: "errorMessage", type: "text", max: 1000 },
      ],
      indexes: [
        "CREATE INDEX `idx_pf_submissions_form` ON `pf_submissions` (`form`)",
        "CREATE INDEX `idx_pf_submissions_status` ON `pf_submissions` (`status`)",
        "CREATE INDEX `idx_pf_submissions_created` ON `pf_submissions` (`created`)",
      ],
    });
    app.save(submissions);

    // ─── pf_rate_log ───────────────────────────────────────────────
    // Lightweight counter rows: one per (form, ipHash, bucket).
    // Buckets are minute or day; we keep both granularities so the hook
    // can enforce both rate limits cheaply.
    const rateLog = new Collection({
      type: "base",
      name: "pf_rate_log",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "form", type: "relation",
          collectionId: forms.id,
          cascadeDelete: true, required: true, maxSelect: 1 },
        { name: "ipHash", type: "text", required: true, max: 100 },
        // "min:2026-05-05T03:55" or "day:2026-05-05"
        { name: "bucket", type: "text", required: true, max: 32 },
        { name: "count", type: "number", required: true, min: 0 },
      ],
      indexes: [
        "CREATE UNIQUE INDEX `idx_pf_rate_form_ip_bucket` ON `pf_rate_log` (`form`,`ipHash`,`bucket`)",
        "CREATE INDEX `idx_pf_rate_created` ON `pf_rate_log` (`created`)",
      ],
    });
    app.save(rateLog);
  },
  (app) => {
    for (const name of ["pf_rate_log", "pf_submissions", "pf_forms"]) {
      try {
        const c = app.findCollectionByNameOrId(name);
        app.delete(c);
      } catch {}
    }
  },
);
