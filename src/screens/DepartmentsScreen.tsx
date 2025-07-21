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

interface Department {
  id: string;
  name: string;
  description?: string;
  code?: string;
  color: string;
  isActive: boolean;
  memberCount: number;
  hodIds: string[];
  createdAt: string;
}

interface CreateDepartmentData {
  name: string;
  description?: string;
  code?: string;
  color: string;
}

interface UpdateDepartmentData {
  name: string;
  description?: string;
  code?: string;
  color: string;
}

const DepartmentsScreen: React.FC = () => {
  const { user: currentUser, refreshDepartments } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [departmentMembers, setDepartmentMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    color: '#3B82F6'
  });

  useEffect(() => {
    if (currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'admin')) {
      fetchDepartments();
    }
  }, [currentUser]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/departments', { params: { isActive: true } });
      
      if (response.data.success) {
        setDepartments(response.data.data);
      } else {
        Alert.alert('Error', 'Failed to load departments');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      Alert.alert('Error', 'Failed to load departments. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDepartments();
    setRefreshing(false);
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Department name is required');
      return;
    }

    try {
      setSubmitting(true);
      
      if (editingDept) {
        // Update existing department
        const updateData: UpdateDepartmentData = {
          name: formData.name,
          description: formData.description,
          code: formData.code || undefined,
          color: formData.color
        };
        
        const response = await api.put(`/departments/${editingDept.id}`, updateData);
        
        if (response.data.success) {
          setDepartments(departments.map(d => d.id === editingDept.id ? response.data.data : d));
          await refreshDepartments();
          Alert.alert('Success', 'Department updated successfully');
          resetForm();
        } else {
          Alert.alert('Error', response.data.message || 'Failed to update department');
        }
      } else {
        // Create new department
        const createData: CreateDepartmentData = {
          name: formData.name,
          description: formData.description,
          code: formData.code || undefined,
          color: formData.color
        };
        
        const response = await api.post('/departments', createData);
        
        if (response.data.success) {
          setDepartments([response.data.data, ...departments]);
          await refreshDepartments();
          Alert.alert('Success', 'Department created successfully');
          resetForm();
        } else {
          Alert.alert('Error', response.data.message || 'Failed to create department');
        }
      }
    } catch (error: any) {
      console.error('Error saving department:', error);
      
      let errorMessage = "Failed to save department. Please try again.";
      
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

  const handleEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      description: dept.description || '',
      code: dept.code || '',
      color: dept.color || '#3B82F6'
    });
    setShowAddForm(true);
  };

  const handleDelete = async (departmentId: string) => {
    Alert.alert(
      'Delete Department',
      'Are you sure you want to delete this department? This action cannot be undone and will remove all department data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete(`/departments/${departmentId}`);
              
              if (response.data.success) {
                setDepartments(departments.filter(d => d.id !== departmentId));
                await refreshDepartments();
                Alert.alert('Success', 'Department deleted successfully');
              } else {
                Alert.alert('Error', response.data.message || 'Failed to delete department');
              }
            } catch (error: any) {
              console.error('Error deleting department:', error);
              
              let errorMessage = "Failed to delete department. Please try again.";
              
              if (error.response) {
                errorMessage = error.response.data?.message || errorMessage;
                if (errorMessage.includes('user(s) are still assigned')) {
                  errorMessage += '\nPlease reassign all users to another department before deleting.';
                }
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

  const handleViewMembers = async (department: Department) => {
    try {
      setSelectedDepartment(department);
      setShowMembersModal(true);
      setLoadingMembers(true);
      
      const response = await api.get(`/departments/${department.id}/users`);
      
      if (response.data.success) {
        setDepartmentMembers(response.data.data);
      } else {
        Alert.alert('Error', 'Failed to fetch department members');
      }
    } catch (error) {
      console.error('Error fetching department members:', error);
      Alert.alert('Error', 'Failed to fetch department members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      code: '',
      color: '#3B82F6'
    });
    setEditingDept(null);
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
          You don't have permission to access the Departments management page. Only Super Admins and Admins can manage departments.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading departments...</Text>
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
          <Text style={styles.headerTitle}>Department Management</Text>
          <Text style={styles.headerSubtitle}>Manage system departments and teams</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(true)}
        >
          <Text style={styles.addButtonText}>+ Add Dept</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search departments..."
        />
      </View>

      {/* Departments List */}
      <View style={styles.departmentsContainer}>
        {filteredDepartments.map((dept) => (
          <View key={dept.id} style={styles.departmentCard}>
            <View style={styles.departmentHeader}>
              <View style={styles.departmentInfo}>
                <View style={styles.departmentNameRow}>
                  <View style={[styles.colorIndicator, { backgroundColor: dept.color }]} />
                  <Text style={styles.departmentName}>{dept.name}</Text>
                  {dept.code && (
                    <View style={styles.codeBadge}>
                      <Text style={styles.codeText}>{dept.code}</Text>
                    </View>
                  )}
                </View>
                {dept.description && (
                  <Text style={styles.departmentDescription} numberOfLines={2}>
                    {dept.description}
                  </Text>
                )}
              </View>
              
              <View style={styles.departmentActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEdit(dept)}
                >
                  <Text style={styles.actionButtonText}>✏️</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(dept.id)}
                >
                  <Text style={styles.actionButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.departmentStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>👥</Text>
                <Text style={styles.statValue}>{dept.memberCount} members</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>📅</Text>
                <Text style={styles.statValue}>Created {formatDate(dept.createdAt)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.viewMembersButton}
              onPress={() => handleViewMembers(dept)}
            >
              <Text style={styles.viewMembersText}>View Members</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Empty State */}
      {filteredDepartments.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🏢</Text>
          <Text style={styles.emptyStateTitle}>No departments found</Text>
          <Text style={styles.emptyStateText}>
            {searchTerm ? 'No departments match your search criteria' : 'No departments have been created yet'}
          </Text>
        </View>
      )}

      {/* Add/Edit Department Form Modal */}
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
                {editingDept ? 'Edit Department' : 'Add New Department'}
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
                  placeholder="Enter department name"
                />
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={formData.description}
                  onChangeText={(value) => setFormData({ ...formData, description: value })}
                  placeholder="Enter department description"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Code */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Code</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.code}
                  onChangeText={(value) => setFormData({ ...formData, code: value })}
                  placeholder="Enter department code (optional)"
                  maxLength={10}
                />
              </View>

              {/* Color */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Color</Text>
                <TouchableOpacity
                  style={styles.colorPickerButton}
                  onPress={() => {
                    Alert.alert(
                      'Select Color',
                      'Choose department color',
                      [
                        { text: 'Blue', onPress: () => setFormData({ ...formData, color: '#3B82F6' }) },
                        { text: 'Green', onPress: () => setFormData({ ...formData, color: '#10B981' }) },
                        { text: 'Purple', onPress: () => setFormData({ ...formData, color: '#8B5CF6' }) },
                        { text: 'Orange', onPress: () => setFormData({ ...formData, color: '#F97316' }) },
                        { text: 'Red', onPress: () => setFormData({ ...formData, color: '#EF4444' }) },
                        { text: 'Yellow', onPress: () => setFormData({ ...formData, color: '#EAB308' }) },
                        { text: 'Cancel', style: 'cancel' }
                      ]
                    );
                  }}
                >
                  <View style={styles.colorDisplay}>
                    <View style={[styles.colorPreview, { backgroundColor: formData.color }]} />
                    <Text style={styles.colorPickerText}>Select Color</Text>
                  </View>
                  <Text style={styles.pickerArrow}>▼</Text>
                </TouchableOpacity>
              </View>

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
                      {editingDept ? 'Update Department' : 'Create Department'}
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

      {/* Department Members Modal */}
      <Modal
        visible={showMembersModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMembersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDepartment?.name} - Members ({departmentMembers.length})
              </Text>
              <TouchableOpacity onPress={() => setShowMembersModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {loadingMembers ? (
                <View style={styles.loadingMembersContainer}>
                  <ActivityIndicator size="large" color="#10B981" />
                  <Text style={styles.loadingMembersText}>Loading members...</Text>
                </View>
              ) : departmentMembers.length > 0 ? (
                departmentMembers.map((member) => (
                  <View key={member.id} style={styles.memberItem}>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <Text style={styles.memberUsername}>@{member.username}</Text>
                    </View>
                    <View style={[styles.roleBadge, { backgroundColor: getRoleColor(member.role) }]}>
                      <Text style={[styles.roleBadgeText, { color: getRoleTextColor(member.role) }]}>
                        {member.role.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.noMembersContainer}>
                  <Text style={styles.noMembersText}>No members in this department</Text>
                </View>
              )}
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
  departmentsContainer: {
    padding: 20,
    gap: 16,
  },
  departmentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  departmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  departmentInfo: {
    flex: 1,
  },
  departmentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  departmentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  codeBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  codeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  departmentDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  departmentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  actionButtonText: {
    fontSize: 18,
  },
  departmentStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 16,
    marginRight: 6,
  },
  statValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  viewMembersButton: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewMembersText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  colorPickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
  },
  colorDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  colorPickerText: {
    fontSize: 16,
    color: '#111827',
  },
  pickerArrow: {
    fontSize: 12,
    color: '#6B7280',
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
  loadingMembersContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingMembersText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  memberUsername: {
    fontSize: 14,
    color: '#6B7280',
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
  noMembersContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noMembersText: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default DepartmentsScreen; 