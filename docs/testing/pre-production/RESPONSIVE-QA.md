# Responsive QA

Exploratory homepage checked 1440×960, 768×1024 and 390×844 with screenshots and scrollWidth checks: no document horizontal overflow at those widths. Existing browser suite covers sign-in mobile, navigation drawer, inventory/portfolio desktop and mobile, dashboard and profile. Screenshot fixtures are identified in evidence index.

Design comparison uses `docs/design.md` and the original screens; some design text still advertises obsolete FREE 3-image batches while runtime defaults are 5 and 15 lifetime. PlanConfig/runtime are the entitlement source; documentation mismatch is recorded as a product/documentation decision, not repaired during baseline. Unsupported admin/profile/processing/real-upload tablet schedules and real-device keyboard visibility remain BLOCKED.

A screenshot does not establish all interaction states. The baseline inventory timeout occurred late at mobile portfolio navigation; successful isolated retest cannot erase it. Full mobile image-processing golden path and all 776 responsive-related scenarios are not claimed passed.
