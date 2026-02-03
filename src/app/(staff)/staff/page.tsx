import KanbanBoard from "@/components/KanbanBoard";

export default function StaffDashboard() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <a className="rounded-xl bg-black px-4 py-2 text-white" href="/staff/orders/new">
          New Order
        </a>
      </div>
      <KanbanBoard />
    </div>
  );
}
