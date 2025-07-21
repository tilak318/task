import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import userService from '../services/userService';
import { User } from '../types/user';

interface UserSelectDropdownProps {
  label?: string;
  value?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  onValueChange: (value: string) => void;
  filterByRole?: string;
  filterByDepartment?: string;
  users?: User[]; // New prop to accept users from parent
  loading?: boolean; // New prop for loading state
}

const UserSelectDropdown: React.FC<UserSelectDropdownProps> = ({
  label,
  value,
  placeholder = 'Select a user',
  error,
  helperText,
  required = false,
  onValueChange,
  filterByRole,
  filterByDepartment,
  users: propUsers, // Users passed from parent
  loading: propLoading, // Loading state from parent
}) => {
  const { user, canViewUserForAssignment } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedUser = users.find(u => u.id === value);

  // Use users from prop if provided, otherwise fetch them
  useEffect(() => {
    if (propUsers) {
      console.log('👥 UserSelectDropdown: Using users from prop:', propUsers.length);
      setUsers(propUsers);
    } else if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, propUsers]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers();
      let allUsers = response.data;

      // Filter users based on permissions
      if (user) {
        allUsers = allUsers.filter(targetUser => {
          return canViewUserForAssignment(
            targetUser.id,
            targetUser.role,
            targetUser.departmentId
          );
        });
      }

      // Apply additional filters
      if (filterByRole) {
        allUsers = allUsers.filter(u => u.role === filterByRole);
      }
      if (filterByDepartment) {
        allUsers = allUsers.filter(u => u.departmentId === filterByDepartment);
      }

      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Use loading state from prop if provided
  const isLoading = propLoading !== undefined ? propLoading : loading;

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.departmentName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (userId: string) => {
    onValueChange(userId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getUserDisplayText = (user: User) => {
    const roleText = user.role.replace('_', ' ').toUpperCase();
    return `${user.name} (${roleText}) - ${user.departmentName || 'No Department'}`;
  };

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.dropdown,
          error && styles.dropdownError,
        ]}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.dropdownText,
            !selectedUser && styles.placeholderText,
          ]}
        >
          {selectedUser ? getUserDisplayText(selectedUser) : placeholder}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      {(error || helperText) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helperText}
        </Text>
      )}

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {label || 'Select User'}
              </Text>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search users..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <ScrollView style={styles.optionsContainer}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#10B981" />
                  <Text style={styles.loadingText}>Loading users...</Text>
                </View>
              ) : filteredUsers.length === 0 ? (
                <View style={styles.noOptionsContainer}>
                  <Text style={styles.noOptionsText}>
                    {searchTerm ? 'No users found' : 'No users available'}
                  </Text>
                </View>
              ) : (
                filteredUsers.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    style={[
                      styles.option,
                      user.id === value && styles.selectedOption,
                    ]}
                    onPress={() => handleSelect(user.id)}
                  >
                    <View style={styles.userInfo}>
                      <Text
                        style={[
                          styles.userName,
                          user.id === value && styles.selectedUserName,
                        ]}
                      >
                        {user.name}
                      </Text>
                      <Text
                        style={[
                          styles.userDetails,
                          user.id === value && styles.selectedUserDetails,
                        ]}
                      >
                        {user.role.replace('_', ' ').toUpperCase()} • {user.departmentName || 'No Department'}
                      </Text>
                    </View>
                    {user.id === value && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  required: {
    color: '#EF4444',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownError: {
    borderColor: '#EF4444',
  },
  dropdownText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  arrow: {
    fontSize: 12,
    color: '#6B7280',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  errorText: {
    color: '#EF4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 20,
    color: '#6B7280',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  optionsContainer: {
    maxHeight: 400,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedOption: {
    backgroundColor: '#EFF6FF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  selectedUserName: {
    color: '#1E40AF',
  },
  userDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  selectedUserDetails: {
    color: '#3B82F6',
  },
  checkmark: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: 'bold',
  },
  noOptionsContainer: {
    padding: 32,
    alignItems: 'center',
  },
  noOptionsText: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default UserSelectDropdown; 