import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Switch,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import HeaderBack from "@/components/HeaderBack";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { apiPatch } from "@/lib/api";

export default function ClientSettings() {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const { user, signOut, updateUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [saving, setSaving] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
    }
  }, [user]);

  const hasChanges =
    firstName !== (user?.firstName || "") || lastName !== (user?.lastName || "");

  const handleSave = useCallback(async () => {
    if (!hasChanges || saving) return;
    setSaving(true);
    try {
      const res = await apiPatch<{ user: { firstName: string; lastName: string } }>(
        "/api/user/profile",
        { firstName: firstName.trim(), lastName: lastName.trim() }
      );
      updateUser({
        firstName: res.user.firstName,
        lastName: res.user.lastName,
      });
      Alert.alert("Готово", "Профиль обновлен");
    } catch (e) {
      console.error("Save profile error:", e);
      Alert.alert("Ошибка", "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }, [hasChanges, saving, firstName, lastName, updateUser]);

  const handleLogout = useCallback(() => {
    Alert.alert("Выйти", "Вы уверены, что хотите выйти?", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Выйти",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/" as never);
        },
      },
    ]);
  }, [signOut, router]);

  const initials = [firstName, lastName]
    .map((n) => n?.charAt(0)?.toUpperCase())
    .filter(Boolean)
    .join("");

  if (!ready) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#1e3a8a" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <HeaderBack title="Настройки" />
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        <ResponsiveContainer>
          <View className="py-6">
            {/* Avatar */}
            <View className="items-center mb-6">
              <View className="w-[72px] h-[72px] rounded-full bg-blue-900 items-center justify-center">
                {user?.avatarUrl ? (
                  <Text className="text-white text-lg font-bold">{initials || "?"}</Text>
                ) : (
                  <Text className="text-white text-lg font-bold">{initials || "?"}</Text>
                )}
              </View>
              <View className="mt-2 bg-slate-100 px-3 py-1 rounded-full">
                <Text className="text-xs font-medium text-slate-900">Клиент</Text>
              </View>
            </View>

            {/* Name inputs */}
            <Text className="text-sm font-medium text-slate-900 mb-1">Имя</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Введите имя"
              style={{
                height: 48,
                borderWidth: 1,
                borderColor: "#e2e8f0",
                borderRadius: 10,
                paddingHorizontal: 16,
                fontSize: 16,
                backgroundColor: "#f9fafb",
                color: "#0f172a",
                marginBottom: 12,
              }}
            />

            <Text className="text-sm font-medium text-slate-900 mb-1">Фамилия</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Введите фамилию"
              style={{
                height: 48,
                borderWidth: 1,
                borderColor: "#e2e8f0",
                borderRadius: 10,
                paddingHorizontal: 16,
                fontSize: 16,
                backgroundColor: "#f9fafb",
                color: "#0f172a",
                marginBottom: 12,
              }}
            />

            <Text className="text-sm font-medium text-slate-900 mb-1">Email</Text>
            <View className="h-12 border border-slate-200 rounded-[10px] bg-slate-100 px-4 justify-center mb-4">
              <Text className="text-base text-slate-400">{user?.email || ""}</Text>
            </View>

            {/* Save button */}
            <Pressable
              onPress={handleSave}
              disabled={!hasChanges || saving}
              className={`rounded-xl py-3 items-center mb-6 ${
                hasChanges && !saving ? "bg-blue-900" : "bg-slate-300"
              }`}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-semibold text-base">Сохранить</Text>
              )}
            </Pressable>

            {/* Notifications */}
            <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Уведомления
            </Text>
            <View className="flex-row items-center justify-between py-3 border-b border-slate-100">
              <Text className="text-base text-slate-900">Push-уведомления</Text>
              <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ false: "#e2e8f0", true: "#1e3a8a" }} thumbColor="#ffffff" />
            </View>
            <View className="flex-row items-center justify-between py-3 border-b border-slate-100 mb-6">
              <Text className="text-base text-slate-900">Email-уведомления</Text>
              <Switch value={emailEnabled} onValueChange={setEmailEnabled} trackColor={{ false: "#e2e8f0", true: "#1e3a8a" }} thumbColor="#ffffff" />
            </View>

            {/* Links */}
            <Pressable
              onPress={() => router.push("/legal/terms" as never)}
              className="flex-row items-center py-3 border-b border-slate-100"
            >
              <FontAwesome name="file-text-o" size={16} color="#94a3b8" />
              <Text className="text-base text-slate-900 ml-3 flex-1">
                Условия использования
              </Text>
              <FontAwesome name="chevron-right" size={12} color="#cbd5e1" />
            </Pressable>

            {/* Logout */}
            <Pressable
              onPress={handleLogout}
              className="mt-6 bg-red-600 rounded-xl py-3 items-center"
            >
              <Text className="text-white font-semibold text-base">Выйти</Text>
            </Pressable>

            {/* Version */}
            <Text className="text-xs text-slate-400 text-center mt-6">
              Версия 1.0.0
            </Text>
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
