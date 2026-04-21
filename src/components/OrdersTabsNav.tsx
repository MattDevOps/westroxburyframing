"use client";

import Link from "next/link";

export type OrdersTab = "active" | "estimates" | "all" | "completed" | "invoices-pending";

type Props = {
  current: OrdersTab;
  estimateCount?: number;
  onLocalTabChange?: (tab: "active" | "estimates" | "all") => void;
};

const LOCAL_TABS: { key: "active" | "estimates" | "all"; label: string }[] = [
  { key: "active", label: "Active Orders" },
  { key: "estimates", label: "Estimates" },
  { key: "all", label: "All Orders" },
];

export default function OrdersTabsNav({ current, estimateCount = 0, onLocalTabChange }: Props) {
  const baseBtn = "px-4 py-2 text-sm font-medium transition-colors";
  const activeCls = "text-neutral-900 border-b-2 border-neutral-900";
  const inactiveCls = "text-neutral-600 hover:text-neutral-900";

  return (
    <div className="flex gap-2 border-b border-neutral-300">
      {LOCAL_TABS.map((t) => {
        const isActive = current === t.key;
        const classes = `${baseBtn} ${isActive ? activeCls : inactiveCls} ${t.key === "estimates" ? "flex items-center gap-1.5" : ""}`;

        const content = (
          <>
            {t.label}
            {t.key === "estimates" && estimateCount > 0 && (
              <span className="rounded-full bg-red-100 text-red-700 text-xs px-2 py-0.5 font-semibold">
                {estimateCount}
              </span>
            )}
          </>
        );

        if (onLocalTabChange) {
          return (
            <button key={t.key} onClick={() => onLocalTabChange(t.key)} className={classes}>
              {content}
            </button>
          );
        }
        return (
          <Link key={t.key} href={`/staff/orders?tab=${t.key}`} className={classes}>
            {content}
          </Link>
        );
      })}
      <Link
        href="/staff/orders/completed"
        className={`${baseBtn} ${current === "completed" ? activeCls : inactiveCls}`}
      >
        Completed Orders
      </Link>
      <Link
        href="/staff/invoices?status=pending"
        className={`${baseBtn} ${current === "invoices-pending" ? activeCls : inactiveCls}`}
      >
        Pending Invoices
      </Link>
    </div>
  );
}
