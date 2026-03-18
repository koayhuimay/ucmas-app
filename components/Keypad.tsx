// components/Keypad.tsx
// A number input pad for kids. Large buttons, easy to tap.
// Calls onPress with each digit, onDelete to remove last digit.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface KeypadProps {
  onPress: (digit: string) => void;
  onDelete: () => void;
}

const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0'];

export default function Keypad({ onPress, onDelete }: KeypadProps) {
  return (
    <View style={styles.container}>
      {keys.map((key) => (
        <TouchableOpacity
          key={key}
          style={styles.key}
          onPress={() => onPress(key)}
        >
          <Text style={styles.keyText}>{key}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={[styles.key, styles.deleteKey]} onPress={onDelete}>
        <Text style={styles.keyText}>⌫</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  key: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#1E1E2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteKey: {
    backgroundColor: '#2E1E1E',
  },
  keyText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});