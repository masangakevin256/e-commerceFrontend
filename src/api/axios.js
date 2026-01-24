import axios from "axios";
import { BASE_URL } from "../tokens/BASE_URL";



// Public axios (login, register, refresh)
export const axiosPublic = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true
});

// Private axios (protected routes)
export const axiosPrivate = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true
});

let accessToken = localStorage.getItem("accessToken");

axiosPrivate.interceptors.request.use(
  (config) => {
    if (!config.headers.Authorization && accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};


axiosPrivate.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosPrivate(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();

        accessToken = newToken;
        localStorage.setItem("accessToken", newToken);
        axiosPrivate.defaults.headers.common.Authorization = `Bearer ${newToken}`;

        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosPrivate(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError, null);
        logout();
        return Promise.reject(refreshError);

      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);


export const refreshAccessToken = async () => {
  const response = await axiosPublic.get("/refresh");
  return response.data.accessToken;
};


export const logout = () => {
  accessToken = null;
  localStorage.removeItem("accessToken");
  delete axiosPrivate.defaults.headers.common.Authorization;
  window.location.href = "/";
};
