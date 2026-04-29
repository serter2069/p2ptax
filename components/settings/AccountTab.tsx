import { View, Text, Pressable } from "react-native";
import { LogOut, Trash2, ChevronRight, FileText } from "lucide-react-native";
import { colors } from "@/lib/theme";

interface AccountTabProps {
  appVersion: string;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onLegal: () => void;
}

export default function AccountTab({
  appVersion,
  onLogout,
  onDeleteAccount,
  onLegal,
}: AccountTabProps) {
  return (
    <>
      {/* Правовая информация */}
      <View className="bg-white border border-border rounded-2xl px-4 py-4 mb-4 overflow-hidden">
        <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-2">
          Правовая информация
        </Text>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Правовые документы"
          onPress={onLegal}
          className="flex-row items-center min-h-[44px]"
        >
          <FileText size={16} color={colors.placeholder} />
          <Text className="text-base text-text-base ml-3 flex-1">
            Правовые документы
          </Text>
          <ChevronRight size={14} color={colors.borderLight} />
        </Pressable>
      </View>

      {/* Аккаунт */}
      <View className="bg-white border border-border rounded-2xl px-4 py-4 mb-4 overflow-hidden">
        <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-2">
          Аккаунт
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Выйти из аккаунта"
          onPress={onLogout}
          className="flex-row items-center min-h-[44px] border-b border-border"
        >
          <LogOut size={16} color={colors.error} />
          <Text className="text-base text-danger ml-3 flex-1">
            Выйти из аккаунта
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Удалить аккаунт"
          onPress={onDeleteAccount}
          className="flex-row items-center min-h-[44px]"
        >
          <Trash2 size={16} color={colors.error} />
          <Text className="text-base text-danger ml-3 flex-1">
            Удалить аккаунт
          </Text>
        </Pressable>
        <Text className="text-xs text-text-mute mt-1">
          Аккаунт будет анонимизирован и скрыт. Восстановление невозможно. История переписок останется у других участников.
        </Text>
      </View>

      <Text className="text-xs text-text-dim text-center mb-4">
        Версия {appVersion}
      </Text>
    </>
  );
}
