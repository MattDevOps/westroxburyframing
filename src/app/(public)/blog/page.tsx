import { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "./posts";

export const metadata: Metadata = {
  title: "Framing Tips & Guides | West Roxbury Framing Blog",
  description:
    "Expert framing tips, guides, and inspiration from West Roxbury Framing. Learn about custom framing costs, how to choose the right frame, preservation techniques, and more.",
  keywords: [
    "framing tips",
    "custom framing guide",
    "picture framing blog",
    "how to frame art",
    "framing cost guide Boston",
    "frame selection tips",
  ],
  openGraph: {
    title: "Framing Tips & Guides | West Roxbury Framing Blog",
    description:
      "Expert framing tips, guides, and inspiration from the team at West Roxbury Framing.",
    url: "https://westroxburyframing.com/blog",
  },
  alternates: {
    canonical: "https://westroxburyframing.com/blog",
  },
};

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen bg-background pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-gold text-sm font-semibold tracking-[0.3em] uppercase mb-3">
            Tips & Guides
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            The Framing <span className="text-gold">Blog</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Expert advice, inspiration, and answers to common framing questions
            — from our family to yours.
          </p>
        </div>

        <div className="space-y-10">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="border border-border rounded-sm p-8 hover:border-gold/30 transition-colors"
            >
              <p className="text-gold text-xs font-semibold tracking-wide uppercase mb-2">
                {post.category}
              </p>
              <Link href={`/blog/${post.slug}`}>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-3 hover:text-gold transition-colors">
                  {post.title}
                </h2>
              </Link>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                {post.excerpt}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">
                  {post.date}
                </span>
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-gold text-sm font-semibold hover:text-gold-light transition-colors"
                >
                  Read More →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
