import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import TextInput from '../components/TextInput';
import TextArea from '../components/TextArea';
import UserSelectDropdown from '../components/UserSelectDropdown';
import SelectDropdown from '../components/SelectDropdown';
import CalendarInput from '../components/CalendarInput';
import { taskValidation } from '../utils/validation';
import { toast } from '../hooks/useToast';

interface CreateTaskData {
  title: string;
  description: string;
  assigneeId: string;
  departmentId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string;
  estimatedHours?: number;
  tags: string[];
  visibility: 'public';
}

const AssignTaskScreen: React.FC = () => {
  const { user, canCreateTasksFor, canViewUserForAssignment } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);

  const [taskForm, setTaskForm] = useState<CreateTaskData>({
    title: '',
    description: '',
    assigneeId: '',
    departmentId: '',
    priority: 'medium',
    dueDate: '',
    estimatedHours: undefined,
    tags: [],
    visibility: 'public'
  });

  const [errors, setErrors] = useState<Partial<CreateTaskData>>({});

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ];

  // Fetch all users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on current user's role and permissions
  useEffect(() => {
    if (!user || availableUsers.length === 0) return;
    
    console.log('🔍 AssignTaskScreen: Filtering users based on permissions...');
    console.log('👤 Current user:', user);
    console.log('👥 Available users count:', availableUsers.length);
    
    // Filter users based on who should be visible in the dropdown
    const allowedUsers = availableUsers.filter(targetUser => {
      console.log('🔍 Checking user for dropdown:', {
        targetUserId: targetUser.id,
        targetUserRole: targetUser.role,
        targetUserDepartmentId: targetUser.departmentId,
        currentUserId: user?.id,
        currentUserDepartmentId: user?.departmentId
      });
      
      const canView = canViewUserForAssignment(targetUser.id, targetUser.role, targetUser.departmentId);
      console.log(`👤 User ${targetUser.name} (${targetUser.role} - ${targetUser.departmentName}): ${canView ? '✅ VISIBLE' : '❌ HIDDEN'}`);
      return canView;
    });
    
    console.log('✅ AssignTaskScreen: Filtered users count:', allowedUsers.length);
    console.log('✅ AssignTaskScreen: Filtered users:', allowedUsers);
    setFilteredUsers(allowedUsers);
  }, [user, availableUsers, canViewUserForAssignment]);

  const fetchUsers = async () => {
    try {
      console.log('🌐 AssignTaskScreen: Fetching all users...');
      setLoading(true);
      const response = await api.get('/users');
      
      if (response.data.success) {
        console.log('✅ AssignTaskScreen: Users fetched successfully:', response.data.data);
        setAvailableUsers(response.data.data);
      } else {
        console.error('❌ AssignTaskScreen: Failed to fetch users:', response.data.message);
        toast.error('Error', 'Failed to fetch users');
      }
    } catch (error) {
      console.error('❌ AssignTaskScreen: Error fetching users:', error);
      toast.error('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateTaskData, value: any) => {
    console.log(`📝 AssignTaskScreen: Updating ${field} to:`, value);
    setTaskForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleUserSelect = (userId: string) => {
    console.log('👤 AssignTaskScreen: User selected:', userId);
    const selectedUser = filteredUsers.find(u => u.id === userId);
    
    if (selectedUser) {
      // Extract the actual department ID (handle both string and object formats)
      const departmentId = typeof selectedUser.departmentId === 'object' 
        ? selectedUser.departmentId._id || selectedUser.departmentId.id 
        : selectedUser.departmentId;
      
      console.log('🏢 AssignTaskScreen: Setting departmentId to:', departmentId);
      console.log('👤 AssignTaskScreen: Selected user details:', selectedUser);
      
      handleInputChange('assigneeId', userId);
      handleInputChange('departmentId', departmentId);
    }
  };

  const validateForm = (): boolean => {
    console.log('🔍 AssignTaskScreen: Validating form data:', taskForm);
    
    const validationResult = taskValidation.validate(taskForm);
    console.log('✅ AssignTaskScreen: Validation result:', validationResult);
    
    if (!validationResult.isValid) {
      const newErrors: Partial<CreateTaskData> = {};
      
      validationResult.errors.forEach(error => {
        console.log('❌ AssignTaskScreen: Validation error:', error);
        // Extract field name from error message
        const fieldMatch = error.match(/^(\w+) is required/);
        if (fieldMatch) {
          const field = fieldMatch[1] as keyof CreateTaskData;
          newErrors[field] = error;
        } else if (error.includes('title')) {
          newErrors.title = error;
        } else if (error.includes('assignee')) {
          newErrors.assigneeId = error;
        } else if (error.includes('due date')) {
          newErrors.dueDate = error;
        }
      });
      
      setErrors(newErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleSubmit = async () => {
    if (!user) {
      console.log('❌ AssignTaskScreen: No user found');
      return;
    }

    console.log('🚀 AssignTaskScreen: Starting task submission...');
    console.log('📋 AssignTaskScreen: Form data:', taskForm);

    // Check if user can actually assign to the selected assignee
    const selectedUser = availableUsers.find(u => u.id === taskForm.assigneeId);
    if (selectedUser && !canCreateTasksFor(selectedUser.id, selectedUser.role, selectedUser.departmentId)) {
      console.log('❌ AssignTaskScreen: Permission denied for user:', selectedUser);
      toast.error('Permission Denied', 'You cannot assign tasks to this user.');
      return;
    }

    if (!validateForm()) {
      console.log('❌ AssignTaskScreen: Form validation failed');
      toast.error('Validation Error', 'Please fix the errors in the form');
      return;
    }

    try {
      setSubmitting(true);
      
      console.log('🌐 AssignTaskScreen: Sending API request to /tasks');
      console.log('📤 AssignTaskScreen: Request payload:', taskForm);
      
      const response = await api.post('/tasks', taskForm);
      
      console.log('✅ AssignTaskScreen: API response received:', response.data);
      
      if (response.data.success) {
        console.log('🎉 AssignTaskScreen: Task created successfully');
        toast.success(
          'Task Assigned Successfully',
          `Task "${taskForm.title}" has been assigned successfully!`
        );
        
        // Reset form
        setTaskForm({
          title: '',
          description: '',
          assigneeId: '',
          departmentId: '',
          priority: 'medium',
          dueDate: '',
          estimatedHours: undefined,
          tags: [],
          visibility: 'public'
        });
        setErrors({});
      } else {
        console.log('❌ AssignTaskScreen: API returned error:', response.data.message);
        toast.error('Error', response.data.message || 'Failed to create task');
      }
    } catch (error: any) {
      console.error('❌ AssignTaskScreen: Task creation error:', error);
      console.error('❌ AssignTaskScreen: Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
      });
      
      let errorMessage = "Failed to create task. Please try again.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        // Handle validation errors from server
        const validationErrors = error.response.data.errors;
        const errorMessages = validationErrors.map((err: any) => err.msg).join(', ');
        errorMessage = `Validation errors: ${errorMessages}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = () => {
    const valid = (
      taskForm.title.trim() !== '' &&
      taskForm.assigneeId !== '' &&
      taskForm.dueDate !== ''
    );
    console.log('🔍 AssignTaskScreen: Form valid check:', {
      title: taskForm.title.trim() !== '',
      assigneeId: taskForm.assigneeId !== '',
      dueDate: taskForm.dueDate !== '',
      overall: valid
    });
    return valid;
  };

  const selectedUser = filteredUsers.find(u => u.id === taskForm.assigneeId);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Assign New Task</Text>
          <Text style={styles.headerSubtitle}>
            Create and assign tasks based on your role permissions
          </Text>
          
          {/* Role and Department Info */}
          <View style={styles.userInfo}>
            <Text style={styles.userInfoText}>
              Your role: <Text style={styles.userInfoHighlight}>{user?.role?.replace('_', ' ')}</Text>
            </Text>
            <Text style={styles.userInfoText}>
              Department: <Text style={styles.userInfoHighlight}>{user?.departmentName}</Text>
            </Text>
          </View>

          {/* Assignment Rules */}
          <View style={styles.rulesContainer}>
            <Text style={styles.rulesTitle}>Assignment Rules:</Text>
            <Text style={styles.rulesText}>
              {user?.role === 'manager' && 'You can assign tasks to managers and members of your department only.'}
              {user?.role === 'member' && 'You can assign tasks to members of your department only.'}
              {user?.role === 'hod' && 'You can assign tasks to managers and members of your department, or HODs of other departments.'}
              {user?.role === 'admin' && 'You can assign tasks to HODs, managers, and members across all departments.'}
              {user?.role === 'super_admin' && 'You can assign tasks to any user in the system.'}
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Task Title */}
          <TextInput
            label="Task Title"
            value={taskForm.title}
            onChangeText={(text) => handleInputChange('title', text)}
            placeholder="Enter task title"
            required
            error={errors.title}
          />

          {/* Task Description */}
          <TextArea
            label="Description"
            value={taskForm.description}
            onChangeText={(text) => handleInputChange('description', text)}
            placeholder="Enter task description (optional)"
            rows={4}
          />

          {/* Assignee Selection */}
          <UserSelectDropdown
            label="Assign To"
            value={taskForm.assigneeId}
            onValueChange={handleUserSelect}
            placeholder="Select assignee"
            required
            error={errors.assigneeId}
            users={filteredUsers}
          />

          {/* Show message if no users available */}
          {filteredUsers.length === 0 && !loading && (
            <View style={styles.noUsersContainer}>
              <Text style={styles.noUsersText}>
                <Text style={styles.noUsersTitle}>No users available for assignment.</Text>
                {'\n'}
                {user?.role === 'manager' && 'You can only assign tasks to managers and members within your department.'}
                {user?.role === 'member' && 'You can only assign tasks to members within your department.'}
                {user?.role === 'hod' && 'You can assign tasks to managers and members in your department, or HODs in other departments.'}
                {user?.role === 'admin' && 'You can assign tasks to HODs, managers, and members across all departments.'}
                {user?.role === 'super_admin' && 'You can assign tasks to any user in the system.'}
              </Text>
            </View>
          )}

          {/* Priority Selection */}
          <SelectDropdown
            label="Priority"
            value={taskForm.priority}
            options={priorityOptions}
            onValueChange={(value) => handleInputChange('priority', value)}
            placeholder="Select priority"
          />

          {/* Due Date */}
          <CalendarInput
            label="Due Date"
            value={taskForm.dueDate}
            onValueChange={(value) => handleInputChange('dueDate', value)}
            placeholder="Select due date"
            required
            error={errors.dueDate}
            minDate={new Date()}
          />

          {/* Estimated Hours */}
          <TextInput
            label="Estimated Hours (Optional)"
            value={taskForm.estimatedHours?.toString() || ''}
            onChangeText={(text) => {
              const hours = text ? parseInt(text) : undefined;
              handleInputChange('estimatedHours', hours);
            }}
            placeholder="Enter estimated hours"
            keyboardType="numeric"
          />

          {/* Task Preview */}
          {taskForm.title && selectedUser && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewTitle}>Task Preview</Text>
              <View style={styles.previewContent}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewTaskTitle}>{taskForm.title}</Text>
                  <View style={[
                    styles.priorityBadge,
                    taskForm.priority === 'critical' && styles.priorityCritical,
                    taskForm.priority === 'high' && styles.priorityHigh,
                    taskForm.priority === 'medium' && styles.priorityMedium,
                    taskForm.priority === 'low' && styles.priorityLow,
                  ]}>
                    <Text style={styles.priorityText}>{taskForm.priority}</Text>
                  </View>
                </View>
                
                {taskForm.description && (
                  <Text style={styles.previewDescription}>{taskForm.description}</Text>
                )}
                
                <View style={styles.previewDetails}>
                  <Text style={styles.previewDetail}>👤 {selectedUser.name} ({selectedUser.role})</Text>
                  <Text style={styles.previewDetail}>🏢 {selectedUser.departmentName}</Text>
                  {taskForm.dueDate && (
                    <Text style={styles.previewDetail}>📅 Due: {taskForm.dueDate}</Text>
                  )}
                  {taskForm.estimatedHours && (
                    <Text style={styles.previewDetail}>⏰ {taskForm.estimatedHours}h estimated</Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!isFormValid() || submitting) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid() || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Assign Task</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40, // Extra padding at bottom
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  userInfo: {
    marginTop: 12,
    marginBottom: 12,
  },
  userInfoText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 2,
  },
  userInfoHighlight: {
    fontWeight: 'bold',
    color: '#111827',
  },
  rulesContainer: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  rulesText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  form: {
    padding: 20,
  },
  submitButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noUsersContainer: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  noUsersText: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
  },
  noUsersTitle: {
    fontWeight: 'bold',
    color: '#111827',
  },
  previewContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  previewContent: {
    padding: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewTaskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    marginRight: 10,
  },
  priorityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityLow: {
    backgroundColor: '#E0F2F7',
    borderColor: '#A7DBE8',
    borderWidth: 1,
  },
  priorityMedium: {
    backgroundColor: '#FDE68A',
    borderColor: '#FCD34D',
    borderWidth: 1,
  },
  priorityHigh: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
  },
  priorityCritical: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
  },
  previewDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
  },
  previewDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  previewDetail: {
    fontSize: 13,
    color: '#6B7280',
    marginRight: 15,
    marginBottom: 4,
  },
});

export default AssignTaskScreen; 