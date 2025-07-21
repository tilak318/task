import React from 'react';
import { StatusBar, LogBox, View, Text } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import NavigationContainer from './src/components/NavigationContainer';
import LoginScreen from './src/screens/LoginScreen';
import ToastContainer from './src/components/ToastContainer';
import ErrorBoundary from './src/components/ErrorBoundary';

// Ignore specific warnings that might cause issues
LogBox.ignoreLogs([
  'Warning: Failed prop type',
  'Warning: AsyncStorage has been extracted',
]);



const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <Text style={{ fontSize: 16, color: '#6B7280' }}>Loading...</Text>
      </View>
    );
  }

  // Fallback to ensure we always render something
  if (!user) {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <LoginScreen />
        <ToastContainer />
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <NavigationContainer />
      <ToastContainer />
    </>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
