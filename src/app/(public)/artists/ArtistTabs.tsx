"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

/**
 * Only the fields the tab strip needs — the long bios stay on the server and
 * never ship to the browser.
 */
export interface ArtistTab {
  slug: string;
  name: string;
  tagline: string;
  blurb: string;
  initials: string;
  portrait?: string;
  portraitAlt?: string;
  location?: string;
  website?: string;
  websiteLabel?: string;
  instagram?: string;
  links?: { label: string; url: string }[];
  workCount: number;
}

export default function ArtistTabs({ artists }: { artists: ArtistTab[] }) {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Deep links: /artists#darrell-smith opens on that artist's tab.
  useEffect(() => {
    const slug = window.location.hash.replace(/^#/, "");
    if (!slug) return;
    const i = artists.findIndex((a) => a.slug === slug);
    if (i >= 0) setActive(i);
  }, [artists]);

  // The strip scrolls sideways on phones — keep the selected tab in view.
  // Scrolls the strip itself, not the page, so nothing jumps under the reader.
  useEffect(() => {
    const list = listRef.current;
    const tab = tabRefs.current[active];
    if (!list || !tab) return;
    const left = tab.offsetLeft;
    const right = left + tab.offsetWidth;
    if (left < list.scrollLeft) {
      list.scrollTo({ left: left - 24, behavior: "smooth" });
    } else if (right > list.scrollLeft + list.clientWidth) {
      list.scrollTo({
        left: right - list.clientWidth + 24,
        behavior: "smooth",
      });
    }
  }, [active]);

  function select(i: number, focus = false) {
    setActive(i);
    if (focus) tabRefs.current[i]?.focus();
    history.replaceState(null, "", `#${artists[i].slug}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const last = artists.length - 1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      select(active === last ? 0 : active + 1, true);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      select(active === 0 ? last : active - 1, true);
    } else if (e.key === "Home") {
      e.preventDefault();
      select(0, true);
    } else if (e.key === "End") {
      e.preventDefault();
      select(last, true);
    }
  }

  return (
    <div>
      {/* Tab strip — scrolls sideways on phones rather than wrapping */}
      <div
        ref={listRef}
        role="tablist"
        aria-label="Featured artists"
        onKeyDown={onKeyDown}
        className="flex gap-2 overflow-x-auto pb-1 -mx-6 px-6 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center border-b border-border"
      >
        {artists.map((artist, i) => (
          <button
            key={artist.slug}
            id={`artist-tab-${artist.slug}`}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            role="tab"
            type="button"
            aria-selected={i === active}
            aria-controls={`artist-panel-${artist.slug}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => select(i)}
            className={`shrink-0 whitespace-nowrap px-5 py-3 text-sm font-semibold tracking-wide transition-colors border-b-2 -mb-px ${
              i === active
                ? "border-gold text-gold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {artist.name}
          </button>
        ))}
      </div>

      {/* Every panel stays in the DOM so the content is crawlable. */}
      {artists.map((artist, i) => (
        <div
          key={artist.slug}
          id={`artist-panel-${artist.slug}`}
          role="tabpanel"
          aria-labelledby={`artist-tab-${artist.slug}`}
          hidden={i !== active}
          className="pt-10"
        >
          <div className="grid gap-8 md:grid-cols-[260px_1fr] items-start">
            <div className="relative aspect-[4/5] rounded-sm overflow-hidden border border-border bg-secondary">
              {artist.portrait ? (
                <Image
                  src={artist.portrait}
                  alt={artist.portraitAlt || artist.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 260px"
                  unoptimized={artist.portrait.startsWith("http")}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    aria-hidden="true"
                    className="font-serif text-5xl text-gold/40"
                  >
                    {artist.initials}
                  </span>
                </div>
              )}
            </div>

            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
                {artist.name}
              </h2>
              <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] mt-2">
                {artist.tagline}
                {artist.location && ` · ${artist.location}`}
              </p>

              <p className="text-foreground/80 leading-relaxed mt-5">
                {artist.blurb}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={`/artists/${artist.slug}`}
                  className="px-6 py-3 bg-gold text-primary-foreground font-semibold tracking-wide uppercase text-xs rounded-sm hover:opacity-90 transition-colors"
                >
                  {artist.workCount > 0
                    ? `See ${artist.name.split(" ")[0]}'s Work`
                    : `More About ${artist.name.split(" ")[0]}`}
                </Link>
                {artist.website && (
                  <a
                    href={artist.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 border border-border text-foreground font-semibold tracking-wide uppercase text-xs rounded-sm hover:border-gold/50 hover:text-gold transition-colors"
                  >
                    {artist.websiteLabel} →
                  </a>
                )}
                {artist.instagram && (
                  <a
                    href={artist.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 border border-border text-foreground font-semibold tracking-wide uppercase text-xs rounded-sm hover:border-gold/50 hover:text-gold transition-colors"
                  >
                    Instagram
                  </a>
                )}
              </div>

              {artist.links && artist.links.length > 0 && (
                <div className="mt-6 pt-5 border-t border-border">
                  <p className="text-muted-foreground text-[11px] uppercase tracking-[0.2em] mb-3">
                    Elsewhere
                  </p>
                  <ul className="flex flex-wrap gap-x-6 gap-y-2">
                    {artist.links.map((link) => (
                      <li key={link.url}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-gold transition-colors underline underline-offset-4 decoration-border hover:decoration-gold"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
