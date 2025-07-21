import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ ErrorBoundary caught an error:', error);
    console.error('❌ ErrorBoundary error info:', errorInfo);
    console.error('❌ ErrorBoundary error stack:', error.stack);
    console.error('❌ ErrorBoundary component stack:', errorInfo.componentStack);
  }

  handleRetry = () => {
    console.log('🔄 ErrorBoundary: Retry requested');
    this.setState({ hasError: false, error: undefined });
  };

  handleReportError = () => {
    console.log('📧 ErrorBoundary: Report error requested');
    Alert.alert(
      'Report Error',
      `Error: ${this.state.error?.message}\n\nError details have been logged. Please contact support if this issue persists.`,
      [{ text: 'OK' }]
    );
  };

  render() {
    if (this.state.hasError) {
      console.log('🚨 ErrorBoundary: Rendering error UI');
      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorMessage}>
              The app encountered an unexpected error. Please try again.
            </Text>
            
            {__DEV__ && this.state.error && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info (Development):</Text>
                <Text style={styles.debugText}>Error: {this.state.error.message}</Text>
                <Text style={styles.debugText}>Stack: {this.state.error.stack?.split('\n')[0]}</Text>
              </View>
            )}
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={this.handleRetry}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.reportButton}
                onPress={this.handleReportError}
              >
                <Text style={styles.reportButtonText}>Report Issue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: 300,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  reportButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  reportButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  debugContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#E0E7FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    width: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 8,
    textAlign: 'left',
  },
  debugText: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'left',
    marginBottom: 4,
  },
});

export default ErrorBoundary; 