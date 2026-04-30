/**
 * ClearThreadModal — confirmation dialog for "clear conversation" action.
 * Extracted from InlineChatView.tsx to keep that file under 500 LOC.
 */
import { Modal, View, Text, Pressable } from "react-native";
import { colors } from "@/lib/theme";

interface ClearThreadModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ClearThreadModal({
  visible,
  onCancel,
  onConfirm,
}: ClearThreadModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.4)",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
        onPress={onCancel}
      >
        <Pressable
          onPress={() => { /* prevent dismiss on inner press */ }}
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 24,
            width: "100%",
            maxWidth: 360,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
            elevation: 16,
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 8 }}>
            Очистить переписку?
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 24 }}>
            Вы и ваш собеседник не сможете получить к ней доступ. Она будет удалена с серверов.
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Отмена"
              onPress={onCancel}
              style={({ pressed }) => [
                {
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor: colors.surface2,
                  minHeight: 44,
                  justifyContent: "center",
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>Отмена</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Очистить переписку"
              onPress={onConfirm}
              style={({ pressed }) => [
                {
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor: colors.danger,
                  minHeight: 44,
                  justifyContent: "center",
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>Очистить</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
