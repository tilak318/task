export interface Task {
  id: string;
  title: string;
  description?: string;
  creatorId: string;
  creatorName?: string;
  assigneeId?: string;
  assigneeName?: string;
  departmentId?: string;
  departmentName?: string;
  parentTaskId?: string;
  status: 'todo' | 'assigned' | 'in_progress' | 'completed' | 'pending_verification' | 'verified';
  visibility: 'public' | 'private';
  path: TaskPathItem[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  estimatedHours?: number;
  completedHours?: number;
  tags?: string[];
  attachments?: TaskAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskPathItem {
  role: string;
  userId: string;
  userName: string;
  timestamp: string;
  action: 'created' | 'assigned' | 'forwarded' | 'completed' | 'marked_completed' | 'verified' | 'reassigned' | 'status_updated';
  note?: string;
}

export interface TaskAttachment {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  assigneeId?: string;
  departmentId?: string;
  visibility: 'public' | 'private';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  estimatedHours?: number;
  tags?: string[];
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  estimatedHours?: number;
  tags?: string[];
} 