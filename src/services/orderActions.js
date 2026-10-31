import { axiosPrivate } from "../api/axios";

// Buyer. Returns { order, requested }: requested is true when the order was already
// confirmed, so a request was sent to the seller instead of cancelling right away.
export async function cancelOrder(orderId, subOrderId, { reasonCode, note }) {
  const { data } = await axiosPrivate.patch(`/orders/${orderId}/cancel`, { subOrderId, reasonCode, note });
  return data;
}

// Seller: decline (placed) or cancel (confirmed, counts against the seller)
export async function cancelAsSeller(subOrderId, { reasonCode, note }) {
  const { data } = await axiosPrivate.patch(`/seller/orders/${subOrderId}/status`, {
    status: "cancelled", reasonCode, note,
  });
  return data;
}

// Seller: answer a buyer's cancellation request. action: "approve" | "refuse" (refuse needs a note)
export async function respondToCancelRequest(subOrderId, { action, note }) {
  const { data } = await axiosPrivate.patch(`/seller/orders/${subOrderId}/cancel-request`, { action, note });
  return data;
}