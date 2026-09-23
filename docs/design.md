# StudioCar AI — Developer Handoff Specification

MVP v0.1 · source of truth: `StudioCar-AI.dc.html`  
Figma reference: https://www.figma.com/design/WNey7FQMaCibcJZufPU5zb?node-id=7-2  
Base system: premium automotive SaaS, neutral-first with processing blue used only for action and live status.  
Stack assumption: React/Next.js + Tailwind or CSS Modules; map every value below to shared theme tokens.

---

## 1. Tokens

### 1.1 Colour — primitives

**Neutral ramp** (the primary visual language)

| Token | Hex | Used for |
| --- | --- | --- |
| `--neutral-0` | `#ffffff` | Elevated surfaces, cards, modal, controls |
| `--neutral-50` | `#fbfbfa` | Sidebar and quiet card ground |
| `--neutral-100` | `#f7f7f5` | Secondary surface, marketing page ground |
| `--neutral-150` | `#efefec` | Selected navigation, muted panels |
| `--neutral-200` | `#ececea` | Outer canvas, skeleton surface |
| `--neutral-300` | `#e4e3df` | Standard border and divider |
| `--neutral-400` | `#c9c7c1` | Dashed upload border, inactive control |
| `--neutral-500` | `#9a9892` | Faint metadata and inactive icon |
| `--neutral-600` | `#6f6d68` | Muted body copy |
| `--neutral-700` | `#56534e` | Navigation text |
| `--neutral-800` | `#2c2c2a` | Dark secondary controls |
| `--neutral-900` | `#171716` | Primary text |
| `--neutral-950` | `#0c0c0b` | Primary button, dark panels, footer |

**Processing blue ramp** (the only non-semantic accent)

| Token | Hex | Used for |
| --- | --- | --- |
| `--blue-50` | `#eef4ff` | Processing pill and badge background |
| `--blue-100` | `#dce7ff` | Quiet selected background |
| `--blue-400` | `#6f8bff` | Dark-ground focus and progress support |
| `--blue-500` | `#315cf5` | Primary processing indicator, upgrade CTA, focus |
| `--blue-600` | `#2448d8` | Processing text on pale blue |
| `--blue-700` | `#1c39ae` | Active/pressed state |

### 1.2 Colour — semantic

| Token | Value | Used for |
| --- | --- | --- |
| `--color-canvas` | `#ececea` | Prototype board and application surround |
| `--color-bg` | `#ffffff` | Main application background |
| `--color-surface` | `#ffffff` | Cards, modal, top bar, menu |
| `--color-surface-subtle` | `#f7f7f5` | Secondary panels and empty states |
| `--color-text` | `#171716` | Primary text |
| `--color-text-muted` | `#6f6d68` | Paragraphs and secondary labels |
| `--color-text-faint` | `#9a9892` | Timestamps, hints, tertiary labels |
| `--color-divider` | `#e4e3df` | Every standard hairline and control border |
| `--color-action` | `#0c0c0b` | Primary button and selected neutral control |
| `--color-focus` | `rgba(49,92,245,.35)` | 3px accessible focus ring |
| `--processing` | `#315cf5` | Active processing and progress |
| `--processing-bg` | `#eef4ff` | Processing badge background |
| `--success` | `#0f9f6e` | Completed and successful actions |
| `--success-bg` | `#ecfdf3` | Completed badge and success panel |
| `--warning` | `#a96c18` | Needs-attention and usage warning |
| `--warning-bg` | `#fff8e6` | Warning panel and favourite status |
| `--error` | `#d92d20` | Failed, destructive, and blocking errors |
| `--error-bg` | `#fff1f2` | Failed badge and error panel |
| `--overlay` | `rgba(12,12,11,.44)` | Modal backdrop |
| `--image-overlay` | `rgba(5,8,15,.65)` | Processing image legibility gradient |

Text hierarchy:

