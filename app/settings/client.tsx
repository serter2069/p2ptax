import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Switch,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Pencil, FileText, ChevronRight, LogOut, Trash2, Bell } from "lucide-react-native";
import HeaderBack from "@/components/HeaderBack";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { API_URL, apiPatch } from "@/lib/api";
import LoadingState from "@/components/ui/LoadingState";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "@/lib/theme";

interface NotificationSetting {
  key: string;
  label: string;
  description: string;
}


const NOTIFICATION_SETTINGS: NotificationSetting[] = [
  {
    key: "newMessages",
    label: "Новые сообщения",
    description: "Получать уведомления о новых сообщениях от специалистов по email",
  },
  {
    key: "closingWarnings",
    label: "Предупреждения о закрытии",
    description: "Предупреждать, когда заявка скоро закроется",
  },
];

export default function ClientSettings() {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const { user, signOut, updateUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [saving, setSaving] = useState(false);
  const [newMessages, setNewMessages] = useState(true);
  const [closingWarnings, setClosingWarnings] = useState(true);

  const notificationValues: Record<string, boolean> = { newMessages, closingWarnings };
  const notificationSetters: Record<string, (v: boolean) => void> = {
    newMessages: setNewMessages,
    closingWarnings: setClosingWarnings,
  };

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
      <SafeAreaView className="flex-1 bg-surface2">
        <HeaderBack title="Настройки" />
        <LoadingState variant="skeleton" lines={5} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface2">
      <HeaderBack title="Настройки" />
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        <ResponsiveContainer>
          <View className="py-6">

            {/* Avatar */}
            <View className="items-center mb-6">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Фото профиля"
                onPress={handleAvatarPress}
                className="items-center"
                style={({ pressed }) => [pressed && { opacity: 0.7 }]}
              >
                {avatarUploading ? (
                  <View
                    className="rounded-full bg-surface2 items-center justify-center"
                    style={{ width: 80, height: 80 }}
                  >
                    <ActivityIndicator color={colors.primary} />
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
                        borderColor: colors.border,
                      }}
                    />
                    <View
                      className="absolute bottom-0 right-0 bg-accent rounded-full items-center justify-center"
                      style={{ width: 24, height: 24 }}
                    >
                      <Pencil size={12} color={colors.surface} />
                    </View>
                  </View>
                ) : (
                  <View
                    className="rounded-full bg-accent items-center justify-center"
                    style={{ width: 80, height: 80 }}
                  >
                    <Text className="text-white text-2xl font-bold">
                      {initials || "?"}
                    </Text>
                  </View>
                )}
                <Text className="text-xs text-text-mute mt-2">
                  {avatarUrl ? "Изменить фото" : "Нажмите, чтобы изменить"}
                </Text>
              </Pressable>
              <View className="mt-2 bg-surface2 px-3 py-1 rounded-full">
                <Text className="text-xs font-medium text-text-base">Клиент</Text>
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
            <View className="mb-3">
              <Input
                label="Имя"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Введите имя"
              />
            </View>

            <View className="mb-3">
              <Input
                label="Фамилия"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Введите фамилию"
              />
            </View>

            {/* Email (read-only) */}
            <Text className="text-sm font-medium text-text-base mb-1">
              Email{" "}
              <Text className="text-text-mute font-normal">(нельзя изменить)</Text>
            </Text>
            <View className="h-12 border border-border rounded-xl bg-surface2 px-4 justify-center mb-6">
              <Text className="text-base text-text-mute">{user?.email || ""}</Text>
            </View>

            {/* Save button */}
            <View className="mb-8">
              <Button
                label="Сохранить"
                onPress={handleSave}
                disabled={!hasChanges || saving}
                loading={saving}
              />
            </View>

            {/* Notifications section */}
            <Text className="text-xs font-semibold text-text-mute uppercase tracking-wide mb-3">
              Уведомления
            </Text>

            <View className="bg-white border border-border rounded-2xl mb-6 overflow-hidden">
              {NOTIFICATION_SETTINGS.length === 0 ? (
                <EmptyState icon={Bell} title="Нет настроек уведомлений" subtitle="Настройки уведомлений недоступны" />
              ) : (
                NOTIFICATION_SETTINGS.map((setting, index) => (
                  <View
                    key={setting.key}
                    className={`flex-row items-center min-h-[50px] px-4 py-3${index < NOTIFICATION_SETTINGS.length - 1 ? " border-b border-border" : ""}`}
                  >
                    <View className="flex-1 mr-3">
                      <Text className="text-base text-text-base">{setting.label}</Text>
                      <Text className="text-xs text-text-mute mt-0.5">{setting.description}</Text>
                    </View>
                    <Switch
                      accessibilityLabel={setting.label}
                      value={notificationValues[setting.key] ?? false}
                      onValueChange={notificationSetters[setting.key]}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor={colors.surface}
                    />
                  </View>
                ))
              )}
            </View>

            {/* Legal section */}
            <Text className="text-xs font-semibold text-text-mute uppercase tracking-wide mb-3">
              Правовая информация
            </Text>

            <View className="bg-white border border-border rounded-2xl mb-8 overflow-hidden">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Условия использования"
                onPress={() => router.push("/legal/terms" as never)}
                className="flex-row items-center min-h-[50px] px-4 py-3"
                style={({ pressed }) => [pressed && { opacity: 0.7 }]}
              >
                <FileText size={16} color={colors.placeholder} />
                <Text className="text-base text-text-base ml-3 flex-1">
                  Условия использования
                </Text>
                <ChevronRight size={12} color={colors.borderLight} />
              </Pressable>
            </View>

            {/* Account / Danger zone */}
            <Text className="text-xs font-semibold text-text-mute uppercase tracking-wide mb-3">
              Аккаунт
            </Text>

            <View className="bg-white border border-border rounded-2xl mb-8 overflow-hidden">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Выйти из аккаунта"
                onPress={handleLogout}
                className="flex-row items-center min-h-[50px] px-4 py-3 border-b border-border"
                style={({ pressed }) => [pressed && { opacity: 0.7 }]}
              >
                <LogOut size={16} color={colors.error} />
                <Text className="text-base text-danger ml-3 flex-1">
                  Выйти из аккаунта
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Удалить аккаунт"
                onPress={handleDeleteAccount}
                className="flex-row items-center min-h-[50px] px-4 py-3"
                style={({ pressed }) => [pressed && { opacity: 0.7 }]}
              >
                <Trash2 size={16} color={colors.error} />
                <Text className="text-base text-danger ml-3 flex-1">
                  Удалить аккаунт
                </Text>
              </Pressable>
            </View>

            {/* App version */}
            <Text className="text-xs text-text-mute text-center mb-4">
              Версия 1.0.0
            </Text>

          </View>
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
