import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
import { Header } from '../../components/Header';

/**
 * Legacy "Отклики" screen — replaced by direct-chat flow (W-2).
 * Clients now see specialist messages in Сообщения, grouped by request.
 */
export default function ResponsesScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header variant="auth" />
      <View style={{ flex: 1, padding: Spacing.lg, gap: Spacing.md, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border }}>
          <Feather name="message-circle" size={36} color={Colors.brandPrimary} />
        </View>
        <Text style={{ fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary, textAlign: 'center' }}>
          Теперь сообщения от специалистов — в разделе «Сообщения»
        </Text>
        <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center', maxWidth: 320 }}>
          Специалисты пишут вам напрямую. Откройте чат, чтобы обсудить детали.
        </Text>
        <Pressable
          onPress={() => router.push('/(tabs)/messages' as any)}
          style={{
            height: 44,
            paddingHorizontal: Spacing['2xl'],
            borderRadius: BorderRadius.btn,
            backgroundColor: Colors.brandPrimary,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: Spacing.sm,
            marginTop: Spacing.sm,
          }}
        >
          <Feather name="mail" size={16} color={Colors.white} />
          <Text style={{ fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.white }}>
            Перейти в сообщения
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
