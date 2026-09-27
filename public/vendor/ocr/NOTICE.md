# Local OCR runtime

Tesseract.js 7.0.0, Tesseract.js Core 7.x and English trained data are bundled from npm dependencies for on-device report reading. The app sends no uploaded report or image to a remote OCR service.

- https://github.com/naptha/tesseract.js — Apache-2.0
- https://github.com/naptha/tesseract.js-core — Apache-2.0
- https://github.com/naptha/tessdata — Apache-2.0 English trained data

See LICENSE and the respective upstream project for notices. Files are copied unchanged from the installed packages. Core variant selection is performed by the bundled worker.
