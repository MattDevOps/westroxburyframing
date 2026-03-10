"use client";

import StaffTopbar from "@/components/StaffTopbar";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  // Server-side redirect in /staff/page.tsx handles receptionist access control
  // No client-side checks needed to avoid hooks issues
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <StaffTopbar />
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
