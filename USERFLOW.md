# User flows

1. Overview → choose a historical sample → build assets with that sample → edit farm / handle → export PNG.
2. Overview → select an aroma color → filtered retail category → product detail → sample creative handoff when a historical panel exists.
3. Retail menu → tap attract screen → browse categories → sort and filter → inspect product or contextual education.
4. Retail menu → Data Editor → add/edit/delete a product → done → changes stay local through navigation and refresh.
5. Data Editor → Export / Templates → download current CSV → Import CSV → paste/upload → append or replace. Invalid input is rejected before applying a partial import. Stable IDs update matching records when appended.
6. Education → choose one of nine pieces → print current or all. Quiz → choose aroma preferences → result → browse matching aroma in the retail module.
7. Portfolio → read case study → download PDF, screenshots, social examples, or complete ZIP.

Empty states: categories without matching items show the source empty state. Bad CSV returns row errors. Storage failure shows an export reminder. A render failure shows a reload action. Unknown suite routes return overview. No login or checkout flow is implied. Source kiosk inactivity returns to its attract screen after 60 seconds; operator editing pauses that timer.

## Classify to publish

1. Open Classifier. Use a supplied preset or load a catalog product and enter its panel.
2. Inspect the spectrum/detailed fingerprint and optionally pin up to four panels for comparison.
3. Save or update the catalog product. Set price and product details in either menu's editor.
4. Open Digital menu and browse the product's profile, or open Print menu and choose the flower menu.
5. For print, choose Menu, Staff Picks, Deals, or Aroma Cards. Set format and header, review every page, then print/save PDF at 100%.
6. For labels, choose products and copies. Set the first label slot for a partially used sheet. Generate, review, download, and print at Actual size.
7. Profile assets offers all ten PNG cards/SVG fingerprints individually and as a ZIP. Export the full catalog CSV to back up edits.

## Version 3: primary users

### Farm / cultivator

Open Workflows → I grow flower. Upload a flower photo and PDF, CSV, or PNG/JPG/WebP lab panel in Upload & create. Select the terpene page if the report contains multiple pages. Review the original names and result values; correct extraction, map only supported compounds, and exclude non-analyte or duplicate metadata explicitly. Confirm the reported total and review checkbox. Save, then open Social studio for the exact flower, adjust branding, and export social PNGs or a chemovar PNG/PDF. Download the reviewed JSON record to preserve the review audit and photograph. Share the original COA separately with the buyer.

### Flower buyer

Open Workflows → I buy flower. Pick an aroma profile and optionally a specific compound and minimum concentration. The catalog sorts by relative aroma score; numerical terpene filters require a panel. Review the source labels and compare fingerprints. Shortlist candidates, export CSV for purchasing notes, and use Build this print menu to pass only the shortlist into Print menu. Enter actual prices and verify the source report, batch availability, and commercial terms separately. This catalog is local, not a live marketplace.

### Retail staff / budtender

Open Workflows → I help customers. Begin with an aroma preference, use the flower-only digital menu to explore matches, then show the fingerprint and band on the corresponding shelf label. Education and profile references explain the common visual vocabulary. Labels now show a clean, automatically refreshed rendering of the actual PDF, including page navigation for multiple sheets.

Existing non-flower records remain stored but are hidden from the flower menu, print-menu editor, and label selector. Reference art isolates a profile sector; it does not pretend to be a measured product panel.