| Role | Token | Used for |
| --- | --- | --- |
| Text/Primary | `--color-text` | Headings, names, values, button labels |
| Text/Body | `--color-text` at 82% | Standard body copy |
| Text/Secondary | `--color-text-muted` | Descriptions, card metadata |
| Text/Subtle | `--color-text-faint` | Hints, dates, low-priority counts |
| Text/Inverse | `#ffffff` | Dark cards, footer, image overlays |
| Text/Inverse muted | `rgba(255,255,255,.68)` | Dark-surface supporting copy |

### 1.3 Type

Family: `--font-sans: "Manrope", Arial, system-ui, sans-serif`.  
Technical filenames and identifiers may use `ui-monospace, SFMono-Regular, Menlo, monospace`.

Global: `-webkit-font-smoothing: antialiased`; headings use tight negative tracking; numbers use tabular numerals when they update in place.

| Token | Size | Line-height | Weight | Tracking | Used for |
| --- | ---: | ---: | ---: | ---: | --- |
| `display` | 54px | 1.03 | 800 | -2.4px | Marketing hero H1 |
| `display-sm` | 42px | 1.08 | 800 | -1.5px | Marketing section H2 |
| `h1-page` | 30px | 1.15 | 800 | -0.7px | Application page titles |
| `h1-mobile` | 25px | 1.15 | 800 | -0.4px | Mobile page titles |
| `h2` | 24px | 1.2 | 800 | -0.4px | Marketing feature heading, plan title |
| `h2-modal` | 20px | 1.2 | 800 | -0.3px | Modal title |
| `h3` | 17px | 1.25 | 800 | -0.15px | Workflow and major card headings |
| `h3-sm` | 14px | 1.3 | 800 | 0 | Application section heading |
| `card-title` | 13px | 1.3 | 800 | 0 | Vehicle card name |
| `body-lg` | 15px | 1.7 | 400 | 0 | Marketing introduction and hero body |
| `body` | 13px | 1.55 | 400 | Application page description |
| `body-sm` | 12px | 1.55 | 500 | Buttons, controls, compact copy |
| `body-xs` | 11px | 1.5 | 500 | Card descriptions, workflow body |
| `caption` | 10px | 1.45 | 600 | Metadata, compact controls, progress detail |
| `micro` | 9px | 1.4 | 800 | Status, tags, image labels |
| `eyebrow` | 11px | 1.4 | 800 | Uppercase section eyebrow; 0.12em tracking |
| `stat-lg` | 38px | 1.05 | 800 | Pricing amount |
| `stat` | 26px | 1.1 | 800 | Dashboard values |
| `stat-sm` | 19px | 1.15 | Homepage proof values |
| `progress-value` | 20px | 1.1 | 800 | Image processing percentage |

At widths below 900px, `display` becomes 42px and `display-sm` becomes 34px. Never reduce application body text below 11px in the prototype or 12px in production.

### 1.4 Spacing

Canonical design scale:

`4 · 5 · 6 · 7 · 8 · 9 · 10 · 11 · 12 · 13 · 14 · 15 · 16 · 18 · 20 · 22 · 24 · 26 · 28 · 30 · 32 · 36 · 40 · 48 · 54 · 60 · 64 · 84 · 96` px

Canonical uses:

- `4–8`: icon/label gaps and tight status content.
- `9–12`: compact card internals and button groups.
- `13–16`: form, card, and grid gaps.
- `18–24`: card padding and modal section rhythm.
- `26–32`: application page padding and major local sections.
- `48–60`: hero and final CTA padding.
- `84–96`: marketing section separation.

Use `gap` for sibling rhythm. Margins are reserved for separating independently owned sections.

### 1.5 Radius

| Token | Value | Applies to |
| --- | ---: | --- |
| `--radius-control` | 10px | Buttons, inputs, icon controls |
| `--radius-card` | 14px | Stats, quotas, feature tiles |
| `--radius-vehicle` | 15px | Vehicle cards |
| `--radius-panel` | 16px | Quick actions, state cards, floating panels |
| `--radius-modal` | 20px | Upload and upgrade modal |
| `--radius-marketing` | 22–26px | Hero image, CTA band |
| `--radius-pill` | 999px | Statuses, filters, processing indicator |
| `--radius-mobile` | 32px | Device-frame presentation only |

Rounded surfaces are purposeful: pills communicate state/filtering; medium radii support approachable SaaS controls; large radii are limited to major marketing surfaces.

