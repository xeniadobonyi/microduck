# Microduck homepage — project notes

Concept homepage for the Microduck open-source duck robot (Pollen Robotics / Hugging Face). Static site: no build step, no framework.

## Structure

- `index.html` — the whole page. It contains two layouts side by side:
  - `.site-d` — desktop layout (12-column grid)
  - `.site-m` — mobile layout (single column, max 480px wide)
  - CSS switches between them at `max-width: 760px`.
- `assets/css/styles.css` — shared styles (fonts, grid, button hover, animations).
- `assets/js/main.js` — lazy-loads the videos for the visible layout, runs the typing tagline, toggles the mobile menu, and fits the mobile logo to the screen width.
- `assets/media/` — photos and looping videos.

Most styling is inline on the elements (the page was exported from a design canvas). When refactoring, move repeated inline styles into classes in `styles.css`.

## Design system

- Fonts (Google Fonts): **Orbitron** for headlines and the `microduck` wordmark, **Exo 2** for everything else.
- Colours: ink `#111111`, background `#FFFFFF`, accent orange `#F26B1D`, warm beige panels `#EDE8E2` / `#F4F1EC`, colourway section `#FAF8F3`.
- Colourways: Cream `#F4E7CE`, Graphite `#6C6A68`, Lavender `#BCAACC`, Sky `#B3DAE6`.
- Grid (desktop): 12 columns, 24px gutter, 64px side margins, max width 1440px. Vertical rhythm in multiples of 8px.
- Buttons: fully rounded pills. Hover = orange fills up from the bottom in 5 steps (`steps(5,end)`), text turns black.
- Sticky "Pre-order now": black pill with an orange outline on desktop (top right). On mobile it floats bottom right and docks at the end of the "Pick your colour" section. Two orange footprints inside appear one after the other.
- Tagline under the hero logo types itself out behind an orange block cursor, cycling five lines.
- Motion respects `prefers-reduced-motion`.

## Page sections (in order)

Hero → function chips → Sit & stand → Get back-up → Walk → Yes / No → Rollerskate → Grab & carry (orange block) → Teach it new tricks (4 steps, simulator video, "Launch the simulator") → Pick your colour (colourways photo, labels under each duck) → Accessories (4 items, €39 each) → footer.

## Open items

- Price consistency: tagline says "€399" and "800 g"; buttons say €340; Pollen's spec sheet says 780 g.
- "Launch the simulator" links to https://huggingface.co/spaces/pollen-robotics/microduck-simulator
- Pre-order buttons currently jump to the colours section; there is no checkout.
- Yes / No still uses an animated crop of the hero photo; a real clip would be better.
