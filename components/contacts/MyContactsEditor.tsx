import { useEffect, useState } from "react";
import { View, Text, Pressable, Modal, ActivityIndicator } from "react-native";
import {
  Trash2,
  ChevronDown,
  Plus,
  Phone,
  Mail,
  Send,
  MessageCircle,
  MessageSquare,
  Globe,
  type LucideIcon,
} from "lucide-react-native";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { dialog } from "@/lib/dialog";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { colors } from "@/lib/theme";

export interface UserContactRow {
  id: string;
  kind: string;
  value: string;
  label: string | null;
  sortOrder: number;
}

// Тот же набор и UX, что у специалиста (components/settings/
// ContactMethodsList) — просто другой эндпоинт + другая модель
// (UserContact вместо ContactMethod). Пользователь жаловался что
// тут был свой собственный плохой UX; восстанавливаем единообразие.
const KIND_LABELS: Record<string, string> = {
  phone: "Телефон",
  email: "Email",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  // Max — российский мессенджер VK, по номеру телефона.
  max: "Max",
  other: "Другое",
};
const KIND_ICONS: Record<string, LucideIcon> = {
  phone: Phone,
  email: Mail,
  telegram: Send,
  whatsapp: MessageCircle,
  max: MessageSquare,
  other: Globe,
};
const KINDS = Object.keys(KIND_LABELS);

function placeholderFor(kind: string): string {
  switch (kind) {
    case "phone":
    case "whatsapp":
    case "max":
      return "+7 (___) ___-__-__";
    case "telegram":
      return "@username";
    case "email":
      return "email@example.com";
    default:
      return "ссылка / ник / адрес";
  }
}

function keyboardFor(kind: string) {
  if (kind === "phone" || kind === "whatsapp" || kind === "max") return "phone-pad" as const;
  if (kind === "email") return "email-address" as const;
  return "default" as const;
}

interface Props {
  /** Колбэк после любого изменения списка. */
  onChange?: (items: UserContactRow[]) => void;
}

/**
 * Редактор контактов клиента — UX идентичен ContactMethodsList у
 * специалиста: список карточек + кнопка «Добавить контакт» снизу,
 * раскрывающаяся в форму с Modal-пикером типа.
 *
 * Используется на /profile (постоянная секция) и инлайн на
 * /requests/new (когда тумблер «Открыть мои прямые контакты» включён).
 */
