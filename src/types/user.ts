export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  role: 'super_admin' | 'admin' | 'hod' | 'manager' | 'member';
  departmentId?: string;
  departmentName?: string;
  isActive: boolean;
  lastLogin?: string;
  profilePicture?: string;
  phone?: string;
  position?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  name: string;
  username: string;
  password: string;
  role: 'admin' | 'hod' | 'manager' | 'member';
  departmentId?: string;
  phone?: string;
  position?: string;
}

export interface UpdateUserData {
  name?: string;
  role?: 'admin' | 'hod' | 'manager' | 'member';
  departmentId?: string;
  isActive?: boolean;
  phone?: string;
  position?: string;
} 