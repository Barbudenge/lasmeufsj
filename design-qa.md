# CrucibleCam design QA

- Source visual truth: https://barbudenge.github.io/lasmeufsj/engrenarium/
- Implementation: http://127.0.0.1:4173/camforge/ and http://127.0.0.1:4173/camforge/pt-br/
- Browser evidence: Codex in-app browser, tab 1, full-page captures produced during this task.
- Desktop viewport/state: default desktop viewport, light theme, English; source capture 1254 × 4753 px, implementation capture 1254 × 3516 px, device scale factor 1.
- Mobile viewport/state: 390 × 844 CSS px, light theme; source capture 375 × 6909 px, implementation capture 375 × 5884 px, device scale factor 1.
- Density normalization: source and implementation were captured in the same browser at the same device scale factor. Heights intentionally differ because the CrucibleCam brief removes the video/YouTube section and reduces What's New to version 1.0.

## Full-view comparison evidence

The source and implementation captures were emitted together in one browser comparison pass in this order: Engrenarium desktop, CrucibleCam desktop, Engrenarium mobile, CrucibleCam mobile. The implementation preserves the source header, hero grid, download band, long-form feature list, screenshot grid, licensing header and CTA, Pro card, license plan card, What's New band, contact block, legal card, typography, colors, borders, radii, shadows, and responsive stacking. Product-specific copy, logo, screenshots, download controls, version history, checkout URL, and the explicitly omitted video section account for the content differences.

## Focused comparison evidence

- Header and hero: matched desktop two-column composition and mobile stacked layout using the same shared stylesheet and source components.
- Screenshot gallery: all four CrucibleCam images loaded at their native 1920 px widths and expand in the lightbox.
- Pricing: matched source card hierarchy, five plan rows, prices, responsive wrapping, and gold checkout CTA.
- Legal: visually inspected the Portuguese Terms page at 390 × 844 CSS px; the table of contents, metadata badges, legal cards, and all nine clauses render without horizontal overflow.

## Findings

- No actionable P0/P1/P2 differences remain.
- Intentional differences: no video/YouTube section; CrucibleCam-specific product copy and assets; only version 1.0 in What's New.

## Required fidelity surfaces

- Fonts and typography: same inherited families, weights, sizes, line heights, headings, labels, and responsive wrapping as the Engrenarium template.
- Spacing and layout rhythm: same container widths, section spacing, hero grid, cards, screenshot grid, plan rows, radii, and shadows; no mobile horizontal overflow.
- Colors and visual tokens: same shared CSS tokens, light/dark theme behavior, borders, muted text, and gold licensing CTA.
- Image quality and asset fidelity: source CrucibleCam logo plus the four supplied PNG screenshots; no placeholders, generated substitutes, or code-drawn assets.
- Copy and content: checked English and Portuguese product copy, Pro lists, five license options and prices, version 1.0 release note, Brazilian discount notice, download filename, and legal terms.

## Interaction and runtime checks

- Screenshot lightbox opens and closes.
- Dark and light theme controls update the page theme.
- English/Portuguese routes and Terms routes resolve.
- Download URL, manifest URL, screenshot assets, and local pages respond successfully.
- Browser console checked on desktop main page, mobile Portuguese page, and mobile Terms page: no errors or warnings.

## Comparison history

1. Initial mobile capture found the screenshot images had not loaded in the full-page state.
2. Removed deferred loading from the four gallery images on both language pages.
3. Re-captured at the same 390 × 844 viewport; all four images reported complete with native dimensions and rendered correctly.

## Implementation checklist

- [x] Desktop and mobile match the Engrenarium template.
- [x] Portuguese and English content complete.
- [x] Download, version manifest, screenshots, licensing, Terms, and lightbox present.
- [x] No video or YouTube content in the CrucibleCam tree.
- [x] No console errors or horizontal overflow.

## Follow-up polish

- No P3 items identified.

final result: passed
