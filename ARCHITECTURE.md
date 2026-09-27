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
