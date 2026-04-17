import { View, Text, Pressable, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useState } from "react";

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
      className="flex-row items-center px-4 py-4 border-b border-gray-50 active:bg-gray-50"
    >
      <View className="w-9 h-9 rounded-lg bg-gray-100 items-center justify-center">
        <FontAwesome name={icon} size={16} color="#6b7280" />
      </View>
      <Text className="flex-1 ml-3 text-base text-gray-900">{label}</Text>
      {rightElement || <FontAwesome name="chevron-right" size={12} color="#d1d5db" />}
    </Pressable>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 pt-6 pb-2">
      {title}
    </Text>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [messageEnabled, setMessageEnabled] = useState(true);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        {/* Header */}
        <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-gray-100">
          <Pressable onPress={() => router.back()} className="mr-3">
            <FontAwesome name="arrow-left" size={18} color="#374151" />
          </Pressable>
          <Text className="text-2xl font-bold text-gray-900">Settings</Text>
        </View>

        <SectionTitle title="Notifications" />
        <SettingRow
          icon="bell"
          label="Push Notifications"
          rightElement={
            <Switch value={pushEnabled} onValueChange={setPushEnabled} />
          }
        />
        <SettingRow
          icon="envelope"
          label="Email Notifications"
          rightElement={
            <Switch value={emailEnabled} onValueChange={setEmailEnabled} />
          }
        />
        <SettingRow
          icon="comments"
          label="Message Notifications"
          rightElement={
            <Switch value={messageEnabled} onValueChange={setMessageEnabled} />
          }
        />

        <SectionTitle title="Preferences" />
        <SettingRow icon="language" label="Language" />
        <SettingRow icon="moon-o" label="Theme" />

        <SectionTitle title="Account" />
        <SettingRow icon="envelope-o" label="Change Email" />
        <SettingRow icon="trash-o" label="Delete Account" />

        <SectionTitle title="About" />
        <SettingRow
          icon="file-text-o"
          label="Privacy Policy"
          onPress={() => router.push("/legal/privacy" as never)}
        />
        <SettingRow
          icon="file-text-o"
          label="Terms of Service"
          onPress={() => router.push("/legal/terms" as never)}
        />
        <SettingRow icon="info-circle" label="App Version" rightElement={
          <Text className="text-sm text-gray-400">1.0.0</Text>
        } />
      </ScrollView>
    </SafeAreaView>
  );
}
