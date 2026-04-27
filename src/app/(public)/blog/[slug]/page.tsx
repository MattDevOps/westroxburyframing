import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { blogPosts } from "../posts";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.metaDescription,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      url: `https://westroxburyframing.com/blog/${post.slug}`,
      type: "article",
    },
    alternates: {
      canonical: `https://westroxburyframing.com/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription,
    author: {
      "@type": "Organization",
      name: "West Roxbury Framing",
    },
    publisher: {
      "@type": "Organization",
      name: "West Roxbury Framing",
      logo: {
        "@type": "ImageObject",
        url: "https://westroxburyframing.com/logo.png",
      },
    },
    datePublished: post.date,
    url: `https://westroxburyframing.com/blog/${post.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <div className="min-h-screen bg-background pt-28 pb-20">
        <article className="max-w-3xl mx-auto px-6">
          <Link
            href="/blog"
            className="text-gold text-sm font-semibold tracking-wide uppercase hover:text-gold-light transition-colors"
          >
            ← Back to Blog
          </Link>

          <div className="mt-6 mb-10">
            <p className="text-gold text-xs font-semibold tracking-wide uppercase mb-2">
              {post.category}
            </p>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
              {post.title}
            </h1>
            <p className="text-muted-foreground text-sm">{post.date}</p>
          </div>

          <div className="prose prose-neutral max-w-none text-foreground/80 leading-relaxed space-y-4 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-foreground [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:font-serif [&_h3]:text-lg [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-2 [&_table]:w-full [&_table]:border-collapse [&_th]:text-left [&_th]:border-b [&_th]:border-border [&_th]:pb-2 [&_th]:text-foreground [&_td]:border-b [&_td]:border-border [&_td]:py-2 [&_td]:text-foreground/70 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:text-foreground/70 [&_strong]:text-foreground [&_a]:text-gold [&_a]:underline [&_a:hover]:text-gold-light">
            {post.content
              .trim()
              .split("\n")
              .map((line, i) => {
                const trimmed = line.trimStart();
                if (trimmed.startsWith("## "))
                  return (
                    <h2 key={i}>{trimmed.slice(3)}</h2>
                  );
                if (trimmed.startsWith("### "))
                  return (
                    <h3 key={i}>{trimmed.slice(4)}</h3>
                  );
                if (trimmed.startsWith("| ")) return null; // skip table rows for now
                if (trimmed.startsWith("- **")) {
                  const match = trimmed.match(/^- \*\*(.+?)\*\*\s*[—–-]\s*(.+)$/);
                  if (match)
                    return (
                      <p key={i} className="pl-4">
                        • <strong>{match[1]}</strong> — {match[2]}
                      </p>
                    );
                  const match2 = trimmed.match(/^- \*\*(.+?)\*\*\s*(.*)$/);
                  if (match2)
                    return (
                      <p key={i} className="pl-4">
                        • <strong>{match2[1]}</strong> {match2[2]}
                      </p>
                    );
                }
                if (trimmed.startsWith("- "))
                  return (
                    <p key={i} className="pl-4">
                      • {trimmed.slice(2)}
                    </p>
                  );
                if (trimmed === "") return null;
                if (trimmed.startsWith("**") && trimmed.endsWith("**"))
                  return (
                    <p key={i}>
                      <strong>{trimmed.slice(2, -2)}</strong>
                    </p>
                  );
                return <p key={i}>{trimmed}</p>;
              })}
          </div>

          {/* CTA */}
          <div className="mt-16 p-8 bg-secondary rounded-sm border border-border text-center">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-3">
              Ready to Get Started?
            </h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              Bring your piece to West Roxbury Framing for a free design consultation.
              Walk-ins welcome, or book a time online.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/book"
                className="px-8 py-3 bg-gold text-primary-foreground font-semibold tracking-wide uppercase text-sm rounded-sm hover:opacity-90 transition-colors"
              >
                Book Consultation
              </Link>
              <a
                href="tel:16173273890"
                className="px-8 py-3 border border-gold text-gold font-semibold tracking-wide uppercase text-sm rounded-sm hover:bg-gold hover:text-primary-foreground transition-colors"
              >
                Call 617-327-3890
              </a>
            </div>
          </div>
        </article>
      </div>
    </>
  );
}