### 1.6 Shadow

| Token | Value | Applies to |
| --- | --- | --- |
| `--shadow-card` | `0 2px 6px rgba(20,20,18,.025)` | Vehicle cards only |
| `--shadow-lift` | `0 12px 28px rgba(0,0,0,.13)` | Selected feature and hovered workflow card |
| `--shadow-panel` | `0 14px 38px rgba(20,20,18,.10)` | Modal and processing panel |
| `--shadow-hero` | `0 24px 60px rgba(22,22,20,.16)` | Marketing comparison stage |
| `--shadow-board` | `0 24px 70px rgba(18,18,16,.10)` | Prototype screen frame only |

Never stack shadows. Cards rely primarily on a 1px border; shadow intensity increases only for active elevation or an overlay relationship.

### 1.7 Motion

| Name | Duration | Easing | Applies to |
| --- | --- | --- | --- |
| `instant` | 0ms | — | Status text and count changes |
| `control` | 120ms | `ease-out` | Button and filter hover/pressed states |
| `card` | 200ms | `ease` | Feature selection and workflow-card lift |
| `modal` | 200ms | `ease-out` | Backdrop fade and modal scale-in |
| `completion` | 260ms | `ease-out` | Processing image reveal and action enablement |
| `scroll` | native | browser smooth | Marketing anchor navigation |

Comparison sliders use direct pointer movement with no animation delay. Progress bars may animate width but never loop. Production must disable non-essential movement under `prefers-reduced-motion: reduce`.

---

## 2. Components

Shared rule: every interactive element receives `:focus-visible { outline:3px solid rgba(49,92,245,.35); outline-offset:2px }`. Disabled elements use `opacity:.45; cursor:not-allowed`. Status never relies on colour alone.

### 2.1 Button (`.btn`)

Base: `display:inline-flex; align-items:center; justify-content:center; gap:8px; height:40px; padding:0 15px; border:1px solid #e4e3df; border-radius:10px; font:800 12px/1 Manrope`.

| Variant | Default | Hover | Active | Use |
| --- | --- | --- | --- | --- |
| `primary` | bg/border `#0c0c0b`, text white | bg `#232321` | bg black, translateY 1px | Single forward action |
| `blue` | bg/border `#315cf5`, text white | bg `#2448d8` | bg `#1c39ae` | Upgrade and plan conversion |
| default/secondary | white, dark text, neutral border | bg `#f7f7f5` | bg `#efefec` | Alternate action |
| `ghost` | transparent | subtle neutral fill | stronger neutral fill | Navigation and low-stakes actions |
| `danger` | red text, `#fff1f2` fill | deepen fill | red tint | Destructive or failure recovery |
| `icon` | 40×40, zero inline padding | per variant | per variant | Close, menu, view toggle |
| `sm` | 34px high, 11px text | per variant | per variant | Card actions and compact toolbars |

Marketing CTA override: 48px high with `padding-inline:20px`. One primary button per local decision group.

### 2.2 Brand mark (`.brand-mark`)

30×30px, 9px radius, black fill, white `SC`, 13px/800. Pair with “StudioCar AI” at 18px/800 and a 10px gap. On the dark footer, reverse to a white tile with black initials. Do not use the mark as a generic icon.

### 2.3 Input (`.input`)

Base: 42px high, 1px `--color-divider` border, 10px radius, white background, 12px text, 12px horizontal padding.

| State | Treatment |
| --- | --- |
| Default | neutral border, dark text |
| Hover | border `#c9c7c1` |
| Focus | border `#315cf5`, 3px focus ring |
| Error | border `#d92d20`, error copy below |
| Disabled | subtle surface, muted text, opacity .65 |

Textarea: 74px minimum height, 11px top padding. Field labels are 11px/800; hints are 10px in faint text. Required state is represented by text or an asterisk and announced in the label.

### 2.4 Toggle (`.toggle`)

36×22px pill with 3px internal padding and a 16px white thumb. Off track `#d9d7d2`; on track `#0c0c0b`; the on thumb translates 14px. The full option row is the interaction target, not only the pill.

