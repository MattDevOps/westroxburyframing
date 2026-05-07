"use client";

import StaffTopbar from "@/components/StaffTopbar";
import StaffSidebar from "@/components/StaffSidebar";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  // Server-side redirect in /staff/page.tsx handles receptionist access control
  // No client-side checks needed to avoid hooks issues
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <StaffTopbar />
      <div className="flex">
        <StaffSidebar />
        <main className="flex-1 px-4 py-8 min-w-0">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
