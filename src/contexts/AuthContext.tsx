import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export type UserRole = 'super_admin' | 'admin' | 'hod' | 'manager' | 'member';

export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  role: UserRole;
  departmentId: string;
  departmentName: string;
  profilePicture?: string;
  phone?: string;
  position?: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  hodIds: string[];
  code: string;
  color: string;
}

interface AuthContextType {
  user: User | null;
  departments: Department[];
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshDepartments: () => Promise<void>;
  canCreateUsersFor: (targetRole: UserRole) => boolean;
  canManageDepartments: () => boolean;
  canCreateTasksFor: (targetUserId: string, targetRole: UserRole, targetDepartmentId: string) => boolean;
  canViewTasksOf: (departmentId: string) => boolean;
  canViewUserForAssignment: (targetUserId: string, targetRole: UserRole, targetDepartmentId: string) => boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Check for existing token on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (token) {
        await fetchUser(token);
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async (token: string) => {
    try {
      const response = await api.get('/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.data.success) {
        setUser(response.data.data);
        await fetchDepartments(token);
      } else {
        await AsyncStorage.removeItem('token');
      }
    } catch (error: any) {
      console.error('Error fetching user:', error);
      await AsyncStorage.removeItem('token');
    }
  };

  const fetchDepartments = async (token: string) => {
    try {
      const response = await api.get('/departments?isActive=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.data.success) {
        setDepartments(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching departments:', error);
    }
  };

  const refreshDepartments = async () => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      await fetchDepartments(token);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post('/auth/login', {
        username,
        password
      });

      if (response.data.success) {
        const { token, user: userData } = response.data.data;
        await AsyncStorage.setItem('token', token);
        setUser(userData);
        await fetchDepartments(token);
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Login failed. Please try again.');
      }
    }
  };

  const logout = async () => {
    try {
      // Clear user state immediately
      setUser(null);
      setDepartments([]);
      
      // Remove token from storage
      await AsyncStorage.removeItem('token');
      
      // Also clear any other stored data
      await AsyncStorage.multiRemove(['token', 'user', 'departments']);
      
      // Force app to re-render by triggering a state update
      setLoading(true);
      setTimeout(() => setLoading(false), 50);
      
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, clear the state
      setUser(null);
      setDepartments([]);
      await AsyncStorage.removeItem('token');
    }
  };

  const canCreateUsersFor = (targetRole: UserRole): boolean => {
    if (!user) return false;
    
    switch (user.role) {
      case 'super_admin':
        return ['admin', 'hod', 'manager', 'member'].includes(targetRole);
      case 'admin':
        return ['hod', 'manager', 'member'].includes(targetRole);
      case 'hod':
      case 'manager':
      case 'member':
        return false;
      default:
        return false;
    }
  };

  const canManageDepartments = (): boolean => {
    if (!user) return false;
    return ['super_admin', 'admin'].includes(user.role);
  };

  const canCreateTasksFor = (targetUserId: string, targetRole: UserRole, targetDepartmentId: string): boolean => {
    if (!user) return false;

    const currentDeptId = typeof user.departmentId === 'object' ? user.departmentId?._id || user.departmentId?.id : user.departmentId;
    const targetDeptId = typeof targetDepartmentId === 'object' ? targetDepartmentId?._id || targetDepartmentId?.id : targetDepartmentId;

    switch (user.role) {
      case 'super_admin':
        return true;
      case 'admin':
        return ['hod', 'manager', 'member'].includes(targetRole);
      case 'hod':
        if (currentDeptId === targetDeptId) {
          // For own department: Can assign to managers and members except themselves
          const canCreate = targetUserId !== user.id && ['manager', 'member'].includes(targetRole);
          console.log(`HOD checking own department: ${targetRole} (${targetUserId}) - ${canCreate}`);
          return canCreate;
        } else {
          // For other departments: Only HODs (handoff model)
          const canCreate = targetRole === 'hod';
          console.log(`HOD checking other department: ${targetRole} - ${canCreate}`);
          return canCreate;
        }
      case 'manager':
        return currentDeptId === targetDeptId && ['manager', 'member'].includes(targetRole);
      case 'member':
        return currentDeptId === targetDeptId && targetRole === 'member';
      default:
        return false;
    }
  };

  const canViewTasksOf = (departmentId: string): boolean => {
    if (!user) return false;
    
    switch (user.role) {
      case 'super_admin':
        return true;
      case 'admin':
        return true;
      case 'hod':
        return departmentId === user.departmentId;
      case 'manager':
      case 'member':
        return false;
      default:
        return false;
    }
  };

  const canViewUserForAssignment = (targetUserId: string, targetRole: UserRole, targetDepartmentId: string): boolean => {
    if (!user) return false;

    // Don't show the current user in the dropdown (can't assign to yourself)
    if (targetUserId === user.id) return false;

    const currentDeptId = typeof user.departmentId === 'object' ? user.departmentId?._id || user.departmentId?.id : user.departmentId;
    const targetDeptId = typeof targetDepartmentId === 'object' ? targetDepartmentId?._id || targetDepartmentId?.id : targetDepartmentId;

    console.log('canViewUserForAssignment check:', {
      userRole: user.role,
      userDepartmentId: user.departmentId,
      currentDeptId,
      targetUserId,
      targetRole,
      targetDepartmentId,
      targetDeptId,
      departmentMatch: currentDeptId === targetDeptId
    });

    switch (user.role) {
      case 'super_admin':
        // Can see all users for assignment
        console.log(`Super Admin can view ${targetRole} in any department: true`);
        return true;
      case 'admin':
        // Can see all users except super_admin and other admins for assignment
        const adminCanView = targetRole !== 'super_admin' && targetRole !== 'admin';
        console.log(`Admin can view ${targetRole}: ${adminCanView}`);
        return adminCanView;
      case 'hod':
        // Can see all users in their department AND HODs from other departments
        const hodCanView = currentDeptId === targetDeptId || targetRole === 'hod';
        console.log(`HOD can view ${targetRole} in department: ${hodCanView} (same dept: ${currentDeptId === targetDeptId}, is HOD: ${targetRole === 'hod'})`);
        return hodCanView;
      case 'manager':
        // Can see managers and members in their department for assignment
        return currentDeptId === targetDeptId && ['manager', 'member'].includes(targetRole);
      case 'member':
        // Can see other members in their department for assignment
        return currentDeptId === targetDeptId && targetRole === 'member';
      default:
        return false;
    }
  };

  const value: AuthContextType = {
    user,
    departments,
    login,
    logout,
    refreshDepartments,
    canCreateUsersFor,
    canManageDepartments,
    canCreateTasksFor,
    canViewTasksOf,
    canViewUserForAssignment,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 