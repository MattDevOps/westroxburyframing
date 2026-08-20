# Artist images

One folder per artist, named after their slug:

    public/artists/paul-goodnight/portrait.jpg
    public/artists/paul-goodnight/cousins-by-the-dozens.jpg

Reference these paths in `src/app/(public)/artists/artists.ts`.
Use .webp or .jpg; portraits look best at roughly 4:5, artwork at 4:5.

## Before publishing anyone's artwork

Get written permission from the artist (email is fine) for each image, and ask
what credit line they want. Put that line in the `credit` field on the work.
Do not pull images off an artist's website or Instagram without asking — that
is their copyright, not ours.

## Still needed

Every profile currently runs text-only. Each artist needs a headshot and 3-6
photos of their work:

- [x] `paul-goodnight/` — portrait + 3 shop photos in (Aug 2026). Still no
      photos of the artwork on its own.
- [ ] `wendi-gray/` — Wendi Gray (also needs a 2-3 sentence blurb from her)
- [ ] `darrell-smith/` — Darrell Smith
- [ ] `laurence-pierce/` — Laurence Pierce
- [ ] `jameel-radcliffe/` — Jameel Radcliffe
- [ ] `deborah-ellington/` — Deborah Ellington

Once a folder has images, add them to the artist's `works` array (and set
`portrait`) — the gallery and the "Work Coming Soon" notice switch over on
their own.

## works vs shopPhotos

`works` is photographs of the artwork itself, which needs the artist's written
permission. `shopPhotos` is our own photos taken in the shop — the artist
standing with a finished frame, a piece on the bench. Those are ours to
publish, and they run at their natural aspect ratio, so set `width`/`height`
on each one.
