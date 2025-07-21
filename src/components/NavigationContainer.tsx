import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import DashboardScreen from '../screens/DashboardScreen';
import TasksScreen from '../screens/TasksScreen';
import AssignTaskScreen from '../screens/AssignTaskScreen';
import PrivateTasksScreen from '../screens/PrivateTasksScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationDrawer from './NotificationDrawer';
import BottomNavigation from './BottomNavigation';
import notificationService from '../services/notificationService';

type TabType = 'tasks' | 'assign' | 'dashboard' | 'private' | 'profile';

const NavigationContainer: React.FC = () => {
  const { user, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial unread count
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  // Periodically refresh unread count (every 30 seconds)
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      console.log('🔔 Periodic unread count refresh...');
      fetchUnreadCount();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      console.log('🔔 Fetching unread notification count...');
      const count = await notificationService.getUnreadCount();
      console.log('🔔 Unread count received:', count);
      setUnreadCount(count);
    } catch (error) {
      console.error('❌ Error fetching unread count:', error);
      setUnreadCount(0);
    }
  };

  const handleNotificationToggle = () => {
    if (!notificationVisible) {
      // Opening drawer - refresh unread count like website does
      console.log('🔔 Opening notification drawer, refreshing unread count...');
      fetchUnreadCount();
    }
    setNotificationVisible(!notificationVisible);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            try {
              console.log('🚪 Logout initiated...');
              await AsyncStorage.clear();
              logout();
              console.log('✅ Logout completed');
            } catch (error) {
              console.error('❌ Logout failed:', error);
              Alert.alert('Error', 'Logout failed. Please try again.');
            }
          }
        },
      ]
    );
  };

  const renderScreen = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'tasks':
        return <TasksScreen />;
      case 'assign':
        return <AssignTaskScreen />;
      case 'private':
        return <PrivateTasksScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Safe Area for Status Bar - Empty */}
      <SafeAreaView style={styles.statusBarSafeArea} />
      
      {/* Main Content */}
      <SafeAreaView style={styles.mainSafeArea}>
        {/* Header with Notification Bell */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AKDM Tasks</Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={handleNotificationToggle}
            >
              <Text style={styles.notificationIcon}>🔔</Text>
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {renderScreen()}
        </View>
      </SafeAreaView>

      {/* Bottom Navigation */}
      <BottomNavigation
        currentTab={currentTab}
        onTabPress={setCurrentTab}
      />

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={notificationVisible}
        onClose={() => setNotificationVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  statusBarSafeArea: {
    backgroundColor: '#FFFFFF',
  },
  mainSafeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60, // Add top padding to avoid camera cutout
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationIcon: {
    fontSize: 20,
    color: '#6B7280',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
});

export default NavigationContainer; 