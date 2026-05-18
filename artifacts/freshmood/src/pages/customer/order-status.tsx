import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetOrder, getGetOrderQueryKey, OrderStatus } from "@workspace/api-client-react";
import { formatRupiah } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Clock, ChefHat, ShoppingBag, Utensils, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const STATUS_STEPS = [
  { id: 'pending', label: 'Order Placed', icon: ShoppingBag },
  { id: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { id: 'preparing', label: 'Preparing', icon: ChefHat },
  { id: 'ready', label: 'Ready to Serve', icon: Utensils },
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
        // Stop polling if completed or cancelled
        if (data?.status === 'completed' || data?.status === 'cancelled') return false;
        return 5000; // Poll every 5s otherwise
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
        <p className="text-muted-foreground mb-6">We couldn't find this order. It may have been cancelled or expired.</p>
        <Button onClick={() => setLocation("/menu")}>Return to Menu</Button>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.id === order.status);
  
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

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="bg-primary text-primary-foreground pt-12 pb-20 px-4 text-center rounded-b-[3rem] shadow-md relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
        <div className="relative z-10">
          <Badge className="bg-white/20 text-white hover:bg-white/30 mb-4 px-3 py-1 font-medium text-sm">
            Table {order.tableNumber}
          </Badge>
          <h1 className="text-3xl font-bold mb-2">Order #{order.id}</h1>
          <p className="text-primary-foreground/80 font-medium">Thank you, {order.customerName}!</p>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 -mt-12 pb-20">
        <Card className="shadow-lg border-none overflow-hidden mb-6">
          <CardContent className="p-0">
            <div className="p-6 text-center border-b border-border/50 bg-card">
              <h2 className="font-bold text-lg mb-1">Status</h2>
              <p className="text-primary font-bold text-2xl capitalize">
                {order.status === 'ready' ? "It's Ready!" : order.status}
              </p>
              
              {order.status === 'preparing' && order.estimatedMinutes && (
                <div className="mt-4 inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-full text-sm font-medium">
                  <Clock className="w-4 h-4 text-primary" />
                  Estimated: {order.estimatedMinutes} mins
                </div>
              )}
            </div>

            <div className="p-6 bg-muted/10">
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {STATUS_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isActive = idx === currentStepIndex;
                  const isCompleted = idx < currentStepIndex || order.status === 'completed';
                  const isPending = idx > currentStepIndex;

                  return (
                    <div key={step.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors duration-300
                        ${isActive ? 'bg-primary border-primary text-primary-foreground scale-110' : 
                          isCompleted ? 'bg-primary border-primary text-primary-foreground' : 
                          'bg-card border-border text-muted-foreground'}`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                      </div>
                      
                      <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-lg shadow-sm border transition-all duration-300
                        ${isActive ? 'bg-card border-primary shadow-primary/20' : 
                          'bg-card border-border'}`}
                      >
                        <div className="flex items-center justify-between space-x-2">
                          <div className={`font-bold ${isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {step.label}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <h3 className="font-bold text-lg mb-4 px-2">Order Details</h3>
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <div className="space-y-3">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between items-start text-sm">
                <div className="flex gap-3">
                  <span className="font-bold text-primary">{item.quantity}x</span>
                  <div>
                    <p className="font-medium">{item.menuItemName}</p>
                    {item.notes && <p className="text-muted-foreground italic mt-0.5">{item.notes}</p>}
                  </div>
                </div>
                <span className="font-medium">{formatRupiah(item.subtotal)}</span>
              </div>
            ))}
          </div>
          
          <div className="border-t border-border pt-3 mt-3">
            <div className="flex justify-between text-lg font-bold">
              <span>Total Paid</span>
              <span className="text-primary">{formatRupiah(order.total)}</span>
            </div>
            <p className="text-xs text-muted-foreground text-right mt-1">
              via {order.paymentMethod}
            </p>
          </div>
        </div>

        {order.status === 'completed' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center"
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

// Simple Badge component fallback since it might not be imported correctly above if not used from ui
function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return <span className={`inline-block rounded-full ${className}`}>{children}</span>;
}
