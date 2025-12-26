import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3500",
});

// Add interceptor
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Check if error is due to expired token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Call refresh endpoint
      const refreshToken = localStorage.getItem("refreshToken");
      const res = await axios.post("/refresh/admins", { refreshToken });
      console.log(res.data || "Failed to refresh token");
      

      // Save new access token
      localStorage.setItem("accessToken", res.data.accessToken);

      // Update header and retry original request
      api.defaults.headers.common["Authorization"] = `Bearer ${res.data.accessToken}`;
      originalRequest.headers["Authorization"] = `Bearer ${res.data.accessToken}`;

      return api(originalRequest);
    }
    return Promise.reject(error);
  }
);

export default api;