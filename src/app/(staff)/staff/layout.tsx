"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import StaffTopbar from "@/components/StaffTopbar";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if user is receptionist and restrict access
    async function checkAccess() {
      try {
        const res = await fetch("/staff/api/location/current");
        if (res.ok) {
          const data = await res.json();
          // Receptionist can only access customer-form page
          if (data.userRole === "receptionist" && pathname !== "/staff/customer-form" && pathname !== "/staff/login") {
            router.push("/staff/customer-form");
            return;
          }
        }
      } catch (error) {
        // Silently fail
      } finally {
        setChecking(false);
      }
    }

    if (pathname && pathname !== "/staff/login") {
      checkAccess();
    } else {
      setChecking(false);
    }
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <StaffTopbar />
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
