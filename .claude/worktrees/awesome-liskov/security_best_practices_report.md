# Security Best Practices Report

## Executive Summary
This review focused on the React frontend and Express backend. I found several high‑impact issues that could lead to XSS or CSRF if attacker‑controlled content reaches the affected code paths, plus a handful of medium/low‑risk misconfigurations and hardening gaps. The most critical items are un-sanitized HTML injection paths in the frontend and the lack of CSRF protection for cookie‑authenticated state‑changing routes.

## High Severity Findings

### 1) REACT-XSS-001 — Untrusted HTML rendered via `dangerouslySetInnerHTML`
- **Severity:** High
- **Location:** `client/src/pages/content-packet-guide.tsx:581`
- **Evidence:**
  ```tsx
  <div dangerouslySetInnerHTML={{ __html: content.body || "" }} />
  ```
- **Impact:** If `content.body` can be influenced by attackers (CMS/user content), this enables stored or reflected XSS in the main app origin.
- **Fix:** Sanitize HTML before render (e.g., DOMPurify with a strict allowlist), or render markdown/structured content without raw HTML. Centralize sanitization and treat any HTML as untrusted by default.
- **Mitigation:** Add CSP and consider Trusted Types to reduce DOM XSS blast radius.
- **False positive notes:** If `content.body` is guaranteed safe and never user‑controlled, document that provenance and enforce it in the ingestion pipeline.

### 2) JS-XSS-002 / REACT-DOM-001 — `document.write` + `innerHTML` used for print output
- **Severity:** High
- **Location:** `client/src/pages/library.tsx:492-513`
- **Evidence:**
  ```ts
  const content = document.getElementById('print-content')?.innerHTML || '';
  printWindow.document.write(`...<body>${content}</body>...`);
  ```
- **Impact:** If `#print-content` includes attacker‑controlled HTML (e.g., content fetched from the backend/CMS), this is a direct DOM‑XSS sink. It also uses `document.write`, which is an explicit high‑risk sink.
- **Fix:** Build the print DOM with safe APIs (`textContent`, createElement) or sanitize the HTML before insertion. Avoid `document.write` entirely.
- **Mitigation:** CSP + Trusted Types for defense‑in‑depth.
- **False positive notes:** If the print content is strictly generated from trusted constants and never includes user content, document it and enforce it.

### 3) JS-XSS-002 / JS-XSS-003 — Inline HTML/JS written into preview window
- **Severity:** High
- **Location:** `client/src/pages/assessment-builder.tsx:206-226`
- **Evidence:**
  ```ts
  previewWindow.document.write(`
    ...
    <script>
      const survey = new Survey.Model(${JSON.stringify(creator.JSON)});
      survey.render("surveyContainer");
    </script>
  `);
  ```
- **Impact:** If `creator.JSON` contains user‑supplied strings, a `</script>` sequence can break out and execute arbitrary JS in the app origin. This is a classic DOM‑XSS pattern.
- **Fix:** Avoid `document.write` and inline scripts. Instead, open a dedicated preview route and pass data via `postMessage` or URL‑safe storage, then render with safe DOM APIs.
- **Mitigation:** CSP and Trusted Types reduce exploitability.
- **False positive notes:** If `creator.JSON` is strictly controlled and never attacker‑influenced, document and enforce that assumption.

### 4) EXPRESS-CSRF-001 — No CSRF protection on cookie‑authenticated state‑changing routes
- **Severity:** High
- **Location:**
  - Session cookie auth: `server/auth.ts:24-35`
  - State‑changing POSTs from client: `client/src/pages/subscription.tsx:110-190`
- **Evidence:**
  ```ts
  // server/auth.ts
  app.use(session(sessionSettings)); // cookie-based auth
  ```
  ```ts
  // client/src/pages/subscription.tsx
  fetch("/api/subscription/checkout", { method: "POST", credentials: "include", ... })
  ```
- **Impact:** Any third‑party site can trigger state‑changing requests (checkout/upgrade/portal/etc.) if the user is logged in and CSRF protections are absent.
- **Fix:** Add CSRF tokens (synchronizer or double‑submit) for all cookie‑authenticated POST/PUT/PATCH/DELETE routes. Consider Origin/Referer validation and SameSite cookies as defense‑in‑depth.
- **Mitigation:** Ensure SameSite is set (it is `Lax`), but do not rely on it alone.
- **False positive notes:** If you fully avoid cookie‑based auth and only use Authorization headers, CSRF risk changes. That is not the current setup.

## Medium Severity Findings

### 5) EXPRESS-REDIRECT-001 — Unvalidated success/cancel URLs in checkout flow
- **Severity:** Medium
- **Location:**
  - `server/routes/subscription.ts:60-71`
  - `server/application/subscription/create-checkout-session-flow.ts:39-48`
