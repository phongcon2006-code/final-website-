# Verification

**132 checks pass** across the eleven functional and pixel-rendering suites. All application JavaScript passes syntax checks. The renderer test uses real Skia Canvas pixels, not a browser or a simulated pixel array.

New coverage includes all 18 legacy-ID migrations, six mood mappings, 30 lesson steps, museum progress retention, title-only reference captions, thumbnails-only pickers, full-image selection, viewer Fit/zoom limits, modeled Escape/focus return, image-error recovery, repeated viewer cleanup, immediate in-memory edits with 300ms persistence, single-write stroke completion, flushes on Done/Escape/navigation/export/visibility/pagehide, blocked storage, and lifecycle cleanup.

Cached and original drawing output have identical RGBA pixels for pen, pressure-sensitive translucent brush, eraser, single-point marks, commits, Undo, Redo, Clear, and restored drawings. At 500 strokes / 50,000 saved points and 2,500 strokes / 250,000 saved points, five preview frames make exactly five calls to the stroke renderer, regardless of completed history. A completed stroke is added to the cache once. PNG export remains independent of preview cache contents. All six full photographs and six thumbnails decode at their declared dimensions. This is a workload and pixel-equivalence result; no browser FPS or latency number is claimed.

The six shop thumbnails total **127,711 bytes** and range from 15,240 to 36,013 bytes. Large copies total **1,046,185 bytes**, loaded only for the selected reference/viewer. Museum pickers also use new local thumbnails. Original painting compositions, product backgrounds, and colors are retained.

Run the dependency-free suites from the project root with:

```powershell
Get-ChildItem tools/verify*.cjs | Where-Object Name -notin 'verify-header-layout.cjs','verify-rendering.cjs' | ForEach-Object { node $_.FullName; if ($LASTEXITCODE -ne 0) { throw "Verification failed: $($_.Name)" } }
```

The main VM harnesses execute the actual combined browser script with its final render call suppressed. Focused tests read named sections from the combined script and stylesheet. Resource checks verify that each entry loads only `styles.css` and deferred `app.js`, and that the original section order is preserved. The action harness clears startup preference writes before measuring metadata writes.

Run the extra dependency-free checks with `node tools/verify-reference-workspace.cjs`. To reproduce the optional native raster tests:

```powershell
npm install --prefix .qa/canvas --no-save --package-lock=false --ignore-scripts @napi-rs/canvas
node tools/verify-rendering.cjs
```

The test renderer is isolated in ignored `.qa/`; it is not a website runtime dependency. Exclude `.qa/` from any website distribution.

**Header browser regression:** `node tools/verify-header-layout.cjs <path-to-chrome-headless-shell>` checks 84 real Chromium layouts: all five pages plus index, widths of 320, 390, 768, 1199, 1200, 1440, and 1920px, and normal/larger Aa settings. The centered Studio menu measures 640 × 70 CSS pixels at 1440px and wider; other desktop menus remain 590 × 64px. All use 16px labels, page text still grows to 18px, and the mobile dropdown opens and closes on Escape. Fixtures, the isolated browser profile, and measurements are stored in ignored `.qa/`.

**Consolidation verification:** all 132 functional/pixel checks pass against the combined files. Computed styles and element dimensions match the original five pages at 390px and 1440px. All six local HTML entry points load without script errors; native pointer drawing, PNG download, gallery handoff, and the five printing impressions pass browser smoke checks. The 84 header cases also pass through the existing optional Playwright tooling; measurements are saved in `.qa/consolidated-header-results.json`. The command-line browser runner could not complete in this Windows sandbox, so the latest header run used Playwright with in-process GPU rendering. The stale 640 ? 70 homepage expectation was corrected to the existing 590 ? 64 behavior; no menu styles were changed.

**Other browser acceptance outstanding:** before full visual sign-off, inspect Aa/200% zoom, uncropped photos, portrait compositions, card readability, full viewer sizing, Fit/zoom/touch panning, native Tab containment/Escape return, mobile keyboard, dock clearance, and loaded-image behavior offline. Check real pen/touch input and PNG downloads, then profile actual browser frame timing at the two tested workloads. The header regression does not cover these other interactions.
