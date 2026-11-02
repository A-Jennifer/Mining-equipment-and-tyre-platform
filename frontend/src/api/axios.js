import axios from "axios";

// Default to relative "/api" in production for single-domain deployment,
// and localhost in local development.
const defaultBaseURL =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000/api";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || defaultBaseURL
});

// Attach the JWT (if present) to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