### 2.5 Status (`.status`)

Base: inline flex, 6px gap, `padding:5px 8px`, pill radius, 9.5px/800. A 6px dot precedes the text.

| Status | Text/icon | Foreground | Background |
| --- | --- | --- | --- |
| Completed | dot + “Completed” | `#0f9f6e` | `#ecfdf3` |
| Processing | dot + “Processing” + percentage where space permits | `#315cf5` | `#eef4ff` |
| Failed | dot + “Failed” or “n need attention” | `#d92d20` | `#fff1f2` |
| Warning | dot + explicit message | `#a96c18` | `#fff8e6` |
| Favourite | star + “Favourite” | `#815500` | `#fff8e6` |
| Archived | archive icon + “Archived” | `#6f6d68` | `#efefec` |

### 2.6 Filter chip (`.filter`)

31px high, pill radius, 1px neutral border, 11px/700. Default is white with muted text. Active is black with white text. Include counts in the visible label when operationally useful: `Processing 3`, `Completed 19`.

### 2.7 Card (`.card` pattern)

White surface, 1px divider border, 14–18px radius, no shadow by default. Standard padding is 13–20px. Card headings and actions align to an 8px baseline. Nested cards are prohibited; use divider-separated groups instead.

### 2.8 Vehicle card (`.vehicle-card`)

Primary inventory unit. Desktop reference width is approximately 280px inside a four-column grid; border radius 15px; image height 132px; body padding 13px.

Structure:

1. Hero image (`object-fit:cover`).
2. Optional three-dot menu in a 30×30 white overlay button.
3. Vehicle name at 13px/800, one line with ellipsis.
4. Brand/model and image count/date at 10px muted.
5. Status and contextual actions.

Variants:

- **Completed** — processed hero, Completed status, Open Portfolio, Download ZIP, More.
- **Processing** — non-clickable card, image `blur(1.5px) brightness(.55)`, overlay percentage, count, progress, and estimate.
- **Partial failure** — processed hero plus explicit “18 of 20 images processed / 2 images need attention”; Review Issues and Retry Failed Images.
- **Failed** — failed status plus Review, Retry, Contact Support.
- **Archived** — reduced emphasis; actions remain available from More.

Never increase the desktop card into a full-width banner. At 1440px, four medium cards must remain visible per row.

### 2.9 Progress (`.progress`)

Standard track 6px high with pill radius. On images: white fill over a 25% white track. On light surfaces: `#315cf5` fill over `#e6e5e1`. Always pair the bar with percentage and processed count. Estimated time is supplementary.

### 2.10 Upload dropzone (`.dropzone`)

128px high, 1.5px dashed `#c9c7c1`, 14px radius, `#fafaf8` fill. Centre icon, 13px/800 instruction, and 10px muted format/limit line. Drag-over switches border to processing blue and fill to `#eef4ff`.

### 2.11 Upload item (`.upload-item`)

56px high, white surface, 1px border, 10px radius, `padding:7px 10px`, 10px gap. Thumbnail is 60×40px at 7px radius. Copy column truncates filename; status is visible text. Provide reorder handle and remove button with accessible labels.

### 2.12 Background choice (`.bg-choice`)

Three equal columns in the modal. Base has a 1px border and 11px radius. Preview is 70px high; label is 9px/800 with 8px padding. Selected uses a 2px black inset outline.

### 2.13 Comparison slider (`.feature-stage`)

Marketing size: 100% available width × 452px, 22px radius, hero shadow. Original is the full image with reduced saturation/contrast/brightness. Processed image is layered above and clipped from the current split percentage. A 2px white divider and 44px circular handle track the range input. Labels sit at the top corners; treatment summary sits bottom-left.

Portfolio variant uses the same interaction at a smaller 36px handle. Both versions require a labelled native range input for keyboard access.

### 2.14 Processing panel (`.process-panel`)

340px wide, positioned below the global processing indicator, white surface, 1px border, 16px radius, panel shadow, 15px padding. Each row includes vehicle name, percentage, progress, processed count, and estimate/status. Panel uses a maximum height with internal scrolling once more than five batches are active.

### 2.15 Modal (`.modal`)

