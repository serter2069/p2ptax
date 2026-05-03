import { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, Platform } from "react-native";
import { colors } from "@/lib/theme";
import { dialog, type DialogRequest } from "@/lib/dialog";

/**
 * DialogHost — global popup renderer. Mount once in app/_layout.tsx and call
 * dialog.alert / dialog.confirm / dialog.toast from anywhere. Replaces native
 * Alert.alert which renders as the browser's `window.alert/confirm` on web
 * (ugly, blocking, no styling control).
 *
 * The host listens to the singleton dialog manager and shows a queue of
 * requests one at a time. Each request resolves its promise when the user
 * clicks a button or dismisses (backdrop click on alerts/toasts).
 */
export default function DialogHost() {
  const [current, setCurrent] = useState<DialogRequest | null>(null);

  useEffect(() => {
    return dialog.subscribe((req) => {
      setCurrent(req);
    });
  }, []);

  if (!current) return null;

  const resolve = (value: boolean) => {
    current.resolve(value);
    setCurrent(null);
  };

  const isConfirm = current.kind === "confirm";
  const destructive = current.destructive ?? false;

  return (
    <Modal
      transparent
      animationType="fade"
      visible
      onRequestClose={() => resolve(false)}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Закрыть"
        onPress={() => {
          if (!isConfirm) resolve(false);
        }}
        style={{
          flex: 1,
          backgroundColor: "rgba(15, 23, 42, 0.45)",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <Pressable
          // Stop propagation so clicks inside the card don't dismiss
          onPress={() => {}}
          style={{
            backgroundColor: colors.white,
            borderRadius: 20,
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: 16,
            width: "100%",
            maxWidth: 420,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.18,
            shadowRadius: 32,
            ...(Platform.OS === "android" ? { elevation: 24 } : {}),
          }}
        >
          {current.title ? (
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.text,
                marginBottom: current.message ? 8 : 16,
                lineHeight: 24,
              }}
            >
              {current.title}
            </Text>
          ) : null}
          {current.message ? (
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                lineHeight: 20,
                marginBottom: 20,
              }}
            >
              {current.message}
            </Text>
          ) : null}

          <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            {isConfirm ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={current.cancelLabel ?? "Отмена"}
                  onPress={() => resolve(false)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ fontSize: 15, color: colors.textSecondary, fontWeight: "500" }}>
                    {current.cancelLabel ?? "Отмена"}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={current.confirmLabel ?? "Подтвердить"}
                  onPress={() => resolve(true)}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: destructive ? colors.error : colors.primary,
                  }}
                >
                  <Text style={{ fontSize: 15, color: colors.white, fontWeight: "600" }}>
                    {current.confirmLabel ?? "Подтвердить"}
                  </Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={current.confirmLabel ?? "OK"}
                onPress={() => resolve(true)}
                style={{
                  paddingHorizontal: 22,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                }}
              >
                <Text style={{ fontSize: 15, color: colors.white, fontWeight: "600" }}>
                  {current.confirmLabel ?? "OK"}
                </Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
