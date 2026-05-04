import { View, Text } from "react-native";
import Input from "@/components/ui/Input";
import StyledSwitch from "@/components/ui/StyledSwitch";
import AvatarUploader from "@/components/settings/AvatarUploader";
import RoleBadge from "@/components/layout/RoleBadge";
import type { UserRole } from "@/contexts/AuthContext";

/**
 * ProfileTab — minimal personal-data card.
 *
 * Avatar + first name + last name + 'Я специалист' toggle. That's it.
 * Email moved to the Account tab; public-profile toggle moved into the
 * specialist section that expands below this card when 'Я специалист'
 * is on. Preview/share also moved inside the specialist section.
 *
 * The tab label flips between 'Профиль' (client) and 'Специалист'
 * (when toggle is on) — that lives in app/profile/index.tsx so the
 * caller controls naming. This component only renders the card body.
 */
interface ProfileTabProps {
  firstName: string;
  lastName: string;
  /** Used for avatar fallback initials when no firstName/lastName yet. */
  email: string;
  avatarUrl: string | null;
  avatarUploading: boolean;
  isSpecialistUser: boolean;
  role: UserRole;
  onFirstNameChange: (v: string) => void;
  onLastNameChange: (v: string) => void;
  onAvatarChange: (url: string, key: string) => void;
  onUploadStart: () => void;
  onUploadEnd: () => void;
  onToggleSpecialist: (v: boolean) => void;
  /** Fires when name inputs blur — used by autosave on the merged Profile page. */
  onPersonalBlur?: () => void;
}

export default function ProfileTab({
  firstName,
  lastName,
  email,
  avatarUrl,
  avatarUploading,
  isSpecialistUser,
  role,
  onFirstNameChange,
  onLastNameChange,
  onAvatarChange,
  onUploadStart,
  onUploadEnd,
  onToggleSpecialist,
  onPersonalBlur,
}: ProfileTabProps) {
  return (
    <>
      {/* Личные данные — единая карточка */}
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
            <RoleBadge role={role} isSpecialist={isSpecialistUser} size="md" />
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

      {/* Тумблер 'Я специалист' — открывает секцию специалиста ниже */}
      <View className="bg-white border border-border rounded-2xl px-4 py-5 mb-4">
        <View className="flex-row items-center justify-between py-1">
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
      </View>
    </>
  );
}
