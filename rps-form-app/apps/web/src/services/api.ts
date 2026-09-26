import axios from 'axios';
import { RpsDocument, TemplateInfo } from '../types/rps';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const rpsApi = {
  async getRpsList(search?: string, status?: string): Promise<RpsDocument[]> {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (status && status !== 'Semua Status') params.status = status;
    const res = await api.get<RpsDocument[]>('/rps', { params });
    return res.data;
  },

  async getRpsById(id: string): Promise<RpsDocument> {
    const res = await api.get<RpsDocument>(`/rps/${id}`);
    return res.data;
  },

  async createRps(payload: {
    title?: string;
    courseName?: string;
    courseCode?: string;
    status?: string;
    data: any;
    completionPercentage?: number;
  }): Promise<RpsDocument> {
    const res = await api.post<RpsDocument>('/rps', payload);
    return res.data;
  },

  async updateRps(
    id: string,
    payload: {
      title?: string;
      courseName?: string;
      courseCode?: string;
      status?: string;
      data: any;
      completionPercentage?: number;
    }
  ): Promise<RpsDocument> {
    const res = await api.put<RpsDocument>(`/rps/${id}`, payload);
    return res.data;
  },

  async deleteRps(id: string): Promise<{ success: boolean }> {
    const res = await api.delete<{ success: boolean }>(`/rps/${id}`);
    return res.data;
  },

  getDocxExportUrl(id: string): string {
    const base = import.meta.env.VITE_API_URL || '/api';
    return `${base}/rps/${id}/export/docx`;
  },

  async exportPdf(id: string): Promise<Blob> {
    const res = await api.get(`/rps/${id}/export/pdf`, {
      responseType: 'blob',
    });
    return res.data;
  },

  async getTemplateInfo(): Promise<TemplateInfo> {
    const res = await api.get<TemplateInfo>('/templates');
    return res.data;
  },

  async uploadTemplate(file: File): Promise<{ success: boolean; message: string; backupCreated: string | null }> {
    const formData = new FormData();
    formData.append('template', file);
    const res = await api.post('/templates/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
};

export default api;
