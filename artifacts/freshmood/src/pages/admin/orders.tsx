import { useState } from "react";
import { downloadReceiptImage } from "@/lib/download-receipt";
import AdminLayout from "@/components/admin-layout";
import { 
  useListOrders, 
  getListOrdersQueryKey,
  useGetOrder,
  getGetOrderQueryKey,
  ListOrdersStatus,
  Order
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, parseISO, format } from "date-fns";
import { Loader2, Search, Eye, Download } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PAYMENT_LABELS: Record<string, { label: string; color: string }> = {
  QRIS:          { label: "QRIS / e-Wallet",   color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  CASH:          { label: "Cash at Cashier",    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  DELIVERY_CASH: { label: "Delivery Cash",      color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  CARD:          { label: "Credit/Debit Card",  color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" },
};

function PaymentBadge({ method }: { method?: string | null }) {
  if (!method) return null;
  const p = PAYMENT_LABELS[method] ?? { label: method, color: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${p.color}`}>
      {p.label}
    </span>
  );
}

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTable, setSearchTable] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const { data: orders, isLoading } = useListOrders(
    statusFilter !== "all" ? { status: statusFilter as ListOrdersStatus } : {}, 
    { query: { queryKey: getListOrdersQueryKey(statusFilter !== "all" ? { status: statusFilter as ListOrdersStatus } : {}) } }
  );

  const { data: selectedOrder, isLoading: isLoadingOrder } = useGetOrder(
    selectedOrderId || 0,
    { query: { enabled: !!selectedOrderId, queryKey: getGetOrderQueryKey(selectedOrderId || 0) } }
  );

  const filteredOrders = orders?.filter(o => 
    searchTable ? o.tableNumber.toString().includes(searchTable) : true
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
      case 'confirmed': return 'bg-blue-500/20 text-blue-700 dark:text-blue-400';
      case 'preparing': return 'bg-orange-500/20 text-orange-700 dark:text-orange-400';
      case 'ready': return 'bg-green-500/20 text-green-700 dark:text-green-400';
      case 'completed': return 'bg-gray-500/20 text-gray-700 dark:text-gray-400';
      case 'cancelled': return 'bg-red-500/20 text-red-700 dark:text-red-400';
      default: return 'bg-gray-500/20 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Orders History</h1>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search by table number..." 
              className="pl-9"
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-44">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Desktop Table */}
        <Card className="hidden md:block">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-medium">Order ID</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Table & Customer</th>
                    <th className="px-6 py-4 font-medium">Payment</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Total</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium">#{order.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {format(parseISO(order.createdAt), "MMM d, HH:mm")}
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(parseISO(order.createdAt))} ago
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold">Table {order.tableNumber}</div>
                        <div className="text-muted-foreground">{order.customerName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <PaymentBadge method={order.paymentMethod} />
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold">{formatRupiah(order.total)}</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedOrderId(order.id)}>
                          <Eye className="w-4 h-4 mr-2" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">No orders found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Card List */}
        <div className="md:hidden space-y-3">
          {filteredOrders.map(order => (
            <Card key={order.id} className="cursor-pointer" onClick={() => setSelectedOrderId(order.id)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-base">Table {order.tableNumber} · {order.customerName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      #{order.id} · {format(parseISO(order.createdAt), "MMM d, HH:mm")}
                    </p>
                  </div>
                  <Eye className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <PaymentBadge method={order.paymentMethod} />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <span className="font-bold text-sm">{formatRupiah(order.total)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
              No orders found
            </div>
          )}
        </div>

        {/* Order Detail Dialog */}
        <Dialog open={!!selectedOrderId} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl md:text-2xl">Order #{selectedOrder?.id}</DialogTitle>
            </DialogHeader>
            
            {isLoadingOrder ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : selectedOrder ? (
              <div className="space-y-5 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Customer</p>
                    <p className="font-medium">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Table</p>
                    <p className="font-medium">{selectedOrder.tableNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Date</p>
                    <p className="font-medium text-sm">{format(parseISO(selectedOrder.createdAt), "PPp")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Payment Method</p>
                    <PaymentBadge method={selectedOrder.paymentMethod} />
                  </div>
                  {selectedOrder.cashierName && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Kasir</p>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                        {selectedOrder.cashierName}
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-bold mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.items?.map(item => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div className="flex gap-3">
                          <span className="font-bold text-primary shrink-0">{item.quantity}x</span>
                          <div>
                            <p className="font-medium text-sm">{item.menuItemName}</p>
                            {item.notes && <p className="text-xs text-muted-foreground italic">Note: {item.notes}</p>}
                          </div>
                        </div>
                        <div className="font-medium text-sm shrink-0">{formatRupiah(item.subtotal)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatRupiah(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.paymentMethod === "DELIVERY_CASH" && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery Fee</span>
                      <span>{formatRupiah(selectedOrder.serviceFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                    <span>Total</span>
                    <span>{formatRupiah(selectedOrder.total)}</span>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-bold text-sm mb-1">Order Notes</h4>
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={isDownloading}
                    onClick={async () => {
                      setIsDownloading(true);
                      try { await downloadReceiptImage(selectedOrder); }
                      finally { setIsDownloading(false); }
                    }}
                  >
                    {isDownloading
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                      : <><Download className="w-4 h-4 mr-2" />Download Struk</>}
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