Desktop width 760px, maximum height 800px, 20px radius, white surface, panel shadow. Backdrop begins below the application top bar in the prototype and covers the full viewport in production.

Structure:

- Header: `padding:22px 24px 17px`, title, eyebrow, stepper, close.
- Content: `padding:22px 24px`, internal scroll when necessary.
- Footer: `padding:16px 24px`, top divider, Back left and forward action right.

On mobile the modal becomes full screen with zero outer radius, sticky header/footer, and independently scrolling content.

### 2.16 Stepper (`.stepper`)

Four 74×4px bars with 6px gap and pill radius. Complete/current bars are black; future bars are `#e7e6e2`. Visible copy such as “Step 1 of 4” is included for screen readers and narrow screens.

### 2.17 Navigation item (`.nav a`)

Desktop sidebar item: `padding:11px 12px`, 10px radius, 13px/650, 11px icon gap. Default text `#56534e`; active uses `#efefec` fill and primary text. Do not use colour alone: active state also has background and `aria-current="page"`.

### 2.18 Stat card (`.stat`)

Minimum height 104px, 1px border, 14px radius, 17px padding. Label 11px/700 muted, value 26px/800, delta 10px faint. The Usage Remaining card may invert to black with white value and muted inverse copy.

### 2.19 Gallery

Desktop portfolio main region is a two-column grid, `1.45fr .55fr`, 16px gap, 490px high. Main image has 16px radius and comparison overlay. Secondary gallery uses two columns, 10px gap, with 155px image tiles at 12px radius. Overflow count is a dark button with `+n` and “View all 20”.

Selecting the overflow button opens `.portfolio-viewer`: an inset full-screen dark dialog with a flexible contained-image stage, image counter, close, previous, and next controls. Its lower 174px control region contains a labelled native range slider from 1–20, a horizontally scrollable rail of twenty 88×72px selectable thumbnails, and Set as Hero, Compare Original, and Download Image actions. Range, arrow, and thumbnail selection update one shared `viewerIndex`; Arrow Left/Right navigate and Escape closes.

Mobile gallery is 360px high with a horizontal thumbnail strip of 76×56px tiles and a persistent Download All action above bottom navigation.

### 2.20 Skeleton / Empty / Success / Error

- **Skeleton** — matches eventual card geometry; neutral static bars or low-motion shimmer respecting reduced motion.
- **Empty** — centred icon tile, title, one sentence, and one primary recovery action.
- **Success** — green icon tile, explicit completed count, Open Portfolio.
- **Partial failure** — red attention icon, successful count, failed count, Review and Retry.
- **Error** — concise explanation followed by Review, Retry, and Contact Support.

Empty Inventory copy is fixed:

> **Your inventory is empty**  
> Upload your first vehicle to create professional studio images.

---

## 3. Screens

Desktop reference frame: 1440×960. Application sidebar: 224px. Top bar: 70px. Application content padding: 30px 32px 36px. Marketing pages are vertically scrollable; application screens use viewport-contained work areas with local overflow where needed.

### 3.1 Marketing header — sticky

Height 78px; `padding:0 54px`; white at 90% opacity with 14px backdrop blur; 1px bottom divider; sticky `top:0; z-index:20`.

Left: brand. Centre: Features, Workflow, Studio backgrounds, Pricing with 30px gaps. Right: Log in secondary + Start free primary. Below 900px the header wraps; product links form a horizontally scrollable second row.

### 3.2 Homepage

The homepage is a scrollable product site, never a one-screen landing page.

1. **Hero** — `padding:58px 54px 48px`; grid `.82fr 1.18fr`; 48px gap. Left: processing eyebrow, display headline, 15px body, primary/secondary CTA pair, three proof values. Right: ComparisonSlider at 452px.
2. **Feature selector** — `padding:24px 54px 54px`; heading row then four equal cards with 12px gap. Selected feature is dark and lifts 3px.
3. **Audience strip** — 54px dark band listing Dealerships, Sellers, Photographers, Marketplaces.
4. **Workflow** — `padding:96px 54px`; white field; two-column introduction followed by four step cards and the dark “After you click Process Photos” note.
5. **Studio backgrounds** — neutral-150 field; `.75fr 1.25fr`; copy/checks left and a 2×2 asymmetric image gallery right.
6. **Pricing** — white field; centred 690px heading; three equal cards. Featured pack moves upward 8px and uses a dark surface.
7. **Final CTA** — 54px side margins, 84px bottom margin; dark 26px-radius panel with headline left and two actions right.
8. **Footer** — dark field, `padding:60px 54px 28px`; brand + social column and Product, Workspace, Company link columns; copyright row below a divider.

