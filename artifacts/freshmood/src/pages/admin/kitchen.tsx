import { useState } from "react";
import AdminLayout from "@/components/admin-layout";
import { 
  useListOrders, 
  getListOrdersQueryKey,
  useUpdateOrderStatus,
  Order
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, ChefHat, Clock, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type KitchenTab = 'new' | 'preparing' | 'ready';

export default function AdminKitchen() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateStatusMutation = useUpdateOrderStatus();
  const [activeTab, setActiveTab] = useState<KitchenTab>('new');

  const { data: orders, isLoading } = useListOrders(
    {}, 
    { 
      query: { 
        queryKey: getListOrdersQueryKey({}),
        refetchInterval: 10000
      } 
    }
  );

  const activeOrders = orders?.filter(o => 
    o.status !== 'completed' && o.status !== 'cancelled'
  ) || [];

  const pendingOrders = activeOrders.filter(o => o.status === 'pending' || o.status === 'confirmed');
  const preparingOrders = activeOrders.filter(o => o.status === 'preparing');
  const readyOrders = activeOrders.filter(o => o.status === 'ready');

  const handleUpdateStatus = async (orderId: number, newStatus: 'confirmed' | 'preparing' | 'ready' | 'completed') => {
    try {
      await updateStatusMutation.mutateAsync({
        id: orderId,
        data: { status: newStatus }
      });
      queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey({}) });
      toast({ title: "Status Updated", description: `Order #${orderId} marked as ${newStatus}` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update order status", variant: "destructive" });
    }
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="flex flex-col">
      <CardHeader className="pb-2 border-b">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg md:text-xl">Table {order.tableNumber}</CardTitle>
            <p className="text-sm text-muted-foreground font-medium mt-1">{order.customerName}</p>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="text-base md:text-lg py-1 px-2 md:px-3">#{order.id}</Badge>
            <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1 justify-end">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(parseISO(order.createdAt))} ago
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-4">
        <ul className="space-y-2">
          {order.items?.map(item => (
            <li key={item.id} className="flex gap-3 text-sm">
              <span className="font-bold w-6 text-primary shrink-0">{item.quantity}x</span>
              <div>
                <p className="font-medium">{item.menuItemName}</p>
                {item.notes && <p className="text-muted-foreground italic text-xs mt-0.5">Note: {item.notes}</p>}
              </div>
            </li>
          ))}
        </ul>
        {order.notes && (
          <div className="mt-3 p-3 bg-muted rounded-md text-sm border-l-2 border-primary">
            <span className="font-bold">Note:</span> {order.notes}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-3 border-t bg-muted/20">
        {order.status === 'pending' || order.status === 'confirmed' ? (
          <Button className="w-full" onClick={() => handleUpdateStatus(order.id, 'preparing')} disabled={updateStatusMutation.isPending}>
            <ChefHat className="mr-2 w-4 h-4" /> Start Preparing
          </Button>
        ) : order.status === 'preparing' ? (
          <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => handleUpdateStatus(order.id, 'ready')} disabled={updateStatusMutation.isPending}>
            <Check className="mr-2 w-4 h-4" /> Mark as Ready
          </Button>
        ) : order.status === 'ready' ? (
          <Button className="w-full" variant="outline" onClick={() => handleUpdateStatus(order.id, 'completed')} disabled={updateStatusMutation.isPending}>
            Complete Order
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );

  const Column = ({ orders, emptyText }: { orders: Order[]; emptyText: string }) => (
    <div className="space-y-4">
      {orders.map(order => <OrderCard key={order.id} order={order} />)}
      {orders.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">{emptyText}</div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex h-full items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Kitchen Display</h1>
          <div className="flex gap-2 items-center text-sm text-muted-foreground">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="hidden sm:inline">Live Updates</span>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="md:hidden flex rounded-xl border overflow-hidden mb-4 shrink-0">
          {([
            { key: 'new', label: 'New', count: pendingOrders.length, color: '' },
            { key: 'preparing', label: 'Preparing', count: preparingOrders.length, color: 'text-primary' },
            { key: 'ready', label: 'Ready', count: readyOrders.length, color: 'text-green-600' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-sm font-semibold flex flex-col items-center gap-0.5 transition-colors
                ${activeTab === tab.key ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted'}`}
            >
              <span>{tab.label}</span>
              <Badge variant={activeTab === tab.key ? 'secondary' : 'outline'} className="text-xs px-1.5 py-0">
                {tab.count}
              </Badge>
            </button>
          ))}
        </div>

        {/* Mobile: single column */}
        <div className="md:hidden overflow-y-auto flex-1">
          {activeTab === 'new' && <Column orders={pendingOrders} emptyText="No new orders" />}
          {activeTab === 'preparing' && <Column orders={preparingOrders} emptyText="No orders currently preparing" />}
          {activeTab === 'ready' && <Column orders={readyOrders} emptyText="No orders ready" />}
        </div>

        {/* Desktop: 3 columns */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 flex-1 overflow-hidden">
          <div className="flex flex-col bg-muted/30 rounded-xl border">
            <div className="p-4 border-b bg-card rounded-t-xl font-bold flex justify-between items-center">
              <h2>New Orders</h2>
              <Badge variant="secondary">{pendingOrders.length}</Badge>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <Column orders={pendingOrders} emptyText="No new orders" />
            </div>
          </div>

          <div className="flex flex-col bg-muted/30 rounded-xl border">
            <div className="p-4 border-b bg-primary/10 rounded-t-xl font-bold flex justify-between items-center">
              <h2 className="text-primary">Preparing</h2>
              <Badge className="bg-primary">{preparingOrders.length}</Badge>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <Column orders={preparingOrders} emptyText="No orders currently preparing" />
            </div>
          </div>

          <div className="flex flex-col bg-muted/30 rounded-xl border">
            <div className="p-4 border-b bg-green-500/10 text-green-700 dark:text-green-400 rounded-t-xl font-bold flex justify-between items-center">
              <h2>Ready to Serve</h2>
              <Badge className="bg-green-500">{readyOrders.length}</Badge>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <Column orders={readyOrders} emptyText="No orders ready" />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
