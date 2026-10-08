# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: billing-checkout.spec.ts >> loads Plus and Pro Checkout through the browser security policy
- Location: ../../tests/e2e/billing-checkout.spec.ts:38:1

# Error details

```
Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - link "StudioCar AI home" [ref=e4] [cursor=pointer]:
        - /url: /
        - generic [ref=e5]:
          - generic [aria-hidden] [ref=e6]: SC
          - generic [ref=e7]: StudioCar AI
      - navigation "Workspace" [ref=e8]:
        - link "Dashboard" [ref=e9] [cursor=pointer]:
          - /url: /dashboard
          - generic [aria-hidden] [ref=e10]: ⌂
          - text: Dashboard
        - link "Inventory" [ref=e11] [cursor=pointer]:
          - /url: /inventory
          - generic [aria-hidden] [ref=e12]: ▦
          - text: Inventory
        - link "Packs & Billing" [ref=e13] [cursor=pointer]:
          - /url: /settings/billing
          - generic [aria-hidden] [ref=e14]: ◇
          - text: Packs & Billing
        - link "Profile" [ref=e15] [cursor=pointer]:
          - /url: /settings/profile
          - generic [aria-hidden] [ref=e16]: ◔
          - text: Profile
      - generic [ref=e17]:
        - strong [ref=e18]: Free plan
        - generic [ref=e19]:
          - generic [ref=e20]: 0 / 15 images used
          - progressbar "0 / 15 images used" [ref=e22]
        - generic [ref=e23]: 0 GB of 3.0 GB
    - generic [ref=e24]:
      - banner [ref=e25]:
        - generic [ref=e26]: Workspace
        - group [ref=e29]:
          - generic "Account menu for Checkout Browser Fixture" [ref=e30] [cursor=pointer]:
            - generic [ref=e31]: Checkout Browser Fixture
            - generic [aria-hidden] [ref=e32]: CB
      - main [ref=e33]:
        - generic [ref=e34]:
          - generic [ref=e35]:
            - generic [ref=e36]:
              - paragraph [ref=e37]: Plan overview
              - heading "Usage & Billing" [level=1] [ref=e38]
              - paragraph [ref=e39]: Track upload sessions, processing credits, storage, and available packs.
            - link "Upgrade plan" [ref=e40] [cursor=pointer]:
              - /url: "#packs"
          - region "Current plan usage" [ref=e41]:
            - article [ref=e42]:
              - paragraph [ref=e43]: Current plan
              - heading "Free" [level=2] [ref=e44]
              - generic [ref=e45]: For individuals trying the StudioCar workflow on a small set of vehicles.
              - generic [ref=e46]:
                - generic [ref=e47]:
                  - generic [ref=e48]: 0 of 15 images used
                  - generic [ref=e49]: 15 remaining
                - progressbar "0 of 15 images used" [ref=e50]
            - generic [ref=e51]:
              - article [ref=e52]:
                - strong [ref=e53]: "0"
                - generic [ref=e54]:
                  - generic [ref=e55]: Upload sessions used · No configured limit
                  - progressbar "Upload sessions used · No configured limit" [ref=e57]
              - article [ref=e58]:
                - strong [ref=e59]: 0 GB
                - generic [ref=e60]:
                  - generic [ref=e61]: Storage used of 3.0 GB
                  - progressbar "Storage used of 3.0 GB" [ref=e63]
          - generic [ref=e64]:
            - region "Purchased credits" [ref=e65]:
              - heading "Purchased credits" [level=2] [ref=e66]
              - paragraph [ref=e67]: 0 remaining
            - region "Payment history" [ref=e68]:
              - heading "Payment History" [level=2] [ref=e69]
              - paragraph [ref=e70]: No payments yet.
          - generic [ref=e71]:
            - generic [ref=e72]:
              - generic [ref=e73]:
                - paragraph [ref=e74]: Available packs
                - heading "Choose the capacity that fits your inventory." [level=2] [ref=e75]
              - paragraph [ref=e76]: The same packs shown on the homepage are available here with your current usage in context.
            - generic [ref=e77]:
              - article [ref=e78]:
                - generic [ref=e79]:
                  - strong [ref=e80]: Free
                  - generic [ref=e81]: Current plan
                - paragraph [ref=e82]: ₹0 forever
                - paragraph [ref=e83]: For individuals trying the StudioCar workflow on a small set of vehicles.
                - list [ref=e84]:
                  - listitem [ref=e85]: ✓ 15 images in total
                  - listitem [ref=e86]: ✓ Maximum 5 images per batch
                  - listitem [ref=e87]: ✓ Standard background processing
                  - listitem [ref=e88]: ✓ 3 GB storage
                - button "Current plan" [disabled] [ref=e89] [cursor=pointer]
              - article [ref=e90]:
                - generic [ref=e91]:
                  - strong [ref=e92]: Studio Plus
                  - generic [ref=e93]: Most popular
                - paragraph [ref=e94]: ₹1,999 one-time
                - paragraph [ref=e95]: A flexible credit pack for sellers, photographers, and growing dealerships.
                - list [ref=e96]:
                  - listitem [ref=e97]: ✓ 100 image credits
                  - listitem [ref=e98]: ✓ Up to 20 images per batch
                  - listitem [ref=e99]: ✓ Premium studio backgrounds
                  - listitem [ref=e100]: ✓ Re-processing included
                - button "Choose Studio Plus" [ref=e101] [cursor=pointer]
                - generic [ref=e102]: Payment confirmed. 100 credits have been added.
              - article [ref=e103]:
                - generic [ref=e104]:
                  - strong [ref=e105]: Studio Pro
                  - generic [ref=e106]: Teams
                - paragraph [ref=e107]: ₹5,499 / month
                - paragraph [ref=e108]: For high-volume teams that need dependable image-processing throughput.
                - paragraph [ref=e109]: Renews monthly
                - list [ref=e110]:
                  - listitem [ref=e111]: ✓ 400 images each month
                  - listitem [ref=e112]: ✓ Priority batch processing
                  - listitem [ref=e113]: ✓ Increased storage
                  - listitem [ref=e114]: ✓ Team-ready inventory workflow
                - button "Choose Studio Pro" [disabled] [ref=e115] [cursor=pointer]
  - alert [ref=e116]
```
