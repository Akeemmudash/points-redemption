import axios from "axios";
import { toast } from "sonner";
import { API_URL } from "@/lib/env";

export const client = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
  },
});

client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("prs_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || "An error occurred";

    if (status === 401) {
      localStorage.removeItem("prs_token");
      window.dispatchEvent(new CustomEvent("auth-unauthorized"));
    } else if (status === 429) {
      toast.error("Too many requests. Please slow down.");
    } else if (status !== 422) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);
