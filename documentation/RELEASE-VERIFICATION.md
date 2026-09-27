# Release verification — 2026-09-26

- Stable demo: https://flower-spectrum-suite.vercel.app
- Repository: https://github.com/cannacre8ive/flower-spectrum-suite
- New isolated local project: `/Users/spencergray/devOS/flower-spectrum-suite`
- Original `flower-spectrum-studio` project left unchanged.

## Evidence

`npm run check`: 9/9 automated checks passed and production build succeeded. Dependency installation reported no known vulnerabilities at release. Source-preservation assertions compare SHA-256 and byte counts for all three supplied inputs.

Production Chromium walkthrough: overview, filtered retail menu, education, social studio, and portfolio all loaded without page errors or failed HTTP requests. The product detail-to-social handoff selected Jelly Breath, and the quiz-to-menu handoff selected Gas / Fuel. Eight portfolio download links present. The full kit downloaded successfully through the live interface.

All six creative canvas sizes match their declared dimensions, and their content containers fit within the native canvas. Four squares are 1080 × 1080, the story is 1080 × 1920, and the fingerprint is 1080 × 1350. The social-preview image is 1200 × 630 and the portfolio cover is 1600 × 1000. The case study is four pages; the primer is one page. ZIP integrity passed.

Responsive checks: overview, retail, education and social shell at 320/390/768/1440px; portfolio and detailed chemovar cards at 320px. Document width equals viewport width. Scrollable navigation rows are intentional. Final screenshots were captured from the stable production URL.

HTTP verification includes the main HTML, social HTML, favicon, robots, sitemap and all portfolio files. Full results with byte comparisons are in `live-http-verification.json`. Social metadata includes canonical, Open Graph, Twitter, image dimensions and alt text. The site is publicly accessible without authentication and has no `noindex` directive. Third-party social preview debugger caches were not tested.

## Remaining scope

No retail sign-off, independent review of supplied scientific/educational copy, original-lab-document verification, live data integration, cloud sync, or production authentication. No performance outcomes are fabricated. See TESTING.md and ROADMAP.md.
