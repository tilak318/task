import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import CommunityScreen from './CommunityScreen';
import UsersScreen from './UsersScreen';
import DepartmentsScreen from './DepartmentsScreen';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<'profile' | 'community' | 'users' | 'departments'>('profile');

  const formatRole = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getDepartmentDisplay = () => {
    if (user?.departmentName) {
      return user.departmentName;
    }
    return 'Department not assigned';
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

  const getPermissionsDescription = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Full system access';
      case 'admin': return 'Administrative access';
      case 'hod': return 'Department management';
      case 'manager': return 'Team management';
      case 'member': return 'Standard user access';
      default: return 'Limited access';
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // Navigation tabs for role-specific screens
  const getNavigationTabs = () => {
    const tabs = [
      { id: 'profile' as const, title: 'Profile', icon: '👤' },
    ];

    // Add Community for HOD, Admin, and Super Admin
    if (['hod', 'admin', 'super_admin'].includes(user?.role || '')) {
      tabs.push({ id: 'community' as const, title: 'Community', icon: '🌐' });
    }

    // Add Users for Admin and Super Admin
    if (['admin', 'super_admin'].includes(user?.role || '')) {
      tabs.push({ id: 'users' as const, title: 'Users', icon: '👥' });
    }

    // Add Departments for Admin and Super Admin
    if (['admin', 'super_admin'].includes(user?.role || '')) {
      tabs.push({ id: 'departments' as const, title: 'Departments', icon: '🏢' });
    }

    return tabs;
  };

  const navigationTabs = getNavigationTabs();

  // Render the appropriate screen based on current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'community':
        return <CommunityScreen />;
      case 'users':
        return <UsersScreen />;
      case 'departments':
        return <DepartmentsScreen />;
      case 'profile':
      default:
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <Text style={styles.headerSubtitle}>View your personal information and account details</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        {/* Profile Picture */}
        <View style={styles.profilePictureContainer}>
          <View style={styles.profilePicture}>
            <Text style={styles.profilePictureText}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
            <Text style={[styles.roleBadgeText, { color: getRoleTextColor(user.role) }]}>
              {formatRole(user.role)}
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Department</Text>
            <Text style={styles.statValue}>{getDepartmentDisplay()}</Text>
          </View>
        </View>
      </View>

      {/* Personal Information */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>👤 Full Name</Text>
            <Text style={styles.infoValue}>{user.name}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>👤 Username</Text>
            <Text style={styles.infoValue}>@{user.username}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>🛡️ Role</Text>
            <Text style={styles.infoValue}>{formatRole(user.role)}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>🏢 Department</Text>
            <Text style={styles.infoValue}>{getDepartmentDisplay()}</Text>
          </View>

          {user.phone && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>📞 Phone Number</Text>
              <Text style={styles.infoValue}>{user.phone}</Text>
            </View>
          )}

          {user.position && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>💼 Position</Text>
              <Text style={styles.infoValue}>{user.position}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Account Information */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>📅 Account Type</Text>
            <Text style={styles.infoValue}>{formatRole(user.role)} Account</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>🛡️ Permissions</Text>
            <Text style={styles.infoValue}>{getPermissionsDescription(user.role)}</Text>
          </View>
        </View>

        {/* Information Note */}
        <View style={styles.infoNote}>
          <View style={styles.infoNoteHeader}>
            <Text style={styles.infoNoteIcon}>ℹ️</Text>
            <Text style={styles.infoNoteTitle}>Profile Information</Text>
          </View>
          <Text style={styles.infoNoteText}>
            Your profile information is managed by system administrators. 
            Contact your administrator if you need to update any details.
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Account Actions</Text>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>🚪 Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Information Note */}
      <View style={styles.infoNote}>
        <View style={styles.infoNoteHeader}>
          <Text style={styles.infoNoteIcon}>ℹ</Text>
          <Text style={styles.infoNoteTitle}>Profile Information</Text>
        </View>
        <Text style={styles.infoNoteText}>
          {user?.role === 'super_admin' || user?.role === 'admin'
            ? 'You have permission to edit profile information. Changes will be applied immediately.'
            : 'Your profile information is managed by system administrators. Contact your administrator if you need to update any details.'
          }
        </Text>
      </View>
    </ScrollView>
        );
    }
  };

  return (
    <View style={styles.mainContainer}>
      {/* Navigation Tabs */}
      {navigationTabs.length > 1 && (
        <View style={styles.navigationTabs}>
          {navigationTabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.navigationTab,
                currentView === tab.id && styles.activeNavigationTab,
              ]}
              onPress={() => setCurrentView(tab.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.navigationTabIcon}>{tab.icon}</Text>
              <Text
                style={[
                  styles.navigationTabText,
                  currentView === tab.id && styles.activeNavigationTabText,
                ]}
              >
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Content */}
      <View style={styles.contentContainer}>
        {renderCurrentView()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
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
  profileCard: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profilePictureText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  sectionCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    gap: 6,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  infoNote: {
    backgroundColor: '#DBEAFE',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoNoteIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginRight: 8,
  },
  infoNoteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  infoNoteText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  navigationTabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 20,
  },
  navigationTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeNavigationTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#10B981',
  },
  navigationTabIcon: {
    fontSize: 20,
    marginBottom: 4,
    color: '#6B7280',
  },
  navigationTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeNavigationTabText: {
    color: '#10B981',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
});

export default ProfileScreen; 