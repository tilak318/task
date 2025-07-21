import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface ForwardTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onForward: () => void;
  taskId: string;
  taskTitle: string;
  currentAssigneeName: string;
}

interface User {
  id: string;
  name: string;
  username: string;
  role: string;
  departmentName: string;
}

const ForwardTaskModal: React.FC<ForwardTaskModalProps> = ({
  isOpen,
  onClose,
  onForward,
  taskId,
  taskTitle,
  currentAssigneeName,
}) => {
  const { user, canViewUserForAssignment } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await api.get('/users');
      if (response.data.success) {
        console.log('🔍 ForwardTaskModal: Loading users for forwarding...');
        console.log('👤 Current user:', user);
        console.log('👥 All users:', response.data.data);
        
        // Filter users based on permissions
        const filteredUsers = response.data.data.filter((u: User) => {
          const userId = typeof u.id === 'object' ? u.id.id || u.id._id : u.id;
          
          // Check if user can view this user for assignment
          const canView = canViewUserForAssignment(userId, u.role, u.departmentId);
          console.log(`👤 User ${u.name} (${u.role} - ${u.departmentName}): ${canView ? '✅ VISIBLE' : '❌ HIDDEN'}`);
          
          return canView;
        });
        
        console.log('✅ ForwardTaskModal: Filtered users for forwarding:', filteredUsers);
        setUsers(filteredUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleForward = async () => {
    if (!selectedUserId) {
      Alert.alert('Error', 'Please select a user to forward the task to');
      return;
    }

    try {
      setLoading(true);
      await api.post(`/tasks/${taskId}/forward`, {
        newAssigneeId: selectedUserId,
        note: note.trim() || undefined,
      });

      Alert.alert('Success', 'Task forwarded successfully!');
      onForward();
      onClose();
      setSelectedUserId('');
      setNote('');
    } catch (error: any) {
      console.error('Error forwarding task:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to forward task');
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    return role.replace('_', ' ').toUpperCase();
  };

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
            <Text style={styles.headerTitle}>Forward Task</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Task Info */}
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>{taskTitle}</Text>
              <Text style={styles.currentAssignee}>
                Currently assigned to: {currentAssigneeName}
              </Text>
            </View>

            {/* Select User */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Forward to User</Text>
              {loadingUsers ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#10B981" />
                  <Text style={styles.loadingText}>Loading users...</Text>
                </View>
              ) : (
                <ScrollView style={styles.usersList} showsVerticalScrollIndicator={false}>
                  {users.map((user) => (
                    <TouchableOpacity
                      key={user.id}
                      style={[
                        styles.userItem,
                        selectedUserId === user.id && styles.userItemSelected
                      ]}
                      onPress={() => setSelectedUserId(user.id)}
                    >
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userDetails}>
                          {getRoleLabel(user.role)} • {user.departmentName}
                        </Text>
                      </View>
                      {selectedUserId === user.id && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Note */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Note (Optional)</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="Add a note about why you're forwarding this task..."
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.forwardButton,
                  !selectedUserId && styles.forwardButtonDisabled
                ]}
                onPress={handleForward}
                disabled={!selectedUserId || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.forwardButtonText}>Forward Task</Text>
                )}
              </TouchableOpacity>
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
  taskInfo: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  currentAssignee: {
    fontSize: 14,
    color: '#6B7280',
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  usersList: {
    maxHeight: 200,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 8,
  },
  userItemSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  userDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  checkmark: {
    fontSize: 18,
    color: '#10B981',
    fontWeight: 'bold',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 100,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  forwardButton: {
    backgroundColor: '#10B981',
  },
  forwardButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  forwardButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ForwardTaskModal; 