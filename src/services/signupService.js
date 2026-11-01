import axiosPublic from "../api/axios";

export async function startSignup(name, email, password) {
  const { data } = await axiosPublic.post("/auth/signup", { name, email, password });
  return data; // { pending, email, emailSent, codeMinutes }
}

export async function verifySignup(email, code) {
  const { data } = await axiosPublic.post("/auth/signup/verify", { email, code });
  return data; // { verified: true }
}

export async function resendSignupCode(email) {
  const { data } = await axiosPublic.post("/auth/signup/resend", { email });
  return data;
}