Below 900px all major grids become one column, sections use 20px horizontal padding, CTA becomes stacked, and footer becomes two columns with the brand spanning both.

### 3.3 Dashboard

Sidebar + top bar shell. Page header contains date, greeting, explanatory line, and Upload Vehicle.

- Stats: five equal columns, 14px gap; Usage Remaining is inverted.
- Quick actions: three equal compact `.vehicle-card`-derived buttons with 14px gaps. Each uses a 98px automotive hero image, small image-overlay label, standard vehicle-card body, status pill, and right arrow. Actions are Upload a vehicle, View inventory, and View portfolio. Do not use abstract oversized action boxes.
- Recent row: three compact vehicle cards, including at least one live processing example.

At 1100px stats wrap to three then two columns. Below 768px use the mobile shell and a single-column action/card flow.

### 3.4 Inventory

Primary operational workspace. Header: eyebrow, `h1-page`, “Manage and process your vehicle image batches.”, and Upload Vehicle.

Toolbar order: search (minimum 320px), sort, filter, grid/list toggle. Filter row: All, Processing, Completed, Failed, Favorites, Recently Added, Archived.

Grid: `repeat(4,minmax(0,1fr))`, 14px gap at the 1440px reference. Cards remain medium and compact. At 1180px use three columns; at 900px two; below 640px one.

Search indexes vehicle name, brand, model, stock ID, and internal reference. Sorting and filtering preserve the current search query.

Processing cards are not clickable. Completed cards expose Open Portfolio, Download ZIP, and More. More includes Rename, Edit Details, Re-process, Duplicate, Move, Archive, Delete.

### 3.5 Upload Vehicle — Step 1, Vehicle Details

One modal; never a standalone route. Two-column field grid with 14px gaps. Vehicle Name spans full width and is required. Brand, Model, Variant, Year, Stock ID, Internal ID are half-width. Notes spans full width. Footer shows “Step 1 of 4”, close, and Continue to photos.

Validation occurs on Continue and returns focus to the first invalid field. Draft values persist when navigating backward.

### 3.6 Upload Vehicle — Step 2, Upload Photos

Dropzone first, then ordered upload items. Each item exposes thumbnail, filename, upload status, remove, and reorder.

- Free: maximum 3 images per batch.
- Paid: maximum 20 images per batch.
- Formats: JPG, JPEG, PNG, WEBP.

Limit messaging is visible before a limit is reached. Reject unsupported files individually without discarding valid selections.

### 3.7 Upload Vehicle — Step 3, Customize

Four option rows in a two-column grid:

- Hide Number Plate
- Image Enhancement
- Studio Background
- Maintain Original Composition

Below: three background choices — Premium White, Dark Studio, Grey Studio — then two floor choices for the selected background: Plain background and Standard floor.

### 3.8 Upload Vehicle — Step 4, Review & Process

Two-column review area: 180px vehicle preview left; title, metadata, 2×2 summary, and credit estimate right. Summary includes image count, plate privacy, background, and enhancement. Include the assurance that originals are preserved and processing continues after navigation.

Primary button: Process Photos. On activation, close the modal, return to Inventory, and insert a medium processing card immediately without reload.

### 3.9 Live processing

Inventory remains visible. Global top-bar indicator reads “n vehicles processing” with a pulse plus text. Clicking opens the 340px processing panel.

New batch card begins at 0–12% with “preparing batch”; active examples include percentage, `processed / total`, and estimated time. Update card and panel from the same source of truth. When complete, cross-fade to processed hero, change status to Completed, and enable portfolio actions.

