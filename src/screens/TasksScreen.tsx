import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import taskService from '../services/taskService';
import TaskBar from '../components/TaskBar';
import TaskDetailModal from '../components/TaskDetailModal';
import ForwardTaskModal from '../components/ForwardTaskModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import ReassignTaskModal from '../components/ReassignTaskModal';

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

type TaskCategory = 'my-work' | 'my-assignments';

const TasksScreen: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<TaskCategory>('my-work');
  
  // Modal states
  const [taskDetailModal, setTaskDetailModal] = useState<{
    isOpen: boolean;
    task: Task | null;
  }>({
    isOpen: false,
    task: null,
  });

  const [forwardModal, setForwardModal] = useState<{
    isOpen: boolean;
    taskId: string;
    taskTitle: string;
    currentAssigneeName: string;
  }>({
    isOpen: false,
    taskId: '',
    taskTitle: '',
    currentAssigneeName: '',
  });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    taskId: string;
    taskTitle: string;
  }>({
    isOpen: false,
    taskId: '',
    taskTitle: '',
  });

  const [reassignModal, setReassignModal] = useState<{
    isOpen: boolean;
    taskId: string;
    taskTitle: string;
    currentAssigneeName: string;
    currentAssigneeId: string;
  }>({
    isOpen: false,
    taskId: '',
    taskTitle: '',
    currentAssigneeName: '',
    currentAssigneeId: '',
  });

  useEffect(() => {
    loadTasks();
  }, [user]);

  const loadTasks = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('🔍 Loading tasks for user:', user.id);
      const response = await taskService.getTasks();
      console.log('📋 Tasks response:', response);
      
      // Filter out private tasks - they should only be in the Private Tasks page
      const publicTasks = response.data.filter(task => task.visibility === 'public');
      console.log('🌐 Public tasks after filtering:', publicTasks);
      setTasks(publicTasks);
    } catch (error) {
      console.error('❌ Error loading tasks:', error);
      Alert.alert('Error', 'Failed to load tasks. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to safely extract and compare IDs
  const extractId = (id: any) => {
    if (!id) return null;
    return typeof id === 'object' ? id.id || id._id : id;
  };

  // Filter tasks by category
  const getTasksByCategory = (category: TaskCategory) => {
    if (!user) return [];
    
    const userId = extractId(user.id);
    console.log('=== TASK CATEGORY DEBUG ===');
    console.log('User ID:', userId);
    console.log('Total tasks available:', tasks.length);
    
    switch (category) {
      case 'my-work':
        // Tasks assigned to the current user
        const myWorkTasks = tasks.filter(task => {
          const assigneeId = extractId(task.assigneeId);
          const matches = assigneeId === userId;
          console.log(`Task "${task.title}": assigneeId=${assigneeId}, matches=${matches}`);
          return matches;
        });
        console.log('My Work tasks found:', myWorkTasks.length);
        return myWorkTasks;
        
      case 'my-assignments':
        // Tasks created by the current user but assigned to others
        // OR tasks that the current user has forwarded to others
        const myAssignmentTasks = tasks.filter(task => {
          const creatorId = extractId(task.creatorId);
          const assigneeId = extractId(task.assigneeId);
          
          // Check if user is the creator and task is assigned to someone else
          const isCreatorAndAssignedToOthers = creatorId === userId && assigneeId !== userId;
          
          // Check if user has forwarded this task (look in task path)
          const hasForwardedTask = task.path && task.path.some(pathItem => 
            pathItem.action === 'forwarded' && 
            extractId(pathItem.userId) === userId
          );
          
          const matches = isCreatorAndAssignedToOthers || hasForwardedTask;
          console.log(`Task "${task.title}": creatorId=${creatorId}, assigneeId=${assigneeId}, isCreatorAndAssignedToOthers=${isCreatorAndAssignedToOthers}, hasForwardedTask=${hasForwardedTask}, matches=${matches}`);
          return matches;
        });
        console.log('My Assignments tasks found:', myAssignmentTasks.length);
        return myAssignmentTasks;
        
      default:
        return [];
    }
  };

  // Get counts for each category
  const getCategoryCounts = () => {
    const myWorkCount = getTasksByCategory('my-work').length;
    const myAssignmentsCount = getTasksByCategory('my-assignments').length;
    
    return { myWorkCount, myAssignmentsCount };
  };

  const handleTaskPress = (task: Task) => {
    setTaskDetailModal({
      isOpen: true,
      task,
    });
  };

  const handleStatusUpdate = async (taskId: string, status: string) => {
    console.log('🔄 TasksScreen: handleStatusUpdate called:', { taskId, status });
    try {
      const updatedTask = await taskService.updateTaskStatus(taskId, status);
      console.log('✅ TasksScreen: Task status updated successfully:', updatedTask);
      
      // Update the task in the local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? updatedTask : task
        )
      );
      
      // Update the task in the detail modal if it's open
      if (taskDetailModal.isOpen && taskDetailModal.task?.id === taskId) {
        setTaskDetailModal(prev => ({
          ...prev,
          task: updatedTask
        }));
      }
    } catch (error) {
      console.error('❌ Error updating task status:', error);
      Alert.alert('Error', 'Failed to update task status. Please try again.');
    }
  };

  const handleForward = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      // Close the task detail modal first
      setTaskDetailModal({ isOpen: false, task: null });
      
      setForwardModal({
        isOpen: true,
        taskId,
        taskTitle: task.title,
        currentAssigneeName: task.assigneeName,
      });
    }
  };

  const handleVerify = async (taskId: string, verified: boolean) => {
    console.log('🔍 TasksScreen: handleVerify called:', { taskId, verified });
    try {
      if (verified) {
        // Verify the task
        const updatedTask = await taskService.verifyTask(taskId);
        console.log('✅ TasksScreen: Task verified successfully:', updatedTask);
        
        // Update the task in the local state
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId ? updatedTask : task
          )
        );
        
        // Update the task in the detail modal if it's open
        if (taskDetailModal.isOpen && taskDetailModal.task?.id === taskId) {
          setTaskDetailModal(prev => ({
            ...prev,
            task: updatedTask
          }));
        }
      } else {
        // Reassign the task
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          setReassignModal({
            isOpen: true,
            taskId,
            taskTitle: task.title,
            currentAssigneeName: task.assigneeName,
            currentAssigneeId: extractId(task.assigneeId) || '',
          });
        }
      }
    } catch (error) {
      console.error('❌ Error verifying task:', error);
      Alert.alert('Error', 'Failed to verify task. Please try again.');
    }
  };

  const handleDelete = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      // Close the task detail modal first
      setTaskDetailModal({ isOpen: false, task: null });
      
      setDeleteModal({
        isOpen: true,
        taskId,
        taskTitle: task.title,
      });
    }
  };

  const confirmDelete = async () => {
    try {
      await taskService.deleteTask(deleteModal.taskId);
      console.log('✅ Task deleted successfully');
      
      // Remove the task from local state
      setTasks(prevTasks => 
        prevTasks.filter(task => task.id !== deleteModal.taskId)
      );
      
      setDeleteModal({ isOpen: false, taskId: '', taskTitle: '' });
    } catch (error) {
      console.error('❌ Error deleting task:', error);
      Alert.alert('Error', 'Failed to delete task. Please try again.');
    }
  };

  const handleReassign = async (newAssigneeId: string, note: string) => {
    try {
      const updatedTask = await taskService.reassignTask(reassignModal.taskId, newAssigneeId, note);
      console.log('✅ Task reassigned successfully:', updatedTask);
      
      // Update the task in the local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === reassignModal.taskId ? updatedTask : task
        )
      );
      
      // Update the task in the detail modal if it's open
      if (taskDetailModal.isOpen && taskDetailModal.task?.id === reassignModal.taskId) {
        setTaskDetailModal(prev => ({
          ...prev,
          task: updatedTask
        }));
      }
      
      setReassignModal({ isOpen: false, taskId: '', taskTitle: '', currentAssigneeName: '', currentAssigneeId: '' });
    } catch (error) {
      console.error('❌ Error reassigning task:', error);
      Alert.alert('Error', 'Failed to reassign task. Please try again.');
    }
  };

  const handleForwardSuccess = () => {
    // Reload tasks to get updated data
    loadTasks();
    setForwardModal({ isOpen: false, taskId: '', taskTitle: '', currentAssigneeName: '' });
  };

  const currentTasks = getTasksByCategory(activeCategory);
  const { myWorkCount, myAssignmentsCount } = getCategoryCounts();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
      </View>

      {/* Category Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeCategory === 'my-work' && styles.activeTab
          ]}
          onPress={() => setActiveCategory('my-work')}
        >
          <Text style={[
            styles.tabText,
            activeCategory === 'my-work' && styles.activeTabText
          ]}>
            My Work ({myWorkCount})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeCategory === 'my-assignments' && styles.activeTab
          ]}
          onPress={() => setActiveCategory('my-assignments')}
        >
          <Text style={[
            styles.tabText,
            activeCategory === 'my-assignments' && styles.activeTabText
          ]}>
            My Assignments ({myAssignmentsCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tasks List */}
      <ScrollView style={styles.tasksContainer} showsVerticalScrollIndicator={false}>
        {currentTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No {activeCategory === 'my-work' ? 'tasks assigned to you' : 'tasks created by you'} yet.
            </Text>
          </View>
        ) : (
          currentTasks.map(task => (
            <TaskBar
              key={task.id}
              task={task}
              onPress={() => handleTaskPress(task)}
            />
          ))
        )}
      </ScrollView>

      {/* Modals */}
      <TaskDetailModal
        task={taskDetailModal.task}
        isOpen={taskDetailModal.isOpen}
        onClose={() => setTaskDetailModal({ isOpen: false, task: null })}
        onStatusUpdate={handleStatusUpdate}
        onForward={handleForward}
        onVerify={handleVerify}
        onDelete={handleDelete}
      />

      <ForwardTaskModal
        isOpen={forwardModal.isOpen}
        taskId={forwardModal.taskId}
        taskTitle={forwardModal.taskTitle}
        currentAssigneeName={forwardModal.currentAssigneeName}
        onClose={() => setForwardModal({ isOpen: false, taskId: '', taskTitle: '', currentAssigneeName: '' })}
        onForward={handleForwardSuccess}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteModal.taskTitle}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, taskId: '', taskTitle: '' })}
      />

      <ReassignTaskModal
        isOpen={reassignModal.isOpen}
        taskId={reassignModal.taskId}
        taskTitle={reassignModal.taskTitle}
        currentAssigneeName={reassignModal.currentAssigneeName}
        currentAssigneeId={reassignModal.currentAssigneeId}
        onClose={() => setReassignModal({ isOpen: false, taskId: '', taskTitle: '', currentAssigneeName: '', currentAssigneeId: '' })}
        onReassign={handleReassign}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  activeTabText: {
    color: 'white',
  },
  tasksContainer: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default TasksScreen; 