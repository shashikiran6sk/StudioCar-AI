# Retest report

No application fixes were implemented. All baseline failures remain recorded against the original SHA.

| Scenario | Baseline | Retest | Change |
|---|---|---|---|
| UI-DISC-001 broad inventory browser test | FAIL: 30 s timeout at mobile portfolio navigation | PASS in isolation, 18.9 s | Same source/assertions/default timeout; one worker |
| Full browser regression | 14 PASS / 1 FAIL | See final regression evidence | Same source; serial execution after baseline unit load |
| ASYNC-DISC-002 exhausted published job | FAIL PROCESSING after 24 simulated hours | Remains FAIL | New adversarial reproduction only |
| SEC-DISC-001, SEC-DISC-002, LEONARDO-DISC-001 | FAIL | Remain FAIL in final dedicated reproduction suite | No fixes |
| Known unlabelled ORIGINAL floor-version duplication | Existing expected-failure assertion | Not fixed / FAIL | Expected failure must not be reported as semantic success |

Engine-download/network access, temporary harness config/baseURL errors and an orphan local server port were resolved as test setup issues. They are preserved separately from product defects and never used to claim a feature failed. A PASS on a retest does not replace the first failure or its timing limitation. There are no fix PR references because the user explicitly required baseline only.
