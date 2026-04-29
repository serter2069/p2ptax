import { View, Text, ViewStyle } from "react-native";
import { Lock } from "lucide-react-native";
import Button from "@/components/ui/Button";
import { colors } from "@/lib/theme";

interface SpecialistGuestLockedContactsProps {
  cardShadow: ViewStyle;
  onLogin: () => void;
}

/**
 * Guest-gated contacts card (SA): unauthenticated users see only a lock + login CTA.
 */
export default function SpecialistGuestLockedContacts({
  cardShadow,
  onLogin,
}: SpecialistGuestLockedContactsProps) {
  return (
    <View className="mt-8">
      <View
        className="rounded-2xl border border-border p-6 items-center relative overflow-hidden"
        style={{ backgroundColor: colors.surface2, ...cardShadow }}
      >
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.surface,
            opacity: 0.6,
          }}
        />
        <Lock size={28} color={colors.textSecondary} />
        <Text
          className="text-base font-semibold mt-3"
          style={{ color: colors.text }}
        >
          Войдите, чтобы увидеть контакты
        </Text>
        <Text
          className="text-sm mt-1 text-center"
          style={{ color: colors.textSecondary }}
        >
          Телефон, Telegram и WhatsApp доступны только авторизованным пользователям
        </Text>
        <View className="mt-4">
          <Button label="Войти" onPress={onLogin} fullWidth={false} />
        </View>
      </View>
    </View>
  );
}
