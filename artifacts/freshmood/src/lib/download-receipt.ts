import { toPng } from "html-to-image";
import { format, parseISO } from "date-fns";
import { formatRupiah } from "@/lib/format";

export type ReceiptOrder = {
  id: number;
  customerName: string;
  tableNumber?: number | null;
  createdAt: string;
  paymentMethod?: string | null;
  cashierName?: string | null;
  orderType?: string | null;
  deliveryAddress?: string | null;
  subtotal: number;
  tax: number;
  serviceFee: number;
  total: number;
  notes?: string | null;
  items?: Array<{
    id: number;
    menuItemName: string;
    quantity: number;
    subtotal: number;
    notes?: string | null;
  }>;
};

const PAYMENT_LABELS: Record<string, string> = {
  QRIS:          "QRIS / e-Wallet",
  CASH:          "Cash at Cashier",
  DELIVERY_CASH: "Delivery Cash",
  CARD:          "Credit/Debit Card",
};

export async function downloadReceiptImage(order: ReceiptOrder) {
  const isDelivery = order.paymentMethod === "DELIVERY_CASH";
  const paymentLabel = PAYMENT_LABELS[order.paymentMethod ?? ""] ?? order.paymentMethod ?? "-";

  const itemsHtml = (order.items ?? [])
    .map(item => `
      <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:13px;">
        <div>
          <span style="font-weight:700;color:#FFCC00">${item.quantity}x</span>
          <span style="margin-left:6px;">${item.menuItemName}</span>
          ${item.notes ? `<div style="font-size:11px;color:#888;margin-top:2px;margin-left:18px;">Catatan: ${item.notes}</div>` : ""}
        </div>
        <div style="font-weight:600;white-space:nowrap;margin-left:12px;">${formatRupiah(item.subtotal)}</div>
      </div>`)
    .join("");

  const feesHtml = isDelivery
    ? `<div style="display:flex;justify-content:space-between;font-size:12px;color:#888;padding:2px 0;">
        <span>Delivery Fee</span><span>${formatRupiah(order.serviceFee)}</span>
       </div>`
    : `<div style="display:flex;justify-content:space-between;font-size:12px;color:#888;padding:2px 0;">
        <span>Tax (10%)</span><span>${formatRupiah(order.tax)}</span>
       </div>
       <div style="display:flex;justify-content:space-between;font-size:12px;color:#888;padding:2px 0;">
        <span>Service Fee (5%)</span><span>${formatRupiah(order.serviceFee)}</span>
       </div>`;

  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:fixed;top:-9999px;left:-9999px;z-index:-1;";

  wrapper.innerHTML = `
    <div id="receipt-capture" style="
      background:#ffffff;
      color:#111111;
      width:360px;
      padding:28px 24px 24px;
      font-family:'Courier New',Courier,monospace;
      box-sizing:border-box;
    ">
      <!-- Header -->
      <div style="text-align:center;margin-bottom:18px;">
        <div style="font-size:22px;font-weight:900;letter-spacing:1px;color:#111;">FreshMood</div>
        <div style="font-size:11px;color:#888;margin-top:3px;">Struk Pembelian</div>
        <div style="font-size:11px;color:#888;">Order #${order.id}</div>
      </div>

      <!-- Dashed top divider -->
      <div style="border-top:2px dashed #ccc;margin-bottom:14px;"></div>

      <!-- Info rows -->
      <div style="font-size:12px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;padding:3px 0;">
          <span style="color:#888;">Tanggal</span>
          <span style="font-weight:600;">${format(parseISO(order.createdAt), "dd MMM yyyy, HH:mm")}</span>
        </div>
        ${order.orderType ? `
        <div style="display:flex;justify-content:space-between;padding:3px 0;">
          <span style="color:#888;">Tipe</span>
          <span style="font-weight:600;">${
            order.orderType === "dine_in" ? "Dine In" :
            order.orderType === "take_away" ? "Take Away" :
            "Delivery"
          }</span>
        </div>` : ""}
        ${order.tableNumber ? `
        <div style="display:flex;justify-content:space-between;padding:3px 0;">
          <span style="color:#888;">Meja</span>
          <span style="font-weight:600;">${order.tableNumber}</span>
        </div>` : ""}
        ${order.deliveryAddress ? `
        <div style="display:flex;justify-content:space-between;padding:3px 0;gap:12px;">
          <span style="color:#888;white-space:nowrap;">Alamat</span>
          <span style="font-weight:600;text-align:right;">${order.deliveryAddress}</span>
        </div>` : ""}
        <div style="display:flex;justify-content:space-between;padding:3px 0;">
          <span style="color:#888;">Nama</span>
          <span style="font-weight:600;">${order.customerName}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:3px 0;">
          <span style="color:#888;">Pembayaran</span>
          <span style="font-weight:600;">${paymentLabel}</span>
        </div>
        ${order.cashierName ? `
        <div style="display:flex;justify-content:space-between;padding:3px 0;">
          <span style="color:#888;">Kasir</span>
          <span style="font-weight:600;">${order.cashierName}</span>
        </div>` : ""}
      </div>

      <!-- Dashed divider -->
      <div style="border-top:1px dashed #ccc;margin-bottom:10px;"></div>

      <!-- Items -->
      <div style="margin-bottom:10px;">${itemsHtml}</div>

      <!-- Dashed divider -->
      <div style="border-top:1px dashed #ccc;margin-bottom:8px;"></div>

      <!-- Fees -->
      <div style="margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#888;padding:2px 0;">
          <span>Subtotal</span><span>${formatRupiah(order.subtotal)}</span>
        </div>
        ${feesHtml}
      </div>

      <!-- Total -->
      <div style="border-top:2px solid #111;padding-top:10px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:15px;font-weight:900;">TOTAL</span>
        <span style="font-size:18px;font-weight:900;color:#111;">${formatRupiah(order.total)}</span>
      </div>

      ${order.notes ? `
      <!-- Notes -->
      <div style="margin-top:12px;background:#f5f5f5;padding:10px 12px;border-radius:6px;font-size:11px;color:#555;">
        <div style="font-weight:700;margin-bottom:3px;">Catatan:</div>
        <div>${order.notes}</div>
      </div>` : ""}

      <!-- Footer -->
      <div style="text-align:center;margin-top:20px;padding-top:14px;border-top:2px dashed #ccc;">
        <div style="font-size:11px;color:#888;">Terima kasih telah memesan di FreshMood!</div>
        <div style="font-size:11px;color:#888;margin-top:2px;">Selamat menikmati 🍽️</div>
      </div>
    </div>
  `;

  document.body.appendChild(wrapper);

  try {
    const el = wrapper.querySelector("#receipt-capture") as HTMLElement;
    const dataUrl = await toPng(el, { pixelRatio: 2, backgroundColor: "#ffffff" });
    const link = document.createElement("a");
    link.download = `struk-order-${order.id}.png`;
    link.href = dataUrl;
    link.click();
  } finally {
    document.body.removeChild(wrapper);
  }
}
