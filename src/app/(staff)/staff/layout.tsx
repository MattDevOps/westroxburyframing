import StaffTopbar from "@/components/StaffTopbar";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StaffTopbar />
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </>
  );
}
