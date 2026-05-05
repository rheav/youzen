/**
 * Submission HTTP client.
 *
 * Two endpoints, picked by `mode`:
 *   - "ajax"    POST {pocketbaseUrl}/api/pf/ajax/{slug}    → JSON
 *   - "classic" POST {pocketbaseUrl}/api/pf/submit/{slug}  → 303 redirect
 *
 * Classic mode lets the browser follow the redirect natively (or render
 * an error page); the SDK doesn't intercept it. AJAX mode sends FormData,
 * waits for JSON, and dispatches success/error callbacks.
 *
 * The SDK never POSTs `_pf_*` fields to anything other than the configured
 * PocketBase host — even if the form's `action` attribute points elsewhere,
 * the SDK rewrites it.
 */

export function buildSubmitUrl(pocketbaseUrl, slug, mode) {
  const base = pocketbaseUrl.replace(/\/$/, "");
  const path = mode === "ajax" ? "ajax" : "submit";
  return `${base}/api/pf/${path}/${encodeURIComponent(slug)}`;
}

/**
 * Send a FormData payload via fetch and parse the JSON response shape:
 *   success: { success: true, id: string }
 *   failure: { success: false, error: string, message?: string }
 *
 * Network errors and non-2xx responses are normalized into the failure
 * shape so callers always see the same surface.
 */
export async function submitAjax(url, formData) {
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
      // Cookies / credentials are never needed — PocketBase routes are
      // anonymous. Explicitly omit so this works cross-origin.
      credentials: "omit",
      mode: "cors",
    });
  } catch (e) {
    return { success: false, error: "network", message: String(e) };
  }
  let body = null;
  try {
    body = await res.json();
  } catch {
    return { success: false, error: "bad_response", message: `HTTP ${res.status}` };
  }
  if (!res.ok) {
    return {
      success: false,
      error: (body && body.error) || "http_error",
      message: (body && body.message) || `HTTP ${res.status}`,
    };
  }
  return body;
}
