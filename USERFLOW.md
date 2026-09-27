# User flows

1. Overview → choose a historical sample → build assets with that sample → edit farm / handle → export PNG.
2. Overview → select an aroma color → filtered retail category → product detail → sample creative handoff when a historical panel exists.
3. Retail menu → tap attract screen → browse categories → sort and filter → inspect product or contextual education.
4. Retail menu → Data Editor → add/edit/delete a product → done → changes stay local through navigation and refresh.
5. Data Editor → Export / Templates → download current CSV → Import CSV → paste/upload → append or replace. Invalid input is rejected before applying a partial import. Stable IDs update matching records when appended.
6. Education → choose one of nine pieces → print current or all. Quiz → choose aroma preferences → result → browse matching aroma in the retail module.
7. Portfolio → read case study → download PDF, screenshots, social examples, or complete ZIP.

Empty states: categories without matching items show the source empty state. Bad CSV returns row errors. Storage failure shows an export reminder. A render failure shows a reload action. Unknown suite routes return overview. No login or checkout flow is implied. Source kiosk inactivity returns to its attract screen after 60 seconds; operator editing pauses that timer.
