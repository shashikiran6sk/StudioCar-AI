# Phone OTP — MSG91 OTP Widget

Operational reference for StudioCar AI's phone sign-in. Secret ownership is in
`/docs/security.md`; environment profiles are in `/docs/environments.md`.

## Integration model

StudioCar uses exactly one integration: the **MSG91 OTP Widget Web SDK with a
custom UI** (`initSendOTP({ exposeMethods: true })`). It does not render the
widget's own popup, does not call the widget REST API from the server, and no
longer uses the legacy SendOTP `/api/v5/otp` template API (removed in SC021).

1. The browser reserves a browser-bound, rate-limited challenge:
   `POST /api/auth/phone/start`.
2. The browser calls `window.sendOtp(identifier)`. MSG91 answers
   `{ type: "success", message: <reqId> }`; the form keeps the `reqId`.
3. The person types the code. The browser calls
   `window.verifyOtp(code, success, failure, reqId)`. MSG91 checks the code.
   A wrong code never reaches StudioCar's server.
4. On success MSG91 returns a signed access token. The browser posts it to
   `POST /api/auth/phone/verify` with the challenge id.
5. The server presents the token to
   `control.msg91.com/api/v5/widget/verifyAccessToken` with the server-only
   `MSG91_AUTH_KEY`, requires that it names the claimed handset, and claims
   the token hash so it is single use.
6. Only then does StudioCar sign the person in, or start account setup for an
   unknown number (SC052). A browser claim of success never creates a session.

