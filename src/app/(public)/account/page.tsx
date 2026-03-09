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
  CreditCard,
  LogOut,
  Loader2,
  ChevronDown,
  ChevronUp,
  Download,
  Image as ImageIcon,
  Calendar,
  Filter,
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

function OrderCard({ order }: { order: OrderRow }) {
  const [expanded, setExpanded] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const loadDetails = async () => {
    if (orderDetails || loadingDetails) return;
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/public/order-status?orderNumber=${order.orderNumber}`);
      if (res.ok) {
        const data = await res.json();
        setOrderDetails(data.order);
      }
    } catch (e) {
      console.error("Failed to load order details:", e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleToggle = () => {
    setExpanded(!expanded);
    if (!expanded && !orderDetails) {
      loadDetails();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-sm hover:border-gold/30 transition-colors"
    >
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 flex-1">
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

            {/* Invoice link — use our branded pay page */}
            {order.invoice && order.invoice.balanceDue > 0 && (
              <Link
                href={`/pay/${order.invoice.id}`}
                className="flex items-center gap-1 text-xs px-3 py-1.5 bg-gold text-primary-foreground rounded-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <CreditCard size={12} />
                Pay Now
              </Link>
            )}
            {!order.invoice && order.squareInvoiceUrl && (
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
            <button
              onClick={handleToggle}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expanded ? "Less" : "Details"}
            </button>
          </div>
        </div>

        {/* Invoice details */}
        {order.invoice && (
          <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
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
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-border p-5 bg-secondary/30">
          {loadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-gold" size={20} />
            </div>
          ) : orderDetails ? (
            <div className="space-y-4">
              {/* Status Progress */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Order Progress</h4>
                <div className="space-y-2 text-xs">
                  <StatusProgressBar status={orderDetails.status} />
                </div>
              </div>

              {/* Order Details */}
              {orderDetails.width && orderDetails.height && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Dimensions</h4>
                  <p className="text-sm text-muted-foreground">
                    {orderDetails.width}" × {orderDetails.height}" {orderDetails.units === "cm" ? "(cm)" : "(inches)"}
                  </p>
                </div>
              )}

              {/* Components */}
              {orderDetails.components && orderDetails.components.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Components</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {orderDetails.components.map((comp: any, idx: number) => (
                      <div key={idx} className="flex justify-between">
                        <span className="capitalize">{comp.category}:</span>
                        <span>{comp.description || comp.vendorItem?.itemNumber || "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos */}
              {orderDetails.photos && orderDetails.photos.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <ImageIcon size={14} />
                    Photos
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {orderDetails.photos.map((photo: any, idx: number) => (
                      <img
                        key={idx}
                        src={photo.url}
                        alt={`Order photo ${idx + 1}`}
                        className="w-full h-24 object-cover rounded border border-border"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                <a
                  href={`/order-status?orderNumber=${order.orderNumber}`}
                  target="_blank"
                  className="flex items-center gap-1 text-xs px-3 py-1.5 border border-border rounded-sm text-muted-foreground hover:text-foreground hover:border-gold/30 transition-colors"
                >
                  <ExternalLink size={12} />
                  View Full Details
                </a>
                {order.invoice && (
                  <a
                    href={`/api/public/invoices/${order.invoice.id}/pdf`}
                    target="_blank"
                    className="flex items-center gap-1 text-xs px-3 py-1.5 border border-border rounded-sm text-muted-foreground hover:text-foreground hover:border-gold/30 transition-colors"
                  >
                    <Download size={12} />
                    Download Invoice
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">
              Failed to load order details
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function ProfileEditor({ customer, onUpdate }: { customer: CustomerProfile; onUpdate: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone || "",
    preferredContact: customer.preferredContact,
    marketingOptIn: customer.marketingOptIn,
  });

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/customer/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setEditing(false);
        onUpdate();
      }
    } catch (e) {
      console.error("Failed to update profile:", e);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Name</span>
          <span className="text-foreground">{customer.firstName} {customer.lastName}</span>
        </div>
        {customer.phone && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phone</span>
            <span className="text-foreground">{customer.phone}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Preferred Contact</span>
          <span className="text-foreground capitalize">{customer.preferredContact}</span>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="w-full mt-3 px-3 py-2 text-xs border border-border rounded-sm text-muted-foreground hover:text-foreground hover:border-gold/30 transition-colors"
        >
          Edit Profile
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      <div>
        <label className="block text-xs text-muted-foreground mb-1">First Name</label>
        <input
          type="text"
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-gold/20"
        />
      </div>
      <div>
        <label className="block text-xs text-muted-foreground mb-1">Last Name</label>
        <input
          type="text"
          value={formData.lastName}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-gold/20"
        />
      </div>
      <div>
        <label className="block text-xs text-muted-foreground mb-1">Phone</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-gold/20"
        />
      </div>
      <div>
        <label className="block text-xs text-muted-foreground mb-1">Preferred Contact</label>
        <select
          value={formData.preferredContact}
          onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-gold/20"
        >
          <option value="email">Email</option>
          <option value="phone">Phone</option>
          <option value="sms">SMS</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="marketingOptIn"
          checked={formData.marketingOptIn}
          onChange={(e) => setFormData({ ...formData, marketingOptIn: e.target.checked })}
          className="w-4 h-4 border-border rounded"
        />
        <label htmlFor="marketingOptIn" className="text-xs text-muted-foreground">
          Receive marketing emails
        </label>
      </div>
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 px-3 py-2 text-xs bg-gold text-primary-foreground rounded-sm font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={() => {
            setEditing(false);
            setFormData({
              firstName: customer.firstName,
              lastName: customer.lastName,
              phone: customer.phone || "",
              preferredContact: customer.preferredContact,
              marketingOptIn: customer.marketingOptIn,
            });
          }}
          className="px-3 py-2 text-xs border border-border rounded-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function StatusProgressBar({ status }: { status: string }) {
  const steps = [
    { key: "new_design", label: "Design" },
    { key: "awaiting_materials", label: "Materials" },
    { key: "in_production", label: "Production" },
    { key: "quality_check", label: "Quality Check" },
    { key: "ready_for_pickup", label: "Ready" },
  ];

  const statusOrder = ["new_design", "awaiting_materials", "in_production", "quality_check", "ready_for_pickup", "picked_up", "completed"];
  const currentIndex = statusOrder.indexOf(status);

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, idx) => {
        const stepIndex = statusOrder.indexOf(step.key);
        const isComplete = currentIndex > stepIndex;
        const isCurrent = currentIndex === stepIndex;
        
        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                  isComplete
                    ? "bg-emerald-500 text-white"
                    : isCurrent
                    ? "bg-gold text-primary-foreground"
                    : "bg-border text-muted-foreground"
                }`}
              >
                {isComplete ? "✓" : idx + 1}
              </div>
              <span className={`text-xs mt-1 ${isCurrent ? "text-gold font-medium" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`h-1 flex-1 mx-2 ${isComplete ? "bg-emerald-500" : "bg-border"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "status" | "amount">("date");

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
                  <Calendar size={14} />
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

              {/* Profile Edit */}
              <div className="bg-card border border-border rounded-sm p-6">
                <h3 className="text-sm font-semibold text-foreground mb-3">Account Settings</h3>
                <ProfileEditor customer={customer} onUpdate={() => loadData()} />
              </div>
            </div>

            {/* Main */}
            <div className="lg:col-span-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="font-serif text-2xl text-foreground">
                  Your <span className="text-gold">Orders</span>
                </h2>
                
                {orders.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Filter size={14} className="text-muted-foreground" />
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="border border-border rounded-sm px-3 py-1.5 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-gold/20"
                      >
                        <option value="all">All Orders</option>
                        <option value="active">Active</option>
                        <option value="ready_for_pickup">Ready for Pickup</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as "date" | "status" | "amount")}
                      className="border border-border rounded-sm px-3 py-1.5 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-gold/20"
                    >
                      <option value="date">Sort by Date</option>
                      <option value="status">Sort by Status</option>
                      <option value="amount">Sort by Amount</option>
                    </select>
                  </div>
                )}
              </div>

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
                  {orders
                    .filter((order) => {
                      if (filterStatus === "all") return true;
                      if (filterStatus === "active") {
                        return !["completed", "picked_up", "cancelled"].includes(order.status);
                      }
                      return order.status === filterStatus;
                    })
                    .sort((a, b) => {
                      if (sortBy === "date") {
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                      }
                      if (sortBy === "status") {
                        return a.status.localeCompare(b.status);
                      }
                      if (sortBy === "amount") {
                        return b.totalAmount - a.totalAmount;
                      }
                      return 0;
                    })
                    .map((order) => (
                      <OrderCard key={order.id} order={order} />
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
