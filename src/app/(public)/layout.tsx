import HeaderPublic from "@/components/HeaderPublic";
import FooterPublic from "@/components/FooterPublic";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HeaderPublic />
      <main className="min-h-screen">{children}</main>
      <FooterPublic />
    </>
  );
}
