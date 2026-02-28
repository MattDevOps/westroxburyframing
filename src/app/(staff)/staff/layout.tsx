import StaffTopbar from "@/components/StaffTopbar";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground">
        <StaffTopbar />
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      </div>
    </ThemeProvider>
  );
}
