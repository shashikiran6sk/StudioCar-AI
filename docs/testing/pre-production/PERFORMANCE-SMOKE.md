# Performance smoke

Exploratory local Chromium homepage navigation-to-heading timings (single warm local run, no production SLO): desktop 833 ms, tablet 362 ms, mobile 115 ms. Widths 1440/768/390 had document scrollWidth equal clientWidth. These are smoke measurements, not capacity or Core Web Vitals certification.

The 20-job synthetic repository/executor test completed in about 1.3 seconds during the first run, including concurrent DB work; it has no real decode/S3/network/Leonardo latency and cannot estimate production batch completion. Existing reservation test atomically reserves 20 images. Submission schedules dispatch with Next after and never synchronously waits on Leonardo.

Browser inventory's broad test timed out at the default 30 seconds under parallel load while navigating to mobile portfolio, then passed unchanged in isolation at 18.9 seconds. Unit suite uses jsdom per file and took about ten minutes locally. Keep both browser outcomes in RETEST-REPORT; do not hide timing sensitivity. Production upload/presign/commit, queue latency, provider duration, Lambda cold start/memory, serverless connection saturation, expected burst/20-image partial SLOs remain BLOCKED.
