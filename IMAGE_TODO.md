# Photos Needed — Shot List for the Website

> Send this list to whoever's taking the photos. Each section below is one page on the website that needs imagery.

## Quick rules for every photo

- **Phone camera is fine.** Just hold steady, good light (natural is best — near a window, no harsh overhead).
- **Wipe the glass first.** Fingerprints + dust ruin frame photos.
- **Shoot straight on.** Frame should fill most of the photo, no awkward angles.
- **One hero photo + 2 to 4 extras** per page (more variety = better, but don't stress about hitting 4 exactly).
- **Wider/landscape orientation** for hero photos when possible. Portrait is OK too.

If you don't have a perfect shot for a category, send what you have — we can swap better ones in anytime.

---

## Page 1 — Sports Memorabilia

**Hero shot:** A finished jersey shadow box from the shop. Brady, a Sox jersey, a Bruins puck-and-photo combo — anything obviously Boston sports. Should clearly look like a serious, professionally framed piece.

**Extras (2–4 more, mix it up):**
- A signed baseball + photo + ticket multi-piece layout
- A jersey shadow box from a different team than the hero
- A championship ring or medal in a recessed shadow box
- A bat, helmet, or boxing glove shadow box

---

## Page 2 — Diploma Framing

**Hero shot:** A finished diploma in a quality frame. If a recognizable Boston-area school's mat colors / seal embossing is visible (Harvard crimson, BC maroon-and-gold, BU red, MIT cardinal-and-gray), even better.

**Extras (2–4 more):**
- Different schools' mat colors / seal embossing
- A multi-degree layout (e.g. BS + MBA in the same frame)
- A diploma + tassel + class photo combo
- A professional certification frame (JD, MD, RN, CPA)

---

## Page 3 — Military / First Responder Shadow Boxes

**Hero shot:** A finished retirement or service display from the shop. Police, fire, military, EMS — whatever you have a good clean shot of. Medals, badges, patches in proper protocol layout, ideally with the engraved nameplate visible.

**Extras (2–4 more):**
- A folded American flag display case (with or without inset medals)
- A BPD or BFD retirement display
- A military medal rack
- A challenge coin display
- A full uniform shadow box if there's one
- Anything from VA / Bedford VA work

---

## Page 4 — Canvas Stretching & Framing

**Hero shot:** A finished stretched canvas — ideally one that shows off the craft. A clean gallery wrap with the canvas wrapping cleanly around the edge, OR a canvas in a floater frame (canvas with a small visible gap inside the frame). Side angle that shows the depth of the stretcher bars works really well here.

**Extras (2–4 more, mix it up):**
- A canvas being stretched on the workbench (in-progress shot — shows the craft)
- A close-up of clean corner-folds on the back of a stretched canvas
- An oversize canvas from a working artist or gallery client
- A canvas in a floater frame (the modern look) next to one in a traditional moulded frame (the classic look)
- A re-stretching project — sagging "before" + tight "after" if you happen to have one

---

## Page 5 — Corporate Art Programs (Hotels / Law Firms / Hospitals)

**Hero shot:** Professional, lobby-grade or office-grade framing. **Best case:** an install shot from an actual project — a hospital donor wall, hotel lobby, law firm partner display. If no install shots exist, a beautifully framed piece on an easel ready to deliver.

**Extras (2–4 more):**
- A donor wall or multi-frame matched-moulding lineup
- A law firm partner diploma row (matched frames side by side)
- A hotel guest room or lobby art piece
- A designer or staging project — luxury home interior with framed pieces

> Even a "matched-moulding lineup" of 4–6 finished pieces side-by-side ready to ship communicates the B2B / volume work clearly.

---

## Page 6 — Wedding Keepsakes

**Hero shot:** A finished wedding shadow box from the shop. Soft / romantic palette — soft whites, blush, navy, gold. Should obviously be wedding stuff: invitation, ceremony photo, vow card. A pre-preserved bouquet as the centerpiece is a bonus if you have an example.

**Extras (2–4 more):**
- A multi-element shadow box (invitation + photo + program + small mementos)
- A vow card layout
- A bridesmaid / parent gift companion frame
- A "before / after" if there's an anniversary upgrade where items were added years later

---

## Sending the photos

Easiest is just text or AirDrop them all to Matt. He'll get them onto the website. Naming the files something like `sports-1.jpg`, `sports-2.jpg`, `diploma-1.jpg` makes it easy to keep track of which goes where, but not required.

---

## (For Matt — wiring notes, ignore the rest of this if you're sending the doc to bro)

In `src/app/(public)/services/[slug]/serviceData.ts`, every service entry has `heroImage: ""` and `gallery: []` waiting to be filled in. Drop image files into `/public/framed-art/` (or a new `/public/services/<slug>/` subfolder), then replace those values with the paths. No code changes needed — components auto-show images once paths are filled in. Just tell Claude "I uploaded photos for [page]" and point at the directory.
