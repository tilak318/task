import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';

interface StatusDropdownProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
  disabled?: boolean;
  isAssignee?: boolean;
}

const StatusDropdown: React.FC<StatusDropdownProps> = ({
  currentStatus,
  onStatusChange,
  disabled = false,
  isAssignee = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusOptions = () => {
    if (!isAssignee) return [];
    
    switch (currentStatus) {
      case 'todo':
      case 'assigned':
        return [
          { value: 'in_progress', label: 'In Progress', icon: '▶️' }
        ];
      case 'in_progress':
        return [
          { value: 'completed', label: 'Complete', icon: '✅' }
        ];
      case 'completed':
        return []; // No further changes allowed
      case 'pending_verification':
        return []; // Only creator can verify/reassign
      case 'verified':
        return []; // Task is done
      default:
        return [];
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return { bg: '#D1FAE5', text: '#065F46' };
      case 'completed': return { bg: '#D1FAE5', text: '#065F46' };
      case 'pending_verification': return { bg: '#F3E8FF', text: '#7C3AED' };
      case 'in_progress': return { bg: '#F3F4F6', text: '#374151' };
      case 'todo': return { bg: '#F3F4F6', text: '#374151' };
      case 'assigned': return { bg: '#F3F4F6', text: '#374151' };
      default: return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return '✅';
      case 'completed': return '✅';
      case 'pending_verification': return '⏳';
      case 'in_progress': return '▶️';
      case 'todo': return '⭕';
      case 'assigned': return '⏰';
      default: return '⭕';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'todo': return 'To Do';
      case 'assigned': return 'Assigned';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'pending_verification': return 'Pending Verification';
      case 'verified': return 'Verified';
      default: return status;
    }
  };

  const statusOptions = getStatusOptions();
  const statusColors = getStatusColor(currentStatus);
  const statusIcon = getStatusIcon(currentStatus);

  const handleStatusChange = (newStatus: string) => {
    onStatusChange(newStatus);
    setIsOpen(false);
  };

  // If not assignee or no options available, show read-only status
  if (!isAssignee || statusOptions.length === 0) {
    return (
      <View style={[styles.readOnlyContainer, { backgroundColor: statusColors.bg }]}>
        <Text style={styles.statusIcon}>{statusIcon}</Text>
        <Text style={[styles.readOnlyText, { color: statusColors.text }]}>
          {getStatusLabel(currentStatus)}
        </Text>
      </View>
    );
  }

  return (
    <>
      {/* Main Button */}
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: statusColors.bg },
          disabled && styles.disabledButton
        ]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        <Text style={styles.statusIcon}>{statusIcon}</Text>
        <Text style={[styles.buttonText, { color: statusColors.text }]}>
          {getStatusLabel(currentStatus)}
        </Text>
        <Text style={[styles.dropdownIcon, { color: statusColors.text }]}>▼</Text>
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownTitle}>Update Status</Text>
              
              <ScrollView style={styles.optionsContainer}>
                {statusOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.optionItem}
                    onPress={() => handleStatusChange(option.value)}
                  >
                    <Text style={styles.optionIcon}>{option.icon}</Text>
                    <Text style={styles.optionText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsOpen(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  readOnlyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusIcon: {
    fontSize: 16,
  },
  readOnlyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 120,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  dropdownIcon: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 300,
  },
  dropdownContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionsContainer: {
    maxHeight: 200,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  optionIcon: {
    fontSize: 16,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
});

export default StatusDropdown; 