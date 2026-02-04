import OrderForm from "@/components/OrderForm";

export default function NewOrderPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">New Order</h1>
      <OrderForm />
    </div>
  );
}
