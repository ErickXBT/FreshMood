import { useEffect, useRef, useState, useCallback } from "react";
import { useListOrders, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const LAST_ID_KEY = "freshmood-last-order-id";
const SOUND_KEY   = "freshmood-sound-enabled";

function playDing() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const schedule = (freq: number, startAt: number, duration: number, volume = 0.38) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + startAt);
      gain.gain.setValueAtTime(0, now + startAt);
      gain.gain.linearRampToValueAtTime(volume, now + startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + startAt + duration);
      osc.start(now + startAt);
      osc.stop(now + startAt + duration);
    };

    schedule(880,  0,    0.45);
    schedule(1047, 0.18, 0.5);
    schedule(1319, 0.36, 0.6, 0.28);

    setTimeout(() => ctx.close().catch(() => {}), 1200);
  } catch {
    // AudioContext blocked or unsupported — fail silently
  }
}

export function useOrderNotifications() {
  const { toast } = useToast();
  const { isOwner, hasPermission } = useAuth();
  const canViewOrders =
    isOwner || hasPermission("orders") || hasPermission("kitchen") || hasPermission("kasir");

  const lastIdRef      = useRef<number>(parseInt(localStorage.getItem(LAST_ID_KEY) ?? "0", 10));
  const initializedRef = useRef(false);

  const [soundEnabled, setSoundEnabledRaw] = useState<boolean>(
    () => localStorage.getItem(SOUND_KEY) !== "false"
  );
  const [newOrderCount, setNewOrderCount] = useState(0);

  const setSoundEnabled = useCallback((val: boolean) => {
    setSoundEnabledRaw(val);
    localStorage.setItem(SOUND_KEY, String(val));
  }, []);

  const clearCount = useCallback(() => setNewOrderCount(0), []);

  const { data: orders } = useListOrders(
    {},
    {
      query: {
        queryKey: getListOrdersQueryKey({}),
        enabled: canViewOrders,
        refetchInterval: canViewOrders ? 8_000 : false,
        refetchIntervalInBackground: true,
      },
    }
  );

  useEffect(() => {
    if (!orders || orders.length === 0) return;

    const maxId = Math.max(...orders.map(o => o.id));

    if (!initializedRef.current) {
      initializedRef.current = true;
      if (lastIdRef.current === 0) {
        lastIdRef.current = maxId;
        localStorage.setItem(LAST_ID_KEY, String(maxId));
      }
      return;
    }

    const newOrders = orders.filter(
      o => o.id > lastIdRef.current && o.status === "pending"
    );

    if (newOrders.length === 0) return;

    lastIdRef.current = maxId;
    localStorage.setItem(LAST_ID_KEY, String(maxId));
    setNewOrderCount(prev => prev + newOrders.length);

    if (soundEnabled) playDing();

    newOrders.forEach(order => {
      const typeLabel =
        order.orderType === "delivery"  ? "🛵 Delivery"  :
        order.orderType === "take_away" ? "🛍 Take Away" : "🍴 Dine In";

      const tableInfo = order.tableNumber ? ` · Meja ${order.tableNumber}` : "";

      toast({
        title: "🔔 Pesanan Baru Masuk!",
        description: `${typeLabel} · ${order.customerName}${tableInfo}`,
        duration: 8_000,
      });
    });
  }, [orders, soundEnabled, toast]);

  return { soundEnabled, setSoundEnabled, newOrderCount, clearCount };
}
