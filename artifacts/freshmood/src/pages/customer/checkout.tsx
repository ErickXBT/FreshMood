import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { formatRupiah } from "@/lib/format";
import { 
  useCreateOrder,
  useCreatePayment
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronLeft, Loader2, Receipt, UtensilsCrossed, ShoppingBag, Bike } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type OrderType = "dine_in" | "take_away" | "delivery";

const ORDER_TYPES: { id: OrderType; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "dine_in",   label: "Dine In",   icon: <UtensilsCrossed className="w-4 h-4" />, desc: "Makan di tempat" },
  { id: "take_away", label: "Take Away", icon: <ShoppingBag className="w-4 h-4" />,     desc: "Bawa pulang" },
  { id: "delivery",  label: "Delivery",  icon: <Bike className="w-4 h-4" />,            desc: "Antar ke alamat" },
];

const PAYMENT_METHODS = [
  { id: "QRIS",          name: "QRIS / e-Wallet" },
  { id: "CASH",          name: "Cash at Cashier" },
  { id: "DELIVERY_CASH", name: "Delivery Cash", description: "Bayar tunai saat pesanan tiba di rumah" },
  { id: "CARD",          name: "Credit/Debit Card" }
];

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { items, subtotal, clearCart } = useCart();
  const { toast } = useToast();

  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [tableNumber, setTableNumber] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("QRIS");

  const createOrderMutation = useCreateOrder();
  const createPaymentMutation = useCreatePayment();

  useEffect(() => {
    const storedTable = sessionStorage.getItem("freshmood-table");
    if (storedTable) setTableNumber(storedTable);

    if (items.length === 0) {
      setLocation("/menu");
    }
  }, [items.length, setLocation]);

  const isDeliveryCash = paymentMethod === "DELIVERY_CASH";
  const deliveryFee = isDeliveryCash ? 5000 : 0;
  const total = subtotal + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast({ title: "Nama diperlukan", description: "Masukkan nama Anda untuk pesanan", variant: "destructive" });
      return;
    }

    if (orderType === "delivery" && !deliveryAddress.trim()) {
      toast({ title: "Alamat diperlukan", description: "Masukkan alamat pengiriman untuk pesanan Delivery", variant: "destructive" });
      return;
    }

    try {
      const order = await createOrderMutation.mutateAsync({
        data: {
          tableNumber: tableNumber ? parseInt(tableNumber) : undefined,
          customerName,
          notes: notes || undefined,
          orderType,
          deliveryAddress: orderType === "delivery" ? deliveryAddress : undefined,
          paymentMethod,
          customerPhone: customerPhone || undefined,
          items: items.map(i => ({
            menuItemId: i.menuItem.id,
            quantity: i.quantity,
            notes: i.notes
          }))
        }
      });

      await createPaymentMutation.mutateAsync({
        data: {
          orderId: order.id,
          method: paymentMethod,
          amount: order.total
        }
      });

      clearCart();
      setLocation(`/order-status/${order.id}`);
    } catch {
      toast({
        title: "Checkout gagal",
        description: "Terjadi kesalahan saat memproses pesanan. Coba lagi.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-[100dvh] bg-muted/30 pb-32">
      <header className="sticky top-0 z-40 bg-background border-b border-border px-4 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => window.history.back()}>
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold">Checkout</h1>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-6">
        <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">

          {/* Order Summary */}
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" /> Order Summary
            </h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.menuItem.id} className="flex justify-between items-start text-sm">
                  <div className="flex gap-3">
                    <span className="font-bold">{item.quantity}x</span>
                    <div>
                      <p className="font-medium">{item.menuItem.name}</p>
                      {item.notes && <p className="text-muted-foreground italic mt-0.5">{item.notes}</p>}
                    </div>
                  </div>
                  <span className="font-medium">{formatRupiah(item.menuItem.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              {isDeliveryCash && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery Fee</span>
                  <span>{formatRupiah(deliveryFee)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatRupiah(total)}</span>
              </div>
            </div>
          </div>

          {/* Your Details */}
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-5">
            <h2 className="font-bold text-lg">Your Details</h2>

            {/* Order Type Selector */}
            <div className="space-y-2">
              <Label>Tipe Pesanan</Label>
              <div className="grid grid-cols-3 gap-2">
                {ORDER_TYPES.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setOrderType(type.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                      orderType === type.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    {type.icon}
                    <span className="font-semibold text-xs">{type.label}</span>
                    <span className="text-[10px] leading-tight opacity-70">{type.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Table Number — only for Dine In, optional */}
            {orderType === "dine_in" && (
              <div className="space-y-2">
                <Label htmlFor="table">Nomor Meja <span className="text-muted-foreground text-xs font-normal">(Opsional)</span></Label>
                <Input
                  id="table"
                  type="number"
                  min="1"
                  placeholder="Contoh: 5"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="bg-muted/50"
                />
              </div>
            )}

            {/* Delivery Address — only for Delivery */}
            {orderType === "delivery" && (
              <div className="space-y-2">
                <Label htmlFor="address">Alamat Pengiriman <span className="text-destructive">*</span></Label>
                <Textarea
                  id="address"
                  placeholder="Masukkan alamat lengkap tujuan pengiriman..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="bg-muted/50 resize-none"
                  rows={3}
                  required
                />
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="bg-muted/50"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">No HP / WhatsApp</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="08xxxxxxxxxx"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="bg-muted/50"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan Pesanan (Opsional)</Label>
              <Textarea
                id="notes"
                placeholder="Ada permintaan khusus? (contoh: es sedikit, tanpa gula)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-muted/50 resize-none"
                rows={3}
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
            <h2 className="font-bold text-lg">Metode Pembayaran</h2>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
              {PAYMENT_METHODS.map((method) => (
                <div key={method.id} className="flex items-center justify-between border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value={method.id} id={method.id} />
                    <div>
                      <Label htmlFor={method.id} className="font-medium cursor-pointer">{method.name}</Label>
                      {method.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{method.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

        </form>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-50">
        <div className="max-w-xl mx-auto flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground font-medium">Total Payment</p>
            <p className="text-xl font-bold">{formatRupiah(total)}</p>
          </div>
          <Button
            type="submit"
            form="checkout-form"
            className="w-1/2 h-14 rounded-2xl text-lg shadow-lg"
            disabled={createOrderMutation.isPending || createPaymentMutation.isPending}
          >
            {(createOrderMutation.isPending || createPaymentMutation.isPending) ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : "Pay Now"}
          </Button>
        </div>
      </div>
    </div>
  );
}
