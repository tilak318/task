import { api } from './api';
import { Task, CreateTaskData, UpdateTaskData } from '../types/task';

export interface TaskResponse {
  success: boolean;
  data: Task[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DashboardStats {
  totalUsers: number;
  totalDepartments: number;
  totalTasks: number;
}

class TaskService {
  async getTasks(params?: {
    status?: string;
    visibility?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }): Promise<TaskResponse> {
    try {
      console.log('📋 TaskService: Getting tasks with params:', params);
      const response = await api.get('/tasks', { params });
      console.log('📋 TaskService: Raw response:', response);
      console.log('📋 TaskService: Response data:', response.data);
      console.log('📋 TaskService: Tasks count:', response.data.data?.length || 0);
      console.log('📋 TaskService: Tasks:', response.data.data?.map((t: any) => ({
        id: t.id,
        title: t.title,
        creatorId: t.creatorId,
        assigneeId: t.assigneeId,
        status: t.status,
        visibility: t.visibility
      })));
      return response.data;
    } catch (error: any) {
      console.error('❌ TaskService: Error getting tasks:', error);
      console.error('❌ TaskService: Error response:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to fetch tasks');
    }
  }

  async getTask(id: string): Promise<Task> {
    try {
      const response = await api.get(`/tasks/${id}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch task');
    }
  }

  async createTask(taskData: CreateTaskData): Promise<Task> {
    try {
      const response = await api.post('/tasks', taskData);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create task');
    }
  }

  async updateTaskStatus(taskId: string, status: string, note?: string): Promise<Task> {
    try {
      const response = await api.put(`/tasks/${taskId}/status`, { status, note });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update task status');
    }
  }

  async forwardTask(taskId: string, newAssigneeId: string, note?: string): Promise<Task> {
    try {
      const response = await api.post(`/tasks/${taskId}/forward`, { newAssigneeId, note });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to forward task');
    }
  }

  async reassignTask(taskId: string, newAssigneeId: string, note?: string): Promise<Task> {
    try {
      const response = await api.post(`/tasks/${taskId}/reassign`, { newAssigneeId, note });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to reassign task');
    }
  }

  async verifyTask(taskId: string): Promise<Task> {
    try {
      const response = await api.put(`/tasks/${taskId}/status`, { status: 'verified' });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to verify task');
    }
  }

  async updateTask(taskId: string, taskData: UpdateTaskData): Promise<Task> {
    try {
      const response = await api.put(`/tasks/${taskId}`, taskData);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update task');
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      await api.delete(`/tasks/${taskId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete task');
    }
  }

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await api.get('/tasks/dashboard-stats');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard stats');
    }
  }
}

export default new TaskService(); 