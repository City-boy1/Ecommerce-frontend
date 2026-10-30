// Sub-order status flow (one per seller): placed -> confirmed -> packed -> shipped -> delivered
export const STATUS_FLOW = ["placed", "confirmed", "packed", "shipped", "delivered"];

export const STATUS_LABEL = {
  placed: "Placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  // derived whole-order statuses
  in_progress: "In progress",
  partially_delivered: "Partly delivered",
  completed: "Completed",
};

export const nextStatus = (s) => {
  const i = STATUS_FLOW.indexOf(s);
  return i >= 0 && i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1] : null;
};

// Button text, keyed by the status the seller is moving the order TO
export const SELLER_ACTION_LABEL = {
  confirmed: "Confirm order",
  packed: "Mark as packed",
  shipped: "Mark as shipped",
  delivered: "Mark as delivered",
};

export const canCancel = (s) => s === "placed" || s === "confirmed";

// Whole-order status is derived, never stored by hand.
export function deriveOrderStatus(subOrders = []) {
  if (!subOrders.length) return "in_progress";
  const all = subOrders.map((s) => s.status);
  if (all.every((s) => s === "cancelled")) return "cancelled";
  const live = all.filter((s) => s !== "cancelled");
  if (live.every((s) => s === "delivered")) return "completed";
  if (live.some((s) => s === "delivered")) return "partially_delivered";
  return "in_progress";
}

export const isLiveOrder = (status) => status === "in_progress" || status === "partially_delivered";