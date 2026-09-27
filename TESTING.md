# Verification

Run `npm run check` before release. Nine automated checks cover original-source hashes, shared profile identities, classifier parity against the original implementation, empty/unmodeled panels, three-segment source/menu consistency, quoted multiline CSV, full catalog field round trips, invalid imports, and sample-sale expiry.

## Browser checks completed

- Overview, retail, education, and embedded social views checked at 320, 390, 768, and 1440px without document-level horizontal overflow. Detailed chemovar cards also verified at 320px after a grid/table fix. Narrow navigation rows deliberately scroll horizontally.
- All five retail categories plus staff picks, flash sale, and Learn opened. Price sorting and aroma filtering exercised.
- Added a temporary product, reloaded, exported CSV, rejected invalid replacement, and removed the temporary record; catalog restored to 20 sample products.
- Historical product detail handed off to the corresponding social sample.
- All nine education tabs displayed one active piece. Gas preference path opened `#menu?profile=gas_fuel`.
- Primer PDF rendered as one Letter page and visually inspected after a print background fix.
- Social strain selection and branding persistence verified. All six PNG downloads generated at declared native dimensions. Three chemovar cards and guide tab checked.
- Blank source canvas / distorted export defect fixed by assigning native canvas width and height before preview scaling. Exports visually reviewed.
- Four-page case study PDF rendered, page count checked, and every page visually inspected.

## Release checks

Verify the final stable domain and asset URLs without authentication, inspect metadata, and check production browser errors. Check source manifest and `git diff --check` before pushing. See `documentation/RELEASE-VERIFICATION.md` for the completed release record.

## Limitations

Chromium-based verification only. No exhaustive assistive-technology certification, physical tablet testing, live POS access, independent scientific validation, or retail approval. Full education set uses source pagination rules; longer references may span pages. PNG text remains rasterized; source HTML/JSX is editable. No claim of Safari/Firefox or printer-driver coverage.

## Version 2 validation

Sixteen automated checks now include source parity against every row of the supplied 38-terpene model, modifier handling, invalid numeric panels, product adapter fidelity, raw-panel CSV backup, PDF ordering, partially used sheets, Letter geometry, and every catalog category in a real jsPDF document.

Browser workflows are recorded in `scripts/verify-connected.cjs`, `verify-production.cjs`, `check-print-edit.cjs`, and `stress-print.cjs`. They exercise classifier save → digital browse → print → labels; comparison and detailed mode; all print categories, staff picks and deals; 48 reference cards; stale label preview invalidation; price edits; all nine routes at 320px; and 900-product portrait/landscape pagination. Scripts use the Playwright CLI against local port 5178 and restore temporary catalog data. They are integration verification helpers, not automatically run by `npm test`.

The 900-product fixture produced 90 portrait pages and 65 landscape pages, with exactly 900 unique rows and zero measured vertical overflow. PDF text extraction independently found all 900 products exactly once in the portrait export. Sample PDFs are under `output/pdf/` and included in the portfolio kit; stress fixtures remain ignored under `output/playwright/`.

Physical printer calibration has not been tested. Print at Actual size / 100%, verify alignment on plain paper, and adjust printer-specific settings before using stock. Browser PDF exports and label geometry were verified.
