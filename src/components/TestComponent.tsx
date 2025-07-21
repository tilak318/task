import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TestComponent: React.FC = () => {
  console.log('🧪 TestComponent: Rendering test component');
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🧪 Test Component - App is working!</Text>
      <Text style={styles.subtext}>If you see this, React Native is rendering properly</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    padding: 20,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default TestComponent; 