import { useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
} from "react-native";
import { X, AlertTriangle, Check } from "lucide-react-native";
import { colors } from "@/lib/theme";

interface ReportFnsModalProps {
  visible: boolean;
  onClose: () => void;
  fnsName: string;
}

const REASONS = [
  "Долгое ожидание / очереди",
  "Грубое отношение сотрудников",
  "Не отвечают на запросы",
  "Ошибки в начислениях / уведомлениях",
  "Закрытое отделение / переезд",
  "Другое",
];

/**
 * Модалка «Пожаловаться на ИФНС». Пока без отправки — собираем
 * категорию + комментарий и просто показываем экран успеха. Когда
 * появится бэкенд-эндпойнт `/api/fns/:id/complaints`, сюда
 * подключим POST.
 */
export default function ReportFnsModal({
  visible,
  onClose,
  fnsName,
}: ReportFnsModalProps) {
  const [reason, setReason] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleClose = () => {
    setReason(null);
    setComment("");
    setSubmitted(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: 16,
            width: "100%",
            maxWidth: 480,
            maxHeight: "90%",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <AlertTriangle size={20} color={colors.warning ?? "#f5a623"} />
            <Text
              style={{
                flex: 1,
                fontSize: 16,
                fontWeight: "700",
                color: colors.text,
              }}
            >
              {submitted ? "Жалоба отправлена" : "Пожаловаться на ИФНС"}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Закрыть"
              onPress={handleClose}
              hitSlop={8}
            >
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {submitted ? (
            <View style={{ padding: 24, alignItems: "center", gap: 12 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.limeSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Check size={28} color={colors.success} />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: colors.text,
                  textAlign: "center",
                }}
              >
                Спасибо за обратную связь
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.textSecondary,
                  textAlign: "center",
                  lineHeight: 19,
                }}
              >
                Мы изучим вашу жалобу и при необходимости свяжемся с вами. Это
                помогает другим пользователям выбирать инспекции с пониманием.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={handleClose}
                style={({ pressed }) => [
                  {
                    marginTop: 8,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                  },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={{ color: colors.white, fontWeight: "700", fontSize: 14 }}>
                  Закрыть
                </Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
              <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
                Жалоба на: <Text style={{ color: colors.text, fontWeight: "600" }}>{fnsName}</Text>
              </Text>

              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted }}>
                  ПРИЧИНА
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {REASONS.map((r) => {
                    const active = reason === r;
                    return (
                      <Pressable
                        key={r}
                        accessibilityRole="button"
                        onPress={() => setReason(r)}
                        style={({ pressed }) => [
                          {
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: active ? colors.primary : colors.border,
                            backgroundColor: active ? colors.primary : colors.white,
                          },
                          pressed && { opacity: 0.7 },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            color: active ? colors.white : colors.textSecondary,
                            fontWeight: active ? "600" : "400",
                          }}
                        >
                          {r}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted }}>
                  ПОДРОБНОСТИ (необязательно)
                </Text>
                <TextInput
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Опишите, что произошло"
                  placeholderTextColor={colors.placeholder}
                  multiline
                  numberOfLines={4}
                  style={{
                    fontSize: 14,
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 10,
                    padding: 12,
                    minHeight: 96,
                    textAlignVertical: "top",
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    outlineWidth: 0 as any,
                  }}
                />
              </View>

              <Pressable
                accessibilityRole="button"
                disabled={!reason}
                onPress={handleSubmit}
                style={({ pressed }) => [
                  {
                    marginTop: 4,
                    paddingHorizontal: 18,
                    paddingVertical: 13,
                    borderRadius: 12,
                    backgroundColor: reason ? colors.primary : colors.border,
                    alignItems: "center",
                  },
                  pressed && reason && { opacity: 0.85 },
                ]}
              >
                <Text style={{ color: colors.white, fontWeight: "700", fontSize: 15 }}>
                  Отправить жалобу
                </Text>
              </Pressable>

              <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: "center", lineHeight: 15 }}>
                Жалоба анонимная. Мы используем её для статистики качества инспекций.
              </Text>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
