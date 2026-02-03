export default function StaffTopbar() {
  return (
    <header className="border-b border-neutral-200">
      <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a className="font-semibold" href="/staff">Staff</a>
          <nav className="flex gap-3 text-sm text-neutral-600">
            <a href="/staff">Orders</a>
            <a href="/staff/customers">Customers</a>
          </nav>
        </div>
        <form action="/staff/api/auth/logout" method="post">
          <button className="text-sm rounded-xl border border-neutral-300 px-3 py-2">Log out</button>
        </form>
      </div>
    </header>
  );
}
