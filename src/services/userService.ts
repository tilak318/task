import { api } from './api';
import { User } from '../types/user';

export interface UserResponse {
  success: boolean;
  data: User[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class UserService {
  async getUsers(params?: {
    role?: string;
    departmentId?: string;
    page?: number;
    limit?: number;
  }): Promise<UserResponse> {
    try {
      const response = await api.get('/users', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  }

  async getUserById(userId: string): Promise<User> {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user');
    }
  }

  async getAssignableUsers(): Promise<User[]> {
    try {
      const response = await api.get('/users/assignable');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch assignable users');
    }
  }
}

export default new UserService(); 