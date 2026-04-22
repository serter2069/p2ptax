import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useRef } from "react";
import { Pencil, Camera } from "lucide-react-native";
import HeaderBack from "@/components/HeaderBack";
import { API_URL, api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
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
  const [fieldErrors, setFieldErrors] = useState<{
    phone?: string;
    telegram?: string;
    description?: string;
  }>({});

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

  const validateFields = () => {
    const errors: typeof fieldErrors = {};
    const phoneDigits = phone.replace(/\D/g, "");
    if (phone.trim() && phoneDigits.length !== 11) {
      errors.phone = "Введите полный номер телефона";
    }
    if (telegram.trim() && !/^@?[a-zA-Z0-9_]{4,}$/.test(telegram.trim())) {
      errors.telegram = "Некорректный username Telegram";
    }
    if (description.trim().length > 1000) {
      errors.description = "Максимум 1000 символов";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    setError("");
    if (!validateFields()) return;
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
          <View className="pt-6">
            {/* Step indicator */}
            <Text className="text-sm text-warning text-center mb-2">
              Шаг 3 из 3
            </Text>
            <Text className="text-2xl font-bold text-text-base text-center mb-1">
              Профиль
            </Text>
            <Text className="text-sm text-text-mute text-center mb-6">
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
                  className="items-center justify-center rounded-full bg-surface2"
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
                  className="rounded-full bg-surface2 items-center justify-center"
                  style={{
                    width: 80,
                    height: 80,
                    borderWidth: 2,
                    borderColor: colors.borderLight,
                    borderStyle: "dashed",
                  }}
                >
                  <Camera size={24} color={colors.placeholder} />
                </View>
              )}
              <Text className="text-sm text-text-mute mt-2">
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
              <Text className="text-xs text-accent text-center">
                Контакты будут видны всем посетителям платформы
              </Text>
            </View>

            {/* About */}
            <View className="mb-4">
              <Input
                label="О себе"
                placeholder="Расскажите о своём опыте: сколько лет в профессии, какие вопросы решаете, с какими инспекциями работаете"
                value={description}
                onChangeText={(t) => {
                  if (t.length <= 1000) setDescription(t);
                  if (fieldErrors.description) setFieldErrors((e) => ({ ...e, description: undefined }));
                }}
                multiline
                editable={!isLoading}
                error={fieldErrors.description}
              />
              <Text className="text-xs text-text-mute text-right mt-1">
                {description.length}/1000
              </Text>
            </View>

            {/* Phone */}
            <View className="mb-4">
              <Input
                label="Телефон"
                placeholder="+7 (___) ___-__-__"
                value={phone}
                onChangeText={(t) => {
                  setPhone(formatPhone(t));
                  if (fieldErrors.phone) setFieldErrors((e) => ({ ...e, phone: undefined }));
                }}
                keyboardType="phone-pad"
                editable={!isLoading}
                error={fieldErrors.phone}
              />
            </View>

            {/* Telegram */}
            <View className="mb-4">
              <Input
                label="Telegram"
                placeholder="@username"
                value={telegram}
                onChangeText={(t) => {
                  setTelegram(t);
                  if (fieldErrors.telegram) setFieldErrors((e) => ({ ...e, telegram: undefined }));
                }}
                autoCapitalize="none"
                editable={!isLoading}
                error={fieldErrors.telegram}
              />
            </View>

            {/* WhatsApp */}
            <View className="mb-4">
              <Input
                label="WhatsApp"
                placeholder="+7 (___) ___-__-__"
                value={whatsapp}
                onChangeText={(t) => setWhatsapp(formatPhone(t))}
                keyboardType="phone-pad"
                editable={!isLoading}
              />
            </View>

            {/* Office address */}
            <View className="mb-4">
              <Input
                label="Адрес офиса"
                placeholder="г. Москва, ул. Примерная, д. 1, оф. 100"
                value={officeAddress}
                onChangeText={setOfficeAddress}
                editable={!isLoading}
              />
            </View>

            {/* Working hours */}
            <View className="mb-6">
              <Input
                label="Часы работы"
                placeholder="Пн-Пт 9:00-18:00"
                value={workingHours}
                onChangeText={setWorkingHours}
                editable={!isLoading}
              />
            </View>

            {error ? (
              <Text className="text-xs text-danger text-center mb-4">
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
              <Text className="text-sm text-text-mute">Пропустить</Text>
            </Pressable>
          </View>
        </ScrollView>
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
