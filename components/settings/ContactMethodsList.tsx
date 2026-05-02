import { View, Text, Pressable, Alert } from "react-native";
import {
  Trash2, ChevronDown, Plus,
  Phone, Mail, Send, MessageCircle, MessageSquare, Globe, AtSign,
  type LucideIcon,
} from "lucide-react-native";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { apiPost, apiDelete } from "@/lib/api";
import { colors } from "@/lib/theme";
import { Z, layer } from "@/lib/zIndex";

export interface ContactMethodItem {
  id: string;
  type: string;
  value: string;
  label: string | null;
  order: number;
}

const CONTACT_TYPE_LABELS: Record<string, string> = {
  phone: "Телефон",
  email: "Email",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  max: "Max",
  vk: "ВКонтакте",
  website: "Сайт",
};

const CONTACT_TYPE_ICONS: Record<string, LucideIcon> = {
  phone: Phone,
  email: Mail,
  telegram: Send,
  whatsapp: MessageCircle,
  max: MessageSquare,
  vk: AtSign,
  website: Globe,
};

const CONTACT_TYPES = Object.keys(CONTACT_TYPE_LABELS);

interface ContactMethodsListProps {
  contacts: ContactMethodItem[];
  addingContact: boolean;
  newContactType: string;
  newContactValue: string;
  contactSaving: boolean;
  showTypePicker: boolean;
  onContactsChange: (contacts: ContactMethodItem[]) => void;
  onAddingContactChange: (val: boolean) => void;
  onNewContactTypeChange: (val: string) => void;
  onNewContactValueChange: (val: string) => void;
  onContactSavingChange: (val: boolean) => void;
  onShowTypePickerChange: (val: boolean) => void;
}

function placeholderFor(type: string): string {
  switch (type) {
    case "phone":
    case "whatsapp":
    case "max":
      return "+7 (___) ___-__-__";
    case "telegram":
      return "@username";
    case "email":
      return "email@example.com";
    case "vk":
      return "vk.com/username";
    default:
      return "https://example.com";
  }
}

function keyboardFor(type: string) {
  if (type === "phone" || type === "whatsapp" || type === "max") return "phone-pad" as const;
  if (type === "email") return "email-address" as const;
  return "default" as const;
}

