"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface UTMLink {
  platform: string;
  description: string;
  url: string;
  where: string;
}

const utmLinks: UTMLink[] = [
  {
    platform: "Google Business Profile",
    description: "Main website link in your GBP listing",
    url: "https://www.westroxburyframing.com?utm_source=google&utm_medium=gbp&utm_campaign=profile",
    where: "Google Business Profile → Info → Website",
  },
  {
    platform: "Google Business Posts",
    description: "Link to use in Google Business posts",
    url: "https://www.westroxburyframing.com/book?utm_source=google&utm_medium=gbp&utm_campaign=posts",
    where: "When creating a Google Business post with a button link",
  },
  {
    platform: "Facebook",
    description: "Website link on your Facebook page",
    url: "https://www.westroxburyframing.com?utm_source=facebook&utm_medium=social&utm_campaign=page",
    where: "Facebook Page → About → Website",
  },
  {
    platform: "Facebook Posts",
    description: "Link to include in Facebook posts",
    url: "https://www.westroxburyframing.com?utm_source=facebook&utm_medium=social&utm_campaign=post",
    where: "When sharing links in Facebook posts",
  },
  {
    platform: "Instagram Bio",
    description: "Link in your Instagram bio",
    url: "https://www.westroxburyframing.com?utm_source=instagram&utm_medium=social&utm_campaign=bio",
    where: "Instagram → Edit Profile → Website",
  },
  {
    platform: "Yelp",
    description: "Website link on Yelp listing",
    url: "https://www.westroxburyframing.com?utm_source=yelp&utm_medium=listing&utm_campaign=profile",
    where: "Yelp Business Page → Website URL",
  },
  {
    platform: "Email Signature",
    description: "Link in email signatures",
    url: "https://www.westroxburyframing.com?utm_source=email&utm_medium=signature&utm_campaign=outbound",
    where: "Gmail/Outlook signature settings",
  },
  {
    platform: "Email Campaigns",
    description: "Links in marketing emails",
    url: "https://www.westroxburyframing.com?utm_source=email&utm_medium=campaign&utm_campaign=newsletter",
    where: "Email blasts and newsletters",
  },
  {
    platform: "Review Cards (QR Code)",
    description: "The review page URL (already tracked separately)",
    url: "https://www.westroxburyframing.com/review?utm_source=qrcode&utm_medium=print&utm_campaign=review-card",
    where: "Printed QR code cards at the counter",
  },
];

export default function UTMLinksPage() {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function copyToClipboard(url: string, idx: number) {
    await navigator.clipboard.writeText(url);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Tracked Links (UTM)
        </h1>
        <p className="text-neutral-500 mt-1">
          Use these links instead of plain URLs so you can see exactly where your
          website traffic comes from in Vercel Analytics.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <strong>Why this matters:</strong> Your GBP report shows 34 website
        visits last month, but without tracking you can&apos;t tell how many came from
        Google Business vs. Facebook vs. Yelp. These tracked links fix that.
        Replace your plain URLs on each platform with the tracked versions
        below.
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <strong>Priority #1:</strong> Update your Google Business Profile
        website link first — that&apos;s where most traffic comes from. Go to{" "}
        <a
          href="https://business.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          business.google.com
        </a>{" "}
        → Edit profile → Website, and paste the tracked URL.
      </div>

      <div className="space-y-4">
        {utmLinks.map((link, idx) => (
          <div
            key={idx}
            className="border border-neutral-200 rounded-lg p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-neutral-900">
                  {link.platform}
                </h2>
                <p className="text-sm text-neutral-500 mt-0.5">
                  {link.description}
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  <strong>Where:</strong> {link.where}
                </p>
                <div className="mt-2 bg-neutral-50 border border-neutral-100 rounded px-3 py-2">
                  <code className="text-xs text-neutral-700 break-all">
                    {link.url}
                  </code>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(link.url, idx)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 rounded text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                {copiedIdx === idx ? (
                  <>
                    <Check size={16} className="text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
