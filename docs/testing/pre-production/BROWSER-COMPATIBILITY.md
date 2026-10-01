# Browser compatibility

Installed engine: Chromium 151.0.7922.173 on Debian GNU/Linux 13. The repository asks for channel chrome; this environment has no Chrome binary at its expected path. A temporary external config uses executablePath `/usr/bin/chromium`, retains existing test assertions and viewport, sets explicit local baseURL/webServer and stores screenshots/reports outside build output.

Baseline: 15 tests, 14 PASS and one inventory timeout FAIL. Unchanged inventory test passed on focused retest (18.9 seconds). Full serial regression status is recorded in evidence and RETEST-REPORT. Adapter/memory images and synthetic sessions do not establish real Google/MSG91, S3 upload or Leonardo browser flows.

Chrome branded distribution, Safari/WebKit, Firefox, Edge, Android device Chrome and iOS Safari were not available/executed. No cross-engine PASS is inferred from Chromium. Real device mobile keyboard, touch/swipe, zoom/screen-reader and download/save interactions need owner/device UAT.
