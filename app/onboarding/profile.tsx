import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useRef } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import HeaderBack from "@/components/HeaderBack";
import { API_URL, api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import Button from "@/components/ui/Button";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "@/lib/theme";


export default function OnboardingProfileScreen() {
  const router = useRouter();
  const { updateUser } = useAuth();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Web-only hidden file input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formatPhone = (text: string) => {
    const digits = text.replace(/\D/g, "");
    if (digits.length === 0) return "";
    let formatted = "+7";
    const rest = digits.startsWith("7")
      ? digits.slice(1)
      : digits.startsWith("8")
        ? digits.slice(1)
        : digits;
    if (rest.length > 0) formatted += " (" + rest.slice(0, 3);
    if (rest.length >= 3) formatted += ") " + rest.slice(3, 6);
    if (rest.length >= 6) formatted += "-" + rest.slice(6, 8);
    if (rest.length >= 8) formatted += "-" + rest.slice(8, 10);
    return formatted;
  };

  const uploadAvatar = async (file: File) => {
    setAvatarUploading(true);
    setError("");
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

      const data = (await res.json()) as { url: string; key: string };
      // Build full URL from relative path returned by server
      const fullUrl = data.url.startsWith("http")
        ? data.url
        : `${API_URL}${data.url}`;
      setAvatarUrl(fullUrl);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка загрузки фото";
      setError(msg);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarPress = () => {
    if (Platform.OS === "web" && fileInputRef.current) {
      fileInputRef.current.click();
    }
    // Native: expo-image-picker not installed — web-only upload for now
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void uploadAvatar(file);
      // Reset so the same file can be re-selected
      e.target.value = "";
    }
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    setError("");
    setIsLoading(true);

    try {
      await api("/api/onboarding/profile", {
        method: "PUT",
        body: {
          description: description.trim() || null,
          phone: phone.trim() || null,
          telegram: telegram.trim() || null,
          whatsapp: whatsapp.trim() || null,
          officeAddress: officeAddress.trim() || null,
          workingHours: workingHours.trim() || null,
          avatarUrl: avatarUrl || null,
        },
      });

      if (avatarUrl) {
        updateUser({ avatarUrl });
      }

      router.replace("/(specialist-tabs)/dashboard" as never);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Что-то пошло не так";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <HeaderBack title="" />
      <ResponsiveContainer>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ paddingTop: "6%" }}>
            {/* Step indicator */}
            <Text className="text-sm text-amber-700 text-center mb-2">
              Шаг 3 из 3
            </Text>
            <Text className="text-2xl font-bold text-slate-900 text-center mb-1">
              Профиль
            </Text>
            <Text className="text-sm text-slate-500 text-center mb-6">
              Всё необязательно — можно заполнить позже
            </Text>

            {/* Avatar upload */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Добавить фото"
              onPress={handleAvatarPress}
              className="items-center mb-6"
            >
              {avatarUploading ? (
                <View
                  className="items-center justify-center rounded-full bg-slate-100"
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
                    className="absolute bottom-0 right-0 bg-blue-900 rounded-full items-center justify-center"
                    style={{ width: 24, height: 24 }}
                  >
                    <FontAwesome name="pencil" size={12} color={colors.surface} />
                  </View>
                </View>
              ) : (
                <View
                  className="rounded-full bg-slate-100 items-center justify-center"
                  style={{
                    width: 80,
                    height: 80,
                    borderWidth: 2,
                    borderColor: colors.borderLight,
                    borderStyle: "dashed",
                  }}
                >
                  <FontAwesome name="camera" size={24} color={colors.placeholder} />
                </View>
              )}
              <Text className="text-sm text-slate-400 mt-2">
                {avatarUrl ? "Изменить фото" : "Нажмите, чтобы загрузить фото"}
              </Text>
            </Pressable>

            {/* Hidden web file input */}
            {Platform.OS === "web" && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            )}

            {/* Contacts note */}
            <View className="bg-blue-50 rounded-xl px-4 py-3 mb-4">
              <Text className="text-xs text-blue-800 text-center">
                Контакты будут видны всем посетителям платформы
              </Text>
            </View>

            {/* About */}
            <Text className="text-sm text-slate-500 mb-1">О себе</Text>
            <TextInput
              accessibilityLabel="О себе"
              style={{
                height: 100,
                borderRadius: 12,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                color: colors.text,
                textAlignVertical: "top",
                marginBottom: 4,
              }}
              placeholder="Расскажите о своём опыте: сколько лет в профессии, какие вопросы решаете, с какими инспекциями работаете"
              placeholderTextColor={colors.placeholder}
              value={description}
              onChangeText={(t) => {
                if (t.length <= 1000) setDescription(t);
              }}
              multiline
              editable={!isLoading}
            />
            <Text className="text-xs text-slate-400 text-right mb-4">
              {description.length}/1000
            </Text>

            {/* Phone */}
            <Text className="text-sm text-slate-500 mb-1">Телефон</Text>
            <TextInput
              accessibilityLabel="Телефон"
              style={{
                height: 48,
                borderRadius: 12,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 16,
                fontSize: 16,
                color: colors.text,
                marginBottom: 16,
              }}
              placeholder="+7 (___) ___-__-__"
              placeholderTextColor={colors.placeholder}
              value={phone}
              onChangeText={(t) => setPhone(formatPhone(t))}
              keyboardType="phone-pad"
              editable={!isLoading}
            />

            {/* Telegram */}
            <Text className="text-sm text-slate-500 mb-1">Telegram</Text>
            <TextInput
              accessibilityLabel="Telegram"
              style={{
                height: 48,
                borderRadius: 12,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 16,
                fontSize: 16,
                color: colors.text,
                marginBottom: 16,
              }}
              placeholder="@username"
              placeholderTextColor={colors.placeholder}
              value={telegram}
              onChangeText={setTelegram}
              autoCapitalize="none"
              editable={!isLoading}
            />

            {/* WhatsApp */}
            <Text className="text-sm text-slate-500 mb-1">WhatsApp</Text>
            <TextInput
              accessibilityLabel="WhatsApp"
              style={{
                height: 48,
                borderRadius: 12,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 16,
                fontSize: 16,
                color: colors.text,
                marginBottom: 16,
              }}
              placeholder="+7 (___) ___-__-__"
              placeholderTextColor={colors.placeholder}
              value={whatsapp}
              onChangeText={(t) => setWhatsapp(formatPhone(t))}
              keyboardType="phone-pad"
              editable={!isLoading}
            />

            {/* Office address */}
            <Text className="text-sm text-slate-500 mb-1">Адрес офиса</Text>
            <TextInput
              accessibilityLabel="Адрес офиса"
              style={{
                height: 48,
                borderRadius: 12,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 16,
                fontSize: 16,
                color: colors.text,
                marginBottom: 16,
              }}
              placeholder="г. Москва, ул. Примерная, д. 1, оф. 100"
              placeholderTextColor={colors.placeholder}
              value={officeAddress}
              onChangeText={setOfficeAddress}
              editable={!isLoading}
            />

            {/* Working hours */}
            <Text className="text-sm text-slate-500 mb-1">Часы работы</Text>
            <TextInput
              accessibilityLabel="Часы работы"
              style={{
                height: 48,
                borderRadius: 12,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 16,
                fontSize: 16,
                color: colors.text,
                marginBottom: 24,
              }}
              placeholder="Пн-Пт 9:00-18:00"
              placeholderTextColor={colors.placeholder}
              value={workingHours}
              onChangeText={setWorkingHours}
              editable={!isLoading}
            />

            {error ? (
              <Text className="text-xs text-red-600 text-center mb-4">
                {error}
              </Text>
            ) : null}

            <Button
              label="Завершить регистрацию"
              onPress={handleSubmit}
              disabled={isLoading || avatarUploading}
              loading={isLoading}
            />

            {/* Skip link */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Пропустить"
              onPress={handleSubmit}
              disabled={isLoading || avatarUploading}
              className="items-center mt-4 py-2"
            >
              <Text className="text-sm text-slate-400">Пропустить</Text>
            </Pressable>
          </View>
        </ScrollView>
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