Cancellation is shown only while the server supports it; the UI must represent cancelling and cancelled states explicitly.

### 3.10 Portfolio

Page header: back to Inventory, completion date, vehicle title, brand/model, stock ID, image count, selected background. Actions: Edit Vehicle, Re-process, Download All as ZIP.

Main gallery per §2.19. Always provide Original and Processed labels, a draggable comparison, Set as Hero, Select images, Download image, and Full screen. Clicking either the `+14 / View all 20` tile or Enter full screen opens the full-screen viewer. Users can select any image 1–20 from the range slider or thumbnail rail without closing the viewer. Originals and processed images remain distinct assets.

On mobile, make the gallery swipeable and keep Download All easy to reach without obscuring bottom navigation.

### 3.11 Usage & Billing

Header with title, explanatory copy, and blue Upgrade plan action. Content grid `1.3fr .7fr`, 18px gap.

- Current-plan card: dark surface, plan name, description, 9px usage progress, used and remaining values.
- Quota stack: upload sessions and storage, each in bordered cards.
- Available Packs appears immediately below current usage and reuses the homepage three-card pricing system: Free, Studio Pack, and Studio Pro. Free is marked Current plan and disabled; Studio Pack keeps the dark Most Popular treatment; Studio Pro uses the blue upgrade action.
- Pack cards retain the same names, prices, limits, and benefits as the homepage. Do not maintain separate marketing and application pricing copy.
- The content area scrolls independently so all pack details and actions remain accessible within the application shell.

If a limit is reached, open a friendly upgrade modal. Never block access to existing inventory or downloads.

### 3.12 State library

Two-column grid of 260px state cards:

- Empty Inventory
- Loading skeleton
- Portfolio ready
- Partial failure with Review, Retry, Contact Support

Production maps the same patterns into Inventory and Portfolio rather than routing users to a dedicated state page.

### 3.13 Mobile Inventory

Reference frame 390×844. Header 64px; content `padding:19px 16px 80px`; bottom nav 68px.

Vehicle cards become a 138px image plus flexible body. Search and add action share a row. Filters scroll horizontally. Processing uses the same dimmed image, overlay percentage, count, and status text as desktop.

### 3.14 Mobile Portfolio

Reference frame 390×844. Top bar contains Back, vehicle name, More. Main image 360px high. Thumbnail rail scrolls horizontally. Metadata and secondary actions follow. A 48px Download All button is fixed 82px above the viewport bottom, clear of the 68px bottom navigation.

### 3.15 Upgrade modal

Trigger only after the user reaches a plan/session/image limit or deliberately selects Upgrade. Preserve all current vehicle details and selected images while it is open.

Header states the limit in plain language. Body compares Free with the relevant paid option. Primary action selects the recommended pack; secondary closes and returns to the existing work. Do not create urgency with countdowns or destructive language.

---

## 4. Rules

### 4.1 Inventory card density

The four-column 1440px inventory grid is a product invariant. Cards are medium, compact, and image-led. Never redesign them as oversized horizontal banners, single-column desktop cards, or editorial feature panels. Use the list toggle only for an explicit alternative view.

### 4.2 Vehicle → batch → processing → portfolio

Every processed image belongs to one image batch, and every batch belongs to one vehicle. Inventory surfaces vehicle/batch status; Portfolio surfaces completed original/processed assets. Do not create disconnected image jobs that cannot be traced back to a vehicle.

### 4.3 Originals are immutable

Never overwrite an uploaded original. Re-processing creates a new processed result or version. Comparison, rollback, individual download, and ZIP generation must always be able to reference the original.

### 4.4 Processing is background work

Navigation must never cancel processing. Progress is available from Inventory and the global indicator. The modal closes after Process Photos; it must not remain open as a blocking progress screen.

### 4.5 Status is redundant by design

Every status combines at least two non-colour signals: icon/dot, visible label, percentage, processed count, or action availability. “Blue card” or “red border” alone is never a valid status implementation.

### 4.6 Colour discipline

The interface is neutral-first. Blue means active processing, focus, or an intentional upgrade action. Green means completed/success only. Amber means warning/attention. Red means failure/destructive only. Do not use gradients or semantic colours as decorative styling.

