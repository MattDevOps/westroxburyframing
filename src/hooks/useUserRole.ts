"use client";

import { useState, useEffect } from "react";

export function useUserRole() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkRole() {
      try {
        const res = await fetch("/staff/api/location/current");
        if (res.ok) {
          const data = await res.json();
          setIsAdmin(data.isAdmin || false);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkRole();
  }, []);

  return { isAdmin, loading };
}
