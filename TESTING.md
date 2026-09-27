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
