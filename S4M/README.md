# Sector4 Motorsport V15 — Performance & Security Review

Based on V14. Original V8 recording, fuel calculator, driver cards and racing content retained.

## Performance work
- Ambient orange trails now have visible, crisp edges and small soft shadows instead of full-screen animated Gaussian blur filters.
- Animation disabled on phones/coarse pointers and on reduced-motion preferences.
- RPM telemetry is refreshed at most ~30 FPS; PCM audio continues uninterrupted.
- Engine waveform only redraws when the displayed progress segment changes, and canvas pixel ratio is capped at 1.5.
- Expensive text blur animation replaced by transform/opacity reveal.
- Audio loads metadata instead of full preload on first visit.

## Security work
- `vercel.json` defines CSP, HSTS, anti-framing protection, MIME sniff protection, referrer and browser feature restrictions.
- Third-party LFM licenses are sandboxed, with scripts and same-origin allowed *inside their external origin*.
- OCR remains an optional external dependency loaded from jsdelivr; assess third-party supply chain risk before production.
- No authentication, payment backend, user accounts or private data stores exist in this static preview. Do not put secrets in frontend files.

## Important limits
- HTTP headers work after Vercel deployment; opening index.html locally does not apply them.
- Browser testing, deployed header checking, performance measurement and external penetration tests are still required.
- LFM sandbox/browser restrictions could affect embedded driver badges; test before deploying.
- Weather OCR may require network endpoints not covered by this CSP; if browser console shows blocked requests, review and explicitly allow only the necessary trusted endpoint.
- Security ratings cannot be guaranteed from code inspection or static tests. Set Vercel GitHub permissions to least privilege, protect production branch, and enable account MFA.


## V16 navigation and deployment
- Added `nav-logo.png`, preserving the S4 symbol on a solid-black background.
- Added muted orange, lime, cool-blue, and social icon tints to the navigation dock.
- Vercel: import the repository as an `Other` framework, use the repository root as Root Directory, and leave the build command empty. `vercel.json` applies security headers on deployment.
- The first deployment should use a preview URL; keep the production domain on the existing Vercel project until approved.
