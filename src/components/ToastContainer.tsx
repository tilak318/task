import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useToast, Toast } from '../hooks/useToast';

const { width: screenWidth } = Dimensions.get('window');

const ToastContainer: React.FC = () => {
  const { toasts, toast } = useToast();

  const getToastStyle = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#DCFCE7',
          borderColor: '#22C55E',
          icon: '✅',
        };
      case 'error':
        return {
          backgroundColor: '#FEE2E2',
          borderColor: '#EF4444',
          icon: '❌',
        };
      case 'warning':
        return {
          backgroundColor: '#FEF3C7',
          borderColor: '#F59E0B',
          icon: '⚠️',
        };
      case 'info':
        return {
          backgroundColor: '#DBEAFE',
          borderColor: '#3B82F6',
          icon: 'ℹ️',
        };
      default:
        return {
          backgroundColor: '#F3F4F6',
          borderColor: '#6B7280',
          icon: '💬',
        };
    }
  };

  const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
    const translateY = new Animated.Value(-100);
    const opacity = new Animated.Value(0);

    useEffect(() => {
      // Animate in
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss
      if (toast.duration && toast.duration > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, toast.duration);

        return () => clearTimeout(timer);
      }
    }, []);

    const handleDismiss = () => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        toast.dismiss(toast.id);
      });
    };

    const toastStyle = getToastStyle(toast.type);

    return (
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: toastStyle.backgroundColor,
            borderColor: toastStyle.borderColor,
            transform: [{ translateY }],
            opacity,
          },
        ]}
      >
        <View style={styles.toastContent}>
          <View style={styles.toastHeader}>
            <Text style={styles.toastIcon}>{toastStyle.icon}</Text>
            <Text style={styles.toastTitle}>{toast.title}</Text>
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={handleDismiss}
            >
              <Text style={styles.dismissIcon}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {toast.description && (
            <Text style={styles.toastDescription}>{toast.description}</Text>
          )}
          
          {toast.action && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={toast.action.onPress}
            >
              <Text style={styles.actionText}>{toast.action.label}</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    );
  };

  if (toasts.length === 0) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  container: {
    paddingTop: 100, // Much more padding for camera cutout
    paddingHorizontal: 16,
  },
  toast: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  toastContent: {
    padding: 16,
  },
  toastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  toastIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  toastTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  dismissButton: {
    padding: 4,
  },
  dismissIcon: {
    fontSize: 16,
    color: '#6B7280',
  },
  toastDescription: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 24,
    lineHeight: 20,
  },
  actionButton: {
    marginTop: 8,
    marginLeft: 24,
    alignSelf: 'flex-start',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
});

export default ToastContainer; 