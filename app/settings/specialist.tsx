import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import HeaderBack from "@/components/HeaderBack";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { apiGet, apiPatch, ApiError } from "@/lib/api";

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

export default function SpecialistSettings() {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const { user, updateUser, signOut } = useAuth();
  const [data, setData] = useState<SpecialistProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [isAvailable, setIsAvailable] = useState(false);

  // Notification toggles (local state, no backend yet)
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
      setIsAvailable(profile.isAvailable);
      if (profile.profile) {
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

  const handleToggleAvailable = async (value: boolean) => {
    setIsAvailable(value);
    try {
      await apiPatch("/api/specialist/profile", { isAvailable: value });
      updateUser({ isAvailable: value });
    } catch {
      setIsAvailable(!value); // Revert on error
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
        phone: phone.trim() || null,
        telegram: telegram.trim() || null,
        whatsapp: whatsapp.trim() || null,
        officeAddress: officeAddress.trim() || null,
        workingHours: workingHours.trim() || null,
      });
      updateUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      Alert.alert("Сохранено", "Профиль обновлён");
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Выход", "Вы уверены, что хотите выйти?", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Выйти",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/auth/email" as never);
        },
      },
    ]);
  };

  if (!ready || loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <HeaderBack title="Настройки" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1e3a8a" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <HeaderBack title="Настройки" />
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        <ResponsiveContainer>
          {/* Avatar */}
          <View className="items-center mt-6">
            <View className="w-[72px] h-[72px] rounded-full bg-blue-900 items-center justify-center">
              <Text className="text-white text-2xl font-bold">
                {(firstName[0] || "").toUpperCase()}
                {(lastName[0] || "").toUpperCase()}
              </Text>
            </View>
            <Pressable className="mt-2 py-2 px-3">
              <Text className="text-sm text-blue-900 font-medium">
                Изменить фото
              </Text>
            </Pressable>
          </View>

          {/* Name fields */}
          <Text className="text-sm font-medium text-slate-900 mt-6 mb-1">
            Имя *
          </Text>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Имя"
            placeholderTextColor="#94a3b8"
            maxLength={50}
            style={{
              height: 48,
              borderWidth: 1,
              borderColor: "#e2e8f0",
              borderRadius: 10,
              paddingHorizontal: 12,
              fontSize: 16,
              color: "#0f172a",
              backgroundColor: "#f9fafb",
            }}
          />

          <Text className="text-sm font-medium text-slate-900 mt-4 mb-1">
            Фамилия *
          </Text>
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="Фамилия"
            placeholderTextColor="#94a3b8"
            maxLength={50}
            style={{
              height: 48,
              borderWidth: 1,
              borderColor: "#e2e8f0",
              borderRadius: 10,
              paddingHorizontal: 12,
              fontSize: 16,
              color: "#0f172a",
              backgroundColor: "#f9fafb",
            }}
          />

          {/* FNS & Services (read-only display, edit via onboarding) */}
          {data && data.fnsServices.length > 0 && (
            <>
              <Text className="text-sm font-medium text-slate-900 mt-6 mb-2">
                ИФНС и услуги
              </Text>
              {data.fnsServices.map((item) => (
                <View
                  key={item.fns.id}
                  className="bg-slate-50 rounded-xl p-3 mb-2 border border-slate-200"
                >
                  <Text className="text-sm font-medium text-slate-900">
                    {item.city.name} — {item.fns.name}
                  </Text>
                  <View className="flex-row flex-wrap gap-1 mt-1">
                    {item.services.map((s) => (
                      <View
                        key={s.id}
                        className="bg-white px-2 py-0.5 rounded border border-slate-200"
                      >
                        <Text className="text-xs text-slate-400">{s.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Contacts */}
          <Text className="text-sm font-medium text-slate-900 mt-6 mb-2">
            Контакты
          </Text>

          <Text className="text-xs text-slate-400 mb-1">Телефон</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+7 (___) ___-__-__"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            style={{
              height: 48,
              borderWidth: 1,
              borderColor: "#e2e8f0",
              borderRadius: 10,
              paddingHorizontal: 12,
              fontSize: 16,
              color: "#0f172a",
              backgroundColor: "#f9fafb",
            }}
          />

          <Text className="text-xs text-slate-400 mt-3 mb-1">Telegram</Text>
          <TextInput
            value={telegram}
            onChangeText={setTelegram}
            placeholder="@username"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            style={{
              height: 48,
              borderWidth: 1,
              borderColor: "#e2e8f0",
              borderRadius: 10,
              paddingHorizontal: 12,
              fontSize: 16,
              color: "#0f172a",
              backgroundColor: "#f9fafb",
            }}
          />

          <Text className="text-xs text-slate-400 mt-3 mb-1">WhatsApp</Text>
          <TextInput
            value={whatsapp}
            onChangeText={setWhatsapp}
            placeholder="+7 (___) ___-__-__"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            style={{
              height: 48,
              borderWidth: 1,
              borderColor: "#e2e8f0",
              borderRadius: 10,
              paddingHorizontal: 12,
              fontSize: 16,
              color: "#0f172a",
              backgroundColor: "#f9fafb",
            }}
          />

          <Text className="text-xs text-slate-400 mt-3 mb-1">Адрес офиса</Text>
          <TextInput
            value={officeAddress}
            onChangeText={setOfficeAddress}
            placeholder="Адрес"
            placeholderTextColor="#94a3b8"
            style={{
              height: 48,
              borderWidth: 1,
              borderColor: "#e2e8f0",
              borderRadius: 10,
              paddingHorizontal: 12,
              fontSize: 16,
              color: "#0f172a",
              backgroundColor: "#f9fafb",
            }}
          />

          <Text className="text-xs text-slate-400 mt-3 mb-1">Часы работы</Text>
          <TextInput
            value={workingHours}
            onChangeText={setWorkingHours}
            placeholder="Пн-Пт 9:00-18:00"
            placeholderTextColor="#94a3b8"
            style={{
              height: 48,
              borderWidth: 1,
              borderColor: "#e2e8f0",
              borderRadius: 10,
              paddingHorizontal: 12,
              fontSize: 16,
              color: "#0f172a",
              backgroundColor: "#f9fafb",
            }}
          />

          {/* Availability toggle */}
          <View className="flex-row items-center justify-between mt-6 py-3 border-t border-slate-100">
            <View className="flex-1 mr-4">
              <Text className="text-base font-medium text-slate-900">
                Принимаю заявки
              </Text>
              <Text className="text-xs text-slate-400 mt-0.5">
                Когда выключено, вы не видны клиентам
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={handleToggleAvailable}
              trackColor={{ false: "#e2e8f0", true: "#1e3a8a" }}
              thumbColor="#ffffff"
            />
          </View>

          {/* Notifications section */}
          <Text className="text-sm font-medium text-slate-900 mt-6 mb-2">
            Уведомления
          </Text>

          <View className="flex-row items-center justify-between py-3 border-b border-slate-100">
            <Text className="text-sm text-slate-900">Push-уведомления</Text>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: "#e2e8f0", true: "#1e3a8a" }}
              thumbColor="#ffffff"
            />
          </View>

          <View className="flex-row items-center justify-between py-3 border-b border-slate-100">
            <Text className="text-sm text-slate-900">Email-уведомления</Text>
            <Switch
              value={emailEnabled}
              onValueChange={setEmailEnabled}
              trackColor={{ false: "#e2e8f0", true: "#1e3a8a" }}
              thumbColor="#ffffff"
            />
          </View>

          {/* Save button */}
          <Pressable
            onPress={handleSave}
            disabled={saving}
            className={`rounded-xl py-3 items-center mt-6 ${
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

          {/* Logout */}
          <Pressable
            onPress={handleLogout}
            className="rounded-xl py-3 items-center mt-3 border border-red-600"
          >
            <Text className="text-red-600 text-base font-semibold">Выйти</Text>
          </Pressable>

          <View className="h-12" />
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