- **Evidence:**
  ```ts
  // routes/subscription.ts
  const { priceId, successUrl, cancelUrl } = req.body;
  ... createCheckoutSessionFlow(..., { successUrl, cancelUrl })
  ```
  ```ts
  // create-checkout-session-flow.ts
  const successUrl = input.successUrl || `${baseUrl}/dashboard?subscription=success`;
  const cancelUrl = input.cancelUrl || `${baseUrl}/subscription?canceled=true`;
  ```
- **Impact:** If an attacker can supply `successUrl`/`cancelUrl`, Stripe will redirect users to arbitrary URLs after checkout (open‑redirect / phishing vector).
- **Fix:** Validate these URLs against a strict allowlist (prefer same‑origin relative URLs) before passing to Stripe.
- **Mitigation:** Consider ignoring client‑provided URLs entirely and always compute server‑side.
- **False positive notes:** If the client never passes custom URLs, enforce that at the API boundary.

### 6) JS-STORAGE-001 — Bearer token stored in `sessionStorage`
- **Severity:** Medium
- **Location:** `client/src/pages/patient-portal.tsx:83-121`
- **Evidence:**
  ```ts
  sessionStorage.setItem("patientPortalToken", data.sessionToken);
  const savedToken = sessionStorage.getItem("patientPortalToken");
  ```
- **Impact:** Any XSS can exfiltrate the token. Session storage is readable by JS and not a safe place for auth tokens.
- **Fix:** Prefer HttpOnly cookies for session identifiers, or keep tokens only in memory with short lifetimes and refresh flow.
- **Mitigation:** Tighten XSS protections (CSP, sanitization) and reduce token scope/TTL.
- **False positive notes:** If this token is strictly non‑sensitive and short‑lived, document that and ensure server‑side validation reflects it.

### 7) EXPRESS-HEADERS-001 — Security headers not configured in app code
- **Severity:** Medium
- **Location:** `server/index.ts:18-38` (no Helmet/CSP visible)
- **Evidence:**
  ```ts
  const app = express();
  // no helmet() or security header middleware configured
  ```
- **Impact:** Missing CSP, clickjacking protection, nosniff, and other baseline headers increases XSS and UI‑redress risk.
- **Fix:** Add `helmet()` with a realistic CSP (start report‑only), plus `X-Content-Type-Options`, `Referrer-Policy`, and frame‑ancestors protection.
- **Mitigation:** If headers are set at the edge/CDN, document and verify at runtime.
- **False positive notes:** If headers are enforced in infrastructure, this can be downgraded.

### 8) SERVER-SIDE HTML INJECTION — Markdown rendered without sanitization for PDFs
- **Severity:** Medium
- **Location:** `server/infrastructure/pdf/pdf-generator.ts:314-368`
- **Evidence:**
  ```ts
  const bodyHtml = marked(item.body || "");
  ...
  <div class="content-body">
    ${bodyHtml}
  </div>
  ```
- **Impact:** If `item.body` includes attacker‑controlled HTML/JS, it will be executed by Puppeteer during PDF generation. This can lead to data exfiltration or SSRF via the headless browser context.
- **Fix:** Sanitize markdown output (DOMPurify with JSDOM, or a markdown renderer configured to disallow raw HTML).
- **Mitigation:** Disable JS execution in Puppeteer where possible and restrict network access.
- **False positive notes:** If content is authored only by trusted admins and never user‑supplied, document that and enforce in CMS/editor roles.

## Low Severity Findings

### 9) EXPRESS-SESS-001 — Default session cookie name in use
- **Severity:** Low
- **Location:** `server/auth.ts:24-35`
- **Evidence:**
  ```ts
  const sessionSettings = {
    ...
    // no `name` set, so default is connect.sid
  }
  ```
- **Impact:** Using the default cookie name makes fingerprinting slightly easier and can cause collisions on shared domains.
- **Fix:** Set a custom session cookie name (e.g., `name: "sessionId"`).
- **Mitigation:** None required beyond renaming.
- **False positive notes:** If multiple apps share a domain, this becomes more important.

### 10) EXPRESS-ERROR-001 — Error handler may leak internal messages
- **Severity:** Low
- **Location:** `server/index.ts:102-107`
- **Evidence:**
  ```ts
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  throw err;
  ```
- **Impact:** Returning raw error messages can leak internal details in production.
- **Fix:** Return a generic message in production and log details server‑side with redaction.
- **Mitigation:** Gate detailed errors behind `NODE_ENV !== "production"`.
- **False positive notes:** If all errors are already sanitized upstream, impact is reduced.

## Notes
- I did not see CORS misconfigurations in app code. If CORS is configured at the edge, please verify it is strict and not wildcarded with credentials.
- If you want, I can start fixing these findings one at a time (recommended order: XSS paths, CSRF protection, URL allowlisting).
