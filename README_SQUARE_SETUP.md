# Square Invoicing Integration Patch (WRX)

This patch adds:
- Server-side Square client (no Square SDK required)
- API route: POST /staff/api/orders/[id]/invoice/send  (send full invoice or deposit)
- Webhook route: POST /api/webhooks/square (optional but recommended)
- Minimal client-side button component you can drop into your order detail UI

## 1) Add env vars

Copy the block from `.env.example.square` into your real `.env` and fill it in.

## 2) Restart dev server

After changing env vars, restart `npm run dev`.

## 3) Wire the buttons into your UI

Import the component:
`import SquareInvoiceButtons from "@/components/SquareInvoiceButtons";`
and render it with an order id.

If your existing order-detail page already has buttons, you can ignore the component and call the API route directly.

## 4) (Optional) Add webhook in Square dashboard

In your Square Developer app:
- Webhooks -> Add subscription (Production)
- Event types: invoice.paid, invoice.payment_made, invoice.canceled (optional)
- URL: https://YOURDOMAIN.com/api/webhooks/square
- Signature key -> set `SQUARE_WEBHOOK_SIGNATURE_KEY` in `.env`

The webhook will mark invoices paid/canceled in your DB if you connect it to your schema.
By default this patch logs events and returns 200.
