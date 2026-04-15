import React from 'react';
import { View, Text, Image, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View className="flex-1 items-center rounded-lg border border-border bg-bgCard p-3" style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
      <Text className="font-bold" style={{ fontSize: 24, color }}>{value}</Text>
      <Text className="text-xs text-textMuted" style={{ marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function RequestRow({ title, status, date, statusColor }: { title: string; status: string; date: string; statusColor: string }) {
  return (
    <Pressable className="flex-row items-center justify-between rounded-lg border border-border bg-bgCard p-3">
      <View className="mr-2 flex-1">
        <Text className="text-sm font-medium text-textPrimary" numberOfLines={1}>{title}</Text>
        <Text className="text-xs text-textMuted" style={{ marginTop: 2 }}>{date}</Text>
      </View>
      <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: statusColor + '20' }}>
        <Text className="text-xs font-semibold" style={{ color: statusColor }}>{status}</Text>
      </View>
    </Pressable>
  );
}

export default function DashboardPage() {
  return (
    <View className="flex-1">
      <Header variant="auth" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View className="gap-1 pt-2">
          <Text className="text-xl font-bold text-textPrimary">Добрый день, Елена!</Text>
          <Text className="text-sm text-textMuted">Добро пожаловать в Налоговик</Text>
        </View>
        <View className="items-center gap-3 p-8">
          <Feather name="file-text" size={48} color={Colors.textMuted} />
          <Text className="text-lg font-semibold text-textPrimary">Пока нет заявок</Text>
          <Text className="text-center text-sm text-textMuted">Создайте первую заявку, чтобы найти налогового специалиста</Text>
          <Pressable className="mt-2 h-11 items-center justify-center rounded-lg bg-brandPrimary px-6">
            <Text className="text-sm font-semibold text-white">Создать заявку</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
