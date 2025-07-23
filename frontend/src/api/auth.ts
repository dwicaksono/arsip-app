import type { ApiResponse, User } from "../types";
import api from "./axios";

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post<ApiResponse<AuthResponse>>("/auth/login", credentials);
    return response.data;
  },
  
  register: async (credentials: RegisterCredentials) => {
    const response = await api.post<ApiResponse<AuthResponse>>("/auth/register", credentials);
    return response.data;
  },
  
  me: async () => {
    const response = await api.get<ApiResponse<User>>("/auth/me");
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post<ApiResponse<null>>("/auth/logout");
    localStorage.removeItem("token");
    return response.data;
  }
};
