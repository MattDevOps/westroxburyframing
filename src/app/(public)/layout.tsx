import "../globals.css";
import HeaderPublic from "@/components/HeaderPublic";
import FooterPublic from "@/components/FooterPublic";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <HeaderPublic />
        <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
        <FooterPublic />
      </body>
    </html>
  );
}
