import { axiosPrivate } from "../api/axios";

// Drop empty params so the server never sees "status=" or "search=".
const clean = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""));

/* ---------- Sellers (Part 3 §6.3) ---------- */

export async function getSellers(params) {
  const { data } = await axiosPrivate.get("/admin/sellers", { params: clean(params) });
  return data; // { sellers, total, pages }
}

export async function suspendSeller(storeId, reason) {
  const { data } = await axiosPrivate.patch(`/admin/sellers/${storeId}/suspend`, { reason });
  return data;
}

export async function reinstateSeller(storeId) {
  const { data } = await axiosPrivate.patch(`/admin/sellers/${storeId}/reinstate`);
  return data;
}

// New in Part 4: the open sub-orders of one seller, so an admin can cancel them one by one.
export async function getSellerOpenOrders(storeId) {
  const { data } = await axiosPrivate.get(`/admin/sellers/${storeId}/orders`, { params: { status: "open" } });
  return data; // { orders: [...] }
}

// Part 3 §6.2: admin cancels one sub-order. Reason is required.
export async function cancelSubOrder(subOrderId, reason) {
  const { data } = await axiosPrivate.patch(`/admin/sub-orders/${subOrderId}/cancel`, { reason });
  return data;
}

/* ---------- Disputes (Part 3 §6.4) ---------- */

export async function getDisputes(params) {
  const { data } = await axiosPrivate.get("/admin/disputes", { params: clean(params) });
  return data; // { disputes, total, pages }
}

export async function resolveDispute(id, { status, adminNote }) {
  const { data } = await axiosPrivate.patch(`/admin/disputes/${id}`, { status, adminNote });
  return data;
}

/* ---------- Audit log ---------- */

export async function getAuditLog(params) {
  const { data } = await axiosPrivate.get("/admin/audit", { params: clean(params) });
  return data; // { entries, total, pages }
}

/* ---------- Account deletion requests ---------- */

export async function getDeletionRequests(params) {
  const { data } = await axiosPrivate.get("/admin/deletion-requests", { params: clean(params) });
  return data; // { requests, total, pages }
}

export async function resolveDeletionRequest(id, { action, adminNote }) {
  const { data } = await axiosPrivate.patch(`/admin/deletion-requests/${id}`, { action, adminNote });
  return data;
}