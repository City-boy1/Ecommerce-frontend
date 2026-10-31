import axiosPublic from "../api/axios";

export async function requestPasswordReset(email) {
  const { data } = await axiosPublic.post("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(token, newPassword) {
  const { data } = await axiosPublic.post("/auth/reset-password", { token, newPassword });
  return data;
}