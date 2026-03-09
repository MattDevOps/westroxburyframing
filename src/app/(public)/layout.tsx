import HeaderPublic from "@/components/HeaderPublic";
import FooterPublic from "@/components/FooterPublic";
import MobileBottomBar from "@/components/MobileBottomBar";
import WelcomePopup from "@/components/WelcomePopup";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HeaderPublic />
      <main className="min-h-screen pb-16 lg:pb-0">{children}</main>
      <FooterPublic />
      <MobileBottomBar />
      <WelcomePopup />
    </>
  );
}
