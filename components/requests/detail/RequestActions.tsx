import { View, Text, Pressable, ActivityIndicator } from "react-native";
import StyledSwitch from "@/components/ui/StyledSwitch";
import { X, Link } from "lucide-react-native";
import { colors } from "@/lib/theme";
import { RequestDetailData } from "./types";

interface Props {
  request: RequestDetailData;
  isOwner: boolean;
  isActive: boolean;
  closing: boolean;
  copied: boolean;
  togglingVisibility: boolean;
  onClose: () => void;
  onCopyLink: () => void;
  onToggleVisibility: (value: boolean) => void;
  isDesktop?: boolean;
}

export default function RequestActions({
  request,
  isOwner,
  isActive,
  closing,
  copied,
  togglingVisibility,
  onClose,
  onCopyLink,
  onToggleVisibility,
  isDesktop,
}: Props) {
  const padding = isDesktop ? "p-5" : "p-4";

  // Non-owners see only the copy-link button (read-only view).
  if (!isOwner) {
    return (
      <View
        className={`bg-white rounded-2xl ${padding} mb-4`}
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Скопировать ссылку"
          onPress={onCopyLink}
          className="flex-row items-center justify-center rounded-xl px-4"
          style={({ pressed }) => [
            {
              backgroundColor: colors.surface2,
              borderWidth: 1,
              borderColor: colors.border,
              minHeight: 48,
              paddingVertical: 14,
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Link size={16} color={copied ? colors.success : colors.text} />
          <Text
            className="ml-2"
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: copied ? colors.success : "#111",
            }}
          >
            {copied ? "Скопировано!" : "Скопировать ссылку"}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      className={`bg-white rounded-2xl ${padding} mb-4`}
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      <Text
        className="uppercase tracking-wide mb-3"
        style={{ fontSize: 13, fontWeight: "600", color: "#111" }}
      >
        Действия
      </Text>

      {isActive ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Закрыть запрос"
          onPress={onClose}
          disabled={closing}
          className="flex-row items-center justify-center rounded-xl px-4"
          style={({ pressed }) => [
            {
              backgroundColor: colors.danger,
              minHeight: 48,
              paddingVertical: 14,
              shadowColor: colors.danger,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 3,
            },
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
        >
          {closing ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <X size={16} color={colors.white} />
              <Text
                className="text-white ml-2"
                style={{ fontSize: 15, fontWeight: "600" }}
              >
                Закрыть запрос
              </Text>
            </>
          )}
        </Pressable>
      ) : (
        <View
          className="rounded-xl px-4 items-center"
          style={{
            backgroundColor: colors.surface2,
            borderWidth: 1,
            borderColor: colors.border,
            minHeight: 48,
            paddingVertical: 14,
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "500", color: "#111" }}>
            Запрос закрыт
          </Text>
        </View>
      )}

      {/* Copy link */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Скопировать ссылку"
        onPress={onCopyLink}
        className="flex-row items-center justify-center rounded-xl px-4 mt-2"
        style={({ pressed }) => [
          {
            backgroundColor: colors.surface2,
            borderWidth: 1,
            borderColor: colors.border,
            minHeight: 48,
            paddingVertical: 14,
          },
          pressed && { opacity: 0.7 },
        ]}
      >
        <Link size={16} color={copied ? colors.success : colors.text} />
        <Text
          className="ml-2"
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: copied ? colors.success : "#111",
          }}
        >
          {copied ? "Скопировано!" : "Скопировать ссылку"}
        </Text>
      </Pressable>

      {/* Visibility toggle — owner only */}
      <View
        className="flex-row items-center justify-between mt-4 pt-3"
        style={{ borderTopWidth: 1, borderTopColor: colors.border }}
      >
        <View className="flex-1 mr-3">
          <View className="flex-row items-center gap-2 mb-0.5">
            <View
              className="rounded px-1.5 py-0.5"
              style={{
                backgroundColor: request.isPublic ? "#D1FAE5" : "#F3F4F6",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: request.isPublic ? "#065F46" : "#6B7280",
                }}
              >
                {request.isPublic ? "Доступно публично" : "Только для участников"}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
            {request.isPublic
              ? "Запрос виден всем пользователям интернета"
              : "Запрос виден только зарегистрированным пользователям"}
          </Text>
        </View>
        <StyledSwitch
          value={request.isPublic}
          onValueChange={onToggleVisibility}
          disabled={togglingVisibility || !isActive}
        />
      </View>
    </View>
  );
}
