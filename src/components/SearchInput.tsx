import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from 'react-native';

interface SearchInputProps extends TextInputProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search...',
  onSearch,
  style,
  ...props
}) => {
  const handleChangeText = (text: string) => {
    onSearch?.(text);
    props.onChangeText?.(text);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.searchInput, style]}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        onChangeText={handleChangeText}
        {...props}
      />
      <View style={styles.searchIcon}>
        <Text style={styles.searchIconText}>🔍</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 40,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIconText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});

export default SearchInput; 