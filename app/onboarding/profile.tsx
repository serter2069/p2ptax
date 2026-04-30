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
import { useRouter, useLocalSearchParams, useSegments } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { useState, useRef, useEffect } from "react";
import { Pencil, Camera, ChevronLeft } from "lucide-react-native";
import {
  api,
  ApiError,
  AVATAR_MAX_BYTES,
  AVATAR_TOO_LARGE_MESSAGE,
  avatarUploadErrorMessage,
  uploadAvatarFile,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/lib/useRequireAuth";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { colors, overlay, textStyle } from "@/lib/theme";

export default function OnboardingProfileScreen() {
  const router = useRouter()
  const nav = useTypedRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const fromSettings = params.from === "settings";
  const { ready, user } = useRequireAuth();
  const { updateUser, isSpecialistUser, isAdminUser } = useAuth();
  const segments = useSegments();
  // Only redirect when this screen is actually active in the navigation stack.
  // Without this guard, toggling specialist off from /settings causes this
  // background screen to fire nav.replaceRoutes.tabs() unintentionally.
  const isOnThisScreen = segments[0] === "onboarding" && segments[1] === "profile";

  useEffect(() => {
    if (!ready || !isOnThisScreen) return;
    if (isAdminUser) {
      nav.replaceRoutes.adminDashboard();
      return;
    }
    if (!isSpecialistUser) {
      nav.replaceRoutes.tabs();
      return;
    }
    if (!fromSettings && user?.specialistProfileCompletedAt) {
      nav.replaceRoutes.tabs();
    }
  }, [ready, isOnThisScreen, isAdminUser, isSpecialistUser, user, fromSettings, nav]);

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
    // Pre-check size before any network call
    if (file.size > AVATAR_MAX_BYTES) {
      setError(AVATAR_TOO_LARGE_MESSAGE);
      return;
    }

    setAvatarUploading(true);
    setError("");
    try {
      const fullUrl = await uploadAvatarFile(file);
      setAvatarUrl(fullUrl);
    } catch (e: unknown) {
      const msg =
        e instanceof ApiError ? e.message : avatarUploadErrorMessage(-1);
      setError(msg);
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
      const result = await api<{ success: boolean; specialistProfileCompletedAt?: string }>(
        "/api/onboarding/profile",
        {
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
        }
      );

      // Mark user as specialist locally + record onboarding completion so
      // useStrandedSpecialistGuard stops bouncing back to /onboarding/name.
      const completedAt = result.specialistProfileCompletedAt ?? new Date().toISOString();
      updateUser({
        isSpecialist: true,
        specialistProfileCompletedAt: completedAt,
        ...(avatarUrl ? { avatarUrl } : {}),
      });

      nav.replaceRoutes.tabs();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Что-то пошло не так";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!ready || isAdminUser || !isSpecialistUser) {
    return (
      <OnboardingShell
        step={3}
        title="Заполните профиль"
        subtitle="Аватар, контакты и краткое описание помогут клиенту быстрее выбрать именно вас."
        loading
        onBack={() => router.back()}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="px-6 pt-4 pb-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Назад"
          onPress={() => router.back()}
          className="flex-row items-center"
          style={{ minHeight: 44 }}
        >
          <ChevronLeft size={20} color={colors.text} />
          <Text className="text-text-base ml-1">Назад</Text>
        </Pressable>
      </View>

      <View className="px-6 pb-4">
        <OnboardingProgress step={3} />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: "100%", maxWidth: 640, alignSelf: "center" }}>
          <Text
            style={{
              ...textStyle.h1,
              color: colors.text,
              fontSize: 32,
              lineHeight: 38,
              marginTop: 16,
              marginBottom: 12,
            }}
          >
            Заполните профиль
          </Text>
          <Text
            style={{
              ...textStyle.body,
              color: colors.textSecondary,
              fontSize: 16,
              lineHeight: 24,
              marginBottom: 24,
            }}
          >
            Всё необязательно — можно заполнить позже. Аватар помогает клиенту
            быстрее выбрать именно вас.
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Добавить фото"
            onPress={handleAvatarPress}
            className="items-center mb-6"
          >
            {avatarUploading ? (
              <View
                className="items-center justify-center rounded-full bg-accent-soft"
                style={{ width: 96, height: 96 }}
              >
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : avatarUrl ? (
              <View>
                <Image
                  source={{ uri: avatarUrl }}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                    borderWidth: 2,
                    borderColor: colors.border,
                  }}
                />
                <View
                  className="absolute bottom-0 right-0 bg-accent rounded-full items-center justify-center"
                  style={{ width: 28, height: 28 }}
                >
                  <Pencil size={14} color={colors.surface} />
                </View>
              </View>
            ) : (
              <View
                className="rounded-full bg-accent-soft items-center justify-center"
                style={{
                  width: 96,
                  height: 96,
                  borderWidth: 2,
                  borderColor: colors.borderLight,
                  borderStyle: "dashed",
                }}
              >
                <Camera size={28} color={colors.primary} />
              </View>
            )}
            <Text className="text-sm text-text-mute mt-2">
              {avatarUrl ? "Изменить фото" : "Нажмите, чтобы загрузить фото"}
            </Text>
          </Pressable>

          {Platform.OS === "web" && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          )}

          <View
            className="bg-accent-soft rounded-xl px-4 py-3 mb-4"
            style={{ borderWidth: 1, borderColor: overlay.accent10 }}
          >
            <Text className="text-xs text-accent text-center font-medium">
              Контакты будут видны всем посетителям платформы
            </Text>
          </View>

          <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
            О себе
          </Text>

          <View className="mb-4">
            <Input
              label="О себе"
              placeholder="Расскажите о своём опыте: сколько лет в профессии, какие вопросы решаете, с какими инспекциями работаете"
              value={description}
              onChangeText={(t) => {
                if (t.length <= 1000) setDescription(t);
                if (fieldErrors.description)
                  setFieldErrors((e) => ({ ...e, description: undefined }));
              }}
              multiline
              editable={!isLoading}
              error={fieldErrors.description}
            />
            <Text className="text-xs text-text-mute text-right mt-1">
              {description.length}/1000
            </Text>
          </View>

          <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3 mt-2">
            Контакты
          </Text>

          <View className="mb-4">
            <Input
              label="Телефон"
              placeholder="+7 (___) ___-__-__"
              value={phone}
              onChangeText={(t) => {
                setPhone(formatPhone(t));
                if (fieldErrors.phone)
                  setFieldErrors((e) => ({ ...e, phone: undefined }));
              }}
              keyboardType="phone-pad"
              editable={!isLoading}
              error={fieldErrors.phone}
            />
          </View>

          <View className="mb-4">
            <Input
              label="Telegram"
              placeholder="@username"
              value={telegram}
              onChangeText={(t) => {
                setTelegram(t);
                if (fieldErrors.telegram)
                  setFieldErrors((e) => ({ ...e, telegram: undefined }));
              }}
              autoCapitalize="none"
              editable={!isLoading}
              error={fieldErrors.telegram}
            />
          </View>

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

          <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3 mt-2">
            Офис
          </Text>

          <View className="mb-4">
            <Input
              label="Адрес офиса"
              placeholder="г. Москва, ул. Примерная, д. 1, оф. 100"
              value={officeAddress}
              onChangeText={setOfficeAddress}
              editable={!isLoading}
            />
          </View>

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
            <View
              className="mb-3 px-4 py-3 rounded-xl"
              style={{
                backgroundColor: colors.errorBg,
                borderWidth: 1,
                borderColor: colors.danger,
              }}
            >
              <Text className="text-sm text-danger leading-5">{error}</Text>
            </View>
          ) : null}

          <Button
            label="Завершить регистрацию"
            onPress={handleSubmit}
            disabled={isLoading || avatarUploading}
            loading={isLoading}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Пропустить"
            onPress={handleSubmit}
            disabled={isLoading || avatarUploading}
            className="items-center mt-4"
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Text className="text-sm text-text-mute">Пропустить</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
