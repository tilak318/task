export interface Department {
  id: string;
  name: string;
  description?: string;
  hodIds: string[];
  isActive: boolean;
  color: string;
  code?: string;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentData {
  name: string;
  description?: string;
  code?: string;
  color: string;
}

export interface UpdateDepartmentData {
  name?: string;
  description?: string;
  code?: string;
  color?: string;
  isActive?: boolean;
  hodIds?: string[];
} 