export default function MyContactsEditor({ onChange }: Props) {
  const [contacts, setContacts] = useState<UserContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newKind, setNewKind] = useState<string>("phone");
  const [newValue, setNewValue] = useState("");
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<{ items: UserContactRow[] }>("/api/user/contacts")
      .then((res) => {
        setContacts(res.items);
        onChange?.(res.items);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async () => {
    if (!newValue.trim()) {
      dialog.alert({ title: "Ошибка", message: "Введите значение контакта" });
      return;
    }
    setSaving(true);
    try {
      const created = await apiPost<UserContactRow>("/api/user/contacts", {
        kind: newKind,
        value: newValue.trim(),
      });
      const next = [...contacts, created];
      setContacts(next);
      onChange?.(next);
      setAdding(false);
      setNewValue("");
      setNewKind("phone");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Не удалось добавить контакт";
      dialog.alert({ title: "Ошибка", message: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await dialog.confirm({
      title: "Удалить контакт?",
      message: "Это действие нельзя отменить",
      confirmLabel: "Удалить",
      destructive: true,
    });
    if (!ok) return;
    try {
      await apiDelete(`/api/user/contacts/${id}`);
      const next = contacts.filter((c) => c.id !== id);
      setContacts(next);
      onChange?.(next);
    } catch {
      dialog.alert({ title: "Ошибка", message: "Не удалось удалить контакт" });
    }
  };

  if (loading) {
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View>
      {contacts.map((contact) => {
        const Icon = KIND_ICONS[contact.kind] ?? Globe;
        return (
          <View
            key={contact.id}
            className="flex-row items-center bg-surface2 border border-border rounded-xl px-4 py-3 mb-2"
          >
            <Icon size={18} color={colors.textMuted} style={{ marginRight: 12 }} />
            <View className="flex-1">
              <Text className="text-xs text-text-mute mb-0.5">
                {KIND_LABELS[contact.kind] ?? contact.kind}
              </Text>
              <Text className="text-sm font-medium text-text-base">{contact.value}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Удалить контакт"
              onPress={() => handleDelete(contact.id)}
              className="ml-2 p-2"
            >
              <Trash2 size={16} color={colors.error} />
            </Pressable>
          </View>
        );
      })}

      {adding ? (
        <View className="bg-surface2 border border-border rounded-xl p-4 mb-2">
          <Text className="text-sm font-medium text-text-base mb-2">Тип контакта</Text>

          <View style={{ marginBottom: 12 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Выбрать тип контакта"
              onPress={() => setShowTypePicker(true)}
              className="flex-row items-center justify-between bg-white border border-border rounded-xl px-4 py-3"
            >
              <View className="flex-row items-center">
                {(() => {
                  const Icon = KIND_ICONS[newKind] ?? Globe;
                  return <Icon size={16} color={colors.textMuted} style={{ marginRight: 10 }} />;
                })()}
                <Text className="text-base text-text-base">{KIND_LABELS[newKind]}</Text>
              </View>
              <ChevronDown size={14} color={colors.placeholder} />
            </Pressable>
          </View>

          <Modal
            transparent
            animationType="fade"
            visible={showTypePicker}
            onRequestClose={() => setShowTypePicker(false)}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Закрыть"
              onPress={() => setShowTypePicker(false)}
              style={{
                flex: 1,
                backgroundColor: "rgba(15, 23, 42, 0.45)",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
              }}
            >
              <Pressable
                onPress={() => {}}
                style={{
                  backgroundColor: colors.white,
                  borderRadius: 16,
                  width: "100%",
                  maxWidth: 360,
                  paddingVertical: 8,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.18,
                  shadowRadius: 32,
                }}
              >
                <Text
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{
                    color: colors.textMuted,
                    paddingHorizontal: 16,
                    paddingTop: 8,
                    paddingBottom: 8,
                  }}
                >
                  Тип контакта
                </Text>
                {KINDS.map((t) => {
                  const Icon = KIND_ICONS[t] ?? Globe;
                  const active = newKind === t;
                  return (
                    <Pressable
                      key={t}
                      accessibilityRole="button"
                      accessibilityLabel={KIND_LABELS[t]}
                      onPress={() => {
                        setNewKind(t);
                        setShowTypePicker(false);
                      }}
                      className={`flex-row items-center px-4 py-3 ${active ? "bg-surface2" : ""}`}
                    >
                      <Icon
                        size={18}
                        color={active ? colors.accent : colors.textMuted}
                        style={{ marginRight: 12 }}
                      />
                      <Text
                        className={`text-base ${active ? "text-accent font-medium" : "text-text-base"}`}
                      >
                        {KIND_LABELS[t]}
                      </Text>
                    </Pressable>
                  );
                })}
              </Pressable>
            </Pressable>
          </Modal>

          <View className="mb-3">
            <Input
              variant="bordered"
              label="Значение"
              value={newValue}
              onChangeText={setNewValue}
              placeholder={placeholderFor(newKind)}
              autoCapitalize="none"
              keyboardType={keyboardFor(newKind)}
            />
          </View>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button
                variant="secondary"
                label="Отмена"
                onPress={() => {
                  setAdding(false);
                  setNewValue("");
                  setNewKind("phone");
                  setShowTypePicker(false);
                }}
              />
            </View>
            <View className="flex-1">
              <Button label="Добавить" onPress={handleAdd} disabled={saving} loading={saving} />
            </View>
          </View>
        </View>
      ) : contacts.length < 6 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Добавить контакт"
          onPress={() => setAdding(true)}
          className="flex-row items-center justify-center py-3 border border-dashed border-border rounded-xl mb-2"
        >
          <Plus size={14} color={colors.primary} />
          <Text className="text-sm text-accent ml-2 font-medium">Добавить контакт</Text>
        </Pressable>
      ) : (
        <Text className="text-xs text-text-mute text-center mb-2">Максимум 6 контактов</Text>
      )}
    </View>
  );
}
