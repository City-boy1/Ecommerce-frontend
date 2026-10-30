import { axiosPrivate } from "../api/axios";

// { review: {...} | null, canReview: boolean }
export const getMyReview = (productId) =>
  axiosPrivate.get(`/products/${productId}/reviews/mine`).then((r) => r.data);

export const createReview = (productId, body) =>
  axiosPrivate.post(`/products/${productId}/reviews`, body).then((r) => r.data.review);

export const updateMyReview = (productId, body) =>
  axiosPrivate.put(`/products/${productId}/reviews/mine`, body).then((r) => r.data.review);

export const deleteMyReview = (productId) =>
  axiosPrivate.delete(`/products/${productId}/reviews/mine`).then((r) => r.data);