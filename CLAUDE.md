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
- Layout B (current): every section is a full-width band; media and cards have square corners. Chapter colours follow the shells: Sit & stand white, Get back-up Graphite `#3A3A3C`, Walk Sky `#CFE6EE`, Rollerskate black, Grab & carry orange, Teach it new tricks Cream `#F4E7CE` with white step cards. Implemented as the "Layout B" block at the end of `styles.css`, overriding the exported inline styles.
- Buttons: fully rounded pills. Hover = orange fills up from the bottom in 5 steps (`steps(5,end)`), text turns black.
- Sticky "Pre-order now" (`.glass`): iOS-style frosted glass pill (backdrop blur + saturate, bright rim, top highlight). `main.js` adds `.on-dark` over dark bands and videos (darker glass, white text). Desktop: top right, placed right inside `.site-d`, outside the nav (the nav's backdrop-filter would break `position: fixed`). On mobile it floats bottom right and docks at the end of the "Pick your colour" section. Two orange footprints inside appear one after the other.
- Hero duck: `assets/js/scrub.js` plays the frame sequence in `assets/media/sit-quack/` (120 WebP frames, 1440px, 3.3 MB) once on a canvas when the page opens: the duck sits down and quacks, at `FPS` 30. Frames download 6 at a time; playback starts as soon as the rest will arrive in time (min `BUFFER` 12 frames), waits on a missing frame instead of skipping, skips failed frames, only plays while the tab and hero are visible, and frees all but the last frame afterwards. Canvas resolution is capped at what the 1440px frames can fill. Desktop (`data-mode="pass"`): full-width canvas (CSS aspect-ratio 25:15.04), duck at `SCALE` 0.64 with soft edges and the empty top strip (`TOP_CROP` 0.06) cut off. Mobile (`data-mode="pin"`): screen-high stage, duck zoomed to fill the width (`M_FILL`). To swap the clip: `ffmpeg -i clip.mp4 -vf scale=1440:1440 -c:v libwebp -quality 74 assets/media/sit-quack/%03d.webp` and update `FRAMES`. Reduced motion shows the first frame only and downloads nothing else. The earlier scroll-scrubbed version is in git history (commit 1cfa2dc).
- Loading: the first hero frame is preloaded in `<head>`; videos (`preload="none"`) start loading only after the duck's frames are in (`duck:loaded` event), the first scroll, or 4 s, then each one loads when within 600px of the screen and pauses off screen (`main.js`). Images are WebP/JPG with `loading="lazy"` and width/height set. Keep new images as WebP (~q90) and new videos `preload="none"` with `data-src`.
- Top navigation (`.hero-nav`) is sticky inside the hero, so it stays visible until you scroll past the duck; it gets a frosted background once scrolled.
- Tagline under the hero logo types itself out behind an orange block cursor, cycling five lines.
- Motion respects `prefers-reduced-motion`.

## Page sections (in order)

Hero → function chips (5) → Sit & stand → Get back-up → Walk → Rollerskate → Grab & carry (orange band) → Teach it new tricks (4 steps, simulator video, "Launch the simulator") → Pick your colour (colourways photo, labels under each duck) → Upgrade your duck (accessories, 4 items, €39 each) → footer.

## Open items

- Price consistency: tagline says "€399" and "800 g"; buttons say €340; Pollen's spec sheet says 780 g.
- "Launch the simulator" links to https://huggingface.co/spaces/pollen-robotics/microduck-simulator
- Pre-order buttons currently jump to the colours section; there is no checkout.
