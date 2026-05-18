import { useRoute, useLocation } from "wouter";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { formatRupiah } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Clock, ChefHat, ShoppingBag, Utensils, ChevronRight, Check } from "lucide-react";
import { motion } from "framer-motion";

const STATUS_STEPS = [
  { id: 'pending', label: 'Order Placed', icon: ShoppingBag },
  { id: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { id: 'preparing', label: 'Preparing', icon: ChefHat },
  { id: 'ready', label: "Ready to Serve", icon: Utensils },
  { id: 'completed', label: 'Completed', icon: CheckCircle2 },
];

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

            {/* Simple vertical stepper — works on all screen sizes */}
            <div className="p-5">
              <div className="relative">
                {/* Vertical line */}
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
          
          <div className="border-t border-border pt-3">
            <div className="flex justify-between font-bold">
              <span>Total Paid</span>
              <span className="text-primary">{formatRupiah(order.total)}</span>
            </div>
            <p className="text-xs text-muted-foreground text-right mt-1">via {order.paymentMethod}</p>
          </div>
        </div>

        {order.status === 'completed' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-center"
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
