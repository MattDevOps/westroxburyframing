"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  User,
  Package,
  FileText,
  ExternalLink,
  LogOut,
  Loader2,
} from "lucide-react";

interface CustomerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  preferredContact: string;
  marketingOptIn: boolean;
  createdAt: string;
}

interface OrderRow {
  id: string;
  orderNumber: string;
  status: string;
  itemType: string;
  itemDescription: string | null;
  totalAmount: number;
  dueDate: string | null;
  createdAt: string;
  squareInvoiceUrl: string | null;
  squareInvoiceStatus: string | null;
  invoice: {
    id: string;
    invoiceNumber: string;
    status: string;
    totalAmount: number;
    amountPaid: number;
    balanceDue: number;
    squareInvoiceUrl: string | null;
  } | null;
}

const STATUS_LABELS: Record<string, string> = {
  estimate: "Estimate",
  new_design: "New / Design",
  materials_ordered: "Materials Ordered",
  materials_received: "Materials Received",
  in_production: "In Production",
  assembled: "Assembled",
  quality_check: "Quality Check",
  ready_for_pickup: "Ready for Pickup",
  complete: "Complete",
  on_hold: "On Hold",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  estimate: "bg-purple-500/20 text-purple-400",
  new_design: "bg-blue-500/20 text-blue-400",
  materials_ordered: "bg-amber-500/20 text-amber-400",
  materials_received: "bg-amber-500/20 text-amber-400",
  in_production: "bg-orange-500/20 text-orange-400",
  assembled: "bg-cyan-500/20 text-cyan-400",
  quality_check: "bg-cyan-500/20 text-cyan-400",
  ready_for_pickup: "bg-emerald-500/20 text-emerald-400",
  complete: "bg-emerald-500/20 text-emerald-400",
  on_hold: "bg-yellow-500/20 text-yellow-400",
  cancelled: "bg-red-500/20 text-red-400",
};

function cents(n: number) {
  return "$" + (n / 100).toFixed(2);
}

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  const loadData = useCallback(async () => {
    const res = await fetch("/api/customer/me");
    if (!res.ok) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    setCustomer(data.customer);
    setOrders(data.orders);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleLogout() {
    await fetch("/api/customer/logout", { method: "POST" });
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-24">
        <Loader2 className="animate-spin text-gold" size={32} />
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="pt-32 pb-12 bg-secondary">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-1"
              >
                Welcome, <span className="text-gold">{customer.firstName}</span>
              </motion.h1>
              <p className="text-muted-foreground text-sm">{customer.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-sm text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <LogOut size={14} />
              Log Out
            </button>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card */}
              <div className="bg-card border border-border rounded-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center">
                    <User className="text-gold" size={20} />
                  </div>
                  <div>
                    <p className="text-foreground font-semibold text-sm">
                      {customer.firstName} {customer.lastName}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Member since{" "}
                      {new Date(customer.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="text-foreground truncate ml-2">{customer.email}</span>
                  </div>
                  {customer.phone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="text-foreground">{customer.phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Orders</span>
                    <span className="text-foreground">{orders.length}</span>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-card border border-border rounded-sm p-6 space-y-3">
                <h3 className="text-sm font-semibold text-foreground mb-2">Quick Links</h3>
                <Link
                  href="/order-status"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors"
                >
                  <Package size={14} />
                  Track an Order
                </Link>
                <Link
                  href="/book"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors"
                >
                  <FileText size={14} />
                  Book Appointment
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors"
                >
                  <FileText size={14} />
                  Contact Us
                </Link>
              </div>
            </div>

            {/* Main */}
            <div className="lg:col-span-3">
              <h2 className="font-serif text-2xl text-foreground mb-6">
                Your <span className="text-gold">Orders</span>
              </h2>

              {orders.length === 0 ? (
                <div className="bg-card border border-border rounded-sm p-12 text-center">
                  <Package className="text-muted-foreground/50 mx-auto mb-4" size={48} />
                  <p className="text-muted-foreground mb-4">
                    No orders yet. Visit us or book an appointment to get started!
                  </p>
                  <Link
                    href="/book"
                    className="inline-block px-6 py-3 bg-gold text-primary-foreground font-semibold text-sm uppercase tracking-wide rounded-sm hover:opacity-90 transition-opacity"
                  >
                    Book a Consultation
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card border border-border rounded-sm p-5 hover:border-gold/30 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="text-foreground font-semibold text-sm">
                              #{order.orderNumber}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                STATUS_COLORS[order.status] || "bg-neutral-500/20 text-neutral-400"
                              }`}
                            >
                              {STATUS_LABELS[order.status] || order.status}
                            </span>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {order.itemType}
                            {order.itemDescription && ` — ${order.itemDescription}`}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Ordered{" "}
                            {new Date(order.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                            {order.dueDate && (
                              <>
                                {" · Due "}
                                {new Date(order.dueDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-foreground font-semibold text-sm">
                            {cents(order.totalAmount)}
                          </span>

                          {/* Invoice link */}
                          {order.invoice?.squareInvoiceUrl && (
                            <a
                              href={order.invoice.squareInvoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-gold hover:opacity-80 transition-opacity"
                            >
                              <ExternalLink size={12} />
                              Pay Invoice
                            </a>
                          )}
                          {!order.invoice?.squareInvoiceUrl && order.squareInvoiceUrl && (
                            <a
                              href={order.squareInvoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-gold hover:opacity-80 transition-opacity"
                            >
                              <ExternalLink size={12} />
                              Pay Invoice
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Invoice details */}
                      {order.invoice && (
                        <div className="mt-3 pt-3 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Invoice #{order.invoice.invoiceNumber}</span>
                          <span>
                            Paid: {cents(order.invoice.amountPaid)} / {cents(order.invoice.totalAmount)}
                          </span>
                          {order.invoice.balanceDue > 0 && (
                            <span className="text-amber-400">
                              Balance Due: {cents(order.invoice.balanceDue)}
                            </span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
