import { View, Text, Pressable, ScrollView, Switch, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useState } from "react";
import { useRequireAuth } from "@/lib/useRequireAuth";

function SettingRow({
  icon,
  label,
  rightElement,
  onPress,
}: {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  label: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-4 border-b border-slate-50 active:bg-slate-50"
    >
      <View className="w-9 h-9 rounded-lg bg-slate-50 items-center justify-center">
        <FontAwesome name={icon} size={16} color="#0f172a" />
      </View>
      <Text className="flex-1 ml-3 text-base text-slate-900">{label}</Text>
      {rightElement || <FontAwesome name="chevron-right" size={12} color="#cbd5e1" />}
    </Pressable>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 pt-6 pb-2">
      {title}
    </Text>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [messageEnabled, setMessageEnabled] = useState(true);

  if (!ready) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#1e3a8a" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        {/* Header */}
        <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-slate-50">
          <Pressable onPress={() => router.back()} className="w-11 h-11 items-center justify-center -ml-2 mr-1">
            <FontAwesome name="arrow-left" size={18} color="#0f172a" />
          </Pressable>
          <Text className="text-2xl font-bold text-slate-900">Настройки</Text>
        </View>

        <SectionTitle title="Уведомления" />
        <SettingRow
          icon="bell"
          label="Push-уведомления"
          rightElement={
            <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ false: "#e2e8f0", true: "#1e3a8a" }} thumbColor="#ffffff" />
          }
        />
        <SettingRow
          icon="envelope"
          label="Email-уведомления"
          rightElement={
            <Switch value={emailEnabled} onValueChange={setEmailEnabled} trackColor={{ false: "#e2e8f0", true: "#1e3a8a" }} thumbColor="#ffffff" />
          }
        />
        <SettingRow
          icon="comments"
          label="Уведомления о сообщениях"
          rightElement={
            <Switch value={messageEnabled} onValueChange={setMessageEnabled} trackColor={{ false: "#e2e8f0", true: "#1e3a8a" }} thumbColor="#ffffff" />
          }
        />

        <SectionTitle title="Настройки" />
        <SettingRow icon="language" label="Язык" />
        <SettingRow icon="moon-o" label="Тема" />

        <SectionTitle title="Аккаунт" />
        <SettingRow icon="envelope-o" label="Сменить email" />
        <SettingRow icon="trash-o" label="Удалить аккаунт" />

        <SectionTitle title="О приложении" />
        <SettingRow
          icon="file-text-o"
          label="Политика конфиденциальности"
          onPress={() => router.push("/legal/privacy" as never)}
        />
        <SettingRow
          icon="file-text-o"
          label="Условия использования"
          onPress={() => router.push("/legal/terms" as never)}
        />
        <SettingRow icon="info-circle" label="Версия" rightElement={
          <Text className="text-sm text-slate-400">1.0.0</Text>
        } />
      </ScrollView>
    </SafeAreaView>
  );
}
