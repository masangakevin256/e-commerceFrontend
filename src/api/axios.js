import axios from 'axios';
import { BASE_URL } from '../tokens/BASE_URL';

// EDITED: Create public instance for login/register
export const axiosPublic = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true
});

// EDITED: Create private instance for protected routes
export const axiosPrivate = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true
});

// EDITED: Request interceptor to attach access token
axiosPrivate.interceptors.request.use(
    config => {
        if (!config.headers['Authorization']) {
            const token = localStorage.getItem("accessToken");
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
        }
        return config;
    }, (error) => Promise.reject(error)
);

// EDITED: Response interceptor to handle token refresh
axiosPrivate.interceptors.response.use(
    response => response,
    async (error) => {
        const prevRequest = error?.config;

        // EDITED: If 403 (Forbidden) or 401 (Unauthorized) and not already retried
        if ((error?.response?.status === 403 || error?.response?.status === 401) && !prevRequest?.sent) {
            prevRequest.sent = true;
            try {
                // EDITED: Call unified refresh endpoint
                // Note: We use axiosPublic here to avoid infinite loops if this fails
                const newAccessToken = await refresh();

                // EDITED: Update local storage with new token
                localStorage.setItem("accessToken", newAccessToken);

                // EDITED: Update header and retry original request
                prevRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                return axiosPrivate(prevRequest);
            } catch (refreshError) {
                console.error("Token refresh failed:", refreshError);
                // Optional: Redirect to login or clear storage
                // localStorage.removeItem("accessToken");
                // window.location.href = "/login"; 
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

// EDITED: Refresh function that calls the backend
export const refresh = async () => {
    try {
        const response = await axiosPublic.get('/refresh');
        // EDITED: Backend now returns { accessToken: "..." }
        return response.data.accessToken;
    } catch (error) {
        throw error;
    }
}
