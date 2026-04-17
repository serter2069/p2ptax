import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
  Alert,
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
import { apiGet, apiPatch } from "@/lib/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3812";

interface FnsServiceItem {
  fns: { id: string; name: string; code: string };
  city: { id: string; name: string };
  services: { id: string; name: string }[];
}

interface SpecialistProfileData {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  isAvailable: boolean;
  profile: {
    description: string | null;
    phone: string | null;
    telegram: string | null;
    whatsapp: string | null;
    officeAddress: string | null;
    workingHours: string | null;
  } | null;
  fnsServices: FnsServiceItem[];
}

const INPUT_STYLE = {
  height: 48,
  borderWidth: 1,
  borderColor: "#e2e8f0",
  borderRadius: 12,
  paddingHorizontal: 16,
  fontSize: 16,
  color: "#0f172a",
  backgroundColor: "#f8fafc",
  marginBottom: 12,
} as const;

export default function SpecialistSettings() {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const { user, updateUser, signOut } = useAuth();
  const [data, setData] = useState<SpecialistProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  // Avatar upload state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [isAvailable, setIsAvailable] = useState(false);

  // Notification toggles (local state)
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const profile = await apiGet<SpecialistProfileData>(
        "/api/specialist/profile"
      );
      setData(profile);
      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
      setAvatarUrl(profile.avatarUrl || null);
      setIsAvailable(profile.isAvailable);
      if (profile.profile) {
        setDescription(profile.profile.description || "");
        setPhone(profile.profile.phone || "");
        setTelegram(profile.profile.telegram || "");
        setWhatsapp(profile.profile.whatsapp || "");
        setOfficeAddress(profile.profile.officeAddress || "");
        setWorkingHours(profile.profile.workingHours || "");
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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
        const errData = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errData.error || "Не удалось загрузить фото");
      }

      const resData = (await res.json()) as { url: string };
      const fullUrl = resData.url.startsWith("http")
        ? resData.url
        : `${API_URL}${resData.url}`;
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

  // Instant availability toggle
  const handleToggleAvailable = async (value: boolean) => {
    if (availabilityLoading) return;
    setIsAvailable(value);
    setAvailabilityLoading(true);
    try {
      await apiPatch("/api/specialist/profile", { isAvailable: value });
      updateUser({ isAvailable: value });
    } catch {
      setIsAvailable(!value); // revert on error
      Alert.alert("Ошибка", "Не удалось изменить статус");
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() || firstName.trim().length < 2) {
      Alert.alert("Ошибка", "Имя должно быть от 2 до 50 символов");
      return;
    }
    if (!lastName.trim() || lastName.trim().length < 2) {
      Alert.alert("Ошибка", "Фамилия должна быть от 2 до 50 символов");
      return;
    }

    setSaving(true);
    try {
      await apiPatch("/api/specialist/profile", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        avatarUrl: avatarUrl || null,
        description: description.trim() || null,
        phone: phone.trim() || null,
        telegram: telegram.trim() || null,
        whatsapp: whatsapp.trim() || null,
        officeAddress: officeAddress.trim() || null,
        workingHours: workingHours.trim() || null,
      });
      updateUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        avatarUrl: avatarUrl || null,
      });
      Alert.alert("Сохранено", "Профиль обновлён");
    } catch {
      Alert.alert("Ошибка", "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
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
  };

  const initials = [firstName, lastName]
    .map((n) => n?.charAt(0)?.toUpperCase())
    .filter(Boolean)
    .join("");

  if (!ready || loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <HeaderBack title="Настройки специалиста" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1e3a8a" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <HeaderBack title="Настройки специалиста" />
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        <ResponsiveContainer>
          <View className="py-6">

            {/* Avatar */}
            <View className="items-center mb-4">
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
                  {avatarUrl ? "Изменить фото" : "Нажмите, чтобы добавить фото"}
                </Text>
              </Pressable>
              <View className="mt-2 bg-blue-50 px-3 py-1 rounded-full">
                <Text className="text-xs font-medium text-blue-900">Специалист</Text>
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

            {/* Availability toggle — top position */}
            <View className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-6 flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-base font-semibold text-slate-900">
                  Принимаю заявки
                </Text>
                <Text className="text-xs text-slate-500 mt-0.5">
                  {isAvailable
                    ? "Вы видны клиентам и получаете заявки"
                    : "Вы скрыты от клиентов"}
                </Text>
              </View>
              {availabilityLoading ? (
                <ActivityIndicator size="small" color="#1e3a8a" />
              ) : (
                <Switch
                  accessibilityLabel="Принимаю заявки"
                  value={isAvailable}
                  onValueChange={handleToggleAvailable}
                  trackColor={{ false: "#e2e8f0", true: "#1e3a8a" }}
                  thumbColor="#ffffff"
                />
              )}
            </View>

            {/* Name fields */}
            <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Личные данные
            </Text>

            <Text className="text-sm font-medium text-slate-900 mb-1">Имя</Text>
            <TextInput
              accessibilityLabel="Имя"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Введите имя"
              placeholderTextColor="#94a3b8"
              maxLength={50}
              style={INPUT_STYLE}
            />

            <Text className="text-sm font-medium text-slate-900 mb-1">Фамилия</Text>
            <TextInput
              accessibilityLabel="Фамилия"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Введите фамилию"
              placeholderTextColor="#94a3b8"
              maxLength={50}
              style={INPUT_STYLE}
            />

            {/* Email read-only */}
            <Text className="text-sm font-medium text-slate-900 mb-1">
              Email{" "}
              <Text className="text-slate-400 font-normal">(нельзя изменить)</Text>
            </Text>
            <View className="h-12 border border-slate-200 rounded-xl bg-slate-100 px-4 justify-center mb-4">
              <Text className="text-base text-slate-400">
                {data?.email || user?.email || ""}
              </Text>
            </View>

            {/* Description */}
            <Text className="text-sm font-medium text-slate-900 mb-1">
              О себе
            </Text>
            <TextInput
              accessibilityLabel="О себе"
              value={description}
              onChangeText={setDescription}
              placeholder="Расскажите о своём опыте и специализации..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
              maxLength={500}
              style={{
                borderWidth: 1,
                borderColor: "#e2e8f0",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                color: "#0f172a",
                backgroundColor: "#f8fafc",
                marginBottom: 4,
                minHeight: 96,
                textAlignVertical: "top",
              }}
            />
            <Text className="text-xs text-slate-400 text-right mb-4">
              {description.length}/500
            </Text>

            {/* FNS & Services */}
            <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              ИФНС и услуги
            </Text>

            {data && data.fnsServices.length > 0 ? (
              <>
                {data.fnsServices.map((item) => (
                  <View
                    key={item.fns.id}
                    className="bg-slate-50 rounded-xl p-3 mb-2 border border-slate-200"
                  >
                    <Text className="text-sm font-semibold text-slate-900">
                      {item.city.name} — {item.fns.name}
                    </Text>
                    <Text className="text-xs text-slate-400 mb-1">
                      {item.fns.code}
                    </Text>
                    <View className="flex-row flex-wrap gap-1 mt-1">
                      {item.services.map((s) => (
                        <View
                          key={s.id}
                          className="bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100"
                        >
                          <Text className="text-xs text-blue-900">{s.name}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
                <Pressable
                  accessibilityLabel="Изменить рабочую зону"
                  onPress={() => router.push("/onboarding/work-area" as never)}
                  className="flex-row items-center justify-center py-2 mb-4"
                >
                  <FontAwesome name="pencil" size={12} color="#b45309" />
                  <Text className="text-sm text-amber-700 ml-1 font-medium">
                    Изменить рабочую зону
                  </Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                accessibilityLabel="Добавить рабочую зону"
                onPress={() => router.push("/onboarding/work-area" as never)}
                className="flex-row items-center justify-center py-3 border border-dashed border-slate-300 rounded-xl mb-4"
              >
                <FontAwesome name="plus" size={14} color="#b45309" />
                <Text className="text-sm text-amber-700 ml-2 font-medium">
                  Добавить ИФНС и услуги
                </Text>
              </Pressable>
            )}

            {/* Contacts */}
            <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Контакты
            </Text>

            <Text className="text-sm font-medium text-slate-900 mb-1">
              Телефон
            </Text>
            <TextInput
              accessibilityLabel="Телефон"
              value={phone}
              onChangeText={setPhone}
              placeholder="+7 (___) ___-__-__"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              style={INPUT_STYLE}
            />

            <Text className="text-sm font-medium text-slate-900 mb-1">
              Telegram
            </Text>
            <TextInput
              accessibilityLabel="Telegram"
              value={telegram}
              onChangeText={setTelegram}
              placeholder="@username"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              style={INPUT_STYLE}
            />

            <Text className="text-sm font-medium text-slate-900 mb-1">
              WhatsApp
            </Text>
            <TextInput
              accessibilityLabel="WhatsApp"
              value={whatsapp}
              onChangeText={setWhatsapp}
              placeholder="+7 (___) ___-__-__"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              style={INPUT_STYLE}
            />

            {/* Office info */}
            <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 mt-2">
              Офис
            </Text>

            <Text className="text-sm font-medium text-slate-900 mb-1">
              Адрес офиса
            </Text>
            <TextInput
              accessibilityLabel="Адрес офиса"
              value={officeAddress}
              onChangeText={setOfficeAddress}
              placeholder="Город, улица, дом"
              placeholderTextColor="#94a3b8"
              style={INPUT_STYLE}
            />

            <Text className="text-sm font-medium text-slate-900 mb-1">
              Часы работы
            </Text>
            <TextInput
              accessibilityLabel="Часы работы"
              value={workingHours}
              onChangeText={setWorkingHours}
              placeholder="Пн-Пт 9:00-18:00"
              placeholderTextColor="#94a3b8"
              style={INPUT_STYLE}
            />

            {/* Save button */}
            <Pressable
              accessibilityLabel="Сохранить"
              onPress={handleSave}
              disabled={saving}
              className={`rounded-xl py-3 items-center mt-2 mb-4 ${
                saving ? "bg-blue-900 opacity-50" : "bg-blue-900"
              }`}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-base font-semibold">
                  Сохранить
                </Text>
              )}
            </Pressable>

            {/* Notifications */}
            <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Уведомления
            </Text>

            <View className="bg-white border border-slate-100 rounded-xl mb-6 overflow-hidden">
              <View className="flex-row items-center px-4 py-3 border-b border-slate-100">
                <View className="flex-1 mr-3">
                  <Text className="text-base text-slate-900">
                    Push-уведомления
                  </Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    Новые заявки и сообщения
                  </Text>
                </View>
                <Switch
                  accessibilityLabel="Push-уведомления"
                  value={pushEnabled}
                  onValueChange={setPushEnabled}
                  trackColor={{ false: "#e2e8f0", true: "#1e3a8a" }}
                  thumbColor="#ffffff"
                />
              </View>
              <View className="flex-row items-center px-4 py-3">
                <View className="flex-1 mr-3">
                  <Text className="text-base text-slate-900">
                    Email-уведомления
                  </Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    Дублировать уведомления на почту
                  </Text>
                </View>
                <Switch
                  accessibilityLabel="Email-уведомления"
                  value={emailEnabled}
                  onValueChange={setEmailEnabled}
                  trackColor={{ false: "#e2e8f0", true: "#1e3a8a" }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>

            {/* Account */}
            <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Аккаунт
            </Text>

            <View className="bg-white border border-slate-100 rounded-xl mb-8 overflow-hidden">
              <Pressable
                accessibilityLabel="Выйти из аккаунта"
                onPress={handleLogout}
                className="flex-row items-center px-4 py-3"
              >
                <FontAwesome name="sign-out" size={16} color="#dc2626" />
                <Text className="text-base text-red-600 ml-3 flex-1">
                  Выйти из аккаунта
                </Text>
              </Pressable>
            </View>

            <Text className="text-xs text-slate-400 text-center mb-4">
              Версия 1.0.0
            </Text>

          </View>
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
