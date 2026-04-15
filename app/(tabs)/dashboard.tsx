import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Доброй ночи";
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Добрый вечер";
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View className="flex-1 items-center gap-1 rounded-xl border border-borderLight bg-white p-3">
      <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: color + "15" }}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text className="text-lg font-bold" style={{ color }}>{value}</Text>
      <Text className="text-xs text-textMuted">{label}</Text>
    </View>
  );
}

function RequestCard({ title, service, fns, city, date, messageCount, status, statusColor }: {
  title: string; service: string; fns: string; city: string; date: string;
  messageCount: number; status: string; statusColor: string;
}) {
  return (
    <Pressable className="gap-2 rounded-xl border border-borderLight bg-white p-4">
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 text-base font-semibold text-textPrimary" numberOfLines={2}>{title}</Text>
        <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: statusColor + "18" }}>
          <Text className="text-xs font-semibold" style={{ color: statusColor }}>{status}</Text>
        </View>
      </View>
      <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
        <View className="flex-row items-center gap-1">
          <Feather name="briefcase" size={12} color={Colors.textMuted} />
          <Text className="text-xs text-textMuted">{service}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Feather name="home" size={12} color={Colors.textMuted} />
          <Text className="text-xs text-textMuted">{fns}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Feather name="map-pin" size={12} color={Colors.textMuted} />
          <Text className="text-xs text-textMuted">{city}</Text>
        </View>
      </View>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1">
          <Feather name="calendar" size={12} color={Colors.textMuted} />
          <Text className="text-xs text-textMuted">{date}</Text>
        </View>
        {messageCount > 0 && (
          <View className="flex-row items-center gap-1">
            <Feather name="message-circle" size={12} color={Colors.brandPrimary} />
            <Text className="text-xs font-medium text-brandPrimary">{messageCount} сообщ.</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function MessagePreview({ initials, name, snippet, time, unread }: {
  initials: string; name: string; snippet: string; time: string; unread?: boolean;
}) {
  return (
    <Pressable className="flex-row items-center gap-3 rounded-xl border border-borderLight bg-white p-3">
      <View className="h-10 w-10 items-center justify-center rounded-full border border-borderLight bg-bgSurface">
        <Text className="text-sm font-bold text-brandPrimary">{initials}</Text>
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text className={`text-sm ${unread ? "font-bold text-textPrimary" : "font-medium text-textPrimary"}`}>{name}</Text>
          <Text className="text-xs text-textMuted">{time}</Text>
        </View>
        <Text className={`text-xs ${unread ? "font-medium text-textSecondary" : "text-textMuted"}`} numberOfLines={1}>{snippet}</Text>
      </View>
      {unread && (
        <View className="h-2.5 w-2.5 rounded-full bg-brandPrimary" />
      )}
    </Pressable>
  );
}

function QuickActions() {
  return (
    <View className="flex-row gap-2">
      <Pressable className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-brandPrimary">
        <Feather name="plus" size={16} color={Colors.white} />
        <Text className="text-sm font-semibold text-white">Новая заявка</Text>
      </Pressable>
      <Pressable className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-borderLight bg-white">
        <Feather name="list" size={16} color={Colors.brandPrimary} />
        <Text className="text-sm font-medium text-brandPrimary">Мои заявки</Text>
      </Pressable>
      <Pressable className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-borderLight bg-white">
        <Feather name="message-circle" size={16} color={Colors.brandPrimary} />
        <Text className="text-sm font-medium text-brandPrimary">Сообщения</Text>
      </Pressable>
    </View>
  );
}

export default function DashboardScreen() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-xl font-bold text-textPrimary">{getGreeting()}, Елена!</Text>
          <Text className="text-sm text-textMuted">Ваши заявки и сообщения</Text>
        </View>
        <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-bgSurface">
          <Feather name="bell" size={20} color={Colors.textPrimary} />
        </Pressable>
      </View>

      <View className="flex-row gap-2">
        <StatCard icon="file-text" label="Активные" value="3" color={Colors.brandPrimary} />
        <StatCard icon="message-circle" label="Сообщения" value="5" color={Colors.statusSuccess} />
        <StatCard icon="check-circle" label="Завершены" value="12" color={Colors.textMuted} />
      </View>

      <QuickActions />

      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-textPrimary">Активные заявки</Text>
          <Pressable><Text className="text-sm font-medium text-brandPrimary">Все заявки</Text></Pressable>
        </View>
        <RequestCard title="Камеральная проверка декларации по НДС" service="Камеральная проверка" fns="ФНС №46 по г. Москве" city="Москва" date="08.04.2026" messageCount={2} status="Новая" statusColor={Colors.brandPrimary} />
        <RequestCard title="Отдел оперативного контроля — требование" service="Отдел оперативного контроля" fns="ФНС №12 по г. Новосибирску" city="Новосибирск" date="07.04.2026" messageCount={4} status="В работе" statusColor={Colors.statusWarning} />
        <RequestCard title="Выездная проверка ООО «Ромашка»" service="Выездная проверка" fns="ФНС №15 по г. Москве" city="Москва" date="05.04.2026" messageCount={0} status="Новая" statusColor={Colors.brandPrimary} />
      </View>

      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-textPrimary">Новые сообщения</Text>
          <Pressable><Text className="text-sm font-medium text-brandPrimary">Все сообщения</Text></Pressable>
        </View>
        <MessagePreview initials="АП" name="Алексей Петров" snippet="Здравствуйте! Готов помочь с камеральной проверкой. Опыт 8 лет." time="14:32" unread />
        <MessagePreview initials="ОС" name="Ольга Смирнова" snippet="Специализируюсь на сопровождении проверок. Помогу подготовиться." time="12:15" unread />
        <MessagePreview initials="ИК" name="Игорь Козлов" snippet="Добрый день! По вашей заявке на оперативный контроль..." time="вчера" />
      </View>
    </ScrollView>
  );
}
