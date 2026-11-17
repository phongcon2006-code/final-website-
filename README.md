# Dong Ho — The Living Printmaking Studio

A floating gateway to a living tradition. Discover the stories, explore the symbols, and create something of your own.

## Open locally

Double-click **HomePage.html**. Keep this folder's HTML, JavaScript, CSS, and `assets` files together. No installation, build, account, server, CDN, or network connection is needed. Research links require internet access when opened.

`index.html` is a second entry point for static hosting. All five original HTML destinations remain available.

## Project files

The main folder has one browser script, `app.js`, and one stylesheet, `styles.css`. Each contains named sections for the original features, in their original loading order. Edit those sections directly; no bundling command is required. Keep section markers intact so the focused verification scripts and asset generators can locate them.

The six HTML entry files keep their existing names. Artwork and credits live in `assets/`. Build and verification scripts live in `tools/`; `.qa/` contains optional development dependencies and browser diagnostics and should be excluded from distribution.

To regenerate the HTML entry files, run `node tools/build-pages.cjs`. `node tools/build-art.cjs` refreshes the three SVG studies and their data section inside `app.js`. `node tools/build-inspiration.cjs` checks the local photo catalog. See [QA.md](QA.md) for verification commands.

## Four bubbles, four experiences

All five pages now share one warm-paper interface palette and the same sticky header. The logo, navigation, Sound, and Aa controls keep the same layout at a given viewport width. The desktop menu is 590 × 64 CSS pixels with 16px labels. Aa enlarges page content while keeping the header compact, including when local HTML pages have different saved text-size preferences. The menu stays at the top while scrolling; Escape closes the mobile menu and returns focus to its button. Header height is measured after resizing or changing text size, so chapter controls, drawing guidance, and the homepage story sit below it.

| Homepage bubble | Destination | What to do |
|---|---|---|
| History | `HistoryPage.html` | Read six open illustrated stories, listen, and explore their source notes. |
| Art & Symbols | `ExplorePage.html` | Zoom into three study paintings, select numbered details, and compare interpretations. |
| Create | `WorkshopPage.html` | Start an original drawing on blank paper, use the optional guide, or switch to the printing lesson. |
| My Gallery | `ExhibitionPage.html` | Revisit the latest completed artwork, export a PNG, and take the reflection quiz. |

