import { View, Text, Pressable, ScrollView, Switch, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft, ChevronRight, Bell, Mail, MessageCircle, List,
  Globe, Moon, AtSign, Trash2, FileText, Info, Palette, type LucideIcon
} from "lucide-react-native";
import { useState } from "react";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { colors } from "@/lib/theme";
import ResponsiveContainer from "@/components/ResponsiveContainer";

function SettingRow({
  icon: Icon,
  label,
  rightElement,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="flex-row items-center py-4 border-b border-slate-50 active:bg-slate-50"
    >
      <View className="w-9 h-9 rounded-lg bg-slate-50 items-center justify-center">
        <Icon size={16} color={colors.text} />
      </View>
      <Text className="flex-1 ml-3 text-base text-slate-900">{label}</Text>
      {rightElement || <ChevronRight size={12} color={colors.borderLight} />}
    </Pressable>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wide pt-6 pb-2">
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
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        <ResponsiveContainer>
        {/* Header */}
        <View className="flex-row items-center pt-2 pb-3 border-b border-slate-50">
          <Pressable accessibilityRole="button" accessibilityLabel="Назад" onPress={() => router.back()} className="w-11 h-11 items-center justify-center -ml-2 mr-1">
            <ArrowLeft size={18} color={colors.text} />
          </Pressable>
          <Text className="text-2xl font-bold text-slate-900">Настройки</Text>
        </View>

        <SectionTitle title="Уведомления" />
        <SettingRow
          icon={Bell}
          label="Push-уведомления"
          rightElement={
            <Switch accessibilityLabel="Push-уведомления" value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.surface} />
          }
        />
        <SettingRow
          icon={Mail}
          label="Email-уведомления"
          rightElement={
            <Switch accessibilityLabel="Email-уведомления" value={emailEnabled} onValueChange={setEmailEnabled} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.surface} />
          }
        />
        <SettingRow
          icon={MessageCircle}
          label="Уведомления о сообщениях"
          rightElement={
            <Switch accessibilityLabel="Уведомления о сообщениях" value={messageEnabled} onValueChange={setMessageEnabled} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.surface} />
          }
        />
        <SettingRow
          icon={List}
          label="Все уведомления"
          onPress={() => router.push("/notifications" as never)}
        />

        <SectionTitle title="Настройки" />
        <SettingRow icon={Globe} label="Язык" />
        <SettingRow icon={Moon} label="Тема" />

        <SectionTitle title="Аккаунт" />
        <SettingRow icon={AtSign} label="Сменить email" />
        <SettingRow icon={Trash2} label="Удалить аккаунт" />

        <SectionTitle title="О приложении" />
        <SettingRow
          icon={FileText}
          label="Политика конфиденциальности"
          onPress={() => router.push("/legal/privacy" as never)}
        />
        <SettingRow
          icon={FileText}
          label="Условия использования"
          onPress={() => router.push("/legal/terms" as never)}
        />
        <SettingRow icon={Info} label="Версия" rightElement={
          <Text className="text-sm text-slate-400">1.0.0</Text>
        } />

        {__DEV__ && (
          <>
            <SectionTitle title="Разработка" />
            <SettingRow
              icon={Palette}
              label="Design System"
              onPress={() => router.push("/brand" as never)}
            />
          </>
        )}
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
