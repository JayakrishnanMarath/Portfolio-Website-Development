# Sector4 V15 security and performance audit — 2026-11-24

## Tests executed
- Node.js syntax check (`app.js`, `fuel.js`): PASS.
- HTML structure: duplicate ID scan: PASS.
- HTML referenced local assets exist: PASS.
- External links with `target=_blank` have `noopener noreferrer`: PASS.
- License iframes sandboxed: PASS.
- HTML contains no inline script tags: PASS.
- Scan for common GitHub/AWS private key patterns: no matches (not a complete secrets scan).
- Vercel JSON parses and contains expected seven security header names: PASS.
- ZIP integrity: PASS.
- Browser integration: NOT TESTED; headless Chromium navigation is blocked by local runtime policy.
- Deployment checks: NOT TESTED; production Vercel access is not connected.
- External penetration, stress, XSS fuzzing and live configuration scanning: NOT TESTED.

## Changes
- CSP restricting scripts, images, frames and origin access (remote OCR remains narrowly allowed).
- HSTS, nosniff, referrer policy, anti-framing and feature restrictions.
- Third-party license iframes sandboxed.
- 30Hz tachometer UI refresh; audio runs independently; waveform redraw reduced.
- CSS background glow filters replaced with sharp-edged orange light trails and shadows; mobile motion restricted.

## Residual risks and production checklist
1. Tesseract OCR is dynamically loaded from jsdelivr, so use a self-hosted version with a verified lock/hash before high-assurance deployment. OCR recognition itself is untrusted.
2. Check browser devtools for CSP violations, especially OCR worker/WASM/data dependencies, and adjust only for required origins.
3. Confirm LFM allows sandboxed badge embedding and preserves live updates.
4. Vercel production must deploy the `vercel.json` headers. Confirm using `curl -I` on real domain and `/fuel.html`.
5. Enable multi-factor authentication, least privilege, protected main branch, deployment approvals, and automated repository secret scanning in GitHub/Vercel.
6. Disable public deployment of preview secrets and audit any linked integrations; never put secret API keys in frontend JS.
7. Run Lighthouse/performance trace and live vulnerability scanning before assigning a security level.

No formal 8–9/10 rating is claimed. The static checks do not establish resistance to all attacks.