The homepage preserves the floating-sphere composition of the user-supplied [Angelo reference](https://angelo.so/). Four objects sit in softly shaded earth-red, indigo-gray, jade, and ochre spheres against warm paper. Labels and descriptions remain visible at every size. The layout uses four staggered columns on desktop, two on tablets, and a compact alternating sequence on phones. The Art & Symbols sphere contains an authentic museum photograph; the other objects remain contemporary illustrations.

Selecting a bubble briefly expands its color into the destination. Ordinary links still work with keyboard navigation, Ctrl/Cmd-click, middle-click, and context-menu opening. Reduced motion or Pause motion skips expansion. The motion control pauses floating animation, pointer drift, and the printing story. Changes to the device's reduced-motion setting take effect immediately. Every feature page includes **Back to the studio**.

## One impression at a time

Below the spheres, four short passages explain prepared paper, the first red impression, successive colors, and the final black contours. A sticky teaching illustration follows the passages on wide, tall screens; four stage buttons provide direct navigation. Phones, short viewports, paused motion, reduced motion, and browsers without IntersectionObserver show the complete static sequence. All passages remain available to narration.

The illustration has separate color fills and black contours, independent of the workshop simulation. Its final passage includes the complete **Mouse Wedding** museum photograph by **Daderot**, licensed CC0, alongside a clear reconstruction note. Images and the paper-fiber texture are bundled locally. See [artwork credits](assets/ARTWORK-CREDITS.md) for provenance and sources.

## A history you can settle into

The six chapters cover:

1. A village becomes a printing tradition.
2. Pictures for a new year.
3. Paper, shells, plants, and carved wood.
4. A craft through changing times.
5. Families carrying the blocks forward.
6. Recognition—and the work ahead.

Each includes a 70–90-word introduction and a 160–220-word deeper story, both displayed openly on a paper-like page. Numbered bookmarks navigate on desktop; a compact chapter chooser serves phones. Illustrations, reconstruction captions, reflection prompts, and previous/next controls remain.

One **Read / Listen / Sources** bar accompanies the story. Listen reveals play/pause, resume, stop, and **Follow the words**. The visible story is the complete narration transcript; History has no separate transcript or deeper-story disclosures. Sources opens one modal panel with publisher/date records and reconstruction notes. Close it with its close button, Escape, or a click outside; focus returns to the opening control.

The history uses Tu Thi Loan's research, Vietnam Pictorial reporting, VNA's April 2024 gallery report, UNESCO's 2025 decision, and additional institutional and reported sources. The exact founding year is not invented. Symbolic interpretations are qualified, historical statistics are not presented as a current census, and the 2025 inscription is distinguished from the later certificate ceremony. The designation is the **List of Intangible Cultural Heritage in Need of Urgent Safeguarding**.

## Draw freely, with guidance if you want it

Create opens in **Draw your own** mode. Use a mouse, finger, or stylus on the blank canvas. Choose a pen, pressure-sensitive brush, or eraser; select a palette or custom color; adjust stroke size and paper tone. There is no visible grid, snapping, or required template. Undo/redo recover strokes, and clearing the paper can be undone.

The optional guide starts with **Study Đông Hồ**: complete, credited museum photographs of **Mouse Wedding** and **Rooster and Hen**, each accompanied by five illustrated drawing lessons. The photographs stay separate from the explicitly labeled simplified drawing studies. Existing guide selections and progress are restored. Both photographs are bundled locally; see [artwork credits](assets/ARTWORK-CREDITS.md).

Choose **Find inspiration** for six photographs from Tranh Dân Gian Đông Hồ / Vinart Store, used with the user's confirmed permission. The 18 generic choices have been replaced by three photographic choices per mood. Each painting has five short drawing lessons. **Enlarge reference** opens a keyboard-accessible viewer with Fit, zoom, scroll/touch panning, credits, and Escape dismissal. The shop photographs are distinct from the CC0 museum references.

| Mood | Drawing examples |
|---|---|
| Joyful | Gà Đại Cát · Vinh Hoa · Phú Quý |
| Calm | Đàn Lợn Âm Dương · Chăn Trâu Thổi Sáo · Phú Quý |
| Sad | Chăn Trâu Thổi Sáo · Vinh Hoa · Phú Quý |
| Energetic | Gà Đại Cát · Đám Cưới Chuột · Đàn Lợn Âm Dương |
| Reflective | Đám Cưới Chuột · Chăn Trâu Thổi Sáo · Vinh Hoa |
| Not sure | Gà Đại Cát · Đàn Lợn Âm Dương · Chăn Trâu Thổi Sáo |

Mood associations are optional inspiration, not traditional interpretations or emotional assessments. **My own idea** remains independent. Brush suggestions, optional read-aloud, guide hiding, and keyboard controls remain available. Choosing a reference never adds or traces marks. Old generic example IDs map by mood-card position to their photographic replacement and begin at step one; existing drawings, titles, papers, and undo history remain unchanged. Museum selections retain their progress. The guide is scripted rather than a live instructor.

Completed drawing strokes are cached on a transparent canvas; each pointer frame copies that cache and renders the current stroke. Undo, Redo, Clear, and restored drawings rebuild it. Exports continue to replay the original vector record. Each completed stroke saves once. Metadata updates immediately in memory, persists after 300ms of quiet, and flushes on dialog dismissal, navigation, export, page hiding, and teardown. All references are local: six shop thumbnails total 127,711 bytes; full photographs load only when selected or enlarged.

**Title & name**, **Download PNG**, and **Exhibit my artwork** stay in a pinned bottom bar. Naming opens a dialog with autosaving, Done, Escape, and return focus; the guide's final step opens the same dialog. Export actions become available after the first stroke. The bar's measured height reserves page space, and focused content is revealed above it. Keyboard-help access sits immediately below the tools, before the canvas.

Original artwork can be reopened from the gallery for editing. The latest original drawing and the latest completed print are stored separately; the selected kind is shown in the gallery. This is not a multi-artwork collection.

For keyboard drawing, focus the canvas with Tab. Space/Enter lowers or lifts the pen, arrows move it, Shift increases movement, and Escape lifts. Ctrl/Cmd + Z undoes; add Shift to redo. Toolbar and export controls remain keyboard-accessible.

## Learn to print

Switch Create to **Learn to print**. Select a study, prepare the paper, inspect the five pigments, and align each color block before pressing. Use dragging, arrow controls, arrow keys, or **Align to guides**. Misalignment or an out-of-order block leaves the paper unchanged and explains recovery. Undo removes the last impression. Black contours complete the study before its reveal and download.

Alignment controls and the Print button now share one panel beside the canvas, or directly beneath it on mobile. Fixed paper corners and a dashed moving outline use the same paper-sized wrapper. Print becomes available only when the block is in sequence and within 4 px on both axes. Each new impression still requires manual alignment in both modes.

The preview uses explicit per-fill and per-stroke pigment assignments from the original SVGs. At 0/5 it shows only prepared paper; pale animal fills no longer leak through before printing. Pale ochre fills join the yellow stage, ivory details join the white stage, and black marks wait until the final pass. The fifth stage and exported artwork retain the original complete SVG. Older asynchronous previews cannot overwrite a newer stage or a different selected painting.

Guided mode enables the next block; independent mode permits a choice and explains order errors. The simulator is an educational adaptation using digital masks, not recovered historical woodblocks. It does not model real pigment chemistry, pressure, drying, or paper deformation. Its green-toned plant layer substitutes for the published blue stage. The source notes describe these limits.

## Preferences, access, and saved work

- The entire interface, artwork titles, instructions, guide, and narration are English-only. Old language preferences cannot switch the interface back.
- Aa enlarges root text and is available on all five pages at every breakpoint. Browser zoom is available at all sizes.
- Narration uses installed English browser voices; availability varies. Written equivalents remain available. Audio is off until requested. Ambient audio is synthesized, not a workshop field recording.
- Skip links, visible focus, tab arrow navigation, text feedback, and reduced motion support accessible use. Full assistive-technology validation remains outstanding.
- Drafts and preferences save locally when storage is available. A shared URL-fragment handoff also carries drafts, completed artwork, printing progress, and chapter position between the local HTML pages, even when storage is blocked.
- Fragments are not server requests. They can contain artwork, its optional name, and progress; avoid sharing a local link containing anything you do not want to include. Very detailed drawings can create long URLs or reach browser storage limits. PNG export is the portable output.

## Artwork and historical scope

The homepage includes two locally bundled sizes of Daderot's CC0 photograph of **Mouse Wedding** at the Vietnam National Museum of Fine Arts. The complete reference is not recolored; the sphere uses a cropped detail. Other example paintings, village scenes, woodblocks, gallery arrangements, and the animated process study are contemporary vector reconstructions, not historical scans or recovered woodblocks. The background fiber texture is an original vector suggestion of paper, not an archival scan.

Visitor artwork is a contemporary personal response inspired by the tradition. A public cultural edition should use appropriately licensed archival assets and review print-specific process details with practicing artisans. The digital guide and simulation do not replace artisan expertise.
