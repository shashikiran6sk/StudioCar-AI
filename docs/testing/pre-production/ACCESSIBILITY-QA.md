# Accessibility QA

Shared primitives have labelled controls, keyboard/focus and dialog tests in Vitest. Existing Playwright queries use accessible names and check visible sign-in/profile/inventory controls; mobile drawer tests and local exploratory invalid-input/cancel behavior provide limited browser evidence. Homepage comparison is a native labelled slider.

No full axe/WCAG audit, contrast matrix, NVDA/VoiceOver, browser zoom/reflow, mobile keyboard occlusion or all dialog focus-restoration paths were executed. Component assertions are not a whole-product accessibility certification. UX canonical checks without a mapped exact assertion remain BLOCKED. Human UAT explicitly covers Tab, Shift-Tab, Enter, Escape, labels, validation and focus around uploads/linking.
