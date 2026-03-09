import OrderForm from "@/components/OrderForm";

export default function NewOrderPage() {
  return (
    <div className="p-6 space-y-5">
      <h1 className="text-2xl font-semibold">New Order</h1>
      <OrderForm />
    </div>
  );
}
