import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import StatusDropdown from './StatusDropdown';

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

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (taskId: string, status: string) => Promise<void>;
  onForward: (taskId: string) => void;
  onVerify: (taskId: string, verified: boolean) => Promise<void>;
  onDelete: (taskId: string) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onStatusUpdate,
  onForward,
  onVerify,
  onDelete,
}) => {
  const { user } = useAuth();
  const [updatingStatus, setUpdatingStatus] = useState(false);

  if (!task || !user) return null;

  // Helper function to safely extract and compare IDs
  const extractId = (id: any) => {
    if (!id) return null;
    return typeof id === 'object' ? id.id || id._id : id;
  };

  // Permission checks
  const currentUserId = extractId(user.id);
  const taskCreatorId = extractId(task.creatorId);
  const taskAssigneeId = extractId(task.assigneeId);

  const isCreator = currentUserId === taskCreatorId;
  const isAssignee = currentUserId === taskAssigneeId;
  
  // Check if user has forwarded this task (loses authority)
  const hasForwardedTask = task.path && task.path.some(pathItem => {
    const pathUserId = typeof pathItem.userId === 'object' ? pathItem.userId.id || pathItem.userId._id : pathItem.userId;
    return pathItem.action === 'forwarded' && pathUserId === currentUserId;
  });
  
  // Only original creator can verify (not users who forwarded the task)
  const canVerify = isCreator && (task.status === 'pending_verification' || task.status === 'completed') && !hasForwardedTask;
  const canForward = isAssignee && task.status !== 'completed' && task.status !== 'verified' && task.status !== 'pending_verification';
  const canDelete = isCreator;

  console.log('🔍 TaskDetailModal Permissions:', {
    currentUserId,
    taskCreatorId,
    taskAssigneeId,
    isCreator,
    isAssignee,
    hasForwardedTask,
    canVerify,
    canForward,
    canDelete,
    taskStatus: task.status
  });

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

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setUpdatingStatus(true);
      await onStatusUpdate(task.id, newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleVerify = async (verified: boolean) => {
    try {
      await onVerify(task.id, verified);
    } catch (error) {
      console.error('Error verifying task:', error);
    }
  };

  const statusColors = getStatusColor(task.status);
  const priorityColors = getPriorityColor(task.priority);

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Task Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Task Title */}
            <Text style={styles.title}>{task.title}</Text>

            {/* Status and Priority Badges */}
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

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{task.description}</Text>
            </View>

            {/* Task Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Task Details</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Assigned to:</Text>
                <Text style={styles.detailValue}>{task.assigneeName}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created by:</Text>
                <Text style={styles.detailValue}>{task.creatorName}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Department:</Text>
                <Text style={styles.detailValue}>{task.departmentName}</Text>
              </View>
              
              {task.dueDate && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Due Date:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(task.dueDate).toLocaleDateString()}
                  </Text>
                </View>
              )}
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created:</Text>
                <Text style={styles.detailValue}>
                  {new Date(task.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {/* Task Journey - Full Path */}
            {task.path && task.path.length > 1 && (
              <View style={styles.section}>
                <View style={styles.journeyHeader}>
                  <View style={styles.journeyDot} />
                  <Text style={styles.sectionTitle}>Task Journey</Text>
                </View>
                
                <View style={styles.journeyContainer}>
                  {task.path.map((pathItem, index) => (
                    <View key={index} style={styles.journeyItem}>
                      <View style={[
                        styles.journeyIcon,
                        index === 0 ? styles.journeyIconStart : 
                        index === task.path.length - 1 ? styles.journeyIconEnd : 
                        styles.journeyIconMiddle
                      ]}>
                        {index === 0 && <Text style={styles.journeyIconText}>✓</Text>}
                        {index === task.path.length - 1 && <Text style={styles.journeyIconText}>✓</Text>}
                        {index !== 0 && index !== task.path.length - 1 && (
                          <View style={styles.journeyIconDot} />
                        )}
                      </View>
                      
                      <View style={styles.journeyContent}>
                        <View style={styles.journeyHeaderRow}>
                          <Text style={styles.journeyUserName}>{pathItem.userName}</Text>
                          <View style={[
                            styles.journeyActionBadge,
                            pathItem.action === 'created' ? styles.actionCreated :
                            pathItem.action === 'forwarded' ? styles.actionForwarded :
                            pathItem.action === 'completed' ? styles.actionCompleted :
                            pathItem.action === 'verified' ? styles.actionVerified :
                            styles.actionDefault
                          ]}>
                            <Text style={styles.journeyActionText}>
                              {pathItem.action.charAt(0).toUpperCase() + pathItem.action.slice(1)}
                            </Text>
                          </View>
                        </View>
                        
                        <View style={styles.journeyMeta}>
                          <Text style={styles.journeyRole}>
                            {pathItem.role.replace('_', ' ').toUpperCase()}
                          </Text>
                          <Text style={styles.journeySeparator}>•</Text>
                          <Text style={styles.journeyDate}>
                            {new Date(pathItem.timestamp).toLocaleDateString()}
                          </Text>
                        </View>
                        
                        {pathItem.note && (
                          <Text style={styles.journeyNote}>{pathItem.note}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              {/* Status Dropdown - Only for assignee when task is not completed/pending verification */}
              {isAssignee && task.status !== 'completed' && task.status !== 'pending_verification' && (
                <View style={styles.statusSection}>
                  <Text style={styles.sectionTitle}>Update Status</Text>
                  <StatusDropdown
                    currentStatus={task.status}
                    onStatusChange={handleStatusUpdate}
                    disabled={updatingStatus}
                    isAssignee={isAssignee}
                  />
                </View>
              )}

              {/* Forward Button - Only for current assignee */}
              {canForward && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={() => onForward(task.id)}
                >
                  <Text style={styles.secondaryButtonText}>Forward Task</Text>
                </TouchableOpacity>
              )}

              {/* Verify/Reassign Buttons - Only for creator when task is pending verification */}
              {task.status === 'pending_verification' && canVerify && (
                <View style={styles.verifyButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.successButton]}
                    onPress={() => handleVerify(true)}
                  >
                    <Text style={styles.successButtonText}>Verify Task</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.warningButton]}
                    onPress={() => handleVerify(false)}
                  >
                    <Text style={styles.warningButtonText}>Reassign Task</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Delete Button - Only for creator */}
              {canDelete && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.dangerButton]}
                  onPress={() => onDelete(task.id)}
                >
                  <Text style={styles.dangerButtonText}>Delete Task</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    fontSize: 20,
    color: '#6B7280',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    lineHeight: 24,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  infoValue: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    textAlign: 'right',
  },
  actionsContainer: {
    gap: 16,
    marginTop: 20,
  },
  statusSection: {
    gap: 12,
  },
  actionButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: '#3B82F6',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  successButton: {
    backgroundColor: '#10B981',
  },
  successButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  warningButton: {
    backgroundColor: '#F59E0B',
  },
  warningButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#EF4444',
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyButtonsContainer: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  detailValue: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    textAlign: 'right',
  },
  journeyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  journeyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  journeyContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  journeyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  journeyIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  journeyIconStart: {
    backgroundColor: '#10B981',
  },
  journeyIconMiddle: {
    backgroundColor: '#6B7280',
  },
  journeyIconEnd: {
    backgroundColor: '#3B82F6',
  },
  journeyIconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
  },
  journeyIconText: {
    fontSize: 16,
    color: 'white',
  },
  journeyContent: {
    flex: 1,
  },
  journeyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  journeyUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  journeyActionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionCreated: {
    backgroundColor: '#D1FAE5',
  },
  actionForwarded: {
    backgroundColor: '#DBEAFE',
  },
  actionCompleted: {
    backgroundColor: '#F3E8FF',
  },
  actionVerified: {
    backgroundColor: '#D1FAE5',
  },
  actionDefault: {
    backgroundColor: '#F3F4F6',
  },
  journeyActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  journeyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  journeyRole: {
    fontSize: 12,
    color: '#6B7280',
  },
  journeySeparator: {
    marginHorizontal: 4,
    color: '#D1D5DB',
  },
  journeyDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  journeyNote: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 4,
  },
});

export default TaskDetailModal; 