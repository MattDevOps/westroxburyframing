import EasyOrderForm from "@/components/EasyOrderForm";

export default function NewOrderPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-neutral-50 min-h-screen">
      <div className="max-w-3xl mx-auto mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900">New Order</h1>
        <p className="text-neutral-600 mt-1">Walk through six simple steps. You can go back at any time.</p>
      </div>
      <EasyOrderForm />
    </div>
  );
}
