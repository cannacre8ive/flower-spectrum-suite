# Changelog

## 3.0.0 — 2026-09-26

- Replaced generic profile icons with the ten-sector fingerprint and spectrum band across the active asset library and downloadable reference cards.
- Added local PDF text extraction, scanned-PDF/image OCR, and table-aware CSV import with editable source rows, explicit units, total reconciliation, 95% modeled-coverage gate, and human confirmation.
- Connected reviewed panels and optional flower photographs to six social formats and chemovar PNG/PDF exports.
- Limited digital menus, print menus, and label selection to flower while retaining older non-flower records in storage.
- Replaced the PDF iframe with an automatically refreshed, paged canvas rendering of the actual label PDF.
- Added farm, buyer, and staff walkthroughs; buyer aroma/terpene search, shortlist CSV, and shortlist-to-print handoff.
- Bundled OCR runtime and English data locally; uploaded reports and photographs are not sent to an extraction service.


## 2.0.0 — 2026-09-26

- Integrated the full supplied 38-terpene classifier, spectrum/detailed fingerprints, comparison, and shared catalog save/update.
- Added a working print menu studio with measured pagination, five categories, staff picks, deals, and 48 reference cards.
- Added true PDF Avery 6464 labels with copy order, six-slot pagination, partial-sheet start position, and stale-preview invalidation.
- Created PNG profile cards and editable SVG icons for all ten profiles.
- Preserved four newly supplied sources verbatim; wholesale portal retained as reference.
- Unified print/digital pricing and catalog adapters; expanded CSV backups to include raw terpene panels and print metadata.
- Fixed tag duplication, unclassified row omission, manual-profile handling, and print footer duplication found during integration.
- Verified 900 distinct products across portrait and landscape; exported portrait PDF contains all 900 once.

## [1.0.0] - 2026-09-26

### Added
- Connected suite overview, global navigation, portfolio case study, and downloadable asset collection.
- Shared profile library, extracted sample classifier, and historical sample links across menu and creative studio.
- Local catalog persistence, local branding persistence, source checksums, and regression checks.
- Bundled fonts and export dependency; GitHub and Vercel release configuration.

### Changed
- Adapted all three supplied prototypes without replacing their original archived source.
- Social PNG exports now use the declared native pixel sizes.
- Comparison title describes aroma differences without implying the chosen historical samples have identical THC.
- Historical source limitations and demo values are made explicit.

### Fixed
- Explicit creative-canvas dimensions correct blank source previews and distorted PNG exports.
- CSV round trips now preserve stable IDs, flavor, illustration flags and source-band fields.
- Invalid CSV inputs fail before partial application.
- Expired sample sales stop displaying discounted product cards.
- Added responsive layouts, including narrow chemovar tables, and cross-module preference and sample links.
