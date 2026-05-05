import { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, Platform } from "react-native";
import {
  CheckCircle2, AlertTriangle, Search, Send, Plus, Check, ExternalLink,
  type LucideIcon,
} from "lucide-react-native";
import { colors } from "@/lib/theme";
import { dialog, type DialogRequest } from "@/lib/dialog";

const CONFIRM_ICON_MAP: Record<NonNullable<DialogRequest["confirmIcon"]>, LucideIcon> = {
  search: Search,
  send: Send,
  plus: Plus,
  check: Check,
  external: ExternalLink,
};

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
          {current.tone ? (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor:
                  current.tone === "success"
                    ? "#dcfce7"
                    : "#fef3c7",
                marginBottom: 12,
                // Center the tone icon (success/warning) above the
                // dialog content. Earlier `flex-start` left it pinned
                // to the left edge, which read like a stray badge —
                // not the centerpiece of a celebratory popup.
                alignSelf: "center",
              }}
            >
              {current.tone === "success" ? (
                <CheckCircle2 size={32} color="#16a34a" />
              ) : (
                <AlertTriangle size={32} color="#d97706" />
              )}
            </View>
          ) : null}
          {current.title ? (
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.text,
                marginBottom: current.message ? 8 : 16,
                lineHeight: 24,
                // When the dialog has a tone icon (and therefore lives
                // in centered-celebration mode), title + message
                // follow the icon's center alignment so the whole
                // composition reads as a single column. Without it the
                // icon sits centered while the text starts at the left
                // edge — visually disconnected.
                textAlign: current.tone ? "center" : "left",
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
                textAlign: current.tone ? "center" : "left",
              }}
            >
              {current.message}
            </Text>
          ) : null}

          {/* Buttons row. Stacks vertically when the cumulative label
              length is too long for one row (e.g. 'Найти специалистов
              сами' + 'Перейти к запросу'). When stacking, primary sits
              on top — RN doesn't support CSS `order`, so we render the
              JSX children in different sequence per branch. */}
          {(() => {
            const cancelLabel = current.cancelLabel ?? "Отмена";
            const confirmLabel = current.confirmLabel ?? (isConfirm ? "Подтвердить" : "OK");
            const stack = isConfirm && cancelLabel.length + confirmLabel.length > 24;
            const ConfirmIcon = current.confirmIcon
              ? CONFIRM_ICON_MAP[current.confirmIcon]
              : null;
            const PrimaryBtn = (
              <Pressable
                key="primary"
                accessibilityRole="button"
                accessibilityLabel={confirmLabel}
                onPress={() => resolve(true)}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: destructive ? colors.error : colors.primary,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {ConfirmIcon ? <ConfirmIcon size={16} color={colors.white} /> : null}
                <Text style={{ fontSize: 15, color: colors.white, fontWeight: "600" }}>
                  {confirmLabel}
                </Text>
              </Pressable>
            );
            const CancelBtn = isConfirm ? (
              <Pressable
                key="cancel"
                accessibilityRole="button"
                accessibilityLabel={cancelLabel}
                onPress={() => resolve(false)}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: "transparent",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 15, color: colors.text, fontWeight: "500" }}>
                  {cancelLabel}
                </Text>
              </Pressable>
            ) : null;
            return (
              <View
                style={{
                  flexDirection: stack ? "column" : "row",
                  gap: 8,
                  justifyContent: "flex-end",
                  marginTop: 4,
                }}
              >
                {/* Stacked: primary on top, cancel below.
                    Inline (single row): cancel on the left, primary on
                    the right (standard 'destructive on right' RTL). */}
                {stack ? PrimaryBtn : CancelBtn}
                {stack ? CancelBtn : PrimaryBtn}
              </View>
            );
          })()}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
