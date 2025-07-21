import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
  dueDate: string;
  createdAt: string;
  creatorName: string;
  departmentName: string;
}

interface SuperAdminStats {
  totalUsers: number;
  totalDepartments: number;
  totalTasks: number;
}

const DashboardScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [superAdminStats, setSuperAdminStats] = useState<SuperAdminStats>({
    totalUsers: 0,
    totalDepartments: 0,
    totalTasks: 0,
  });
  const [userStats, setUserStats] = useState({
    totalTasks: 0,
    todoTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
  });
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      if (user.role === 'super_admin') {
        // Load super admin dashboard statistics using separate API calls
        await loadSuperAdminStats();
      } else {
        // Load user-specific dashboard data
        await loadUserDashboardData();
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadSuperAdminStats = async () => {
    try {
      // Get total users count
      const usersResponse = await api.get('/users');
      const totalUsers = usersResponse.data.pagination?.total || usersResponse.data.data?.length || 0;

      // Get total departments count
      const departmentsResponse = await api.get('/departments');
      const totalDepartments = departmentsResponse.data.pagination?.total || departmentsResponse.data.data?.length || 0;

      // Get total tasks count
      const tasksResponse = await api.get('/tasks');
      const totalTasks = tasksResponse.data.pagination?.total || tasksResponse.data.data?.length || 0;

      setSuperAdminStats({
        totalUsers,
        totalDepartments,
        totalTasks,
      });
    } catch (error) {
      console.error('Error loading super admin stats:', error);
      throw error;
    }
  };

  const loadUserDashboardData = async () => {
    try {
      const tasksResponse = await api.get('/tasks?limit=100');
      if (tasksResponse.data.success) {
        const allTasks = tasksResponse.data.data;
        
        // Filter tasks assigned to the current user
        const userTasks = allTasks.filter((task: Task) => {
          const assigneeId = task.assigneeId ? 
            (typeof task.assigneeId === 'object' ? task.assigneeId.id || task.assigneeId._id : task.assigneeId) : 
            null;
          return assigneeId === user.id;
        });

        // Calculate statistics
        const totalTasks = userTasks.length;
        const todoTasks = userTasks.filter((task: Task) => 
          task.status === 'todo' || task.status === 'assigned'
        ).length;
        const inProgressTasks = userTasks.filter((task: Task) => 
          task.status === 'in_progress'
        ).length;
        const completedTasks = userTasks.filter((task: Task) => 
          task.status === 'completed' || task.status === 'verified'
        ).length;

        setUserStats({
          totalTasks,
          todoTasks,
          inProgressTasks,
          completedTasks,
        });

        // Set recent tasks (latest 5)
        setRecentTasks(userTasks.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading user dashboard data:', error);
      throw error;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return '#10B981';
      case 'completed': return '#3B82F6';
      case 'pending_verification': return '#8B5CF6';
      case 'in_progress': return '#3B82F6';
      case 'todo': return '#6B7280';
      case 'assigned': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#EF4444';
      case 'high': return '#F97316';
      case 'medium': return '#EAB308';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const handleQuickAction = (action: string) => {
    Alert.alert('Coming Soon', `${action} functionality will be available in the next update!`);
  };

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const handleCloseTaskDetail = () => {
    setShowTaskDetail(false);
    setSelectedTask(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.welcomeText}>
              Welcome back, {user?.name}!
            </Text>
            <Text style={styles.roleText}>
              {user?.role.replace('_', ' ').toUpperCase()} • {user?.departmentName}
            </Text>
          </View>
        </View>

        {user?.role === 'super_admin' ? (
          // Super Admin Dashboard - Matching Web App
          <View style={styles.superAdminContainer}>
            <Text style={styles.sectionTitle}>System Overview</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statContent}>
                  <View>
                    <Text style={styles.statLabel}>Total Users</Text>
                    <Text style={styles.statNumber}>{superAdminStats.totalUsers}</Text>
                  </View>
                  <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
                    <Text style={styles.statIconText}>👥</Text>
                  </View>
                </View>
                <Text style={styles.statDescription}>Manage all users</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={styles.statContent}>
                  <View>
                    <Text style={styles.statLabel}>Departments</Text>
                    <Text style={styles.statNumber}>{superAdminStats.totalDepartments}</Text>
                  </View>
                  <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
                    <Text style={styles.statIconText}>🏢</Text>
                  </View>
                </View>
                <Text style={styles.statDescription}>System departments</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={styles.statContent}>
                  <View>
                    <Text style={styles.statLabel}>Total Tasks</Text>
                    <Text style={styles.statNumber}>{superAdminStats.totalTasks}</Text>
                  </View>
                  <View style={[styles.statIcon, { backgroundColor: '#FED7AA' }]}>
                    <Text style={styles.statIconText}>📋</Text>
                  </View>
                </View>
                <Text style={styles.statDescription}>All system tasks</Text>
              </View>
            </View>

            <View style={styles.quickActionsContainer}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => handleQuickAction('Create User')}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: '#DBEAFE' }]}>
                    <Text style={styles.quickActionIconText}>👤</Text>
                  </View>
                  <Text style={styles.quickActionText}>Create User</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => handleQuickAction('Create Department')}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: '#D1FAE5' }]}>
                    <Text style={styles.quickActionIconText}>🏢</Text>
                  </View>
                  <Text style={styles.quickActionText}>Create Department</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => handleQuickAction('Assign Task')}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: '#FED7AA' }]}>
                    <Text style={styles.quickActionIconText}>📝</Text>
                  </View>
                  <Text style={styles.quickActionText}>Assign Task</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => handleQuickAction('View Reports')}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: '#FCE7F3' }]}>
                    <Text style={styles.quickActionIconText}>📊</Text>
                  </View>
                  <Text style={styles.quickActionText}>View Reports</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          // Regular User Dashboard
          <View style={styles.userContainer}>
            <Text style={styles.sectionTitle}>Your Tasks Overview</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statContent}>
                  <View>
                    <Text style={styles.statLabel}>Total Tasks</Text>
                    <Text style={styles.statNumber}>{userStats.totalTasks}</Text>
                  </View>
                  <View style={[styles.statIcon, { backgroundColor: '#F3F4F6' }]}>
                    <Text style={styles.statIconText}>📋</Text>
                  </View>
                </View>
                <Text style={styles.statDescription}>All your tasks</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={styles.statContent}>
                  <View>
                    <Text style={styles.statLabel}>To Do</Text>
                    <Text style={styles.statNumber}>{userStats.todoTasks}</Text>
                  </View>
                  <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={styles.statIconText}>⏳</Text>
                  </View>
                </View>
                <Text style={styles.statDescription}>Pending tasks</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={styles.statContent}>
                  <View>
                    <Text style={styles.statLabel}>In Progress</Text>
                    <Text style={styles.statNumber}>{userStats.inProgressTasks}</Text>
                  </View>
                  <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
                    <Text style={styles.statIconText}>🔄</Text>
                  </View>
                </View>
                <Text style={styles.statDescription}>Active tasks</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={styles.statContent}>
                  <View>
                    <Text style={styles.statLabel}>Completed</Text>
                    <Text style={styles.statNumber}>{userStats.completedTasks}</Text>
                  </View>
                  <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
                    <Text style={styles.statIconText}>✅</Text>
                  </View>
                </View>
                <Text style={styles.statDescription}>Finished tasks</Text>
              </View>
            </View>

            {recentTasks.length > 0 && (
              <View style={styles.recentTasksContainer}>
                <Text style={styles.sectionTitle}>Recent Tasks</Text>
                {recentTasks.map((task) => (
                  <TouchableOpacity key={task.id} onPress={() => handleTaskPress(task)}>
                    <View style={styles.recentTaskCard}>
                      <View style={styles.recentTaskHeader}>
                        <Text style={styles.recentTaskTitle} numberOfLines={1}>
                          {task.title}
                        </Text>
                        <View style={styles.recentTaskBadges}>
                          <View style={[
                            styles.recentTaskBadge,
                            { backgroundColor: getStatusColor(task.status) + '20' }
                          ]}>
                            <Text style={[
                              styles.recentTaskBadgeText,
                              { color: getStatusColor(task.status) }
                            ]}>
                              {task.status.replace('_', ' ').toUpperCase()}
                            </Text>
                          </View>
                          <View style={[
                            styles.recentTaskBadge,
                            { backgroundColor: getPriorityColor(task.priority) + '20' }
                          ]}>
                            <Text style={[
                              styles.recentTaskBadgeText,
                              { color: getPriorityColor(task.priority) }
                            ]}>
                              {task.priority.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      </View>
                      {task.description && (
                        <Text style={styles.recentTaskDescription} numberOfLines={2}>
                          {task.description}
                        </Text>
                      )}
                      <View style={styles.recentTaskFooter}>
                        <Text style={styles.recentTaskDate}>
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </Text>
                        <Text style={styles.recentTaskCreator}>
                          by {task.creatorName}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
      <TaskDetailModal
        isVisible={showTaskDetail}
        onClose={handleCloseTaskDetail}
        task={selectedTask}
      />
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
  headerContent: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 16,
    color: '#6B7280',
  },
  superAdminContainer: {
    padding: 20,
  },
  userContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
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
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconText: {
    fontSize: 20,
  },
  statDescription: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  quickActionsContainer: {
    marginTop: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionIconText: {
    fontSize: 24,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  recentTasksContainer: {
    marginTop: 24,
  },
  recentTaskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recentTaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recentTaskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  recentTaskBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  recentTaskBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recentTaskBadgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  recentTaskDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  recentTaskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentTaskDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  recentTaskCreator: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default DashboardScreen; 