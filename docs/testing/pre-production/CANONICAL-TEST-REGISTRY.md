# Canonical test registry

All 776 scenarios are preserved from the user-supplied request. IDs use the requested category prefix and a zero-padded local sequence. Numbering spans 1–776 without duplicates or gaps. Results and evidence are separate in `results.json`; an accounted BLOCKED row is not an executed test.

| Number | ID | Category | Scenario |
|---|---|---|---|
| 1 | PUBLIC-001 | PUBLIC APPLICATION | Homepage loads without authentication. |
| 2 | PUBLIC-002 | PUBLIC APPLICATION | Public navigation works. |
| 3 | PUBLIC-003 | PUBLIC APPLICATION | Sign-in entry points work. |
| 4 | PUBLIC-004 | PUBLIC APPLICATION | Pricing/plans display current correct information. |
| 5 | PUBLIC-005 | PUBLIC APPLICATION | Public plan descriptions match actual backend entitlements. |
| 6 | PUBLIC-006 | PUBLIC APPLICATION | Invalid route uses StudioCar custom 404. |
| 7 | PUBLIC-007 | PUBLIC APPLICATION | Backend failure uses intended error experience. |
| 8 | PUBLIC-008 | PUBLIC APPLICATION | Public pages expose no authenticated-user data. |
| 9 | PUBLIC-009 | PUBLIC APPLICATION | Public pages expose no environment secrets. |
| 10 | PUBLIC-010 | PUBLIC APPLICATION | Homepage works desktop. |
| 11 | PUBLIC-011 | PUBLIC APPLICATION | Homepage works tablet. |
| 12 | PUBLIC-012 | PUBLIC APPLICATION | Homepage works mobile. |
| 13 | PUBLIC-013 | PUBLIC APPLICATION | Public metadata is correct. |
| 14 | PUBLIC-014 | PUBLIC APPLICATION | Favicon/social metadata work. |
| 15 | PUBLIC-015 | PUBLIC APPLICATION | Public navigation does not accidentally expose Admin routes. |
| 16 | GOOGLE-001 | GOOGLE AUTHENTICATION | New user signs in through Google successfully. |
| 17 | GOOGLE-002 | GOOGLE AUTHENTICATION | Existing Google user signs in successfully. |
| 18 | GOOGLE-003 | GOOGLE AUTHENTICATION | Google identity maps to correct existing user. |
| 19 | GOOGLE-004 | GOOGLE AUTHENTICATION | Repeated Google login does not create duplicate user. |
| 20 | GOOGLE-005 | GOOGLE AUTHENTICATION | OAuth state validation works. |
| 21 | GOOGLE-006 | GOOGLE AUTHENTICATION | OIDC nonce/state protections work where implemented. |
| 22 | GOOGLE-007 | GOOGLE AUTHENTICATION | Invalid callback rejected. |
| 23 | GOOGLE-008 | GOOGLE AUTHENTICATION | Expired callback/code handled safely. |
| 24 | GOOGLE-009 | GOOGLE AUTHENTICATION | User cancelling Google auth returns recoverable UX. |
| 25 | GOOGLE-010 | GOOGLE AUTHENTICATION | Google provider error handled gracefully. |
| 26 | GOOGLE-011 | GOOGLE AUTHENTICATION | Google email verification requirements enforced where intended. |
| 27 | GOOGLE-012 | GOOGLE AUTHENTICATION | Google account cannot access another user's data. |
| 28 | GOOGLE-013 | GOOGLE AUTHENTICATION | Google login creates intended session. |
| 29 | GOOGLE-014 | GOOGLE AUTHENTICATION | Logout invalidates session. |
| 30 | GOOGLE-015 | GOOGLE AUTHENTICATION | Logout-all behavior works if supported. |
| 31 | GOOGLE-016 | GOOGLE AUTHENTICATION | Expired session handled safely. |
| 32 | GOOGLE-017 | GOOGLE AUTHENTICATION | Multiple browser tabs use consistent identity. |
| 33 | GOOGLE-018 | GOOGLE AUTHENTICATION | Google OAuth production callback configuration correct. |
| 34 | PHONE-001 | PHONE OTP AUTHENTICATION | New phone number starts OTP flow. |
| 35 | PHONE-002 | PHONE OTP AUTHENTICATION | Existing phone user starts OTP flow. |
| 36 | PHONE-003 | PHONE OTP AUTHENTICATION | Valid OTP authenticates existing user. |
| 37 | PHONE-004 | PHONE OTP AUTHENTICATION | Invalid OTP rejected. |
| 38 | PHONE-005 | PHONE OTP AUTHENTICATION | Expired OTP rejected. |
| 39 | PHONE-006 | PHONE OTP AUTHENTICATION | Used OTP cannot replay. |
| 40 | PHONE-007 | PHONE OTP AUTHENTICATION | OTP attempt limit enforced. |
| 41 | PHONE-008 | PHONE OTP AUTHENTICATION | OTP resend limit enforced. |
| 42 | PHONE-009 | PHONE OTP AUTHENTICATION | Rate limiting protects OTP endpoint. |
| 43 | PHONE-010 | PHONE OTP AUTHENTICATION | OTP provider failure gives recoverable UX. |
| 44 | PHONE-011 | PHONE OTP AUTHENTICATION | OTP timeout does not create partial login. |
| 45 | PHONE-012 | PHONE OTP AUTHENTICATION | Refresh during OTP remains safe. |
| 46 | PHONE-013 | PHONE OTP AUTHENTICATION | Browser Back during OTP remains safe. |
| 47 | PHONE-014 | PHONE OTP AUTHENTICATION | Multiple OTP requests cannot authenticate wrong challenge. |
| 48 | PHONE-015 | PHONE OTP AUTHENTICATION | Concurrent OTP verification remains safe. |
| 49 | PHONE-016 | PHONE OTP AUTHENTICATION | Verified phone maps to correct user. |
| 50 | PHONE-017 | PHONE OTP AUTHENTICATION | Phone login does not create duplicate existing user. |
| 51 | PHONE-018 | PHONE OTP AUTHENTICATION | Session created correctly. |
| 52 | PHONE-019 | PHONE OTP AUTHENTICATION | Logout invalidates phone-auth session. |
| 53 | PHONE-020 | PHONE OTP AUTHENTICATION | Production OTP configuration uses intended provider/channel. |
| 54 | PHONE-021 | PHONE OTP AUTHENTICATION | Local bypass cannot operate accidentally in production. |
| 55 | PHONE-022 | PHONE OTP AUTHENTICATION | Phone identity cannot access another user's resources. |
| 56 | PHONE-CREATE-001 | PHONE-FIRST ACCOUNT CREATION | New verified phone user is shown intended post-verification choices. |
| 57 | PHONE-CREATE-002 | PHONE-FIRST ACCOUNT CREATION | User can choose Link Google. |
| 58 | PHONE-CREATE-003 | PHONE-FIRST ACCOUNT CREATION | User can choose Create Account. |
| 59 | PHONE-CREATE-004 | PHONE-FIRST ACCOUNT CREATION | Create Account requires intended name fields only. |
| 60 | PHONE-CREATE-005 | PHONE-FIRST ACCOUNT CREATION | Verified phone remains associated with created account. |
| 61 | PHONE-CREATE-006 | PHONE-FIRST ACCOUNT CREATION | Account creation does not request OTP again unnecessarily. |
| 62 | PHONE-CREATE-007 | PHONE-FIRST ACCOUNT CREATION | Refresh during account creation is safe. |
| 63 | PHONE-CREATE-008 | PHONE-FIRST ACCOUNT CREATION | Duplicate submission does not create duplicate users. |
| 64 | PHONE-CREATE-009 | PHONE-FIRST ACCOUNT CREATION | Invalid name/input rejected. |
| 65 | PHONE-CREATE-010 | PHONE-FIRST ACCOUNT CREATION | Direct API cannot create account without valid phone verification. |
| 66 | PHONE-CREATE-011 | PHONE-FIRST ACCOUNT CREATION | Verification token/challenge cannot be reused for another phone. |
| 67 | PHONE-CREATE-012 | PHONE-FIRST ACCOUNT CREATION | Created account receives FREE/default plan correctly. |
| 68 | PHONE-CREATE-013 | PHONE-FIRST ACCOUNT CREATION | Created account can access dashboard/inventory. |
| 69 | PHONE-CREATE-014 | PHONE-FIRST ACCOUNT CREATION | Created account can later link Google. |
| 70 | PHONE-CREATE-015 | PHONE-FIRST ACCOUNT CREATION | Logout/login through phone returns same account. |
| 71 | LINK-PHONE-001 | GOOGLE-FIRST PHONE LINKING | Google-created user opens Profile. |
| 72 | LINK-PHONE-002 | GOOGLE-FIRST PHONE LINKING | User starts phone-linking flow. |
| 73 | LINK-PHONE-003 | GOOGLE-FIRST PHONE LINKING | Valid OTP links phone. |
| 74 | LINK-PHONE-004 | GOOGLE-FIRST PHONE LINKING | Invalid OTP rejected. |
| 75 | LINK-PHONE-005 | GOOGLE-FIRST PHONE LINKING | Expired OTP rejected. |
| 76 | LINK-PHONE-006 | GOOGLE-FIRST PHONE LINKING | Phone is not linked before verification succeeds. |
| 77 | LINK-PHONE-007 | GOOGLE-FIRST PHONE LINKING | Linked phone appears correctly in Profile. |
| 78 | LINK-PHONE-008 | GOOGLE-FIRST PHONE LINKING | User can later sign in through linked phone. |
| 79 | LINK-PHONE-009 | GOOGLE-FIRST PHONE LINKING | Phone login resolves same user as Google. |
| 80 | LINK-PHONE-010 | GOOGLE-FIRST PHONE LINKING | Linking does not create duplicate account. |
| 81 | LINK-PHONE-011 | GOOGLE-FIRST PHONE LINKING | Linking phone already owned by same user behaves safely. |
| 82 | LINK-PHONE-012 | GOOGLE-FIRST PHONE LINKING | Linking phone owned by another account is prevented or follows explicitly designed merge policy. |
| 83 | LINK-PHONE-013 | GOOGLE-FIRST PHONE LINKING | User cannot steal another account's phone through direct API. |
| 84 | LINK-PHONE-014 | GOOGLE-FIRST PHONE LINKING | Concurrent linking attempts remain safe. |
| 85 | LINK-PHONE-015 | GOOGLE-FIRST PHONE LINKING | Refresh during linking does not create partial link. |
| 86 | LINK-PHONE-016 | GOOGLE-FIRST PHONE LINKING | OTP replay cannot link phone again to another account. |
| 87 | LINK-PHONE-017 | GOOGLE-FIRST PHONE LINKING | Account's subscription/inventory/jobs remain unchanged after linking. |
| 88 | LINK-PHONE-018 | GOOGLE-FIRST PHONE LINKING | Audit/security records capture important identity linking where implemented. |
| 89 | LINK-GOOGLE-001 | PHONE-FIRST GOOGLE LINKING | Phone-created user can initiate Google linking. |
| 90 | LINK-GOOGLE-002 | PHONE-FIRST GOOGLE LINKING | Correct Google account links successfully. |
| 91 | LINK-GOOGLE-003 | PHONE-FIRST GOOGLE LINKING | Linked Google appears in Profile. |
| 92 | LINK-GOOGLE-004 | PHONE-FIRST GOOGLE LINKING | User can later login through Google. |
| 93 | LINK-GOOGLE-005 | PHONE-FIRST GOOGLE LINKING | Google login resolves same user as phone. |
| 94 | LINK-GOOGLE-006 | PHONE-FIRST GOOGLE LINKING | Linking does not create duplicate user. |
| 95 | LINK-GOOGLE-007 | PHONE-FIRST GOOGLE LINKING | Google identity already linked to same account handled safely. |
| 96 | LINK-GOOGLE-008 | PHONE-FIRST GOOGLE LINKING | Google identity belonging to another account is prevented or follows explicit merge policy. |
| 97 | LINK-GOOGLE-009 | PHONE-FIRST GOOGLE LINKING | User cannot take over another account through Google linking. |
| 98 | LINK-GOOGLE-010 | PHONE-FIRST GOOGLE LINKING | OAuth state protections apply to linking. |
| 99 | LINK-GOOGLE-011 | PHONE-FIRST GOOGLE LINKING | Cancelling Google linking leaves account intact. |
| 100 | LINK-GOOGLE-012 | PHONE-FIRST GOOGLE LINKING | Google provider failure leaves account intact. |
| 101 | LINK-GOOGLE-013 | PHONE-FIRST GOOGLE LINKING | Refresh during linking remains safe. |
| 102 | LINK-GOOGLE-014 | PHONE-FIRST GOOGLE LINKING | Concurrent linking requests remain safe. |
| 103 | LINK-GOOGLE-015 | PHONE-FIRST GOOGLE LINKING | Subscription remains attached to same user. |
| 104 | LINK-GOOGLE-016 | PHONE-FIRST GOOGLE LINKING | Vehicles remain attached to same user. |
| 105 | LINK-GOOGLE-017 | PHONE-FIRST GOOGLE LINKING | Processing history remains attached to same user. |
| 106 | LINK-GOOGLE-018 | PHONE-FIRST GOOGLE LINKING | Phone login continues working after Google linking. |
| 107 | IDENTITY-001 | IDENTITY COLLISION / ACCOUNT LINKING | Google Account A cannot link Phone B belonging to Account B without explicit safe merge behavior. |
| 108 | IDENTITY-002 | IDENTITY COLLISION / ACCOUNT LINKING | Phone Account A cannot link Google B belonging to Account B without explicit safe merge behavior. |
| 109 | IDENTITY-003 | IDENTITY COLLISION / ACCOUNT LINKING | Linking never silently overwrites identity ownership. |
| 110 | IDENTITY-004 | IDENTITY COLLISION / ACCOUNT LINKING | Linking never silently moves subscription between users. |
| 111 | IDENTITY-005 | IDENTITY COLLISION / ACCOUNT LINKING | Linking never silently moves vehicles between users. |
| 112 | IDENTITY-006 | IDENTITY COLLISION / ACCOUNT LINKING | Linking never silently moves processing jobs between users. |
| 113 | IDENTITY-007 | IDENTITY COLLISION / ACCOUNT LINKING | Linking never silently loses account data. |
| 114 | IDENTITY-008 | IDENTITY COLLISION / ACCOUNT LINKING | Simultaneous linking from two sessions remains safe. |
| 115 | IDENTITY-009 | IDENTITY COLLISION / ACCOUNT LINKING | Logout/login through either linked identity resolves same canonical user. |
| 116 | IDENTITY-010 | IDENTITY COLLISION / ACCOUNT LINKING | Unlinking behavior, if supported, never leaves account inaccessible. |
| 117 | IDENTITY-011 | IDENTITY COLLISION / ACCOUNT LINKING | Last authentication method cannot be removed if that would orphan account. |
| 118 | IDENTITY-012 | IDENTITY COLLISION / ACCOUNT LINKING | Direct API cannot manipulate provider subject IDs. |
| 119 | IDENTITY-013 | IDENTITY COLLISION / ACCOUNT LINKING | Direct API cannot manipulate verified phone ownership. |
| 120 | IDENTITY-014 | IDENTITY COLLISION / ACCOUNT LINKING | Duplicate provider identities prevented at DB level. |
| 121 | IDENTITY-015 | IDENTITY COLLISION / ACCOUNT LINKING | Duplicate verified-phone ownership prevented at DB level where required. |
| 122 | IDENTITY-016 | IDENTITY COLLISION / ACCOUNT LINKING | Session identity remains canonical after linking. |
| 123 | IDENTITY-017 | IDENTITY COLLISION / ACCOUNT LINKING | Existing processing session survives safe linking appropriately. |
| 124 | IDENTITY-018 | IDENTITY COLLISION / ACCOUNT LINKING | Identity-linking failure is observable without leaking secrets. |
| 125 | PROFILE-001 | PROFILE | User can open Profile. |
| 126 | PROFILE-002 | PROFILE | Correct name displayed. |
| 127 | PROFILE-003 | PROFILE | Correct email displayed where available. |
| 128 | PROFILE-004 | PROFILE | Correct phone displayed where available. |
| 129 | PROFILE-005 | PROFILE | Linked-auth state displayed correctly. |
| 130 | PROFILE-006 | PROFILE | User updates permitted profile fields. |
| 131 | PROFILE-007 | PROFILE | Invalid profile data rejected. |
| 132 | PROFILE-008 | PROFILE | User cannot modify subscription directly through profile API. |
| 133 | PROFILE-009 | PROFILE | User cannot modify another user's profile. |
| 134 | PROFILE-010 | PROFILE | Direct payload cannot change user ID/auth provider ownership. |
| 135 | PROFILE-011 | PROFILE | Profile works mobile. |
| 136 | PROFILE-012 | PROFILE | Profile changes survive logout/login. |
| 137 | PLAN-001 | PLANS / ENTITLEMENTS | New user receives correct default FREE plan. |
| 138 | PLAN-002 | PLANS / ENTITLEMENTS | FREE plan UI correctly identified. |
| 139 | PLAN-003 | PLANS / ENTITLEMENTS | PRO plan UI correctly identified. |
| 140 | PLAN-004 | PLANS / ENTITLEMENTS | PLUS plan UI correctly identified. |
| 141 | PLAN-005 | PLANS / ENTITLEMENTS | Backend entitlement matches FREE UI. |
| 142 | PLAN-006 | PLANS / ENTITLEMENTS | Backend entitlement matches PRO UI. |
| 143 | PLAN-007 | PLANS / ENTITLEMENTS | Backend entitlement matches PLUS UI. |
| 144 | PLAN-008 | PLANS / ENTITLEMENTS | FREE processing follows current limits. |
| 145 | PLAN-009 | PLANS / ENTITLEMENTS | PRO processing follows current limits. |
| 146 | PLAN-010 | PLANS / ENTITLEMENTS | PLUS processing follows current limits. |
| 147 | PLAN-011 | PLANS / ENTITLEMENTS | FREE receives only permitted preview-quality access. |
| 148 | PLAN-012 | PLANS / ENTITLEMENTS | PRO receives intended high-quality access. |
| 149 | PLAN-013 | PLANS / ENTITLEMENTS | PLUS receives intended high-quality access. |
| 150 | PLAN-014 | PLANS / ENTITLEMENTS | FREE cannot manipulate API to request PRO/PLUS entitlement. |
| 151 | PLAN-015 | PLANS / ENTITLEMENTS | FREE cannot manipulate frontend state to unlock HQ. |
| 152 | PLAN-016 | PLANS / ENTITLEMENTS | FREE cannot obtain HQ object through predictable S3 URL. |
| 153 | PLAN-017 | PLANS / ENTITLEMENTS | FREE cannot access HQ object through another endpoint. |
| 154 | PLAN-018 | PLANS / ENTITLEMENTS | User cannot modify own plan through API. |
| 155 | PLAN-019 | PLANS / ENTITLEMENTS | Subscription changes propagate correctly to entitlement checks. |
| 156 | PLAN-020 | PLANS / ENTITLEMENTS | Downgrade behavior follows explicit policy. |
| 157 | PLAN-021 | PLANS / ENTITLEMENTS | Upgrade behavior follows explicit policy. |
| 158 | PLAN-022 | PLANS / ENTITLEMENTS | Expired subscription behavior follows explicit policy. |
| 159 | PLAN-023 | PLANS / ENTITLEMENTS | Plan change does not destroy historical processed images unexpectedly. |
| 160 | PLAN-024 | PLANS / ENTITLEMENTS | Plan entitlement is enforced server-side, not only UI. |
| 161 | ADMIN-PLAN-001 | ADMIN SUBSCRIPTION MANAGEMENT | Admin can access subscription-management functionality. |
| 162 | ADMIN-PLAN-002 | ADMIN SUBSCRIPTION MANAGEMENT | Normal user cannot access it. |
| 163 | ADMIN-PLAN-003 | ADMIN SUBSCRIPTION MANAGEMENT | FREE user cannot access it. |
| 164 | ADMIN-PLAN-004 | ADMIN SUBSCRIPTION MANAGEMENT | PRO user cannot access Admin functionality merely because subscribed. |
| 165 | ADMIN-PLAN-005 | ADMIN SUBSCRIPTION MANAGEMENT | PLUS user cannot access Admin functionality. |
| 166 | ADMIN-PLAN-006 | ADMIN SUBSCRIPTION MANAGEMENT | Admin can assign intended PRO subscription. |
| 167 | ADMIN-PLAN-007 | ADMIN SUBSCRIPTION MANAGEMENT | Admin can assign intended PLUS subscription. |
| 168 | ADMIN-PLAN-008 | ADMIN SUBSCRIPTION MANAGEMENT | Assignment updates user's entitlement. |
| 169 | ADMIN-PLAN-009 | ADMIN SUBSCRIPTION MANAGEMENT | Repeated assignment does not create invalid duplicate subscription state. |
| 170 | ADMIN-PLAN-010 | ADMIN SUBSCRIPTION MANAGEMENT | Invalid plan assignment rejected. |
| 171 | ADMIN-PLAN-011 | ADMIN SUBSCRIPTION MANAGEMENT | Non-admin direct API assignment rejected. |
| 172 | ADMIN-PLAN-012 | ADMIN SUBSCRIPTION MANAGEMENT | Subscription changes audit logged where implemented. |
| 173 | ADMIN-PLAN-013 | ADMIN SUBSCRIPTION MANAGEMENT | User processing behavior reflects changed plan. |
| 174 | ADMIN-PLAN-014 | ADMIN SUBSCRIPTION MANAGEMENT | Subscription change does not corrupt user history. |
| 175 | VEHICLE-001 | VEHICLE / INVENTORY | User creates vehicle/inventory record through intended flow. |
| 176 | VEHICLE-002 | VEHICLE / INVENTORY | Vehicle belongs to correct user. |
| 177 | VEHICLE-003 | VEHICLE / INVENTORY | User sees own vehicles. |
| 178 | VEHICLE-004 | VEHICLE / INVENTORY | User cannot see another user's private vehicles. |
| 179 | VEHICLE-005 | VEHICLE / INVENTORY | Vehicle search works. |
| 180 | VEHICLE-006 | VEHICLE / INVENTORY | Inventory pagination works where applicable. |
| 181 | VEHICLE-007 | VEHICLE / INVENTORY | Vehicle metadata saves correctly. |
| 182 | VEHICLE-008 | VEHICLE / INVENTORY | Invalid metadata rejected. |
| 183 | VEHICLE-009 | VEHICLE / INVENTORY | Duplicate operations do not create unintended duplicate vehicle. |
| 184 | VEHICLE-010 | VEHICLE / INVENTORY | User can update permitted vehicle fields. |
| 185 | VEHICLE-011 | VEHICLE / INVENTORY | User cannot reassign vehicle to another user. |
| 186 | VEHICLE-012 | VEHICLE / INVENTORY | User removes vehicle according to current lifecycle. |
| 187 | VEHICLE-013 | VEHICLE / INVENTORY | Vehicle removal handles associated uploads correctly. |
| 188 | VEHICLE-014 | VEHICLE / INVENTORY | Vehicle removal handles processed outputs correctly. |
| 189 | VEHICLE-015 | VEHICLE / INVENTORY | Vehicle removal handles processing history according to policy. |
| 190 | VEHICLE-016 | VEHICLE / INVENTORY | Vehicle deletion during active processing follows defined policy. |
| 191 | VEHICLE-017 | VEHICLE / INVENTORY | Direct URL/API to another user's vehicle denied. |
| 192 | VEHICLE-018 | VEHICLE / INVENTORY | Inventory empty state works. |
| 193 | VEHICLE-019 | VEHICLE / INVENTORY | Inventory works mobile. |
| 194 | VEHICLE-020 | VEHICLE / INVENTORY | Inventory survives logout/login. |
| 195 | UPLOAD-001 | UPLOAD | User selects valid image. |
| 196 | UPLOAD-002 | UPLOAD | Multiple valid images selected. |
| 197 | UPLOAD-003 | UPLOAD | Intended 20-image batch supported. |
| 198 | UPLOAD-004 | UPLOAD | File-count limit enforced. |
| 199 | UPLOAD-005 | UPLOAD | Supported MIME types accepted. |
| 200 | UPLOAD-006 | UPLOAD | Unsupported MIME type rejected. |
| 201 | UPLOAD-007 | UPLOAD | Oversized image rejected according to limits. |
| 202 | UPLOAD-008 | UPLOAD | Zero-byte/corrupt image handled safely. |
| 203 | UPLOAD-009 | UPLOAD | Non-image masquerading as image rejected where validation supports it. |
| 204 | UPLOAD-010 | UPLOAD | Presign endpoint requires authentication. |
| 205 | UPLOAD-011 | UPLOAD | Presigned URL belongs to correct user/resource. |
| 206 | UPLOAD-012 | UPLOAD | User cannot request presign for another user's resource. |
| 207 | UPLOAD-013 | UPLOAD | Upload to S3 succeeds. |
| 208 | UPLOAD-014 | UPLOAD | Commit after upload succeeds. |
| 209 | UPLOAD-015 | UPLOAD | DB record correctly references uploaded object. |
| 210 | UPLOAD-016 | UPLOAD | Upload success + commit failure remains recoverable. |
| 211 | UPLOAD-017 | UPLOAD | Presign success + no upload leaves cleanup path. |
| 212 | UPLOAD-018 | UPLOAD | Upload succeeds + user closes dialog follows cleanup policy. |
| 213 | UPLOAD-019 | UPLOAD | Upload succeeds + browser refresh remains recoverable. |
| 214 | UPLOAD-020 | UPLOAD | Network interruption during upload handled. |
| 215 | UPLOAD-021 | UPLOAD | Retrying upload does not create unintended duplicates. |
| 216 | UPLOAD-022 | UPLOAD | Duplicate commit handled safely. |
| 217 | UPLOAD-023 | UPLOAD | Upload ordering preserved where required. |
| 218 | UPLOAD-024 | UPLOAD | Image preview corresponds to correct upload. |
| 219 | UPLOAD-025 | UPLOAD | S3 key cannot be manipulated to overwrite another user's object. |
| 220 | UPLOAD-026 | UPLOAD | Private upload object cannot be fetched by another user. |
| 221 | UPLOAD-027 | UPLOAD | Expired presigned URL rejected. |
| 222 | UPLOAD-028 | UPLOAD | Presigned URL permissions are appropriately scoped. |
| 223 | UPLOAD-029 | UPLOAD | Upload metadata cannot mass-assign another user/vehicle. |
| 224 | UPLOAD-030 | UPLOAD | Batch partial upload failure clearly represented. |
| 225 | OPTIONS-001 | PROCESSING DIALOG / OPTIONS | Processing dialog opens for eligible images. |
| 226 | OPTIONS-002 | PROCESSING DIALOG / OPTIONS | Available studio backgrounds load. |
| 227 | OPTIONS-003 | PROCESSING DIALOG / OPTIONS | Available floors load. |
| 228 | OPTIONS-004 | PROCESSING DIALOG / OPTIONS | Background selection persists for submitted job. |
| 229 | OPTIONS-005 | PROCESSING DIALOG / OPTIONS | Floor selection persists for submitted job. |
| 230 | OPTIONS-006 | PROCESSING DIALOG / OPTIONS | Correct background/floor IDs reach worker. |
| 231 | OPTIONS-007 | PROCESSING DIALOG / OPTIONS | Image enhancement toggle follows current implementation. |
| 232 | OPTIONS-008 | PROCESSING DIALOG / OPTIONS | Image enhancement OFF produces intended behavior. |
| 233 | OPTIONS-009 | PROCESSING DIALOG / OPTIONS | Image enhancement ON produces intended behavior. |
| 234 | OPTIONS-010 | PROCESSING DIALOG / OPTIONS | Maintain composition OFF follows intended behavior. |
| 235 | OPTIONS-011 | PROCESSING DIALOG / OPTIONS | Maintain composition ON follows intended behavior. |
| 236 | OPTIONS-012 | PROCESSING DIALOG / OPTIONS | Removed/unsupported options are absent. |
| 237 | OPTIONS-013 | PROCESSING DIALOG / OPTIONS | Invalid background ID rejected. |
| 238 | OPTIONS-014 | PROCESSING DIALOG / OPTIONS | Invalid floor ID rejected. |
| 239 | OPTIONS-015 | PROCESSING DIALOG / OPTIONS | User cannot inject arbitrary S3 asset belonging to another user. |
| 240 | OPTIONS-016 | PROCESSING DIALOG / OPTIONS | Closing dialog before processing does not create job. |
| 241 | OPTIONS-017 | PROCESSING DIALOG / OPTIONS | Reopening dialog maintains intended selection behavior. |
| 242 | OPTIONS-018 | PROCESSING DIALOG / OPTIONS | Dialog works mobile. |
| 243 | PROCESS-001 | PROCESS REQUEST | Single eligible image can be processed. |
| 244 | PROCESS-002 | PROCESS REQUEST | Multiple eligible images can be processed. |
| 245 | PROCESS-003 | PROCESS REQUEST | 20-image batch can be submitted. |
| 246 | PROCESS-004 | PROCESS REQUEST | Clicking Process creates intended DB records. |
| 247 | PROCESS-005 | PROCESS REQUEST | Job records belong to correct user. |
| 248 | PROCESS-006 | PROCESS REQUEST | Job records reference correct source image. |
| 249 | PROCESS-007 | PROCESS REQUEST | Job records contain correct processing options. |
| 250 | PROCESS-008 | PROCESS REQUEST | Process request returns within acceptable submission latency. |
| 251 | PROCESS-009 | PROCESS REQUEST | User is navigated/updated according to current UX. |
| 252 | PROCESS-010 | PROCESS REQUEST | Double-click Process does not create unintended duplicate processing. |
| 253 | PROCESS-011 | PROCESS REQUEST | Network retry does not duplicate job unexpectedly. |
| 254 | PROCESS-012 | PROCESS REQUEST | Browser Back does not resubmit processing. |
| 255 | PROCESS-013 | PROCESS REQUEST | Refresh after submission does not duplicate processing. |
| 256 | PROCESS-014 | PROCESS REQUEST | Same request from two tabs remains safe. |
| 257 | PROCESS-015 | PROCESS REQUEST | User cannot process another user's source image. |
| 258 | PROCESS-016 | PROCESS REQUEST | FREE entitlement enforced at submission. |
| 259 | PROCESS-017 | PROCESS REQUEST | PRO entitlement enforced at submission. |
| 260 | PROCESS-018 | PROCESS REQUEST | PLUS entitlement enforced at submission. |
| 261 | PROCESS-019 | PROCESS REQUEST | Invalid source object rejected. |
| 262 | PROCESS-020 | PROCESS REQUEST | Missing source object handled. |
| 263 | PROCESS-021 | PROCESS REQUEST | Invalid processing options rejected. |
| 264 | PROCESS-022 | PROCESS REQUEST | DB failure during job creation gives no false success. |
| 265 | PROCESS-023 | PROCESS REQUEST | Queue/dispatch failure after DB creation remains recoverable. |
| 266 | PROCESS-024 | PROCESS REQUEST | Partial batch job-creation failure follows defined atomicity policy. |
| 267 | PROCESS-025 | PROCESS REQUEST | Processing submission emits useful request/job IDs. |
| 268 | PROCESS-026 | PROCESS REQUEST | No provider/API secret returned to client. |
| 269 | PROCESS-027 | PROCESS REQUEST | Submission API does not wait unnecessarily for Leonardo completion. |
| 270 | PROCESS-028 | PROCESS REQUEST | Processing batch submission remains responsive under expected batch size. |
| 271 | DISPATCH-001 | OUTBOX / DISPATCH | Newly created process job becomes dispatchable. |
| 272 | DISPATCH-002 | OUTBOX / DISPATCH | Outbox/event record correctly references job. |
| 273 | DISPATCH-003 | OUTBOX / DISPATCH | Dispatcher sends intended SQS message. |
| 274 | DISPATCH-004 | OUTBOX / DISPATCH | SQS message references correct job. |
| 275 | DISPATCH-005 | OUTBOX / DISPATCH | Duplicate dispatcher invocation does not create unsafe duplicate processing. |
| 276 | DISPATCH-006 | OUTBOX / DISPATCH | Dispatch retry is safe. |
| 277 | DISPATCH-007 | OUTBOX / DISPATCH | DB success + SQS failure leaves recoverable dispatch state. |
| 278 | DISPATCH-008 | OUTBOX / DISPATCH | SQS success + dispatcher response failure remains safe. |
| 279 | DISPATCH-009 | OUTBOX / DISPATCH | Dispatcher cannot dispatch another user's fabricated job. |
| 280 | DISPATCH-010 | OUTBOX / DISPATCH | Invalid outbox record handled. |
| 281 | DISPATCH-011 | OUTBOX / DISPATCH | Already-dispatched record not incorrectly reprocessed by dispatcher logic. |
| 282 | DISPATCH-012 | OUTBOX / DISPATCH | Concurrent dispatcher instances remain safe. |
| 283 | DISPATCH-013 | OUTBOX / DISPATCH | EventBridge/internal trigger authentication works where applicable. |
| 284 | DISPATCH-014 | OUTBOX / DISPATCH | Internal dispatch endpoint cannot be publicly abused. |
| 285 | DISPATCH-015 | OUTBOX / DISPATCH | Dispatch metrics/logging emitted. |
| 286 | DISPATCH-016 | OUTBOX / DISPATCH | Failed dispatch observable. |
| 287 | DISPATCH-017 | OUTBOX / DISPATCH | Stuck outbox records can be identified. |
| 288 | DISPATCH-018 | OUTBOX / DISPATCH | Batch dispatch behaves correctly. |
| 289 | DISPATCH-019 | OUTBOX / DISPATCH | Dispatcher failure does not mark image successfully processed. |
| 290 | DISPATCH-020 | OUTBOX / DISPATCH | Dispatch preserves correlation/request/job IDs. |
| 291 | SQS-001 | SQS | Correct message reaches intended queue. |
| 292 | SQS-002 | SQS | Message body validates. |
| 293 | SQS-003 | SQS | Invalid message rejected safely. |
| 294 | SQS-004 | SQS | Duplicate message delivery remains idempotent. |
| 295 | SQS-005 | SQS | Message retry behaves correctly. |
| 296 | SQS-006 | SQS | Visibility timeout supports expected processing duration. |
| 297 | SQS-007 | SQS | Lambda concurrency does not cause duplicate ownership. |
| 298 | SQS-008 | SQS | Poison message does not retry forever without visibility. |
| 299 | SQS-009 | SQS | DLQ behavior works if configured. |
| 300 | SQS-010 | SQS | Failed messages can be diagnosed. |
| 301 | SQS-011 | SQS | Queue permissions restrict unauthorized producers. |
| 302 | SQS-012 | SQS | Queue permissions restrict unauthorized consumers. |
| 303 | SQS-013 | SQS | Message contains no secrets. |
| 304 | SQS-014 | SQS | Message contains only necessary identifiers/options. |
| 305 | SQS-015 | SQS | 20-image batch creates expected queue behavior. |
| 306 | SQS-016 | SQS | SQS redelivery after Lambda timeout remains safe. |
| 307 | SQS-017 | SQS | SQS redelivery after partial processing remains safe. |
| 308 | SQS-018 | SQS | Queue metrics expose backlog/failures. |
| 309 | LAMBDA-001 | LAMBDA WORKER | Worker receives valid job. |
| 310 | LAMBDA-002 | LAMBDA WORKER | Worker loads correct DB job. |
| 311 | LAMBDA-003 | LAMBDA WORKER | Worker loads correct source object. |
| 312 | LAMBDA-004 | LAMBDA WORKER | Worker loads correct processing configuration. |
| 313 | LAMBDA-005 | LAMBDA WORKER | Worker handles FREE job correctly. |
| 314 | LAMBDA-006 | LAMBDA WORKER | Worker handles PRO job correctly. |
| 315 | LAMBDA-007 | LAMBDA WORKER | Worker handles PLUS job correctly. |
| 316 | LAMBDA-008 | LAMBDA WORKER | Worker invokes Leonardo with correct source. |
| 317 | LAMBDA-009 | LAMBDA WORKER | Worker applies correct studio background. |
| 318 | LAMBDA-010 | LAMBDA WORKER | Worker applies correct floor. |
| 319 | LAMBDA-011 | LAMBDA WORKER | Worker applies supported processing toggles correctly. |
| 320 | LAMBDA-012 | LAMBDA WORKER | Worker rejects invalid/non-car input according to current provider/product policy. |
| 321 | LAMBDA-013 | LAMBDA WORKER | Worker handles missing source object. |
| 322 | LAMBDA-014 | LAMBDA WORKER | Worker handles invalid DB job. |
| 323 | LAMBDA-015 | LAMBDA WORKER | Worker cannot process another user's manipulated object reference. |
| 324 | LAMBDA-016 | LAMBDA WORKER | Worker writes correct output. |
| 325 | LAMBDA-017 | LAMBDA WORKER | Output belongs to correct user/job. |
| 326 | LAMBDA-018 | LAMBDA WORKER | DB status updates correctly. |
| 327 | LAMBDA-019 | LAMBDA WORKER | Worker failure updates/retries according to policy. |
| 328 | LAMBDA-020 | LAMBDA WORKER | Lambda timeout remains recoverable. |
| 329 | LAMBDA-021 | LAMBDA WORKER | Lambda crash before provider call remains safe. |
| 330 | LAMBDA-022 | LAMBDA WORKER | Lambda crash after provider call remains safe. |
| 331 | LAMBDA-023 | LAMBDA WORKER | Lambda crash after S3 write but before DB update remains recoverable. |
| 332 | LAMBDA-024 | LAMBDA WORKER | Lambda crash after DB update remains idempotent. |
| 333 | LAMBDA-025 | LAMBDA WORKER | Duplicate Lambda invocation does not produce uncontrolled duplicate output/cost. |
| 334 | LAMBDA-026 | LAMBDA WORKER | Worker temporary files cleaned. |
| 335 | LAMBDA-027 | LAMBDA WORKER | Worker memory use remains acceptable for max batch/image. |
| 336 | LAMBDA-028 | LAMBDA WORKER | Worker package contains only required production dependencies. |
| 337 | LAMBDA-029 | LAMBDA WORKER | Logs contain correlation/job identifiers. |
| 338 | LAMBDA-030 | LAMBDA WORKER | Logs contain no Leonardo/AWS/DB secrets. |
| 339 | LEONARDO-001 | LEONARDO PROVIDER | Valid image successfully processes through Leonardo. |
| 340 | LEONARDO-002 | LEONARDO PROVIDER | Leonardo authentication works. |
| 341 | LEONARDO-003 | LEONARDO PROVIDER | Invalid Leonardo credentials fail safely. |
| 342 | LEONARDO-004 | LEONARDO PROVIDER | Provider timeout handled. |
| 343 | LEONARDO-005 | LEONARDO PROVIDER | Provider 4xx handled. |
| 344 | LEONARDO-006 | LEONARDO PROVIDER | Provider 5xx handled. |
| 345 | LEONARDO-007 | LEONARDO PROVIDER | Rate-limit response handled. |
| 346 | LEONARDO-008 | LEONARDO PROVIDER | Provider malformed response handled. |
| 347 | LEONARDO-009 | LEONARDO PROVIDER | Missing output URL handled. |
| 348 | LEONARDO-010 | LEONARDO PROVIDER | Expired temporary Leonardo output URL handled safely. |
| 349 | LEONARDO-011 | LEONARDO PROVIDER | Output downloaded before temporary URL expiry. |
| 350 | LEONARDO-012 | LEONARDO PROVIDER | Content type validated. |
| 351 | LEONARDO-013 | LEONARDO PROVIDER | Unexpected output type rejected. |
| 352 | LEONARDO-014 | LEONARDO PROVIDER | Provider cost information not exposed unnecessarily to user. |
| 353 | LEONARDO-015 | LEONARDO PROVIDER | Leonardo request does not leak user secrets. |
| 354 | LEONARDO-016 | LEONARDO PROVIDER | Provider abstraction remains intact. |
| 355 | LEONARDO-017 | LEONARDO PROVIDER | Removed providers cannot accidentally execute in production. |
| 356 | LEONARDO-018 | LEONARDO PROVIDER | Retry does not cause uncontrolled duplicate provider charges. |
| 357 | LEONARDO-019 | LEONARDO PROVIDER | Same SQS job redelivery does not repeatedly call Leonardo when completed output already exists. |
| 358 | LEONARDO-020 | LEONARDO PROVIDER | Provider success + downstream S3 failure remains recoverable. |
| 359 | LEONARDO-021 | LEONARDO PROVIDER | Provider success + DB failure remains recoverable. |
| 360 | LEONARDO-022 | LEONARDO PROVIDER | 20-image processing does not violate provider handling assumptions. |
| 361 | LEONARDO-023 | LEONARDO PROVIDER | Generated output visually corresponds to correct source car. |
| 362 | LEONARDO-024 | LEONARDO PROVIDER | Provider errors map to understandable job failure state. |
| 363 | OUTPUT-001 | OUTPUT S3 | Processed output stored in intended production bucket/path. |
| 364 | OUTPUT-002 | OUTPUT S3 | Output associated with correct user. |
| 365 | OUTPUT-003 | OUTPUT S3 | Output associated with correct vehicle/image/job. |
| 366 | OUTPUT-004 | OUTPUT S3 | Output content type correct. |
| 367 | OUTPUT-005 | OUTPUT S3 | Output metadata correct where applicable. |
| 368 | OUTPUT-006 | OUTPUT S3 | Output object cannot overwrite another user's object. |
| 369 | OUTPUT-007 | OUTPUT S3 | User cannot access another user's output. |
| 370 | OUTPUT-008 | OUTPUT S3 | FREE preview access works. |
| 371 | OUTPUT-009 | OUTPUT S3 | PRO HQ access works. |
| 372 | OUTPUT-010 | OUTPUT S3 | PLUS HQ access works. |
| 373 | OUTPUT-011 | OUTPUT S3 | FREE cannot access HQ object directly. |
| 374 | OUTPUT-012 | OUTPUT S3 | Guessing HQ S3 key does not bypass entitlement. |
| 375 | OUTPUT-013 | OUTPUT S3 | Presigned/read URLs expire appropriately. |
| 376 | OUTPUT-014 | OUTPUT S3 | Private bucket configuration correct. |
| 377 | OUTPUT-015 | OUTPUT S3 | Missing output object handled gracefully. |
| 378 | OUTPUT-016 | OUTPUT S3 | S3 write failure does not falsely mark job successful. |
| 379 | OUTPUT-017 | OUTPUT S3 | Duplicate worker invocation does not corrupt output. |
| 380 | OUTPUT-018 | OUTPUT S3 | Removed vehicle/image follows output cleanup policy. |
| 381 | OUTPUT-019 | OUTPUT S3 | Raw upload and processed output permissions remain separated appropriately. |
| 382 | OUTPUT-020 | OUTPUT S3 | S3 URLs do not expose secrets. |
| 383 | JOB-001 | JOB STATE / DATABASE | New job begins correct initial state. |
| 384 | JOB-002 | JOB STATE / DATABASE | Dispatch state correct. |
| 385 | JOB-003 | JOB STATE / DATABASE | Processing state correct. |
| 386 | JOB-004 | JOB STATE / DATABASE | Success state correct. |
| 387 | JOB-005 | JOB STATE / DATABASE | Failure state correct. |
| 388 | JOB-006 | JOB STATE / DATABASE | Retry state correct if supported. |
| 389 | JOB-007 | JOB STATE / DATABASE | Job state transitions follow allowed state machine. |
| 390 | JOB-008 | JOB STATE / DATABASE | Invalid transition rejected. |
| 391 | JOB-009 | JOB STATE / DATABASE | Completed job cannot accidentally return to processing. |
| 392 | JOB-010 | JOB STATE / DATABASE | Duplicate completion remains idempotent. |
| 393 | JOB-011 | JOB STATE / DATABASE | Job belongs to correct user. |
| 394 | JOB-012 | JOB STATE / DATABASE | Job references correct vehicle/source. |
| 395 | JOB-013 | JOB STATE / DATABASE | Job references correct output. |
| 396 | JOB-014 | JOB STATE / DATABASE | Request ID preserved where designed. |
| 397 | JOB-015 | JOB STATE / DATABASE | Failure reason stored safely. |
| 398 | JOB-016 | JOB STATE / DATABASE | Failure reason does not contain secrets. |
| 399 | JOB-017 | JOB STATE / DATABASE | User cannot query another user's job. |
| 400 | JOB-018 | JOB STATE / DATABASE | Admin access follows intended authorization. |
| 401 | JOB-019 | JOB STATE / DATABASE | Old job history remains after logout/login. |
| 402 | JOB-020 | JOB STATE / DATABASE | Vehicle deletion interaction follows defined policy. |
| 403 | JOB-021 | JOB STATE / DATABASE | Source deletion during job follows defined policy. |
| 404 | JOB-022 | JOB STATE / DATABASE | DB indexes support job-status polling/query patterns. |
| 405 | UI-PROCESS-001 | FRONTEND PROCESSING UPDATE | Submitted job appears promptly in UI. |
| 406 | UI-PROCESS-002 | FRONTEND PROCESSING UPDATE | Processing state represented correctly. |
| 407 | UI-PROCESS-003 | FRONTEND PROCESSING UPDATE | Completed image appears without requiring inappropriate manual recovery. |
| 408 | UI-PROCESS-004 | FRONTEND PROCESSING UPDATE | Current polling/refresh architecture works as implemented. |
| 409 | UI-PROCESS-005 | FRONTEND PROCESSING UPDATE | UI does not create excessive polling/network traffic. |
| 410 | UI-PROCESS-006 | FRONTEND PROCESSING UPDATE | Multiple simultaneous jobs update independently. |
| 411 | UI-PROCESS-007 | FRONTEND PROCESSING UPDATE | 20-image batch updates correctly. |
| 412 | UI-PROCESS-008 | FRONTEND PROCESSING UPDATE | One failed image does not incorrectly mark entire successful batch failed unless defined. |
| 413 | UI-PROCESS-009 | FRONTEND PROCESSING UPDATE | Partial batch completion represented correctly. |
| 414 | UI-PROCESS-010 | FRONTEND PROCESSING UPDATE | Refresh during processing recovers job state. |
| 415 | UI-PROCESS-011 | FRONTEND PROCESSING UPDATE | Logout/login during processing recovers state. |
| 416 | UI-PROCESS-012 | FRONTEND PROCESSING UPDATE | New browser tab sees authoritative job state. |
| 417 | UI-PROCESS-013 | FRONTEND PROCESSING UPDATE | UI never shows success before backend completion. |
| 418 | UI-PROCESS-014 | FRONTEND PROCESSING UPDATE | UI never exposes HQ to FREE through client state. |
| 419 | UI-PROCESS-015 | FRONTEND PROCESSING UPDATE | Failed job displays useful error/retry state. |
| 420 | UI-PROCESS-016 | FRONTEND PROCESSING UPDATE | Stuck job does not spin forever without useful state. |
| 421 | UI-PROCESS-017 | FRONTEND PROCESSING UPDATE | Completed output maps to correct thumbnail/source. |
| 422 | UI-PROCESS-018 | FRONTEND PROCESSING UPDATE | Out-of-order completions do not mismatch images. |
| 423 | UI-PROCESS-019 | FRONTEND PROCESSING UPDATE | UI works mobile while jobs process. |
| 424 | UI-PROCESS-020 | FRONTEND PROCESSING UPDATE | Slow processing does not freeze unrelated navigation. |
| 425 | FREE-001 | FREE PLAN OUTPUT SECURITY | FREE user can process eligible image. |
| 426 | FREE-002 | FREE PLAN OUTPUT SECURITY | FREE sees intended preview. |
| 427 | FREE-003 | FREE PLAN OUTPUT SECURITY | FREE preview corresponds to processed output. |
| 428 | FREE-004 | FREE PLAN OUTPUT SECURITY | FREE cannot access HQ through UI. |
| 429 | FREE-005 | FREE PLAN OUTPUT SECURITY | FREE cannot reveal HQ by modifying client state. |
| 430 | FREE-006 | FREE PLAN OUTPUT SECURITY | FREE cannot reveal HQ by changing API request. |
| 431 | FREE-007 | FREE PLAN OUTPUT SECURITY | FREE cannot access HQ job endpoint. |
| 432 | FREE-008 | FREE PLAN OUTPUT SECURITY | FREE cannot access HQ S3 key. |
| 433 | FREE-009 | FREE PLAN OUTPUT SECURITY | FREE cannot reuse PRO user's HQ URL. |
| 434 | FREE-010 | FREE PLAN OUTPUT SECURITY | FREE cannot change user ID to fetch HQ. |
| 435 | FREE-011 | FREE PLAN OUTPUT SECURITY | FREE cannot change plan field in request. |
| 436 | FREE-012 | FREE PLAN OUTPUT SECURITY | FREE cannot manipulate local storage/state to unlock HQ. |
| 437 | FREE-013 | FREE PLAN OUTPUT SECURITY | FREE output remains correctly restricted after refresh. |
| 438 | FREE-014 | FREE PLAN OUTPUT SECURITY | FREE restriction persists after logout/login. |
| 439 | FREE-015 | FREE PLAN OUTPUT SECURITY | FREE restriction applies to historical processed images. |
| 440 | FREE-016 | FREE PLAN OUTPUT SECURITY | FREE restriction applies to Studio-generated derivative. |
| 441 | FREE-017 | FREE PLAN OUTPUT SECURITY | Upgrade to PRO changes future/current access according to policy. |
| 442 | FREE-018 | FREE PLAN OUTPUT SECURITY | Downgrade back to FREE follows policy. |
| 443 | FREE-019 | FREE PLAN OUTPUT SECURITY | Subscription expiry follows policy. |
| 444 | FREE-020 | FREE PLAN OUTPUT SECURITY | Server remains authoritative for HQ entitlement. |
| 445 | PRO-001 | PRO PLAN | PRO processes eligible image. |
| 446 | PRO-002 | PRO PLAN | PRO receives intended HQ output. |
| 447 | PRO-003 | PRO PLAN | PRO HQ survives refresh. |
| 448 | PRO-004 | PRO PLAN | PRO HQ survives logout/login. |
| 449 | PRO-005 | PRO PLAN | PRO cannot access another user's HQ. |
| 450 | PRO-006 | PRO PLAN | PRO processing limits enforced. |
| 451 | PRO-007 | PRO PLAN | PRO entitlement enforced server-side. |
| 452 | PRO-008 | PRO PLAN | PRO Studio-generation entitlement follows current policy. |
| 453 | PRO-009 | PRO PLAN | PRO downgrade follows policy. |
| 454 | PRO-010 | PRO PLAN | PRO expiration follows policy. |
| 455 | PRO-011 | PRO PLAN | PRO history remains intact after plan change. |
| 456 | PRO-012 | PRO PLAN | PRO plan cannot self-upgrade to PLUS through API. |
| 457 | PRO-013 | PRO PLAN | PRO UI accurately reflects plan. |
| 458 | PRO-014 | PRO PLAN | PRO 20-image batch follows intended limits. |
| 459 | PLUS-001 | PLUS PLAN | PLUS processes eligible image. |
| 460 | PLUS-002 | PLUS PLAN | PLUS receives intended HQ output. |
| 461 | PLUS-003 | PLUS PLAN | PLUS HQ survives refresh. |
| 462 | PLUS-004 | PLUS PLAN | PLUS HQ survives logout/login. |
| 463 | PLUS-005 | PLUS PLAN | PLUS cannot access another user's HQ. |
| 464 | PLUS-006 | PLUS PLAN | PLUS limits enforced. |
| 465 | PLUS-007 | PLUS PLAN | PLUS entitlement server-side. |
| 466 | PLUS-008 | PLUS PLAN | PLUS Studio-generation entitlement correct. |
| 467 | PLUS-009 | PLUS PLAN | PLUS downgrade follows policy. |
| 468 | PLUS-010 | PLUS PLAN | PLUS expiration follows policy. |
| 469 | PLUS-011 | PLUS PLAN | PLUS history remains intact. |
| 470 | PLUS-012 | PLUS PLAN | PLUS cannot manipulate Admin subscription APIs. |
| 471 | PLUS-013 | PLUS PLAN | PLUS UI accurately reflects plan. |
| 472 | PLUS-014 | PLUS PLAN | PLUS 20-image batch follows intended limits. |
| 473 | STUDIO-001 | STUDIO IMAGE FROM EXISTING PROCESSED IMAGE | Eligible processed image can start Studio generation. |
| 474 | STUDIO-002 | STUDIO IMAGE FROM EXISTING PROCESSED IMAGE | Correct source processed image selected. |
| 475 | STUDIO-003 | STUDIO IMAGE FROM EXISTING PROCESSED IMAGE | User selects studio background. |
| 476 | STUDIO-004 | STUDIO IMAGE FROM EXISTING PROCESSED IMAGE | User selects floor. |
| 477 | STUDIO-005 | STUDIO IMAGE FROM EXISTING PROCESSED IMAGE | Studio job records correct source/options. |
| 478 | STUDIO-006 | STUDIO IMAGE FROM EXISTING PROCESSED IMAGE | Studio job dispatched correctly. |
| 479 | STUDIO-007 | STUDIO IMAGE FROM EXISTING PROCESSED IMAGE | Lambda receives correct derivative job. |
| 480 | STUDIO-008 | STUDIO IMAGE FROM EXISTING PROCESSED IMAGE | Leonardo receives intended source. |
| 481 | STUDIO-009 | STUDIO IMAGE FROM EXISTING PROCESSED IMAGE | Generated Studio output stored correctly. |
| 482 | STUDIO-010 | STUDIO IMAGE FROM EXISTING PROCESSED IMAGE | Studio output appears in UI. |
| 483 | STUDIO-011 | STUDIO IMAGE FROM EXISTING PROCESSED IMAGE | FREE Studio behavior follows entitlement policy. |
| 484 | STUDIO-012 | STUDIO IMAGE FROM EXISTING PROCESSED IMAGE | PRO Studio behavior follows entitlement policy. |
| 485 | STUDIO-013 | STUDIO IMAGE FROM EXISTING PROCESSED IMAGE | PLUS Studio behavior follows entitlement policy. |
| 486 | STUDIO-014 | STUDIO IMAGE FROM EXISTING PROCESSED IMAGE | User cannot create Studio image from another user's processed image. |
| 487 | STUDIO-015 | STUDIO IMAGE FROM EXISTING PROCESSED IMAGE | User cannot inject another user's source object. |
| 488 | STUDIO-016 | STUDIO IMAGE FROM EXISTING PROCESSED IMAGE | Invalid source rejected. |
| 489 | STUDIO-017 | STUDIO IMAGE FROM EXISTING PROCESSED IMAGE | Missing source handled. |
| 490 | STUDIO-018 | STUDIO IMAGE FROM EXISTING PROCESSED IMAGE | Duplicate Studio submission remains safe. |
| 491 | STUDIO-019 | STUDIO IMAGE FROM EXISTING PROCESSED IMAGE | SQS redelivery remains idempotent. |
| 492 | STUDIO-020 | STUDIO IMAGE FROM EXISTING PROCESSED IMAGE | Provider retry remains safe. |
| 493 | STUDIO-021 | STUDIO IMAGE FROM EXISTING PROCESSED IMAGE | Studio failure does not corrupt original processed image. |
| 494 | STUDIO-022 | STUDIO IMAGE FROM EXISTING PROCESSED IMAGE | Deleting derivative does not delete original unless explicitly designed. |
| 495 | STUDIO-023 | STUDIO IMAGE FROM EXISTING PROCESSED IMAGE | Original deletion interaction follows defined derivative policy. |
| 496 | STUDIO-024 | STUDIO IMAGE FROM EXISTING PROCESSED IMAGE | Studio output access obeys plan quality entitlement. |
| 497 | CLEANUP-001 | DELETE / CLEANUP | Uncommitted uploads cleaned according to policy. |
| 498 | CLEANUP-002 | DELETE / CLEANUP | Upload removed from UI triggers intended storage cleanup. |
| 499 | CLEANUP-003 | DELETE / CLEANUP | Deleted vehicle cleanup follows policy. |
| 500 | CLEANUP-004 | DELETE / CLEANUP | Deleted source image cleanup follows policy. |
| 501 | CLEANUP-005 | DELETE / CLEANUP | Processed output cleanup follows policy. |
| 502 | CLEANUP-006 | DELETE / CLEANUP | Studio derivative cleanup follows policy. |
| 503 | CLEANUP-007 | DELETE / CLEANUP | Cleanup never deletes another user's object. |
| 504 | CLEANUP-008 | DELETE / CLEANUP | Cleanup validates ownership. |
| 505 | CLEANUP-009 | DELETE / CLEANUP | Internal cleanup endpoint protected. |
| 506 | CLEANUP-010 | DELETE / CLEANUP | Cleanup token/auth works. |
| 507 | CLEANUP-011 | DELETE / CLEANUP | Unauthorized cleanup invocation denied. |
| 508 | CLEANUP-012 | DELETE / CLEANUP | Repeated cleanup is idempotent. |
| 509 | CLEANUP-013 | DELETE / CLEANUP | Missing object cleanup safe. |
| 510 | CLEANUP-014 | DELETE / CLEANUP | DB record + missing S3 object safe. |
| 511 | CLEANUP-015 | DELETE / CLEANUP | S3 object + missing DB record handled according to orphan policy. |
| 512 | CLEANUP-016 | DELETE / CLEANUP | Cleanup during active processing follows defined policy. |
| 513 | CLEANUP-017 | DELETE / CLEANUP | Cleanup after failed processing works. |
| 514 | CLEANUP-018 | DELETE / CLEANUP | Cleanup after successful processing follows retention policy. |
| 515 | CLEANUP-019 | DELETE / CLEANUP | Scheduled cleanup observable. |
| 516 | CLEANUP-020 | DELETE / CLEANUP | Cleanup failures observable. |
| 517 | CLEANUP-021 | DELETE / CLEANUP | Cleanup logs contain no secrets. |
| 518 | CLEANUP-022 | DELETE / CLEANUP | Cleanup does not accidentally remove shared static studio assets. |
| 519 | ADMIN-001 | ADMIN | Admin authentication works. |
| 520 | ADMIN-002 | ADMIN | Normal user denied Admin UI. |
| 521 | ADMIN-003 | ADMIN | Normal user denied Admin APIs. |
| 522 | ADMIN-004 | ADMIN | FREE/PRO/PLUS do not imply Admin. |
| 523 | ADMIN-005 | ADMIN | Bootstrap Admin behavior secure. |
| 524 | ADMIN-006 | ADMIN | Admin can view intended user management. |
| 525 | ADMIN-007 | ADMIN | Admin can add Admin according to current feature. |
| 526 | ADMIN-008 | ADMIN | Unauthorized user cannot add Admin. |
| 527 | ADMIN-009 | ADMIN | Admin can assign PRO where supported. |
| 528 | ADMIN-010 | ADMIN | Admin can assign PLUS where supported. |
| 529 | ADMIN-011 | ADMIN | Invalid subscription assignment rejected. |
| 530 | ADMIN-012 | ADMIN | Admin actions audit logged where implemented. |
| 531 | ADMIN-013 | ADMIN | Admin cannot accidentally expose auth secrets. |
| 532 | ADMIN-014 | ADMIN | Admin user search/list works. |
| 533 | ADMIN-015 | ADMIN | Admin responsive layout works. |
| 534 | ADMIN-016 | ADMIN | Admin session expiry handled. |
| 535 | ADMIN-017 | ADMIN | Admin logout handled. |
| 536 | ADMIN-018 | ADMIN | Direct Admin endpoints enforce authorization. |
| 537 | USER-SEC-001 | CROSS-USER SECURITY | User A cannot view User B vehicles. |
| 538 | USER-SEC-002 | CROSS-USER SECURITY | User A cannot modify User B vehicles. |
| 539 | USER-SEC-003 | CROSS-USER SECURITY | User A cannot upload to User B vehicle. |
| 540 | USER-SEC-004 | CROSS-USER SECURITY | User A cannot process User B image. |
| 541 | USER-SEC-005 | CROSS-USER SECURITY | User A cannot query User B job. |
| 542 | USER-SEC-006 | CROSS-USER SECURITY | User A cannot access User B raw upload. |
| 543 | USER-SEC-007 | CROSS-USER SECURITY | User A cannot access User B processed output. |
| 544 | USER-SEC-008 | CROSS-USER SECURITY | User A cannot access User B HQ output. |
| 545 | USER-SEC-009 | CROSS-USER SECURITY | User A cannot access User B Studio derivative. |
| 546 | USER-SEC-010 | CROSS-USER SECURITY | User A cannot delete User B object. |
| 547 | USER-SEC-011 | CROSS-USER SECURITY | User A cannot alter User B profile. |
| 548 | USER-SEC-012 | CROSS-USER SECURITY | User A cannot alter User B subscription. |
| 549 | USER-SEC-013 | CROSS-USER SECURITY | User A cannot link identity to User B account improperly. |
| 550 | USER-SEC-014 | CROSS-USER SECURITY | UUID manipulation does not bypass ownership. |
| 551 | USER-SEC-015 | CROSS-USER SECURITY | Query manipulation does not bypass ownership. |
| 552 | USER-SEC-016 | CROSS-USER SECURITY | Request-body manipulation does not bypass ownership. |
| 553 | USER-SEC-017 | CROSS-USER SECURITY | Presigned URLs do not allow cross-user write. |
| 554 | USER-SEC-018 | CROSS-USER SECURITY | Historical URLs expire/remain protected as designed. |
| 555 | USER-SEC-019 | CROSS-USER SECURITY | Error responses do not leak private resource existence unnecessarily. |
| 556 | USER-SEC-020 | CROSS-USER SECURITY | Cross-user authorization remains enforced after plan changes. |
| 557 | API-SEC-001 | MASS ASSIGNMENT / API SECURITY | Unauthenticated protected requests denied. |
| 558 | API-SEC-002 | MASS ASSIGNMENT / API SECURITY | Expired session denied. |
| 559 | API-SEC-003 | MASS ASSIGNMENT / API SECURITY | Malformed session denied. |
| 560 | API-SEC-004 | MASS ASSIGNMENT / API SECURITY | User cannot set own plan. |
| 561 | API-SEC-005 | MASS ASSIGNMENT / API SECURITY | User cannot set own Admin flag. |
| 562 | API-SEC-006 | MASS ASSIGNMENT / API SECURITY | User cannot change `userId` ownership. |
| 563 | API-SEC-007 | MASS ASSIGNMENT / API SECURITY | User cannot change provider subject. |
| 564 | API-SEC-008 | MASS ASSIGNMENT / API SECURITY | User cannot mark phone verified directly. |
| 565 | API-SEC-009 | MASS ASSIGNMENT / API SECURITY | User cannot mark job SUCCESS directly. |
| 566 | API-SEC-010 | MASS ASSIGNMENT / API SECURITY | User cannot inject arbitrary output S3 key. |
| 567 | API-SEC-011 | MASS ASSIGNMENT / API SECURITY | User cannot change another vehicle ID into job. |
| 568 | API-SEC-012 | MASS ASSIGNMENT / API SECURITY | User cannot invoke internal dispatch endpoint without authorization. |
| 569 | API-SEC-013 | MASS ASSIGNMENT / API SECURITY | User cannot invoke cleanup endpoint without authorization. |
| 570 | API-SEC-014 | MASS ASSIGNMENT / API SECURITY | Unexpected privileged fields rejected/ignored safely. |
| 571 | API-SEC-015 | MASS ASSIGNMENT / API SECURITY | Invalid enums rejected. |
| 572 | API-SEC-016 | MASS ASSIGNMENT / API SECURITY | Malformed UUID/ID rejected safely. |
| 573 | API-SEC-017 | MASS ASSIGNMENT / API SECURITY | Oversized request handled. |
| 574 | API-SEC-018 | MASS ASSIGNMENT / API SECURITY | Invalid content type handled. |
| 575 | API-SEC-019 | MASS ASSIGNMENT / API SECURITY | Pagination validated. |
| 576 | API-SEC-020 | MASS ASSIGNMENT / API SECURITY | Server errors leak no stack/SQL/secrets. |
| 577 | API-SEC-021 | MASS ASSIGNMENT / API SECURITY | Rate limits function on sensitive endpoints. |
| 578 | API-SEC-022 | MASS ASSIGNMENT / API SECURITY | CSRF/session protections follow architecture where applicable. |
| 579 | ASYNC-001 | ASYNC FAILURE MATRIX | DB job created + dispatch succeeds. |
| 580 | ASYNC-002 | ASYNC FAILURE MATRIX | DB job created + dispatch fails. |
| 581 | ASYNC-003 | ASYNC FAILURE MATRIX | Dispatch succeeds + response times out. |
| 582 | ASYNC-004 | ASYNC FAILURE MATRIX | SQS message delivered once. |
| 583 | ASYNC-005 | ASYNC FAILURE MATRIX | SQS message delivered twice. |
| 584 | ASYNC-006 | ASYNC FAILURE MATRIX | Lambda starts + crashes before Leonardo. |
| 585 | ASYNC-007 | ASYNC FAILURE MATRIX | Lambda calls Leonardo + Leonardo fails. |
| 586 | ASYNC-008 | ASYNC FAILURE MATRIX | Leonardo succeeds + Lambda crashes before download. |
| 587 | ASYNC-009 | ASYNC FAILURE MATRIX | Leonardo succeeds + output download fails. |
| 588 | ASYNC-010 | ASYNC FAILURE MATRIX | Leonardo succeeds + S3 write fails. |
| 589 | ASYNC-011 | ASYNC FAILURE MATRIX | S3 write succeeds + DB update fails. |
| 590 | ASYNC-012 | ASYNC FAILURE MATRIX | DB completion succeeds + Lambda retries. |
| 591 | ASYNC-013 | ASYNC FAILURE MATRIX | Lambda timeout causes SQS redelivery. |
| 592 | ASYNC-014 | ASYNC FAILURE MATRIX | Worker receives already-completed job. |
| 593 | ASYNC-015 | ASYNC FAILURE MATRIX | Worker receives nonexistent job. |
| 594 | ASYNC-016 | ASYNC FAILURE MATRIX | Worker receives malformed message. |
| 595 | ASYNC-017 | ASYNC FAILURE MATRIX | Source S3 object disappears before processing. |
| 596 | ASYNC-018 | ASYNC FAILURE MATRIX | User deletes source while queued. |
| 597 | ASYNC-019 | ASYNC FAILURE MATRIX | User deletes vehicle while queued. |
| 598 | ASYNC-020 | ASYNC FAILURE MATRIX | User deletes source while Lambda running. |
| 599 | ASYNC-021 | ASYNC FAILURE MATRIX | Subscription changes while queued. |
| 600 | ASYNC-022 | ASYNC FAILURE MATRIX | Subscription expires while queued. |
| 601 | ASYNC-023 | ASYNC FAILURE MATRIX | Subscription changes while processing. |
| 602 | ASYNC-024 | ASYNC FAILURE MATRIX | 20-image batch partially fails. |
| 603 | ASYNC-025 | ASYNC FAILURE MATRIX | Queue backlog delays processing. |
| 604 | ASYNC-026 | ASYNC FAILURE MATRIX | Provider rate limit affects subset of batch. |
| 605 | CONCURRENCY-001 | CONCURRENCY | Double Process click. |
| 606 | CONCURRENCY-002 | CONCURRENCY | Same batch submitted from two tabs. |
| 607 | CONCURRENCY-003 | CONCURRENCY | Same source processed simultaneously. |
| 608 | CONCURRENCY-004 | CONCURRENCY | Process + delete source concurrently. |
| 609 | CONCURRENCY-005 | CONCURRENCY | Process + delete vehicle concurrently. |
| 610 | CONCURRENCY-006 | CONCURRENCY | Studio generation + original deletion concurrently. |
| 611 | CONCURRENCY-007 | CONCURRENCY | Phone linking in two tabs. |
| 612 | CONCURRENCY-008 | CONCURRENCY | Google linking in two tabs. |
| 613 | CONCURRENCY-009 | CONCURRENCY | Phone linked while another session logs in. |
| 614 | CONCURRENCY-010 | CONCURRENCY | Admin plan change while user submits process. |
| 615 | CONCURRENCY-011 | CONCURRENCY | Plan downgrade while job queued. |
| 616 | CONCURRENCY-012 | CONCURRENCY | Plan downgrade while output completes. |
| 617 | CONCURRENCY-013 | CONCURRENCY | Two Lambda invocations same job. |
| 618 | CONCURRENCY-014 | CONCURRENCY | Two cleanup invocations same object. |
| 619 | CONCURRENCY-015 | CONCURRENCY | User refresh while batch submission in flight. |
| 620 | CONCURRENCY-016 | CONCURRENCY | Logout while processing submission in flight. |
| 621 | CONCURRENCY-017 | CONCURRENCY | Two Admin subscription changes concurrently. |
| 622 | CONCURRENCY-018 | CONCURRENCY | User update profile while identity link completes. |
| 623 | DATA-001 | DATA INTEGRITY | User uniqueness constraints correct. |
| 624 | DATA-002 | DATA INTEGRITY | Google provider identity uniqueness correct. |
| 625 | DATA-003 | DATA INTEGRITY | Verified phone uniqueness correct. |
| 626 | DATA-004 | DATA INTEGRITY | Vehicle belongs to one intended user. |
| 627 | DATA-005 | DATA INTEGRITY | Upload belongs to intended vehicle/user. |
| 628 | DATA-006 | DATA INTEGRITY | Job belongs to intended user/source. |
| 629 | DATA-007 | DATA INTEGRITY | Output belongs to intended job. |
| 630 | DATA-008 | DATA INTEGRITY | Studio derivative references intended source. |
| 631 | DATA-009 | DATA INTEGRITY | Subscription belongs to intended user. |
| 632 | DATA-010 | DATA INTEGRITY | Identity linking preserves same canonical user. |
| 633 | DATA-011 | DATA INTEGRITY | Failed processing preserves source. |
| 634 | DATA-012 | DATA INTEGRITY | Failed Studio generation preserves original. |
| 635 | DATA-013 | DATA INTEGRITY | Deleting derivative does not corrupt source. |
| 636 | DATA-014 | DATA INTEGRITY | Retry does not create uncontrolled duplicate output records. |
| 637 | DATA-015 | DATA INTEGRITY | Job status and output state remain consistent. |
| 638 | DATA-016 | DATA INTEGRITY | S3/DB references remain consistent. |
| 639 | DATA-017 | DATA INTEGRITY | Cleanup does not break unrelated records. |
| 640 | DATA-018 | DATA INTEGRITY | Historical jobs remain queryable according to policy. |
| 641 | DATA-019 | DATA INTEGRITY | Migration preserves identity/subscription/vehicle/job relationships. |
| 642 | DATA-020 | DATA INTEGRITY | Audit records remain valid after user state changes. |
| 643 | PROD-001 | PRODUCTION CONFIGURATION | Production does not use local auth bypass. |
| 644 | PROD-002 | PRODUCTION CONFIGURATION | Production does not use dummy OTP. |
| 645 | PROD-003 | PRODUCTION CONFIGURATION | Production does not use MinIO. |
| 646 | PROD-004 | PRODUCTION CONFIGURATION | Production does not use Mailpit. |
| 647 | PROD-005 | PRODUCTION CONFIGURATION | Production does not use local queue consumer. |
| 648 | PROD-006 | PRODUCTION CONFIGURATION | Production uses intended S3 bucket. |
| 649 | PROD-007 | PRODUCTION CONFIGURATION | Production uses intended SQS queue. |
| 650 | PROD-008 | PRODUCTION CONFIGURATION | Production uses intended Lambda. |
| 651 | PROD-009 | PRODUCTION CONFIGURATION | Production uses intended AWS region. |
| 652 | PROD-010 | PRODUCTION CONFIGURATION | Production uses intended DB. |
| 653 | PROD-011 | PRODUCTION CONFIGURATION | Production Google OAuth callbacks correct. |
| 654 | PROD-012 | PRODUCTION CONFIGURATION | Production MSG91 configuration correct. |
| 655 | PROD-013 | PRODUCTION CONFIGURATION | Leonardo production key configured securely. |
| 656 | PROD-014 | PRODUCTION CONFIGURATION | AWS credentials not exposed to browser. |
| 657 | PROD-015 | PRODUCTION CONFIGURATION | DB credentials not exposed. |
| 658 | PROD-016 | PRODUCTION CONFIGURATION | Internal cleanup token not exposed. |
| 659 | PROD-017 | PRODUCTION CONFIGURATION | Internal dispatcher authorization not exposed. |
| 660 | PROD-018 | PRODUCTION CONFIGURATION | Debug/internal endpoints follow production policy. |
| 661 | PROD-019 | PRODUCTION CONFIGURATION | Environment validation fails safely for critical missing configuration. |
| 662 | PROD-020 | PRODUCTION CONFIGURATION | Client bundle contains no server-only secrets. |
| 663 | AWS-001 | AWS INFRASTRUCTURE | S3 bucket region correct. |
| 664 | AWS-002 | AWS INFRASTRUCTURE | S3 public-access policy correct. |
| 665 | AWS-003 | AWS INFRASTRUCTURE | S3 encryption configured. |
| 666 | AWS-004 | AWS INFRASTRUCTURE | SQS queue region correct. |
| 667 | AWS-005 | AWS INFRASTRUCTURE | SQS visibility timeout appropriate. |
| 668 | AWS-006 | AWS INFRASTRUCTURE | SQS retention appropriate. |
| 669 | AWS-007 | AWS INFRASTRUCTURE | DLQ configured/behavior documented. |
| 670 | AWS-008 | AWS INFRASTRUCTURE | Lambda region correct. |
| 671 | AWS-009 | AWS INFRASTRUCTURE | Lambda architecture/runtime correct. |
| 672 | AWS-010 | AWS INFRASTRUCTURE | Lambda memory appropriate. |
| 673 | AWS-011 | AWS INFRASTRUCTURE | Lambda timeout appropriate. |
| 674 | AWS-012 | AWS INFRASTRUCTURE | Lambda concurrency appropriate. |
| 675 | AWS-013 | AWS INFRASTRUCTURE | Lambda IAM follows least privilege. |
| 676 | AWS-014 | AWS INFRASTRUCTURE | Lambda can read required S3 inputs. |
| 677 | AWS-015 | AWS INFRASTRUCTURE | Lambda can write required S3 outputs. |
| 678 | AWS-016 | AWS INFRASTRUCTURE | Lambda can consume intended SQS. |
| 679 | AWS-017 | AWS INFRASTRUCTURE | Lambda cannot unnecessarily access unrelated resources. |
| 680 | AWS-018 | AWS INFRASTRUCTURE | Worker artifact/package deployable. |
| 681 | AWS-019 | AWS INFRASTRUCTURE | CloudWatch logs available. |
| 682 | AWS-020 | AWS INFRASTRUCTURE | CloudWatch metrics available. |
| 683 | AWS-021 | AWS INFRASTRUCTURE | EventBridge/dispatcher trigger correct where used. |
| 684 | AWS-022 | AWS INFRASTRUCTURE | Infrastructure resource names/environments do not cross dev/prod. |
| 685 | OBS-001 | OBSERVABILITY | Web request receives request/correlation ID. |
| 686 | OBS-002 | OBSERVABILITY | Processing job has useful job ID. |
| 687 | OBS-003 | OBSERVABILITY | Request/job correlation preserved into worker where designed. |
| 688 | OBS-004 | OBSERVABILITY | SQS processing traceable. |
| 689 | OBS-005 | OBSERVABILITY | Lambda invocation traceable to job. |
| 690 | OBS-006 | OBSERVABILITY | Leonardo failure traceable. |
| 691 | OBS-007 | OBSERVABILITY | S3 failure traceable. |
| 692 | OBS-008 | OBSERVABILITY | DB failure traceable. |
| 693 | OBS-009 | OBSERVABILITY | Dispatch failure traceable. |
| 694 | OBS-010 | OBSERVABILITY | Failed job diagnosable end-to-end. |
| 695 | OBS-011 | OBSERVABILITY | 5xx errors captured. |
| 696 | OBS-012 | OBSERVABILITY | Structured logs valid. |
| 697 | OBS-013 | OBSERVABILITY | Logs contain no OTP. |
| 698 | OBS-014 | OBSERVABILITY | Logs contain no session token. |
| 699 | OBS-015 | OBSERVABILITY | Logs contain no Google OAuth secret. |
| 700 | OBS-016 | OBSERVABILITY | Logs contain no Leonardo key. |
| 701 | OBS-017 | OBSERVABILITY | Logs contain no AWS credentials. |
| 702 | OBS-018 | OBSERVABILITY | CloudWatch metrics reflect processing failures/success where implemented. |
| 703 | PERF-001 | PERFORMANCE | Homepage performance reasonable. |
| 704 | PERF-002 | PERFORMANCE | Dashboard load measured. |
| 705 | PERF-003 | PERFORMANCE | Inventory load measured. |
| 706 | PERF-004 | PERFORMANCE | Vehicle search measured. |
| 707 | PERF-005 | PERFORMANCE | Upload presign latency measured. |
| 708 | PERF-006 | PERFORMANCE | Upload commit latency measured. |
| 709 | PERF-007 | PERFORMANCE | Single-image Process submission latency measured. |
| 710 | PERF-008 | PERFORMANCE | 20-image Process submission latency measured. |
| 711 | PERF-009 | PERFORMANCE | Process submission does not synchronously wait for Leonardo. |
| 712 | PERF-010 | PERFORMANCE | Job-status update mechanism does not create excessive requests. |
| 713 | PERF-011 | PERFORMANCE | Inventory does not exhibit obvious N+1 behavior. |
| 714 | PERF-012 | PERFORMANCE | 20-image UI remains responsive. |
| 715 | PERF-013 | PERFORMANCE | Lambda cold start measured where possible. |
| 716 | PERF-014 | PERFORMANCE | Worker memory usage observed. |
| 717 | PERF-015 | PERFORMANCE | DB connection usage inspected for obvious exhaustion risk. |
| 718 | PERF-016 | PERFORMANCE | Production architecture avoids known connection-pool exhaustion under expected serverless patterns. |
| 719 | BROWSER-001 | BROWSER / RESPONSIVE | Chrome desktop critical flow. |
| 720 | BROWSER-002 | BROWSER / RESPONSIVE | Safari/WebKit critical flow. |
| 721 | BROWSER-003 | BROWSER / RESPONSIVE | Firefox critical flow. |
| 722 | BROWSER-004 | BROWSER / RESPONSIVE | Edge/Chromium critical flow. |
| 723 | BROWSER-005 | BROWSER / RESPONSIVE | Mobile Chrome critical flow. |
| 724 | BROWSER-006 | BROWSER / RESPONSIVE | Mobile Safari/WebKit critical flow. |
| 725 | BROWSER-007 | BROWSER / RESPONSIVE | Tablet critical flow. |
| 726 | BROWSER-008 | BROWSER / RESPONSIVE | Homepage responsive. |
| 727 | BROWSER-009 | BROWSER / RESPONSIVE | Auth responsive. |
| 728 | BROWSER-010 | BROWSER / RESPONSIVE | Dashboard responsive. |
| 729 | BROWSER-011 | BROWSER / RESPONSIVE | Inventory responsive. |
| 730 | BROWSER-012 | BROWSER / RESPONSIVE | Upload UI responsive. |
| 731 | BROWSER-013 | BROWSER / RESPONSIVE | Processing dialog responsive. |
| 732 | BROWSER-014 | BROWSER / RESPONSIVE | Profile responsive. |
| 733 | BROWSER-015 | BROWSER / RESPONSIVE | Admin responsive. |
| 734 | BROWSER-016 | BROWSER / RESPONSIVE | No horizontal overflow. |
| 735 | BROWSER-017 | BROWSER / RESPONSIVE | Mobile keyboard does not hide required controls. |
| 736 | BROWSER-018 | BROWSER / RESPONSIVE | Navigation remains usable on mobile. |
| 737 | UX-001 | ACCESSIBILITY / UX | Sign-in keyboard accessible. |
| 738 | UX-002 | ACCESSIBILITY / UX | OTP form keyboard accessible. |
| 739 | UX-003 | ACCESSIBILITY / UX | Upload flow keyboard accessible. |
| 740 | UX-004 | ACCESSIBILITY / UX | Processing dialog keyboard accessible. |
| 741 | UX-005 | ACCESSIBILITY / UX | Profile keyboard accessible. |
| 742 | UX-006 | ACCESSIBILITY / UX | Fields labeled. |
| 743 | UX-007 | ACCESSIBILITY / UX | Validation understandable. |
| 744 | UX-008 | ACCESSIBILITY / UX | Dialog focus correct. |
| 745 | UX-009 | ACCESSIBILITY / UX | Buttons have accessible names. |
| 746 | UX-010 | ACCESSIBILITY / UX | Loading state clear. |
| 747 | UX-011 | ACCESSIBILITY / UX | Processing state clear. |
| 748 | UX-012 | ACCESSIBILITY / UX | Failed state clear. |
| 749 | UX-013 | ACCESSIBILITY / UX | Empty inventory state useful. |
| 750 | UX-014 | ACCESSIBILITY / UX | Destructive actions confirmed where appropriate. |
| 751 | UX-015 | ACCESSIBILITY / UX | Disabled actions understandable. |
| 752 | UX-016 | ACCESSIBILITY / UX | Long processing does not appear as frozen application. |
| 753 | SEO-001 | SEO / PUBLIC | Homepage title correct. |
| 754 | SEO-002 | SEO / PUBLIC | Homepage description correct. |
| 755 | SEO-003 | SEO / PUBLIC | Canonical correct. |
| 756 | SEO-004 | SEO / PUBLIC | robots.txt correct. |
| 757 | SEO-005 | SEO / PUBLIC | sitemap correct. |
| 758 | SEO-006 | SEO / PUBLIC | favicon correct. |
| 759 | SEO-007 | SEO / PUBLIC | social metadata correct. |
| 760 | SEO-008 | SEO / PUBLIC | production Search Console verification remains configured where intended. |
| 761 | SEO-009 | SEO / PUBLIC | authenticated/private pages not unintentionally indexed. |
| 762 | SEO-010 | SEO / PUBLIC | invalid URLs use custom 404. |
| 763 | GOLDEN-001 | GOLDEN PATHS | New Google user → login → upload → process → FREE preview. |
| 764 | GOLDEN-002 | GOLDEN PATHS | New phone user → OTP → Create Account → upload → process → FREE preview. |
| 765 | GOLDEN-003 | GOLDEN PATHS | New phone user → OTP → Link Google → same account → process. |
| 766 | GOLDEN-004 | GOLDEN PATHS | Google user → Profile → link phone → logout → phone login → same account/data. |
| 767 | GOLDEN-005 | GOLDEN PATHS | Phone user → Profile/link Google → logout → Google login → same account/data. |
| 768 | GOLDEN-006 | GOLDEN PATHS | FREE → process → preview only → attempted HQ bypass denied. |
| 769 | GOLDEN-007 | GOLDEN PATHS | Admin upgrades FREE → PRO → user receives correct PRO entitlement. |
| 770 | GOLDEN-008 | GOLDEN PATHS | PRO → upload 20 images → Process → queue → Lambda → Leonardo → outputs → UI. |
| 771 | GOLDEN-009 | GOLDEN PATHS | PLUS → upload/process → HQ outputs. |
| 772 | GOLDEN-010 | GOLDEN PATHS | Processed image → Studio generation → new Studio output. |
| 773 | GOLDEN-011 | GOLDEN PATHS | Processing job → Lambda failure → retry/recovery → valid final state. |
| 774 | GOLDEN-012 | GOLDEN PATHS | Duplicate SQS delivery → exactly one logical successful job/output. |
| 775 | GOLDEN-013 | GOLDEN PATHS | User logs out while processing → logs back in → correct processing/result state. |
| 776 | GOLDEN-014 | GOLDEN PATHS | Cross-user attack across vehicle/upload/job/output → all denied. |
