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
  Modal,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import SelectDropdown from '../components/SelectDropdown';

interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  role: string;
  departmentId: string | { id: string; _id: string; name: string; code?: string };
  departmentName: string;
  phone?: string;
  position?: string;
  isActive: boolean;
  createdAt: string;
}

interface CreateUserData {
  name: string;
  username: string;
  password: string;
  email?: string;
  role: string;
  departmentId?: string;
  phone?: string;
  position?: string;
}

interface UpdateUserData {
  name: string;
  role: string;
  departmentId?: string;
  phone?: string;
  position?: string;
}

const UsersScreen: React.FC = () => {
  const { user: currentUser, departments, canCreateUsersFor } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    phone: '',
    departmentId: '',
    role: 'member' as const,
    position: ''
  });

  const roles = [
    { value: 'member', label: 'Member' },
    { value: 'manager', label: 'Manager' },
    { value: 'hod', label: 'HOD' },
    { value: 'admin', label: 'Admin' }
  ];

  // Filter roles based on current user's permissions
  const availableRoles = roles.filter(role => canCreateUsersFor(role.value));

  // Create department options for dropdown
  const departmentOptions = [
    { value: '', label: 'No Department' },
    ...departments.map(dept => ({
      value: dept.id,
      label: dept.name
    }))
  ];

  useEffect(() => {
    if (currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'admin')) {
      fetchUsers();
    }
  }, [currentUser, filterDepartment, filterRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Build filters
      const filters: any = {};
      if (filterDepartment && filterDepartment !== 'all') {
        filters.departmentId = filterDepartment;
      }
      if (filterRole && filterRole !== 'all') {
        filters.role = filterRole;
      }
      
      const response = await api.get('/users', { params: filters });
      
      if (response.data.success) {
        setUsers(response.data.data);
      } else {
        Alert.alert('Error', 'Failed to load users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.username.trim()) {
      Alert.alert('Error', 'Name and username are required');
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      Alert.alert('Error', 'Password is required for new users');
      return;
    }

    // Check if department is required for non-admin roles
    if (formData.role !== 'admin' && formData.role !== 'super_admin' && !formData.departmentId) {
      Alert.alert('Error', 'Department is required for HOD, Manager, and Member roles');
      return;
    }

    try {
      setSubmitting(true);
      
      if (editingUser) {
        // Update existing user
        const updateData: UpdateUserData = {
          name: formData.name,
          role: formData.role,
          departmentId: formData.departmentId || undefined,
          phone: formData.phone,
          position: formData.position
        };
        
        const response = await api.put(`/users/${editingUser.id}`, updateData);
        
        if (response.data.success) {
          setUsers(users.map(u => u.id === editingUser.id ? response.data.data : u));
          Alert.alert('Success', 'User updated successfully');
          resetForm();
        } else {
          Alert.alert('Error', response.data.message || 'Failed to update user');
        }
      } else {
        // Create new user
        const createData: CreateUserData = {
          name: formData.name,
          username: formData.username,
          password: formData.password,
          role: formData.role,
          departmentId: formData.departmentId || undefined,
          phone: formData.phone,
          position: formData.position
        };
        
        const response = await api.post('/users', createData);
        
        if (response.data.success) {
          setUsers([response.data.data, ...users]);
          Alert.alert('Success', 'User created successfully');
          resetForm();
        } else {
          Alert.alert('Error', response.data.message || 'Failed to create user');
        }
      }
    } catch (error: any) {
      let errorMessage = "Failed to save user. Please try again.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const validationErrors = error.response.data.errors;
        errorMessage = validationErrors.map((err: any) => err.msg).join('\n');
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

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      password: '',
      phone: user.phone || '',
      departmentId: typeof user.departmentId === 'object' ? user.departmentId._id || user.departmentId.id : user.departmentId,
      role: user.role as any,
      position: user.position || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (userId: string) => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete(`/users/${userId}`);
              
              if (response.data.success) {
                setUsers(users.filter(u => u.id !== userId));
                Alert.alert('Success', 'User deleted successfully');
              } else {
                Alert.alert('Error', response.data.message || 'Failed to delete user');
              }
            } catch (error: any) {
              console.error('Error deleting user:', error);
              
              let errorMessage = "Failed to delete user. Please try again.";
              
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



  const resetForm = () => {
    setFormData({
      name: '',
      username: '',
      password: '',
      phone: '',
      departmentId: '',
      role: 'member',
      position: ''
    });
    setEditingUser(null);
    setShowAddForm(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return '#FEE2E2';
      case 'admin': return '#DBEAFE';
      case 'hod': return '#E9D5FF';
      case 'manager': return '#FED7AA';
      case 'member': return '#D1FAE5';
      default: return '#F3F4F6';
    }
  };

  const getRoleTextColor = (role: string) => {
    switch (role) {
      case 'super_admin': return '#DC2626';
      case 'admin': return '#1E40AF';
      case 'hod': return '#7C3AED';
      case 'manager': return '#EA580C';
      case 'member': return '#059669';
      default: return '#374151';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? '#D1FAE5' : '#FEE2E2';
  };

  const getStatusTextColor = (isActive: boolean) => {
    return isActive ? '#059669' : '#DC2626';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Check if user has permission to access this screen
  if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'admin')) {
    return (
      <View style={styles.permissionDeniedContainer}>
        <Text style={styles.permissionDeniedTitle}>Access Denied</Text>
        <Text style={styles.permissionDeniedText}>
          You don't have permission to access the Users management page. Only Super Admins and Admins can manage users.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading users...</Text>
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
          <Text style={styles.headerTitle}>User Management</Text>
          <Text style={styles.headerSubtitle}>Manage system users and permissions</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(true)}
        >
          <Text style={styles.addButtonText}>+ Add User</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search users..."
        />
        
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              Alert.alert(
                'Filter by Department',
                'Select department to filter',
                [
                  { text: 'All Departments', onPress: () => setFilterDepartment('all') },
                  ...departments.map(dept => ({
                    text: dept.name,
                    onPress: () => setFilterDepartment(dept.id)
                  })),
                  { text: 'Cancel', style: 'cancel' }
                ]
              );
            }}
          >
            <Text style={styles.filterButtonText}>
              {filterDepartment === 'all' ? 'All Departments' : 
               departments.find(d => d.id === filterDepartment)?.name || 'All Departments'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              Alert.alert(
                'Filter by Role',
                'Select role to filter',
                [
                  { text: 'All Roles', onPress: () => setFilterRole('all') },
                  ...roles.map(role => ({
                    text: role.label,
                    onPress: () => setFilterRole(role.value)
                  })),
                  { text: 'Cancel', style: 'cancel' }
                ]
              );
            }}
          >
            <Text style={styles.filterButtonText}>
              {filterRole === 'all' ? 'All Roles' : 
               roles.find(r => r.value === filterRole)?.label || 'All Roles'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Users List */}
      <View style={styles.usersContainer}>
        {filteredUsers.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userHeader}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userUsername}>@{user.username}</Text>
                {user.position && (
                  <Text style={styles.userPosition}>{user.position}</Text>
                )}
              </View>
              
              <View style={styles.userActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEdit(user)}
                >
                  <Text style={styles.actionButtonText}>✏️</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(user.id)}
                >
                  <Text style={styles.actionButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.userDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Role:</Text>
                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
                  <Text style={[styles.roleBadgeText, { color: getRoleTextColor(user.role) }]}>
                    {user.role.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Department:</Text>
                <Text style={styles.detailValue}>{user.departmentName || 'None'}</Text>
              </View>
              
              {user.phone && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone:</Text>
                  <Text style={styles.detailValue}>{user.phone}</Text>
                </View>
              )}
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(user.isActive) }]}>
                  <Text style={[styles.statusBadgeText, { color: getStatusTextColor(user.isActive) }]}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created:</Text>
                <Text style={styles.detailValue}>{formatDate(user.createdAt)}</Text>
              </View>
            </View>


          </View>
        ))}
      </View>

      {/* Empty State */}
      {filteredUsers.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>👥</Text>
          <Text style={styles.emptyStateTitle}>No users found</Text>
          <Text style={styles.emptyStateText}>
            {searchTerm ? 'No users match your search criteria' : 'No users have been created yet'}
          </Text>
        </View>
      )}

      {/* Add/Edit User Form Modal */}
      <Modal
        visible={showAddForm}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingUser ? 'Edit User' : 'Add New User'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddForm(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {/* Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.name}
                  onChangeText={(value) => setFormData({ ...formData, name: value })}
                  placeholder="Enter full name"
                />
              </View>

              {/* Username */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.username}
                  onChangeText={(value) => setFormData({ ...formData, username: value })}
                  placeholder="Enter username"
                  editable={!editingUser}
                />
              </View>

              {/* Password */}
              {!editingUser && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.password}
                    onChangeText={(value) => setFormData({ ...formData, password: value })}
                    placeholder="Enter password"
                    secureTextEntry
                  />
                </View>
              )}

              {/* Phone */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.phone}
                  onChangeText={(value) => setFormData({ ...formData, phone: value })}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              {/* Position */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Position</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.position}
                  onChangeText={(value) => setFormData({ ...formData, position: value })}
                  placeholder="Enter job position"
                />
              </View>

              {/* Department - Only show for non-admin roles */}
              {formData.role !== 'admin' && formData.role !== 'super_admin' && (
                <SelectDropdown
                  label="Department"
                  value={formData.departmentId}
                  options={departmentOptions}
                  placeholder="Select Department"
                  searchable={true}
                  required={formData.role !== 'admin' && formData.role !== 'super_admin'}
                  onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                />
              )}

              {/* Role */}
              <SelectDropdown
                label="Role"
                value={formData.role}
                options={availableRoles}
                placeholder="Select Role"
                required={true}
                onValueChange={(value) => {
                  const newRole = value as any;
                  // Clear department if admin or super_admin is selected
                  const newDepartmentId = (newRole === 'admin' || newRole === 'super_admin') ? '' : formData.departmentId;
                  setFormData({ ...formData, role: newRole, departmentId: newDepartmentId });
                }}
              />

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {editingUser ? 'Update User' : 'Create User'}
                    </Text>
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
  filtersContainer: {
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
    marginBottom: 12,
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
  usersContainer: {
    padding: 20,
    gap: 16,
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  userUsername: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  userPosition: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  actionButtonText: {
    fontSize: 18,
  },
  userDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
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
});

export default UsersScreen; 