### 4.7 Shadows

Borders establish most hierarchy. Use card shadow only on vehicle cards at extremely low opacity. Use lift shadow for selected/hovered marketing cards, panel shadow for overlays, and hero shadow for the comparison stage. Never apply multiple shadows or glow effects.

### 4.8 Radius discipline

Controls use 10px, standard cards 14–18px, modal 20px, major marketing imagery 22–26px, statuses/filters pill radius. Do not increase every surface to the largest radius; hierarchy depends on this scale.

### 4.9 Spacing: between vs within

- Marketing section padding: 84–96px vertical, 54px desktop horizontal.
- Application page padding: 30–32px.
- Modal content padding: 22–24px.
- Grid gaps: 14–18px.
- Card internal gap: 8–13px.
- Field gap: 14px.
- Inline controls: 5–10px.

Use layout `gap` for component-owned siblings. Do not create alignment with arbitrary whitespace or empty elements.

### 4.10 Button hierarchy

Use one primary forward action per decision group. Secondary buttons are alternate paths. Ghost buttons are navigation or low-stakes actions. Destructive styling is reserved for Delete, Cancel Processing where loss is possible, and confirmed destructive choices. Do not use a blue button merely to add visual variety.

### 4.11 Upload limits

Free users receive 3 upload sessions and a maximum of 3 images per batch. Paid users may upload up to 20 images per batch. Validate limits before transmission, show the remaining allowance, and never remove already uploaded valid work when rejecting excess files.

### 4.12 Counts are derived

Vehicle counts, image counts, processing counts, percentages, session usage, remaining credits, and storage values come from live state. Do not hard-code operational counts outside fixtures, Storybook stories, or the static prototype.

### 4.13 Grid overflow

Any grid/flex child containing truncated titles, galleries, tables, or upload filenames must set `min-width:0`. Thumbnail and filter rails own their `overflow-x:auto`. Application-level horizontal scrolling is prohibited at supported widths.

### 4.14 Typography

Sentence case everywhere. Uppercase is limited to eyebrow/micro labels with increased tracking. Manrope is used for interface and marketing copy. Monospace is limited to filenames and technical/internal identifiers. Multi-line marketing paragraphs cap at approximately 62ch and use balanced wrapping where supported.

### 4.15 Currency and locale

Prototype pricing uses Indian rupees and `en-IN` grouping: `₹1,499`, `₹3,999 / month`. These values are illustrative until commercial approval. Dates use `Sep 18, 2026` in compact metadata and `September 18, 2026` when written in full. Store dates in an unambiguous machine format and localize at render time.

### 4.16 Accessibility

Minimum production touch target is 44×44px on mobile. Focus is never removed, only restyled. Every icon-only action has an `aria-label`. Native buttons, links, inputs, and range controls are preferred. Modals trap focus, close on Escape when safe, and restore focus to the trigger. Progress changes are announced through a polite live region without announcing every percentage point. Contrast targets WCAG 2.2 AA. Motion respects reduced-motion preferences.

### 4.17 Image behaviour

Vehicle photography uses `object-fit:cover` for cards and `contain` where full vehicle visibility is required. Do not distort aspect ratios. Preserve the vehicle’s visual orientation unless the source requires correction. Processed assets must not crop meaningful vehicle edges when Maintain Original Composition is enabled.

### 4.18 Error recovery

Errors identify what happened, which images are affected, and the next safe action. Use Review, Retry, and Contact Support. Retrying failed images must not reprocess successful images unless the user explicitly selects a full re-process.

### 4.19 Responsive invariants

Desktop shows multiple compact inventory cards. Tablet reduces column count without inflating card anatomy. Mobile uses stacked cards, a full-screen upload flow, swipeable gallery, and easy downloads. Content order and action meaning remain consistent across breakpoints.

### 4.20 Prototype and production boundary

`StudioCar-AI.dc.html` is a static interaction prototype: it does not upload, persist, process, charge, or download real assets. Public image and font URLs are presentation dependencies only. Production replaces them with licensed assets, authenticated APIs, durable storage, asynchronous processing, observability, and approved pricing.
