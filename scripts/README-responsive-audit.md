# P3.2 responsive audit

Run `npm run audit:responsive` from the repository root. The script launches the existing Vite server and installed Chrome in headless mode. Set `CHROME_PATH` if Chrome is installed elsewhere. Node 24 or later is required for its built-in WebSocket client. Local loopback connections to ports 4179 and 9228 must be permitted.

Results are written to the ignored `audit-output/p3.2/` directory: `report.md`, machine-readable `report.json`, 12 full-page screenshots, 12 hero screenshots, and a WebGL fallback screenshot. Each run replaces files with the same names. The Chrome profile in that directory is temporary browser state.

The suite records geometry, horizontal overflow, console errors, HTTP errors and failed requests. It checks a simulated touch scroll on the globe, the Explore Event target height, menu opening and closing, reduced-motion CSS, and the simulated WebGL fallback. A synthetic horizontal drag is dispatched but rotation is marked unverified because the scene exposes no stable rotation value. Browser emulation does not establish physical-device behavior.

No visual regression score is generated without an independently approved P3.1 baseline. The 1440 × 900 screenshot is available for comparison when one is supplied.
