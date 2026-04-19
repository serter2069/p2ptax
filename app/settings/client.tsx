import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Switch,
  TextInput,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import HeaderBack from "@/components/HeaderBack";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { API_URL, apiPatch } from "@/lib/api";
import LoadingState from "@/components/ui/LoadingState";
import AsyncStorage from "@react-native-async-storage/async-storage";


export default function ClientSettings() {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const { user, signOut, updateUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [saving, setSaving] = useState(false);
  const [newMessages, setNewMessages] = useState(true);
  const [closingWarnings, setClosingWarnings] = useState(true);

  // Avatar upload state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl || null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setAvatarUrl(user.avatarUrl || null);
    }
  }, [user]);

  const hasChanges =
    firstName !== (user?.firstName || "") ||
    lastName !== (user?.lastName || "") ||
    avatarUrl !== (user?.avatarUrl || null);

  const initials = [firstName || user?.firstName, lastName || user?.lastName]
    .map((n) => n?.charAt(0)?.toUpperCase())
    .filter(Boolean)
    .join("");

  // Avatar upload
  const uploadAvatar = async (file: File) => {
    setAvatarUploading(true);
    try {
      const token = await AsyncStorage.getItem("p2ptax_access_token");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/api/upload/avatar`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Не удалось загрузить фото");
      }

      const data = (await res.json()) as { url: string };
      const fullUrl = data.url.startsWith("http") ? data.url : `${API_URL}${data.url}`;
      setAvatarUrl(fullUrl);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка загрузки фото";
      Alert.alert("Ошибка", msg);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarPress = () => {
    if (Platform.OS === "web" && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void uploadAvatar(file);
      e.target.value = "";
    }
  };

  const handleSave = useCallback(async () => {
    if (!hasChanges || saving) return;
    setSaving(true);
    try {
      const body: Record<string, string | null> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      };
      if (avatarUrl !== (user?.avatarUrl || null)) {
        body.avatarUrl = avatarUrl;
      }
      const res = await apiPatch<{
        user: { firstName: string; lastName: string; avatarUrl?: string | null };
      }>("/api/user/profile", body);
      updateUser({
        firstName: res.user.firstName,
        lastName: res.user.lastName,
        avatarUrl: res.user.avatarUrl,
      });
      Alert.alert("Готово", "Изменения сохранены");
    } catch (e) {
      console.error("Save profile error:", e);
      Alert.alert(
        "Ошибка сохранения",
        "Не удалось сохранить изменения. Попробуйте ещё раз."
      );
    } finally {
      setSaving(false);
    }
  }, [hasChanges, saving, firstName, lastName, avatarUrl, user?.avatarUrl, updateUser]);

  const handleLogout = useCallback(() => {
    Alert.alert("Выйти из аккаунта", "Вы уверены, что хотите выйти?", [
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

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "Удалить аккаунт",
      "Это действие необратимо. Все ваши данные будут удалены.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Запрос отправлен",
              "Ваш запрос на удаление аккаунта принят. Мы свяжемся с вами по email."
            );
          },
        },
      ]
    );
  }, []);

  if (!ready) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <HeaderBack title="Настройки" />
        <LoadingState variant="skeleton" lines={5} />
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
              <Pressable
                accessibilityLabel="Фото профиля"
                onPress={handleAvatarPress}
                className="items-center"
              >
                {avatarUploading ? (
                  <View
                    className="rounded-full bg-slate-100 items-center justify-center"
                    style={{ width: 80, height: 80 }}
                  >
                    <ActivityIndicator color="#1e3a8a" />
                  </View>
                ) : avatarUrl ? (
                  <View>
                    <Image
                      source={{ uri: avatarUrl }}
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        borderWidth: 2,
                        borderColor: "#e2e8f0",
                      }}
                    />
                    <View
                      className="absolute bottom-0 right-0 bg-blue-900 rounded-full items-center justify-center"
                      style={{ width: 24, height: 24 }}
                    >
                      <FontAwesome name="pencil" size={12} color="#fff" />
                    </View>
                  </View>
                ) : (
                  <View
                    className="rounded-full bg-blue-900 items-center justify-center"
                    style={{ width: 80, height: 80 }}
                  >
                    <Text className="text-white text-2xl font-bold">
                      {initials || "?"}
                    </Text>
                  </View>
                )}
                <Text className="text-xs text-slate-400 mt-2">
                  {avatarUrl ? "Изменить фото" : "Нажмите, чтобы изменить"}
                </Text>
              </Pressable>
              <View className="mt-2 bg-slate-100 px-3 py-1 rounded-full">
                <Text className="text-xs font-medium text-slate-900">Клиент</Text>
              </View>
            </View>

            {/* Hidden file input (web only) */}
            {Platform.OS === "web" && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            )}

            {/* Name fields */}
            <Text className="text-sm font-medium text-slate-900 mb-1">Имя</Text>
            <TextInput
              accessibilityLabel="Имя"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Введите имя"
              style={{
                height: 48,
                borderWidth: 1,
                borderColor: "#e2e8f0",
                borderRadius: 12,
                paddingHorizontal: 16,
                fontSize: 16,
                backgroundColor: "#f8fafc",
                color: "#0f172a",
                marginBottom: 12,
              }}
            />

            <Text className="text-sm font-medium text-slate-900 mb-1">Фамилия</Text>
            <TextInput
              accessibilityLabel="Фамилия"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Введите фамилию"
              style={{
                height: 48,
                borderWidth: 1,
                borderColor: "#e2e8f0",
                borderRadius: 12,
                paddingHorizontal: 16,
                fontSize: 16,
                backgroundColor: "#f8fafc",
                color: "#0f172a",
                marginBottom: 12,
              }}
            />

            {/* Email (read-only) */}
            <Text className="text-sm font-medium text-slate-900 mb-1">
              Email{" "}
              <Text className="text-slate-400 font-normal">(нельзя изменить)</Text>
            </Text>
            <View className="h-12 border border-slate-200 rounded-xl bg-slate-100 px-4 justify-center mb-6">
              <Text className="text-base text-slate-400">{user?.email || ""}</Text>
            </View>

            {/* Save button */}
            <Pressable
              accessibilityLabel="Сохранить"
              onPress={handleSave}
              disabled={!hasChanges || saving}
              className={`rounded-xl py-3 items-center mb-8 ${
                hasChanges && !saving ? "bg-blue-900" : "bg-slate-300"
              }`}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-semibold text-base">Сохранить</Text>
              )}
            </Pressable>

            {/* Notifications section */}
            <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Уведомления
            </Text>

            <View className="bg-white border border-slate-100 rounded-xl mb-6 overflow-hidden">
              <View className="flex-row items-center px-4 py-3 border-b border-slate-100">
                <View className="flex-1 mr-3">
                  <Text className="text-base text-slate-900">Новые сообщения</Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    Получать уведомления о новых сообщениях от специалистов по email
                  </Text>
                </View>
                <Switch
                  accessibilityLabel="Новые сообщения"
                  value={newMessages}
                  onValueChange={setNewMessages}
                  trackColor={{ false: "#e2e8f0", true: "#1e3a8a" }}
                  thumbColor="#ffffff"
                />
              </View>
              <View className="flex-row items-center px-4 py-3">
                <View className="flex-1 mr-3">
                  <Text className="text-base text-slate-900">
                    Предупреждения о закрытии
                  </Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    Предупреждать, когда заявка скоро закроется
                  </Text>
                </View>
                <Switch
                  accessibilityLabel="Предупреждения о закрытии"
                  value={closingWarnings}
                  onValueChange={setClosingWarnings}
                  trackColor={{ false: "#e2e8f0", true: "#1e3a8a" }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>

            {/* Legal section */}
            <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Правовая информация
            </Text>

            <View className="bg-white border border-slate-100 rounded-xl mb-8 overflow-hidden">
              <Pressable
                accessibilityLabel="Условия использования"
                onPress={() => router.push("/legal/terms" as never)}
                className="flex-row items-center px-4 py-3"
              >
                <FontAwesome name="file-text-o" size={16} color="#94a3b8" />
                <Text className="text-base text-slate-900 ml-3 flex-1">
                  Условия использования
                </Text>
                <FontAwesome name="chevron-right" size={12} color="#cbd5e1" />
              </Pressable>
            </View>

            {/* Account / Danger zone */}
            <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Аккаунт
            </Text>

            <View className="bg-white border border-slate-100 rounded-xl mb-8 overflow-hidden">
              <Pressable
                accessibilityLabel="Выйти из аккаунта"
                onPress={handleLogout}
                className="flex-row items-center px-4 py-3 border-b border-slate-100"
              >
                <FontAwesome name="sign-out" size={16} color="#dc2626" />
                <Text className="text-base text-red-600 ml-3 flex-1">
                  Выйти из аккаунта
                </Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Удалить аккаунт"
                onPress={handleDeleteAccount}
                className="flex-row items-center px-4 py-3"
              >
                <FontAwesome name="trash-o" size={16} color="#dc2626" />
                <Text className="text-base text-red-600 ml-3 flex-1">
                  Удалить аккаунт
                </Text>
              </Pressable>
            </View>

            {/* App version */}
            <Text className="text-xs text-slate-400 text-center mb-4">
              Версия 1.0.0
            </Text>

          </View>
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
