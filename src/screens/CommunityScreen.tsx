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
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import TaskDetailModal from '../components/TaskDetailModal';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assigneeName: string;
  creatorName: string;
  departmentName: string;
  dueDate?: string;
  createdAt: string;
  visibility: string;
}

const CommunityScreen: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);

  useEffect(() => {
    if (user && (user.role === 'super_admin' || user.role === 'admin' || user.role === 'hod')) {
      loadTasks();
    }
  }, [user]);

  const loadTasks = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('Loading community tasks for user:', user.id, 'Role:', user.role);
      
      // Get all public tasks
      const response = await api.get('/tasks', { params: { visibility: 'public' } });
      
      if (response.data.success) {
        let publicTasks = response.data.data;
        
        // Filter based on user role
        if (user.role === 'hod') {
          // HOD can only see tasks in their department
          publicTasks = publicTasks.filter(task => {
            const taskDeptId = task.departmentId ? (typeof task.departmentId === 'object' ? task.departmentId.id || task.departmentId._id : task.departmentId) : null;
            const userDeptId = user.departmentId ? (typeof user.departmentId === 'object' ? user.departmentId.id || user.departmentId._id : user.departmentId) : null;
            return taskDeptId === userDeptId;
          });
          console.log('HOD filtered tasks:', publicTasks.length);
        } else if (user.role === 'super_admin') {
          // Super admin can see all public tasks
          console.log('Super admin - all tasks:', publicTasks.length);
        } else {
          // Other roles shouldn't access this page, but just in case
          publicTasks = [];
        }
        
        setTasks(publicTasks);
      } else {
        Alert.alert('Error', 'Failed to load community tasks');
      }
    } catch (error) {
      console.error('Error loading community tasks:', error);
      Alert.alert('Error', 'Failed to load community tasks. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.creatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.assigneeName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesDepartment = filterDepartment === 'all' || 
      (task.departmentName && task.departmentName.toLowerCase().includes(filterDepartment.toLowerCase()));
    
    return matchesSearch && matchesStatus && matchesPriority && matchesDepartment;
  });

  const getStatusOptions = () => [
    { value: 'all', label: 'All Status' },
    { value: 'todo', label: 'To Do' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending_verification', label: 'Pending Verification' },
    { value: 'verified', label: 'Verified' }
  ];

  const getPriorityOptions = () => [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  const getDepartmentOptions = () => {
    const departments = [...new Set(tasks.map(task => task.departmentName).filter(Boolean))];
    return [
      { value: 'all', label: 'All Departments' },
      ...departments.map(dept => ({ value: dept, label: dept }))
    ];
  };

  const getStats = () => {
    const total = tasks.length;
    const inProgress = tasks.filter(task => task.status === 'in_progress').length;
    const completed = tasks.filter(task => task.status === 'verified').length;
    const pending = tasks.filter(task => task.status === 'pending_verification').length;
    
    return { total, inProgress, completed, pending };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return '#D1FAE5';
      case 'completed': return '#DBEAFE';
      case 'pending_verification': return '#E9D5FF';
      case 'in_progress': return '#DBEAFE';
      case 'todo': return '#F3F4F6';
      case 'assigned': return '#F3F4F6';
      default: return '#F3F4F6';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'verified': return '#065F46';
      case 'completed': return '#1E40AF';
      case 'pending_verification': return '#7C3AED';
      case 'in_progress': return '#1E40AF';
      case 'todo': return '#374151';
      case 'assigned': return '#374151';
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

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const handleCloseTaskDetail = () => {
    setShowTaskDetail(false);
    setSelectedTask(null);
  };

  const stats = getStats();

  // Check if user has permission to access this screen
  if (!user || (user.role !== 'super_admin' && user.role !== 'admin' && user.role !== 'hod')) {
    return (
      <View style={styles.permissionDeniedContainer}>
        <Text style={styles.permissionDeniedTitle}>Access Denied</Text>
        <Text style={styles.permissionDeniedText}>
          You don't have permission to access the Community page. Only Super Admins, Admins, and HODs can view community tasks.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading community tasks...</Text>
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
        <Text style={styles.headerTitle}>Community</Text>
        <Text style={styles.headerSubtitle}>
          {user?.role === 'super_admin' 
            ? 'View all public tasks across all departments' 
            : 'View public tasks in your department'
          }
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statContent}>
              <View>
                <Text style={styles.statLabel}>Total Tasks</Text>
                <Text style={styles.statNumber}>{stats.total}</Text>
              </View>
              <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
                <Text style={styles.statIconText}>👥</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statContent}>
              <View>
                <Text style={styles.statLabel}>In Progress</Text>
                <Text style={styles.statNumber}>{stats.inProgress}</Text>
              </View>
              <View style={[styles.statIcon, { backgroundColor: '#FED7AA' }]}>
                <Text style={styles.statIconText}>⏰</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statContent}>
              <View>
                <Text style={styles.statLabel}>Completed</Text>
                <Text style={styles.statNumber}>{stats.completed}</Text>
              </View>
              <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
                <Text style={styles.statIconText}>✅</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statContent}>
              <View>
                <Text style={styles.statLabel}>Pending</Text>
                <Text style={styles.statNumber}>{stats.pending}</Text>
              </View>
              <View style={[styles.statIcon, { backgroundColor: '#E9D5FF' }]}>
                <Text style={styles.statIconText}>⏳</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search tasks, creators, or assignees..."
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              Alert.alert(
                'Filter by Status',
                'Select status to filter',
                getStatusOptions().map(status => ({
                  text: status.label,
                  onPress: () => setFilterStatus(status.value)
                })).concat({ text: 'Cancel', style: 'cancel' })
              );
            }}
          >
            <Text style={styles.filterButtonText}>
              {filterStatus === 'all' ? 'All Status' : 
               getStatusOptions().find(s => s.value === filterStatus)?.label || 'All Status'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              Alert.alert(
                'Filter by Priority',
                'Select priority to filter',
                getPriorityOptions().map(priority => ({
                  text: priority.label,
                  onPress: () => setFilterPriority(priority.value)
                })).concat({ text: 'Cancel', style: 'cancel' })
              );
            }}
          >
            <Text style={styles.filterButtonText}>
              {filterPriority === 'all' ? 'All Priorities' : 
               getPriorityOptions().find(p => p.value === filterPriority)?.label || 'All Priorities'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            Alert.alert(
              'Filter by Department',
              'Select department to filter',
              getDepartmentOptions().map(dept => ({
                text: dept.label,
                onPress: () => setFilterDepartment(dept.value)
              })).concat({ text: 'Cancel', style: 'cancel' })
            );
          }}
        >
          <Text style={styles.filterButtonText}>
            {filterDepartment === 'all' ? 'All Departments' : filterDepartment}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tasks List */}
      <View style={styles.tasksContainer}>
        {filteredTasks.map((task) => (
          <TouchableOpacity key={task.id} onPress={() => handleTaskPress(task)}>
            <View style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskTitle} numberOfLines={2}>
                  {task.title}
                </Text>
                <View style={styles.taskBadges}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
                    <Text style={[styles.statusBadgeText, { color: getStatusTextColor(task.status) }]}>
                      {task.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
                    <Text style={[styles.priorityBadgeText, { color: getPriorityTextColor(task.priority) }]}>
                      {task.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
              
              {task.description && (
                <Text style={styles.taskDescription} numberOfLines={3}>
                  {task.description}
                </Text>
              )}
              
              <View style={styles.taskDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>👤 Creator:</Text>
                  <Text style={styles.detailValue}>{task.creatorName}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>👤 Assignee:</Text>
                  <Text style={styles.detailValue}>{task.assigneeName}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>🏢 Department:</Text>
                  <Text style={styles.detailValue}>{task.departmentName}</Text>
                </View>
                
                {task.dueDate && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📅 Due:</Text>
                    <Text style={[styles.detailValue, isOverdue(task.dueDate) && styles.overdueText]}>
                      {formatDate(task.dueDate)}
                    </Text>
                  </View>
                )}
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>📅 Created:</Text>
                  <Text style={styles.detailValue}>{formatDate(task.createdAt)}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Empty State */}
      {filteredTasks.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🌍</Text>
          <Text style={styles.emptyStateTitle}>No community tasks found</Text>
          <Text style={styles.emptyStateText}>
            {searchTerm ? 'No tasks match your search criteria' : 'No public tasks are available in your view'}
          </Text>
        </View>
      )}

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
  permissionDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  permissionDeniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 16,
  },
  permissionDeniedText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
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
    fontSize: 14,
    color: '#6B7280',
  },
  statsContainer: {
    padding: 20,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconText: {
    fontSize: 16,
  },
  searchContainer: {
    padding: 20,
    paddingTop: 0,
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  filtersContainer: {
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
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
  taskHeader: {
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  taskBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  taskDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  taskDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
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

export default CommunityScreen; 