import React from 'react';
import { View, Text, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/Colors';

function AuthHeader() {
  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      height: 56,
      backgroundColor: Colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: Colors.borderLight,
      ...Platform.select({
        web: { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
        default: { ...Shadows.sm },
      }),
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
        <View style={{
          width: 28,
          height: 28,
          borderRadius: BorderRadius.md,
          backgroundColor: Colors.brandPrimary,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Feather name="shield" size={16} color={Colors.white} />
        </View>
        <Text style={{
          fontSize: Typography.fontSize.lg,
          fontWeight: Typography.fontWeight.bold,
          color: Colors.textPrimary,
        }}>Nalogovik</Text>
      </View>
    </View>
  );
}

export default function AuthLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgPrimary }}>
      <AuthHeader />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.bgPrimary },
          animation: 'slide_from_right',
        }}
      />
    </View>
  );
}
