import { View, Text, Pressable, ActivityIndicator, Share, Platform } from "react-native";
import Input from "@/components/ui/Input";
import StyledSwitch from "@/components/ui/StyledSwitch";
import AvatarUploader from "@/components/settings/AvatarUploader";
import RoleBadge from "@/components/layout/RoleBadge";
import type { UserRole } from "@/contexts/AuthContext";
import { colors } from "@/lib/theme";
import { Share2, ExternalLink } from "lucide-react-native";
import { router } from "expo-router";

interface ProfileTabProps {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  avatarUploading: boolean;
  isSpecialistUser: boolean;
  isAvailable: boolean;
  availabilityLoading: boolean;
  role: UserRole;
  userId?: string;
  onFirstNameChange: (v: string) => void;
  onLastNameChange: (v: string) => void;
  onAvatarChange: (url: string, key: string) => void;
  onUploadStart: () => void;
  onUploadEnd: () => void;
  onToggleSpecialist: (v: boolean) => void;
  onToggleAvailable: (v: boolean) => void;
  /** Fires when name inputs lose focus — used by autosave on the merged Profile page. */
  onPersonalBlur?: () => void;
}

export default function ProfileTab({
  firstName,
  lastName,
  email,
  avatarUrl,
  avatarUploading,
  isSpecialistUser,
  isAvailable,
  availabilityLoading,
  role,
  userId,
  onFirstNameChange,
  onLastNameChange,
  onAvatarChange,
  onUploadStart,
  onUploadEnd,
  onToggleSpecialist,
  onToggleAvailable,
  onPersonalBlur,
}: ProfileTabProps) {
  const handleShareProfile = async () => {
    const url =
      Platform.OS === "web"
        ? `${window.location.origin}/profile/${userId}`
        : `https://p2ptax.ru/profile/${userId}`;
    if (Platform.OS === "web") {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // fallback — do nothing silently
      }
      return;
    }
    try {
      await Share.share({ message: url, url });
    } catch {
      // cancelled or unsupported
    }
  };
  return (
    <>
      {/* 1. Личные данные */}
      <View className="bg-white border border-border rounded-2xl px-4 py-5 mb-4">
        <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-4">
          Личные данные
        </Text>

        <View className="items-center mb-4">
          <AvatarUploader
            avatarUrl={avatarUrl}
            avatarUploading={avatarUploading}
            name={`${firstName} ${lastName}`.trim()}
            fallback={email}
            onAvatarChange={onAvatarChange}
            onUploadStart={onUploadStart}
            onUploadEnd={onUploadEnd}
          />
          <View className="mt-2">
            <RoleBadge
              role={role}
              isSpecialist={isSpecialistUser}
              size="md"
            />
          </View>
        </View>

        <View className="mb-3">
          <Input
            variant="bordered"
            label="Имя"
            value={firstName}
            onChangeText={onFirstNameChange}
            onBlur={onPersonalBlur ? () => onPersonalBlur() : undefined}
            placeholder="Введите имя"
            maxLength={50}
          />
        </View>

        <View className="mb-3">
          <Input
            variant="bordered"
            label="Фамилия"
            value={lastName}
            onChangeText={onLastNameChange}
            onBlur={onPersonalBlur ? () => onPersonalBlur() : undefined}
            placeholder="Введите фамилию"
            maxLength={50}
          />
          <Text className="text-xs text-text-mute mt-1">
            Необязательно. Можете указать только первую букву
          </Text>
        </View>

        <Text className="text-sm font-medium text-text-base mb-1.5">
          Email{" "}
          <Text className="text-text-mute font-normal">
            (нельзя изменить)
          </Text>
        </Text>
        <View className="h-12 border border-border rounded-xl bg-surface2 px-4 justify-center">
          <Text className="text-base text-text-mute">{email}</Text>
        </View>
      </View>

      {/* 2. Режим специалиста — единый тумблер */}
      <View className="bg-white border border-border rounded-2xl px-4 py-5 mb-4">
        <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
          Режим специалиста
        </Text>
        <View className="flex-row items-center justify-between py-2">
          <View className="flex-1 mr-4">
            <Text className="text-base font-semibold text-text-base">
              Я специалист
            </Text>
            <Text className="text-xs text-text-mute mt-0.5">
              {isSpecialistUser
                ? "Клиенты могут найти вас через каталог"
                : "Включите, чтобы принимать запросы от клиентов"}
            </Text>
          </View>
          <StyledSwitch value={isSpecialistUser} onValueChange={onToggleSpecialist} />
        </View>

        {isSpecialistUser && (
          <View className="border-t border-border mt-2">
            <View className="flex-row items-center justify-between py-2">
              <View className="flex-1 mr-4">
                <Text className="text-base font-semibold text-text-base">
                  Публичный профиль
                </Text>
                <Text className="text-xs text-text-mute mt-0.5">
                  Ваш профиль будет отображаться в поиске и доступен другим пользователям
                </Text>
              </View>
              {availabilityLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <StyledSwitch value={isAvailable} onValueChange={onToggleAvailable} />
              )}
            </View>
            {isAvailable && userId && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Посмотреть мой профиль"
                  onPress={() => router.push(`/profile/${userId}` as never)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: colors.surface2,
                    alignSelf: "flex-start",
                  }}
                >
                  <ExternalLink size={14} color={colors.accent} />
                  <Text
                    style={{
                      marginLeft: 6,
                      fontSize: 13,
                      fontWeight: "600",
                      color: colors.accent,
                    }}
                  >
                    Посмотреть мой профиль
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Поделиться профилем"
                  onPress={handleShareProfile}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: colors.surface2,
                    alignSelf: "flex-start",
                  }}
                >
                  <Share2 size={14} color={colors.accent} />
                  <Text
                    style={{
                      marginLeft: 6,
                      fontSize: 13,
                      fontWeight: "600",
                      color: colors.accent,
                    }}
                  >
                    Поделиться профилем
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </View>
    </>
  );
}
