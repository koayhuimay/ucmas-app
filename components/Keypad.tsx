// components/Keypad.tsx
// A number input pad for kids. Large buttons, easy to tap.
// Calls onPress with each digit, onDelete to remove last digit.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

interface KeypadProps {
  onPress: (digit: string) => void;
  onDelete: () => void;
}

const CONTAINER_HEIGHT = Dimensions.get('window').height / 3;

const rows = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['.', '0', '⌫'],
];

export default function Keypad({ onPress, onDelete }: KeypadProps) {
  return (
    <View style={styles.container}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((key) => (
            <TouchableOpacity
              key={key}
              style={[styles.key, key === '⌫' && styles.deleteKey]}
              onPress={() => (key === '⌫' ? onDelete() : onPress(key))}
            >
              <Text style={styles.keyText}>{key}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: CONTAINER_HEIGHT,
    paddingHorizontal: 6,
    paddingTop: 4,
    paddingBottom: 40,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  key: {
    flex: 1,
    marginVertical: 2,
    borderRadius: 10,
    backgroundColor: '#1E1E2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteKey: {
    backgroundColor: '#2E1E1E',
  },
  keyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
