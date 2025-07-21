import { api } from './api';
import { Department } from '../types/department';

export interface CreateDepartmentData {
  name: string;
  description?: string;
  code?: string;
  color?: string;
  hodIds?: string[];
}

export interface UpdateDepartmentData {
  name?: string;
  description?: string;
  code?: string;
  color?: string;
  isActive?: boolean;
  hodIds?: string[];
}

export interface DepartmentResponse {
  success: boolean;
  data: Department[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class DepartmentService {
  async getDepartments(filters?: {
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<DepartmentResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await api.get(`/departments?${params}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch departments');
    }
  }

  async getDepartmentById(departmentId: string): Promise<Department> {
    try {
      const response = await api.get(`/departments/${departmentId}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch department');
    }
  }

  async createDepartment(departmentData: CreateDepartmentData): Promise<Department> {
    try {
      const response = await api.post('/departments', departmentData);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create department');
    }
  }

  async updateDepartment(departmentId: string, departmentData: UpdateDepartmentData): Promise<Department> {
    try {
      const response = await api.put(`/departments/${departmentId}`, departmentData);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update department');
    }
  }

  async deleteDepartment(departmentId: string): Promise<void> {
    try {
      await api.delete(`/departments/${departmentId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete department');
    }
  }

  async getDepartmentUsers(departmentId: string, filters?: {
    role?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; pagination: any }> {
    try {
      const params = new URLSearchParams();
      if (filters?.role) params.append('role', filters.role);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await api.get(`/departments/${departmentId}/users?${params}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch department users');
    }
  }

  async getActiveDepartments(): Promise<Department[]> {
    try {
      const response = await this.getDepartments({ isActive: true });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch active departments');
    }
  }
}

export default new DepartmentService(); 