export default function ContactMethodsList({
  contacts,
  addingContact,
  newContactType,
  newContactValue,
  contactSaving,
  showTypePicker,
  onContactsChange,
  onAddingContactChange,
  onNewContactTypeChange,
  onNewContactValueChange,
  onContactSavingChange,
  onShowTypePickerChange,
}: ContactMethodsListProps) {
  const handleAddContact = async () => {
    if (!newContactValue.trim()) {
      Alert.alert("Ошибка", "Введите значение контакта");
      return;
    }
    onContactSavingChange(true);
    try {
      const created = await apiPost<ContactMethodItem>("/api/profile/contacts", {
        type: newContactType,
        value: newContactValue.trim(),
        order: contacts.length,
      });
      onContactsChange([...contacts, created]);
      onAddingContactChange(false);
      onNewContactValueChange("");
      onNewContactTypeChange("phone");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Не удалось добавить контакт";
      Alert.alert("Ошибка", msg);
    } finally {
      onContactSavingChange(false);
    }
  };

  const handleDeleteContact = (id: string) => {
    Alert.alert("Удалить контакт?", "Это действие нельзя отменить", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          try {
            await apiDelete(`/api/profile/contacts/${id}`);
            onContactsChange(contacts.filter((c) => c.id !== id));
          } catch {
            Alert.alert("Ошибка", "Не удалось удалить контакт");
          }
        },
      },
    ]);
  };

  return (
    <View>
      {contacts.map((contact) => {
        const Icon = CONTACT_TYPE_ICONS[contact.type] ?? Globe;
        return (
          <View
            key={contact.id}
            className="flex-row items-center bg-surface2 border border-border rounded-xl px-4 py-3 mb-2"
          >
            <Icon size={18} color={colors.textMuted} style={{ marginRight: 12 }} />
            <View className="flex-1">
              <Text className="text-xs text-text-mute mb-0.5">
                {CONTACT_TYPE_LABELS[contact.type] || contact.type}
              </Text>
              <Text className="text-sm font-medium text-text-base">
                {contact.value}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Удалить контакт"
              onPress={() => handleDeleteContact(contact.id)}
              className="ml-2 p-2"
            >
              <Trash2 size={16} color={colors.error} />
            </Pressable>
          </View>
        );
      })}

      {addingContact ? (
        <View className="bg-surface2 border border-border rounded-xl p-4 mb-2">
          <Text className="text-sm font-medium text-text-base mb-2">Тип контакта</Text>

          <View style={{ position: "relative", zIndex: Z.STICKY, marginBottom: 12 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Выбрать тип контакта"
              onPress={() => onShowTypePickerChange(!showTypePicker)}
              className="flex-row items-center justify-between bg-white border border-border rounded-xl px-4 py-3"
            >
              <View className="flex-row items-center">
                {(() => {
                  const Icon = CONTACT_TYPE_ICONS[newContactType] ?? Globe;
                  return <Icon size={16} color={colors.textMuted} style={{ marginRight: 10 }} />;
                })()}
                <Text className="text-base text-text-base">
                  {CONTACT_TYPE_LABELS[newContactType]}
                </Text>
              </View>
              <ChevronDown size={14} color={colors.placeholder} />
            </Pressable>

            {showTypePicker && (
              <View
                className="absolute left-0 right-0 bg-white border border-border rounded-xl overflow-hidden"
                style={{
                  top: 52,
                  ...layer("POPOVER"),
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.1,
                  shadowRadius: 16,
                }}
              >
                {CONTACT_TYPES.map((t) => {
                  const Icon = CONTACT_TYPE_ICONS[t] ?? Globe;
                  const active = newContactType === t;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={t}
                      accessibilityLabel={CONTACT_TYPE_LABELS[t]}
                      onPress={() => {
                        onNewContactTypeChange(t);
                        onShowTypePickerChange(false);
                      }}
                      className={`flex-row items-center px-4 py-3 ${
                        active ? "bg-surface2" : ""
                      }`}
                    >
                      <Icon
                        size={16}
                        color={active ? colors.accent : colors.textMuted}
                        style={{ marginRight: 10 }}
                      />
                      <Text
                        className={`text-base ${
                          active ? "text-accent font-medium" : "text-text-base"
                        }`}
                      >
                        {CONTACT_TYPE_LABELS[t]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          <View className="mb-3">
            <Input
              variant="bordered"
              label="Значение"
              value={newContactValue}
              onChangeText={onNewContactValueChange}
              placeholder={placeholderFor(newContactType)}
              autoCapitalize="none"
              keyboardType={keyboardFor(newContactType)}
            />
          </View>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button
                variant="secondary"
                label="Отмена"
                onPress={() => {
                  onAddingContactChange(false);
                  onNewContactValueChange("");
                  onNewContactTypeChange("phone");
                  onShowTypePickerChange(false);
                }}
              />
            </View>
            <View className="flex-1">
              <Button
                label="Добавить"
                onPress={handleAddContact}
                disabled={contactSaving}
                loading={contactSaving}
              />
            </View>
          </View>
        </View>
      ) : contacts.length < 6 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Добавить контакт"
          onPress={() => onAddingContactChange(true)}
          className="flex-row items-center justify-center py-3 border border-dashed border-border rounded-xl mb-4"
        >
          <Plus size={14} color={colors.primary} />
          <Text className="text-sm text-accent ml-2 font-medium">
            Добавить контакт
          </Text>
        </Pressable>
      ) : (
        <Text className="text-xs text-text-mute text-center mb-4">
          Максимум 6 контактов
        </Text>
      )}
    </View>
  );
}
