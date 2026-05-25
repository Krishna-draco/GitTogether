import axios from "axios";
import { API_BASE_URL } from "../utils/constants";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiService = {
  // Rooms
  createRoom: () => api.post("/api/rooms/create"),
  getRoomState: (roomId) => api.get(`/api/rooms/${roomId}`),
  listRooms: () => api.get("/api/rooms"),
  deleteRoom: (roomId) => api.delete(`/api/rooms/${roomId}`),

  // Stats
  getStats: () => api.get("/api/stats"),

  // Health
  health: () => api.get("/"),
  // Auth
  register: (payload) => api.post("/api/auth/register", payload),
  login: (payload) => api.post("/api/auth/login", payload),
  me: () => api.get("/api/auth/me"),
};

export default api;
