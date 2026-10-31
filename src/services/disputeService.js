import { axiosPrivate } from "../api/axios";

// Buyer side of Part 3 §6.4.

export async function confirmReceived(orderId, subOrderId) {
  const { data } = await axiosPrivate.patch(`/orders/${orderId}/confirm-received`, { subOrderId });
  return data;
}

// reason: "wrong_item" | "damaged" | "not_received" | "other"
// images: array of File objects (0 to 3)
export async function reportProblem(orderId, { subOrderId, reason, message, images = [] }) {
  const form = new FormData();
  form.append("subOrderId", subOrderId);
  form.append("reason", reason);
  form.append("message", message);
  images.forEach((file) => form.append("images", file));
  const { data } = await axiosPrivate.post(`/orders/${orderId}/report`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

// Seller side: one reply per dispute, only while it is open (Part 4 §2.5).
export async function replyToDispute(disputeId, message) {
  const { data } = await axiosPrivate.post(`/seller/disputes/${disputeId}/reply`, { message });
  return data;
}