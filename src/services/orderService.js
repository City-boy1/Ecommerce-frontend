import { axiosPublic, axiosPrivate } from "../api/axios";

export async function resolveCart(lines) {
  const { data } = await axiosPublic.post("/cart/resolve", {
    lines: lines.map((l) => ({
      productId: l.productId,
      color: l.color || "",
      size: l.size || "",
      quantity: l.quantity,
    })),
  });
  return {
    groups: data.groups || data.stores || [],
    suggestions: data.suggestions || [],
    subtotal: data.subtotal ?? 0,
    deliveryFee: data.deliveryFee,
  };
}

export async function placeOrder(payload) {
  const { data } = await axiosPrivate.post("/orders", payload);
  return data.order || data;
}

export async function getOrder(id) {
  const { data } = await axiosPrivate.get(`/orders/${id}`);
  return data.order || data;
}