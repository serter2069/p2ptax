import { useRef, useEffect } from "react";
import { View, Text, Pressable, Animated, ActivityIndicator } from "react-native";
import Input from "@/components/ui/Input";
import AvatarUploader from "@/components/settings/AvatarUploader";
import RoleBadge from "@/components/layout/RoleBadge";
import type { UserRole } from "@/contexts/AuthContext";
import { colors } from "@/lib/theme";

/**
 * Внутренний iOS-style toggle. Дублируется здесь чтобы tab был самодостаточным
 * (parent ничего не передаёт визуального).
 */
function IosToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [value]);
  const trackColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#E5E5EA", colors.primary],
  });
  const thumbPos = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={{ width: 51, height: 31 }}
    >
      <Animated.View
        style={{
          width: 51,
          height: 31,
          borderRadius: 15.5,
          backgroundColor: trackColor,
          justifyContent: "center",
        }}
      >
        <Animated.View
          style={{
            width: 27,
            height: 27,
            borderRadius: 13.5,
            backgroundColor: "white",
            position: "absolute",
            left: thumbPos,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.15,
            shadowRadius: 2,
            elevation: 2,
          }}
        />
      </Animated.View>
    </Pressable>
  );
}

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
  onFirstNameChange: (v: string) => void;
  onLastNameChange: (v: string) => void;
  onAvatarChange: (url: string | null) => void;
  onUploadStart: () => void;
  onUploadEnd: () => void;
  onToggleSpecialist: (v: boolean) => void;
  onToggleAvailable: (v: boolean) => void;
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
  onFirstNameChange,
  onLastNameChange,
  onAvatarChange,
  onUploadStart,
  onUploadEnd,
  onToggleSpecialist,
  onToggleAvailable,
}: ProfileTabProps) {
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
            label="Имя"
            value={firstName}
            onChangeText={onFirstNameChange}
            placeholder="Введите имя"
            maxLength={50}
          />
        </View>

        <View className="mb-3">
          <Input
            label="Фамилия"
            value={lastName}
            onChangeText={onLastNameChange}
            placeholder="Введите фамилию"
            maxLength={50}
          />
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
                : "Включите, чтобы принимать заявки от клиентов"}
            </Text>
          </View>
          <IosToggle value={isSpecialistUser} onChange={onToggleSpecialist} />
        </View>

        {isSpecialistUser && (
          <View className="flex-row items-center justify-between py-2 border-t border-border mt-2">
            <View className="flex-1 mr-4">
              <Text className="text-base font-semibold text-text-base">
                Принимаю заявки
              </Text>
              <Text className="text-xs text-text-mute mt-0.5">
                {isAvailable
                  ? "Вы видны клиентам и получаете заявки"
                  : "Вы скрыты от клиентов — новые заявки не поступают"}
              </Text>
            </View>
            {availabilityLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <IosToggle value={isAvailable} onChange={onToggleAvailable} />
            )}
          </View>
        )}
      </View>
    </>
  );
}
