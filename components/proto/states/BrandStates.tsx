import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';

export function BrandStates() {
  return (
    <View style={styles.container}>
      <StateSection title="Brand">
        <View style={styles.placeholder}>
          <Text style={styles.text}>Brand page stub</Text>
        </View>
      </StateSection>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 32 },
  placeholder: { padding: 24, alignItems: 'center' },
  text: { fontSize: 16, color: '#666' },
});
