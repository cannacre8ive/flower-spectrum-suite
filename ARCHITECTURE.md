# Architecture

Vite + React, with two Vite HTML entries. The main app provides navigation, a catalog provider, the portfolio presentation, retail module, and education module. The social studio runs in an iframe using its own source layout and print styles; it imports the same ES modules for profile identities, sample data, and classification. This keeps the original creative canvas isolated while sharing actual data and branding conventions.

```
source/                 Exact supplied inputs + SHA-256 manifest
src/data/               Shared profiles, terpene library, strains, product seeds
src/lib/                Classifier, CSV utilities, local catalog provider
src/components/         Shared fingerprint visualization
src/modules/            Adapted tablet menu, education library, social studio
src/App.jsx             Suite navigation, overview, portfolio and handoffs
public/assets/          Downloadable portfolio files served by the demo
portfolio/              Editable case study, captions, asset guide
output/pdf/             Final PDFs
documentation/assets/   Repository screenshots
tests/                  Source, classifier, catalog and CSV regression checks
```

Routes: `#overview`, `#menu`, `#education`, `#social`, `#portfolio`. `#menu?profile=earthy_dank` filters the menu. `#social?strain=jb` selects a historical social sample. `#education?piece=quiz` opens the aroma quiz. `social.html` is the secondary Vite entry.

The catalog uses `localStorage` key `fs-suite-catalog-v1`. Branding uses `fs-suite-brand`. No data is transmitted to a server. Changes do not synchronize between separate devices; export CSV for portable catalog backups. Historical source panels remain fixed; editing catalog merchandising does not rewrite historical laboratory examples. If a modeled catalog aroma is manually changed, its historical source association is cleared.

The compact classifier is extracted from the supplied social kit. The education library contains a broader terpene reference; the app does not pretend that the compact classifier models all education entries. Unsupported source analytes stay visible in raw sample tables. Model score percentages describe relative aroma weights, not measured terpene percentages or predicted effects.

No backend or application API endpoints. Fonts and export dependencies are bundled locally. Export uses html-to-image at native template dimensions. Print uses browser CSS.

## Version 2 production tools

The full 38-row model lives in `src/data/engine-terpenes.js`; `src/lib/classifier.js` applies the supplied classifier's raw-score sort, modifiers, Gas/Fuel balance term, and confidence thresholds. Historic sample percentages remain unchanged; equal rounded percentages now sort by unrounded score. `product-model.js` adapts the canonical catalog for print and labels, preserving unknown panel keys. The classifier displays unmodeled entries and modeled versus entered totals. No PDF laboratory ingestion is claimed.

`CatalogProvider` is shared by classifier, digital menu, print menu, and labels. Operator-entered profiles remain separate from model-derived panels. `PrintPages.jsx` measures cloned source designs at final physical dimensions, places whole rows/cards into columns, and repeats group headers and page furniture. Page counts reflect content and selected format; a too-tall item produces an explicit warning. `labels.js` draws vectors into inch-based jsPDF pages with six slots and an optional first-sheet offset. Blob URLs are revoked and stale previews cleared whenever inputs change.

CSV backup includes raw `Values`, `Tags`, `PrintPrice`, `GrowMethod`, IDs, and provenance. Label stock uses the coordinates in the supplied source. Physical printer registration requires an actual test sheet.

## Version 3 import and handoff

`coa-import.js` is a pure table-aware parser and validation module. Explicit aliases in `coa-aliases.js` derive from the local FS COA Classifier v1.1; no fuzzy compound guessing is used. Original labels, result strings, units, zero/nondetect rows, included/excluded state, and separately reported totals are retained in review records. Isomer rows remain separate while canonical contributions aggregate internally. A reviewed upload requires at least two positive modeled compounds, a row-sum/reported-total difference of at most 0.02 percentage points, and at least 95% modeled mass coverage. Human confirmation is mandatory for every upload, including OCR.

`extract-report.js` uses PDF.js for text geometry and rendering, and Tesseract.js for scanned PDF/image OCR. Multi-column text and multi-line mass/unit headers are supported. The page with the strongest terpene signal is proposed; the user can select another page. PDFs are limited to 20 pages / 25 MB. OCR and English language assets are bundled under `public/vendor/ocr`; reports are not sent to an external extraction service. Optional photos are resized locally to 900px and stored as JPEG data URLs. Original PDFs remain in memory only during review.

The catalog retains reviewed provenance and a photo. `social-catalog.js` adapts user flower records into the preserved social template structure alongside historical samples. Editing canonical concentrations invalidates a previous review status while retaining its provenance. Exportable JSON preserves the reviewed record; menu CSV does not include photos or the full review audit. There is no cloud sync or shared supplier database.

`PDFPreview.jsx` renders the same label PDF blob that is downloaded. Pagination and canvas rendering replace browser PDF chrome. `useFlowerCatalog` filters the active retail/print views while preserving non-flower records on edits or replacement. Workflows provides role-specific walkthroughs and local buyer search; shortlist IDs are passed explicitly into Print menu.

Runtime references: [PDF.js API](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib.html), [Tesseract local installation](https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md). Bundled third-party assets retain their upstream licenses and notices.
