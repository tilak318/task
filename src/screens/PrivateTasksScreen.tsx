import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import CalendarInput from '../components/CalendarInput';
import TaskDetailModal from '../components/TaskDetailModal';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate?: string;
  createdAt: string;
  tags: string[];
  visibility: string;
}

interface CreateTaskData {
  title: string;
  description: string;
  visibility: 'private';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  tags: string[];
}

const PrivateTasksScreen: React.FC = () => {
  const { user } = useAuth();
  const [privateTasks, setPrivateTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    category: 'Personal',
    priority: 'medium' as const
  });

  useEffect(() => {
    fetchPrivateTasks();
  }, []);

  const fetchPrivateTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tasks?visibility=private');
      
      if (response.data.success) {
        setPrivateTasks(response.data.data);
      } else {
        Alert.alert('Error', 'Failed to load private tasks');
      }
    } catch (error) {
      console.error('Error fetching private tasks:', error);
      Alert.alert('Error', 'Failed to load private tasks. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPrivateTasks();
    setRefreshing(false);
  };

  const filteredTasks = privateTasks.filter(task => 
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTask = async () => {
    if (!newTask.title.trim() || !user) {
      Alert.alert('Error', 'Task title is required');
      return;
    }

    if (!newTask.dueDate.trim()) {
      Alert.alert('Error', 'Due date is required');
      return;
    }

    try {
      setSubmitting(true);
      
      const taskData: CreateTaskData = {
        title: newTask.title,
        description: newTask.description,
        visibility: 'private',
        priority: newTask.priority,
        dueDate: newTask.dueDate,
        tags: [newTask.category]
      };

      console.log('Creating private task:', taskData);

      const response = await api.post('/tasks', taskData);
      
      if (response.data.success) {
        setPrivateTasks([response.data.data, ...privateTasks]);
        setNewTask({ title: '', description: '', dueDate: '', category: 'Personal', priority: 'medium' });
        setShowAddForm(false);
        Alert.alert('Success', 'Private task created successfully');
      } else {
        Alert.alert('Error', response.data.message || 'Failed to create private task');
      }
    } catch (error: any) {
      console.error('Error creating private task:', error);
      
      let errorMessage = "Failed to create private task. Please try again.";
      
      if (error.response) {
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        errorMessage = "Network error. Please check your connection.";
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    });
    setShowAddTaskModal(true);
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !newTask.title.trim()) {
      Alert.alert('Error', 'Task title is required');
      return;
    }

    if (!newTask.dueDate.trim()) {
      Alert.alert('Error', 'Due date is required');
      return;
    }

    try {
      setSubmitting(true);
      
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        dueDate: newTask.dueDate,
      };

      console.log('Updating private task:', taskData);

      const response = await api.put(`/tasks/${editingTask.id}`, taskData);
      
      if (response.data.success) {
        setPrivateTasks(tasks => 
          tasks.map(t => t.id === editingTask.id ? response.data.data : t)
        );
        setNewTask({ title: '', description: '', dueDate: '', priority: 'medium' });
        setShowAddTaskModal(false);
        setEditingTask(null);
        Alert.alert('Success', 'Private task updated successfully');
      } else {
        Alert.alert('Error', response.data.message || 'Failed to update private task');
      }
    } catch (error: any) {
      console.error('Error updating private task:', error);
      
      let errorMessage = "Failed to update private task. Please try again.";
      
      if (error.response) {
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        errorMessage = "Network error. Please check your connection.";
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const handleCloseTaskDetail = () => {
    setShowTaskDetail(false);
    setSelectedTask(null);
  };

  const toggleTaskCompletion = async (task: Task) => {
    try {
      const newStatus = task.status === 'completed' ? 'todo' : 'completed';
      
      const response = await api.put(`/tasks/${task.id}/status`, {
        status: newStatus
      });
      
      if (response.data.success) {
        setPrivateTasks(tasks => 
          tasks.map(t => t.id === task.id ? response.data.data : t)
        );
        Alert.alert('Success', `Task marked as ${newStatus}`);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to update task status');
      }
    } catch (error: any) {
      console.error('Error updating task status:', error);
      
      let errorMessage = "Failed to update task status. Please try again.";
      
      if (error.response) {
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        errorMessage = "Network error. Please check your connection.";
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const deleteTask = async (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this private task?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete(`/tasks/${taskId}`);
              
              if (response.data.success) {
                setPrivateTasks(tasks => tasks.filter(task => task.id !== taskId));
                Alert.alert('Success', 'Private task deleted successfully');
              } else {
                Alert.alert('Error', response.data.message || 'Failed to delete private task');
              }
            } catch (error: any) {
              console.error('Error deleting task:', error);
              
              let errorMessage = "Failed to delete private task. Please try again.";
              
              if (error.response) {
                errorMessage = error.response.data?.message || errorMessage;
              } else if (error.request) {
                errorMessage = "Network error. Please check your connection.";
              } else {
                errorMessage = error.message || errorMessage;
              }
              
              Alert.alert('Error', errorMessage);
            }
          }
        }
      ]
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Learning': return '#DBEAFE';
      case 'Personal': return '#E9D5FF';
      case 'Work': return '#D1FAE5';
      default: return '#F3F4F6';
    }
  };

  const getCategoryTextColor = (category: string) => {
    switch (category) {
      case 'Learning': return '#1E40AF';
      case 'Personal': return '#7C3AED';
      case 'Work': return '#065F46';
      default: return '#374151';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#FEE2E2';
      case 'high': return '#FED7AA';
      case 'medium': return '#FEF3C7';
      case 'low': return '#D1FAE5';
      default: return '#F3F4F6';
    }
  };

  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#D97706';
      case 'low': return '#059669';
      default: return '#374151';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#D1FAE5';
      case 'in_progress': return '#DBEAFE';
      case 'todo': return '#F3F4F6';
      default: return '#F3F4F6';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'completed': return '#065F46';
      case 'in_progress': return '#1E40AF';
      case 'todo': return '#374151';
      default: return '#374151';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading private tasks...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Private Tasks</Text>
          <Text style={styles.headerSubtitle}>Your personal notes and tasks - completely private</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(true)}
        >
          <Text style={styles.addButtonText}>+ Add Task</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search private tasks..."
        />
      </View>

      {/* Add Task Form Modal */}
      <Modal
        visible={showAddForm}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Private Task</Text>
              <TouchableOpacity onPress={() => setShowAddForm(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {/* Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newTask.title}
                  onChangeText={(value) => setNewTask({ ...newTask, title: value })}
                  placeholder="Enter task title..."
                  multiline
                />
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={newTask.description}
                  onChangeText={(value) => setNewTask({ ...newTask, description: value })}
                  placeholder="Enter task description (optional)..."
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Due Date */}
              <View style={styles.inputGroup}>
                <CalendarInput
                  label="Due Date"
                  value={newTask.dueDate}
                  onValueChange={(value) => setNewTask({ ...newTask, dueDate: value })}
                  placeholder="Select due date"
                  required={true}
                  minDate={new Date()}
                />
              </View>

              {/* Category */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => {
                    Alert.alert(
                      'Select Category',
                      'Choose a category for your task',
                      [
                        { text: 'Personal', onPress: () => setNewTask({ ...newTask, category: 'Personal' }) },
                        { text: 'Learning', onPress: () => setNewTask({ ...newTask, category: 'Learning' }) },
                        { text: 'Work', onPress: () => setNewTask({ ...newTask, category: 'Work' }) },
                        { text: 'Cancel', style: 'cancel' }
                      ]
                    );
                  }}
                >
                  <Text style={styles.pickerButtonText}>{newTask.category}</Text>
                  <Text style={styles.pickerArrow}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* Priority */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Priority</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => {
                    Alert.alert(
                      'Select Priority',
                      'Choose priority level',
                      [
                        { text: 'Low', onPress: () => setNewTask({ ...newTask, priority: 'low' }) },
                        { text: 'Medium', onPress: () => setNewTask({ ...newTask, priority: 'medium' }) },
                        { text: 'High', onPress: () => setNewTask({ ...newTask, priority: 'high' }) },
                        { text: 'Critical', onPress: () => setNewTask({ ...newTask, priority: 'critical' }) },
                        { text: 'Cancel', style: 'cancel' }
                      ]
                    );
                  }}
                >
                  <View style={styles.priorityDisplay}>
                    <View style={[styles.priorityDot, { backgroundColor: getPriorityTextColor(newTask.priority) }]} />
                    <Text style={styles.pickerButtonText}>
                      {newTask.priority.charAt(0).toUpperCase() + newTask.priority.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.pickerArrow}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                  onPress={handleAddTask}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Add Task</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowAddForm(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Task Form Modal */}
      <Modal
        visible={showAddTaskModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddTaskModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Private Task</Text>
              <TouchableOpacity onPress={() => setShowAddTaskModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {/* Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newTask.title}
                  onChangeText={(value) => setNewTask({ ...newTask, title: value })}
                  placeholder="Enter task title..."
                  multiline
                />
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={newTask.description}
                  onChangeText={(value) => setNewTask({ ...newTask, description: value })}
                  placeholder="Enter task description (optional)..."
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Due Date */}
              <View style={styles.inputGroup}>
                <CalendarInput
                  label="Due Date"
                  value={newTask.dueDate}
                  onValueChange={(value) => setNewTask({ ...newTask, dueDate: value })}
                  placeholder="Select due date"
                  required={true}
                  minDate={new Date()}
                />
              </View>

              {/* Category */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => {
                    Alert.alert(
                      'Select Category',
                      'Choose a category for your task',
                      [
                        { text: 'Personal', onPress: () => setNewTask({ ...newTask, category: 'Personal' }) },
                        { text: 'Learning', onPress: () => setNewTask({ ...newTask, category: 'Learning' }) },
                        { text: 'Work', onPress: () => setNewTask({ ...newTask, category: 'Work' }) },
                        { text: 'Cancel', style: 'cancel' }
                      ]
                    );
                  }}
                >
                  <Text style={styles.pickerButtonText}>{newTask.category}</Text>
                  <Text style={styles.pickerArrow}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* Priority */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Priority</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => {
                    Alert.alert(
                      'Select Priority',
                      'Choose priority level',
                      [
                        { text: 'Low', onPress: () => setNewTask({ ...newTask, priority: 'low' }) },
                        { text: 'Medium', onPress: () => setNewTask({ ...newTask, priority: 'medium' }) },
                        { text: 'High', onPress: () => setNewTask({ ...newTask, priority: 'high' }) },
                        { text: 'Critical', onPress: () => setNewTask({ ...newTask, priority: 'critical' }) },
                        { text: 'Cancel', style: 'cancel' }
                      ]
                    );
                  }}
                >
                  <View style={styles.priorityDisplay}>
                    <View style={[styles.priorityDot, { backgroundColor: getPriorityTextColor(newTask.priority) }]} />
                    <Text style={styles.pickerButtonText}>
                      {newTask.priority.charAt(0).toUpperCase() + newTask.priority.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.pickerArrow}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                  onPress={handleUpdateTask}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Update Task</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowAddTaskModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Tasks List */}
      <View style={styles.tasksContainer}>
        {filteredTasks.map((task) => (
          <TouchableOpacity key={task.id} onPress={() => handleTaskPress(task)}>
            <View style={[styles.taskCard, task.status === 'completed' && styles.completedTask]}>
              {/* Task Header */}
              <View style={styles.taskHeader}>
                <View style={styles.taskContent}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleTaskCompletion(task);
                    }}
                  >
                    <Text style={[styles.checkboxText, task.status === 'completed' && styles.checkboxChecked]}>
                      {task.status === 'completed' ? '✓' : ''}
                    </Text>
                  </TouchableOpacity>
                  
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskTitle, task.status === 'completed' && styles.completedTaskTitle]}>
                      {task.title}
                    </Text>
                    {task.description && (
                      <Text style={styles.taskDescription} numberOfLines={2}>
                        {task.description}
                      </Text>
                    )}
                  </View>
                  
                  <View style={styles.taskActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleEditTask(task);
                      }}
                    >
                      <Text style={styles.editButtonText}>✏️</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        deleteTask(task.id);
                      }}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Tags and Status */}
              <View style={styles.tagsContainer}>
                {task.tags && task.tags.length > 0 && (
                  <View style={[styles.tag, { backgroundColor: getCategoryColor(task.tags[0]) }]}>
                    <Text style={[styles.tagText, { color: getCategoryTextColor(task.tags[0]) }]}>
                      {task.tags[0]}
                    </Text>
                  </View>
                )}
                <View style={[styles.tag, { backgroundColor: getPriorityColor(task.priority) }]}>
                  <Text style={[styles.tagText, { color: getPriorityTextColor(task.priority) }]}>
                    {task.priority}
                  </Text>
                </View>
                <View style={[styles.tag, { backgroundColor: getStatusColor(task.status) }]}>
                  <Text style={[styles.tagText, { color: getStatusTextColor(task.status) }]}>
                    {task.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>

              {/* Task Meta */}
              <View style={styles.taskMeta}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>📅</Text>
                  <Text style={styles.metaText}>
                    Created: {formatDate(task.createdAt)}
                  </Text>
                </View>
                {task.dueDate && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>📅</Text>
                    <Text style={[styles.metaText, isOverdue(task.dueDate) && styles.overdueText]}>
                      Due: {formatDate(task.dueDate)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Empty State */}
      {filteredTasks.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📝</Text>
          <Text style={styles.emptyStateTitle}>No private tasks found</Text>
          <Text style={styles.emptyStateText}>
            {searchTerm ? 'No tasks match your search' : 'Create your first private task to get started'}
          </Text>
        </View>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        isVisible={showTaskDetail}
        onClose={handleCloseTaskDetail}
        task={selectedTask}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  addButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 20,
    paddingTop: 16,
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalClose: {
    fontSize: 20,
    color: '#6B7280',
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#111827',
  },
  pickerArrow: {
    fontSize: 12,
    color: '#6B7280',
  },
  priorityDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  tasksContainer: {
    padding: 20,
    gap: 16,
  },
  taskCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completedTask: {
    opacity: 0.75,
  },
  taskHeader: {
    marginBottom: 12,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: 'bold',
  },
  checkboxChecked: {
    color: '#10B981',
  },
  taskInfo: {
    flex: 1,
    marginRight: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  taskDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  editButton: {
    padding: 4,
  },
  editButtonText: {
    fontSize: 18,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskMeta: {
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 14,
    marginRight: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  overdueText: {
    color: '#DC2626',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PrivateTasksScreen; 