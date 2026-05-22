import { useRoute, useLocation } from "wouter";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { formatRupiah } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Clock, ChefHat, ShoppingBag, Utensils, ChevronRight, Check, Download } from "lucide-react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";

const STATUS_STEPS = [
  { id: 'pending', label: 'Order Placed', icon: ShoppingBag },
  { id: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { id: 'preparing', label: 'Preparing', icon: ChefHat },
  { id: 'ready', label: "Ready to Serve", icon: Utensils },
  { id: 'completed', label: 'Completed', icon: CheckCircle2 },
];

const PAYMENT_LABELS: Record<string, string> = {
  QRIS:          "QRIS / e-Wallet",
  CASH:          "Cash at Cashier",
  DELIVERY_CASH: "Delivery Cash",
  CARD:          "Credit/Debit Card",
};

function printReceipt(order: NonNullable<ReturnType<typeof useGetOrder>["data"]>) {
  const isDelivery = order.paymentMethod === "DELIVERY_CASH";
  const paymentLabel = PAYMENT_LABELS[order.paymentMethod ?? ""] ?? order.paymentMethod ?? "-";

  const itemRows = (order.items ?? []).map(item => `
    <tr>
      <td style="padding:4px 0">${item.quantity}x ${item.menuItemName}${item.notes ? `<br/><span style="font-size:10px;color:#888">Catatan: ${item.notes}</span>` : ""}</td>
      <td style="padding:4px 0;text-align:right">${formatRupiah(item.subtotal)}</td>
    </tr>`).join("");

  const feeRows = isDelivery
    ? `<tr><td style="padding:3px 0;color:#555">Delivery Fee</td><td style="text-align:right">${formatRupiah(order.serviceFee)}</td></tr>`
    : `
    <tr><td style="padding:3px 0;color:#555">Tax (10%)</td><td style="text-align:right">${formatRupiah(order.tax)}</td></tr>
    <tr><td style="padding:3px 0;color:#555">Service Fee (5%)</td><td style="text-align:right">${formatRupiah(order.serviceFee)}</td></tr>`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<title>Struk Order #${order.id}</title>
<style>
  body{font-family:monospace;font-size:13px;margin:0;padding:16px;max-width:320px;color:#111}
  h1{font-size:18px;font-weight:bold;margin:0 0 2px}
  .sub{font-size:11px;color:#555;margin-bottom:12px}
  table{width:100%;border-collapse:collapse}
  .divider{border:none;border-top:1px dashed #aaa;margin:10px 0}
  .total-row td{font-weight:bold;font-size:15px;padding-top:8px;border-top:1px solid #222}
  .footer{text-align:center;font-size:10px;color:#888;margin-top:16px}
  @media print{body{padding:4px}}
</style>
</head><body>
<h1>FreshMood</h1>
<div class="sub">Struk Order #${order.id}</div>
<table>
  <tr><td style="color:#555">Tanggal</td><td style="text-align:right">${format(parseISO(order.createdAt), "dd MMM yyyy, HH:mm")}</td></tr>
  <tr><td style="color:#555">Meja</td><td style="text-align:right">${order.tableNumber}</td></tr>
  <tr><td style="color:#555">Nama</td><td style="text-align:right">${order.customerName}</td></tr>
  <tr><td style="color:#555">Pembayaran</td><td style="text-align:right">${paymentLabel}</td></tr>
</table>
<hr class="divider"/>
<table>${itemRows}</table>
<hr class="divider"/>
<table>
  <tr><td style="padding:3px 0;color:#555">Subtotal</td><td style="text-align:right">${formatRupiah(order.subtotal)}</td></tr>
  ${feeRows}
  <tr class="total-row"><td>TOTAL</td><td style="text-align:right">${formatRupiah(order.total)}</td></tr>
</table>
${order.notes ? `<hr class="divider"/><div style="font-size:11px;color:#555">Catatan: ${order.notes}</div>` : ""}
<div class="footer">Terima kasih telah memesan di FreshMood!<br/>Selamat menikmati 🍽️</div>
<script>window.onload=()=>{window.print();}</script>
</body></html>`;

  const win = window.open("", "_blank", "width=380,height=600");
  if (win) { win.document.write(html); win.document.close(); }
}

export default function OrderStatusPage() {
  const [, params] = useRoute("/order-status/:orderId");
  const [, setLocation] = useLocation();
  const orderId = params?.orderId ? parseInt(params.orderId) : 0;

  const { data: order, isLoading } = useGetOrder(orderId, {
    query: {
      enabled: !!orderId,
      queryKey: getGetOrderQueryKey(orderId),
      refetchInterval: (data) => {
        if (data?.status === 'completed' || data?.status === 'cancelled') return false;
        return 5000;
      }
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="font-medium animate-pulse">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
        <p className="text-muted-foreground mb-6">We couldn't find this order.</p>
        <Button onClick={() => setLocation("/menu")}>Return to Menu</Button>
      </div>
    );
  }

  if (order.status === 'cancelled') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-500">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Order Cancelled</h1>
        <p className="text-muted-foreground mb-6">This order has been cancelled.</p>
        <Button onClick={() => setLocation("/menu")}>Return to Menu</Button>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.id === order.status);
  const isDelivery = order.paymentMethod === "DELIVERY_CASH";

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground pt-8 pb-16 px-4 text-center rounded-b-[2rem] shadow-md relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
        <div className="relative z-10">
          <span className="inline-block bg-white/20 text-white rounded-full px-3 py-1 font-medium text-sm mb-3">
            Table {order.tableNumber}
          </span>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Order #{order.id}</h1>
          <p className="text-primary-foreground/80 font-medium text-sm">Thank you, {order.customerName}!</p>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 -mt-8 pb-8">
        {/* Status Card */}
        <Card className="shadow-lg border-none overflow-hidden mb-4">
          <CardContent className="p-0">
            <div className="p-5 text-center border-b border-border/50">
              <h2 className="font-bold text-base mb-1 text-muted-foreground">Current Status</h2>
              <p className="text-primary font-bold text-2xl capitalize">
                {order.status === 'ready' ? "It's Ready!" : order.status}
              </p>
              {order.status === 'preparing' && order.estimatedMinutes && (
                <div className="mt-3 inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-full text-sm font-medium">
                  <Clock className="w-4 h-4 text-primary" />
                  Est: {order.estimatedMinutes} mins
                </div>
              )}
            </div>

            {/* Simple vertical stepper */}
            <div className="p-5">
              <div className="relative">
                <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border" />
                <div className="space-y-4">
                  {STATUS_STEPS.map((step, idx) => {
                    const Icon = step.icon;
                    const isActive = idx === currentStepIndex;
                    const isCompleted = idx < currentStepIndex || order.status === 'completed';
                    const isPending = idx > currentStepIndex && order.status !== 'completed';

                    return (
                      <div key={step.id} className="flex items-center gap-4 relative">
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 z-10 transition-all duration-300
                          ${isActive ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-md shadow-primary/30' :
                            isCompleted ? 'bg-primary border-primary text-primary-foreground' :
                            'bg-background border-border text-muted-foreground'}`}
                        >
                          {isCompleted && !isActive ? <Check className="w-4 h-4" /> : <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />}
                        </div>
                        <span className={`font-medium text-sm transition-colors
                          ${isActive ? 'text-primary font-bold' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}
                        >
                          {step.label}
                        </span>
                        {isActive && (
                          <span className="ml-auto text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
                            Now
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <h3 className="font-bold text-base mb-3 px-1">Order Details</h3>
        <div className="bg-card rounded-2xl border border-border shadow-sm p-4 space-y-3">
          <div className="space-y-3">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between items-start text-sm">
                <div className="flex gap-3">
                  <span className="font-bold text-primary shrink-0">{item.quantity}x</span>
                  <div>
                    <p className="font-medium">{item.menuItemName}</p>
                    {item.notes && <p className="text-muted-foreground italic text-xs mt-0.5">{item.notes}</p>}
                  </div>
                </div>
                <span className="font-medium shrink-0 ml-2">{formatRupiah(item.subtotal)}</span>
              </div>
            ))}
          </div>
          
          <div className="border-t border-border pt-3 space-y-1.5">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatRupiah(order.subtotal)}</span>
            </div>
            {isDelivery && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Delivery Fee</span>
                <span>{formatRupiah(order.serviceFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
              <span>Total Paid</span>
              <span className="text-primary">{formatRupiah(order.total)}</span>
            </div>
            <p className="text-xs text-muted-foreground text-right">
              via {PAYMENT_LABELS[order.paymentMethod ?? ""] ?? order.paymentMethod}
            </p>
          </div>
        </div>

        {/* Download Struk */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4"
        >
          <Button
            variant="outline"
            size="lg"
            className="w-full rounded-2xl border-dashed"
            onClick={() => printReceipt(order)}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Struk
          </Button>
        </motion.div>

        {order.status === 'completed' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 text-center"
          >
            <Button size="lg" className="rounded-full shadow-lg" onClick={() => setLocation("/menu")}>
              Order Again <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
