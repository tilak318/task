import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

type TabType = 'tasks' | 'assign' | 'dashboard' | 'private' | 'profile';

interface BottomNavigationProps {
  currentTab: TabType;
  onTabPress: (tab: TabType) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onTabPress,
}) => {
  const tabs = [
    {
      id: 'tasks' as TabType,
      title: 'Tasks',
      icon: '📋',
    },
    {
      id: 'assign' as TabType,
      title: 'Assign',
      icon: '👥',
    },
    {
      id: 'dashboard' as TabType,
      title: 'Dashboard',
      icon: '📊',
    },
    {
      id: 'private' as TabType,
      title: 'Private',
      icon: '🛡️',
    },
    {
      id: 'profile' as TabType,
      title: 'Profile',
      icon: '👤',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navigation}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              currentTab === tab.id && styles.activeTab,
            ]}
            onPress={() => onTabPress(tab.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabIcon,
                currentTab === tab.id && styles.activeTabIcon,
              ]}
            >
              {tab.icon}
            </Text>
            <Text
              style={[
                styles.tabText,
                currentTab === tab.id && styles.activeTabText,
              ]}
            >
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navigation: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: 'white',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    backgroundColor: '#F3F4F6',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
    color: '#6B7280',
  },
  activeTabIcon: {
    color: '#10B981',
  },
  tabText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#10B981',
    fontWeight: '600',
  },
});

export default BottomNavigation; 