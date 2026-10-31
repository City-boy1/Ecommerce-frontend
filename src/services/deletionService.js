import { axiosPrivate } from "../api/axios";

export async function getMyDeletionRequest() {
  const { data } = await axiosPrivate.get("/users/me/deletion-request");
  return data; // { request: {...} | null }
}

export async function requestDeletion(reason) {
  const { data } = await axiosPrivate.post("/users/me/deletion-request", { reason });
  return data; // { request }
}

export async function cancelDeletionRequest() {
  const { data } = await axiosPrivate.delete("/users/me/deletion-request");
  return data;
}