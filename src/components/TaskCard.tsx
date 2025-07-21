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

interface TaskCardProps {
  task: Task;
  onPress: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onPress }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return { bg: '#D1FAE5', text: '#065F46' };
      case 'completed': return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'pending_verification': return { bg: '#F3E8FF', text: '#7C3AED' };
      case 'in_progress': return { bg: '#FED7AA', text: '#C2410C' };
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
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Task Title and Description */}
        <View style={styles.mainContent}>
          <Text style={styles.title} numberOfLines={2}>
            {task.title}
          </Text>
          {task.description && (
            <Text style={styles.description} numberOfLines={2}>
              {task.description}
            </Text>
          )}
        </View>

        {/* Task Details */}
        <View style={styles.details}>
          {/* Assignee */}
          <View style={styles.assigneeContainer}>
            <Text style={styles.assigneeIcon}>👤</Text>
            <Text style={styles.assigneeName} numberOfLines={1}>
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
            <View style={styles.dateContainer}>
              <Text style={styles.dateIcon}>📅</Text>
              <Text style={styles.dateText}>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    gap: 12,
  },
  mainContent: {
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 20,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  details: {
    gap: 8,
  },
  assigneeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assigneeIcon: {
    fontSize: 14,
  },
  assigneeName: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
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
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateIcon: {
    fontSize: 14,
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default TaskCard; 