Resend uses `window.retryOtp(channel, success, failure, reqId)` against the
same `reqId` (see [Resend](#resend)).

## Configuration

| Variable | Where | Purpose |
| --- | --- | --- |
| `PHONE_OTP_DRIVER` | server | `msg91`, or `fake` in the Local profile only |
| `MSG91_WIDGET_ID` | server → browser | Widget id, served by `GET /api/auth/phone/widget` |
| `MSG91_WIDGET_TOKEN` | server → browser | Widget `tokenAuth`, served by the same endpoint |
| `MSG91_AUTH_KEY` | server only | Verifies access tokens; never sent to a browser |
| `MSG91_TIMEOUT_MS` | server | `verifyAccessToken` timeout (default 5 000) |
| `PHONE_OTP_CHALLENGE_TTL_SECONDS` | server | Server challenge lifetime (default 900, max 900) |
| `PHONE_OTP_RATE_LIMIT_WINDOW_SECONDS` | server | Window for the limits below (default 600) |
| `PHONE_OTP_SEND_MAX_PER_PHONE` | server | Challenges per phone per window (default 3) |
| `PHONE_OTP_SEND_MAX_PER_IP` | server | Challenges per IP per window (default 10) |
| `PHONE_OTP_VERIFY_MAX_PER_CHALLENGE` | server | Token submissions per challenge (default 5) |
| `PHONE_OTP_VERIFY_MAX_PER_IP` | server | Token submissions per IP per window (default 30) |
| `PHONE_OTP_DEV_CODE` | server | The code the Local `fake` driver accepts |

The challenge lifetime must not be shorter than the widget's OTP expiry.
Otherwise StudioCar would refuse a code MSG91 still accepts. The 900-second
default matches the widget's 15-minute expiry, so MSG91 stays the effective
authority on code expiry.

### Widget configuration

Read from `widget/getWidgetProcess` on 2026-09-25. The form reads the same
values at runtime through `window.getWidgetData()` rather than copying them:

| Setting | Value |
| --- | --- |
| Widget type | **Custom** (`widgetType.value = "2"`) |
| Process type | Both (mobile and email) |
| OTP length | 6 — drives the input length and the Verify button |
| OTP expiry (`expiryTime`) | 15 minutes |
| Resend delay (`retryTime`) | 60 seconds — drives the resend countdown |
| Resend count (`retryCount`) | 2 |
| Captcha (`captchaValidations`) | **Off** |
| Primary channel | SMS (`11`) |
| Resend channels | SMS (`11`), WhatsApp (`12`), Voice (`4`), Email (`3`) |
| SMS template | **MSG91 default** — every process has `use_default: true` and no `templateId` |

## Error mapping

MSG91 publishes no error table for the widget endpoints: the verify page's
sample response is `null`. Every mapping below comes from live responses
recorded on 2026-09-25. Refusals arrive as **HTTP 200** with
`{ type: "error", message, code }`. When the widget's own HTTP request fails,
the failure callback receives a list of strings such as
`["Something went wrong."]`.

| Operation | MSG91 response | Internal category | User message |
| --- | --- | --- | --- |
| verify | `705` `invalid otp` | `INVALID_OTP` | The verification code you entered is incorrect. Please try again. |
| verify | `704` `verification limit exceeded` | `TOO_MANY_ATTEMPTS` | Too many incorrect verification attempts. Please request a new code and try again. |
| resend | `704` `wait N seconds to retry.` | `RATE_LIMITED` (wait = N) | Too many OTP requests. Please wait before requesting another code. |
| verify, resend | `709` `no request found` | `OTP_SESSION_EXPIRED` | This verification session has ended. Request a new code to continue. |
| any | `708` `error fetching records` | `INVALID_REQUEST` | We couldn't process that verification request. Request a new code and try again. |
| any | `status: "fail"`, no code (e.g. `reqId is required.`) | `INVALID_REQUEST` | as above |
| any | widget argument check (`Channel not provided in retryOtp() method.`) | `INVALID_REQUEST` | as above |
| any | `["Something went wrong."]` (HTTP failure) | `NETWORK_ERROR` | We couldn't verify your code right now. Please try again. |
| any | no answer within 20 s, or widget never started | `SERVICE_UNAVAILABLE` | We couldn't verify your code right now. Please try again. |
| any | any other code | `UNKNOWN_PROVIDER_ERROR` | Verification didn't complete. Request a new code and try again. |

On send or resend, an availability failure says "We couldn't send a
verification code right now." The same `704` code means different things per
operation, so the mapping is keyed on operation *and* code
(`msg91-otp-error.constants.ts`).

**Expired code.** The provider response for a code past MSG91's 15-minute
expiry was not observed, so no MSG91 code is mapped to `OTP_EXPIRED` yet; an
unseen code is reported as `UNKNOWN_PROVIDER_ERROR`, never as an outage.
StudioCar's own expired challenge returns `OTP_EXPIRED` from the server. Once
the MSG91 code is confirmed (see [Log verification](#log-verification)), add
it to the verify table.

The server answers its own refusals distinctly as well:

| Server condition | HTTP | Message |
| --- | --- | --- |
| Token rejected, wrong handset, or replayed | 400 | The verification code you entered is incorrect. Please try again. |
| Challenge expired | 400 | This verification code has expired. Request a new code to continue. |
| Challenge unknown or already used | 400 | This verification session has ended. Request a new code to continue. |
| Per-challenge submission cap | 429 | Too many incorrect verification attempts. Please request a new code and try again. |
| Per-phone or per-IP challenge limit | 429 | Too many OTP requests. Please wait before requesting another code. |
| Per-IP verification limit | 429 | Too many verification attempts. Please try again later. |
| `verifyAccessToken` unreachable | 503 | We couldn't verify your code right now. Please try again. |
| Unexpected failure | 503 | Phone verification is temporarily unavailable. Please try again. |

## Attempt policy

**MSG91 (authoritative).** Observed: three wrong codes against one `reqId`
return `705`; the fourth and every later verify, *including a correct code*,
returns `704 verification limit exceeded`. The limit is per `reqId`: a new
`sendOtp` starts a new request. The widget configuration exposes no attempt
setting, and MSG91 does not document one, so whether it is configurable is
unknown. The lock was still in place about two minutes later; whether it
lifts before the 15-minute expiry is unknown. Whether `retryOtp` on a locked
`reqId` resets the count was not observed. For that reason StudioCar starts a
**new** request after `TOO_MANY_ATTEMPTS`, `OTP_EXPIRED` or
`OTP_SESSION_EXPIRED`, instead of retrying a request that can no longer
succeed.

**StudioCar.** No browser-side attempt counter is added. The code is checked
between the browser and MSG91, so a counter the browser reports could not be
enforced — an attacker would simply not report. The enforceable server-side
limits already exist and are StudioCar security policy, not MSG91 limits:
5 token submissions per challenge, 30 per IP per window, 3 challenges per
phone and 10 per IP per window. They are stored in PostgreSQL, expire with the
window, and are bounded by the lifecycle cleanup.

## Resend

- The widget is **Custom**. The provider script requires an explicit channel
  for `retryOtp` on Custom widgets, and *throws* when given `null`. Before
  this fix StudioCar passed `null`, so every resend threw and silently fell
  back to a brand-new `sendOtp` — bypassing the resend count. Resend now passes
  the widget's SMS resend channel (`11`), or the first configured resend
  channel, together with the current `reqId`. A Default widget gets `null`, as
  MSG91 documents.
- A resend is never converted into a fresh send on failure. A new request is
  started only when the current one can no longer be verified, or when the
  widget has no resend channel.
- The resend button counts down from MSG91's `retryTime` (60 s), or from the
  wait MSG91 returns (`wait N seconds`). The 30-second fallback applies only
  when the widget reports no delay (the Local fake driver). The countdown is a
  courtesy; MSG91 and the server limits enforce.
- A third resend beyond `retryCount` (2) was not observed. With
  `exposeMethods` the widget script does not enforce `retryCount` itself;
  whatever MSG91 returns is shown as its category, or as unknown.

## Throttling

Request throttling and verification attempts are separate:

- *Requests* (send/resend): MSG91's resend delay (`704` on resend) and
  StudioCar's per-phone/per-IP challenge limits → `RATE_LIMITED`.
- *Verification*: MSG91's three-per-request limit → `TOO_MANY_ATTEMPTS`;
  StudioCar's per-IP verification limit → "Too many verification attempts.
  Please try again later."

The widget token is public by design, so anyone can call MSG91's `sendOtp`
for this widget directly and skip `/api/auth/phone/start`. Controls against
that live in MSG91: the widget's domain allow-list, captcha (**currently
off**), and the OTP security/throttle settings. Those security settings are
not readable through the widget API and should be reviewed in the dashboard.

## SMS template

**Root cause of the "Team Dashanan" message.** The widget's SMS send and SMS
resend processes are configured with `use_default: true` and no template.
MSG91 therefore sends its own shared default template from its default
sender. The text is not in this repository or in any StudioCar setting, and
the Next.js application must not supply an SMS body: the widget owns the
message.

**Branding requires a custom template.** MSG91's default template cannot carry
StudioCar branding. MSG91 documents that its default template and sender need
no DLT registration and are billed to the OTP Widget subscription. A custom
template or sender is billed to the SMS wallet instead, and in India requires
DLT registration.

The final template (MSG91's documented OTP placeholder is `##OTP##`):

```text
Your StudioCar AI verification code is ##OTP##. Do not share this code with anyone.
```

Dashboard and DLT steps:

1. **DLT (India).** On a DLT operator portal, register the principal entity,
   a sender header (for example `STDCAR`), and a content template in the
   service/OTP category with the same wording. DLT portals use their own
   variable token (commonly `{#var#}`) in place of `##OTP##`; confirm it on
   the chosen portal. Record the entity id and the DLT template id.
2. **MSG91 → sender ID.** Add the approved header with its DLT entity id.
3. **MSG91 → OTP → Templates → Add template.** Enter the text above with
   `##OTP##`, choose the sender, add the DLT template id, and save.
4. **MSG91 → OTP Widget → this widget.** On the SMS send process *and* the
   SMS resend process, turn off the default template and select the new one.
   Save.
5. **Verify.** `getWidgetData()` should show `use_default: false` and the
   template id on both SMS processes. Send one code and read the SMS.

Until this is done, the message keeps MSG91's default wording. No application
change is needed when it is done.

## Observability

- **Browser (development builds only).** Every widget refusal logs
  `MSG91 OTP widget call failed` with the method, category, provider code,
  type, status and message, whether it was a transport failure, and the
  `reqId`. Nothing is logged in production builds. The typed code, access
  tokens, the widget token and the auth key are never copied out of the
  failure.
- **Server.** Every refused verification emits the structured event
  `phone_otp_verification_refused` with a bounded `Reason`
  (`provider_rejected`, `identifier_mismatch`, `token_replayed`,
  `provider_unavailable`, `challenge_expired`, `too_many_attempts`,
  `rate_limited`, `invalid_challenge`) and the metric
  `PhoneOtpVerificationRefused`. No phone number, token, key or cookie is in
  the event.

## Log verification

In the MSG91 dashboard, open **OTP → Widget → Logs** for the widget and open
the individual channel request to see its details. For a test sign-in, confirm
against the browser log's `reqId`:

- the OTP was sent, and on which channel;
- each verification attempt and its failure reason (`invalid otp`,
  `verification limit exceeded`);
- resend count and channel;
- final verification status, and whether the access token was verified.

A successful sign-in has a matching server-side `verifyAccessToken` call and
no `phone_otp_verification_refused` event. Two things should be confirmed this
way and then recorded in the error mapping: the code MSG91 returns for an
expired OTP, and whether `retryOtp` resets the attempt count.
