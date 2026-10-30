import { axiosPublic, axiosPrivate } from "../api/axios";

const list = (data, key) => (Array.isArray(data) ? data : data?.[key] || []);

// Dashboard overview (role-shaped payload)
export const getSummary = () => axiosPrivate.get("/dashboard/summary").then((r) => r.data);

// Buyer orders
export const getMyOrders = () => axiosPrivate.get("/orders").then((r) => list(r.data, "orders"));
export const cancelSubOrder = (orderId, subOrderId, reason) =>
  axiosPrivate.patch(`/orders/${orderId}/cancel`, { subOrderId, reason }).then((r) => r.data);

// Seller incoming orders (each row is one sub-order belonging to this seller)
export const getSellerOrders = () => axiosPrivate.get("/seller/orders").then((r) => list(r.data, "orders"));
export const updateSellerOrderStatus = (id, status, note) =>
  axiosPrivate.patch(`/seller/orders/${id}/status`, { status, note }).then((r) => r.data);

// Store
export const getMyStore = async () => {
  try {
    const { data } = await axiosPrivate.get("/stores/mine");
    return data.store || null;
  } catch (e) {
    if (e?.response?.status === 404) return null;
    throw e;
  }
};
export const saveMyStore = (formData) =>
  axiosPrivate
    .put("/stores/mine", formData, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data.store || r.data);
export const getStore = (id) => axiosPublic.get(`/stores/${id}`).then((r) => r.data);

// Notifications
export const getNotifications = () => axiosPrivate.get("/notification").then((r) => list(r.data, "notifications"));
export const markNotificationRead = (id) => axiosPrivate.patch(`/notification/${id}/read`);
export const markAllNotificationsRead = () => axiosPrivate.patch("/notification/read-all");