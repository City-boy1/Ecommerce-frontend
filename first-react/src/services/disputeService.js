import { axiosPrivate } from "../api/axios";

// Buyer side of Part 3 §6.4.

export async function confirmReceived(orderId, subOrderId) {
  const { data } = await axiosPrivate.patch(`/orders/${orderId}/confirm-received`, { subOrderId });
  return data;
}

// reason: "wrong_item" | "damaged" | "not_received" | "other"
// Images are not sent yet; the contract allows them later.
export async function reportProblem(orderId, { subOrderId, reason, message }) {
  const { data } = await axiosPrivate.post(`/orders/${orderId}/report`, { subOrderId, reason, message });
  return data;
}

// Seller side: one reply per dispute, only while it is open (Part 4 §2.5).
export async function replyToDispute(disputeId, message) {
  const { data } = await axiosPrivate.post(`/seller/disputes/${disputeId}/reply`, { message });
  return data;
}