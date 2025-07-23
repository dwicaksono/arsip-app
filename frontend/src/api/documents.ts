import type { ApiResponse, Document } from "../types";
import api from "./axios";

export const documentsApi = {
  getAll: async () => {
    const response = await api.get<ApiResponse<Document[]>>("/documents");
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Document>>(`/documents/${id}`);
    return response.data;
  },
  
  upload: async (formData: FormData) => {
    const response = await api.post<ApiResponse<Document>>("/documents/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<null>>(`/documents/${id}`);
    return response.data;
  },
};
