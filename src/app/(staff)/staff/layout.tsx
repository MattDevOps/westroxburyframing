import "../../globals.css";
import StaffTopbar from "@/components/StaffTopbar";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StaffTopbar />
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
