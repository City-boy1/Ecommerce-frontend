import axios from "axios";

const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN || "http://localhost:3000").replace(/\/+$/, "");
const BASEURL = `${API_ORIGIN}/api`;

export const axiosPublic = axios.create({ baseURL: BASEURL, withCredentials: true });
export default axiosPublic
export const axiosPrivate = axios.create({ baseURL: BASEURL, withCredentials: true });

let accessToken = null;
let isRefreshing = false;
let queue = [];

export const setAccessToken = (t) => { accessToken = t; };
export const getAccessToken = () => accessToken;

const processQueue = (error, token = null) => {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  queue = [];
};

axiosPrivate.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosPrivate.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (err.response?.status !== 401 || original._retry) {
      return Promise.reject(err);
    }
    original._retry = true;

    // Someone else is already refreshing: wait in line
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return axiosPrivate(original);
      });
    }

    isRefreshing = true;
    try {
      const r = await axiosPublic.post("/auth/refresh");
      const newToken = r.data.accessToken;
      setAccessToken(newToken);
      processQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return axiosPrivate(original);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      setAccessToken(null);
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

let refreshPromise = null;

export const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = axiosPublic
      .post("/auth/refresh")
      .then((res) => {
        setAccessToken(res.data.accessToken);
        return res.data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};