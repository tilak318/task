import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assigneeId: string | { id: string; _id: string; name: string; email?: string; role?: string };
  assigneeName: string;
  creatorId: string | { id: string; _id: string; name: string; email?: string; role?: string };
  creatorName: string;
  departmentId: string | { id: string; _id: string; name: string; code?: string };
  departmentName: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  visibility: string;
  path?: any[];
}

interface TaskBarProps {
  task: Task;
  onPress: () => void;
}

const TaskBar: React.FC<TaskBarProps> = ({ task, onPress }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return { bg: '#D1FAE5', text: '#065F46' };
      case 'completed': return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'pending_verification': return { bg: '#F3E8FF', text: '#7C3AED' };
      case 'in_progress': return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'todo': return { bg: '#F3F4F6', text: '#374151' };
      case 'assigned': return { bg: '#F3F4F6', text: '#374151' };
      default: return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return { bg: '#FEE2E2', text: '#DC2626' };
      case 'high': return { bg: '#FED7AA', text: '#EA580C' };
      case 'medium': return { bg: '#FEF3C7', text: '#D97706' };
      case 'low': return { bg: '#D1FAE5', text: '#059669' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'todo': return 'To Do';
      case 'assigned': return 'Assigned';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'pending_verification': return 'Pending Verification';
      case 'verified': return 'Verified';
      default: return status;
    }
  };

  const statusColors = getStatusColor(task.status);
  const priorityColors = getPriorityColor(task.priority);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        {/* Task Title and Description */}
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {task.title}
          </Text>
          {task.description && (
            <Text style={styles.description} numberOfLines={2}>
              {task.description}
            </Text>
          )}
        </View>

        {/* Task Details */}
        <View style={styles.detailsContainer}>
          {/* Assignee */}
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Assignee:</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {task.assigneeName}
            </Text>
          </View>

          {/* Status and Priority */}
          <View style={styles.badgesContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
              <Text style={[styles.statusText, { color: statusColors.text }]}>
                {getStatusLabel(task.status)}
              </Text>
            </View>
            
            <View style={[styles.priorityBadge, { backgroundColor: priorityColors.bg }]}>
              <Text style={[styles.priorityText, { color: priorityColors.text }]}>
                {task.priority.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Due Date */}
          {task.dueDate && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Due:</Text>
              <Text style={styles.detailValue}>
                {new Date(task.dueDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  content: {
    gap: 12,
  },
  textContainer: {
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  detailsContainer: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    minWidth: 60,
  },
  detailValue: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
});

export default TaskBar; 