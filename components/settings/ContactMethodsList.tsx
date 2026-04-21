import { View, Text, Pressable, Alert } from "react-native";
import { Trash2, ChevronDown, Plus } from "lucide-react-native";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { apiPost, apiDelete } from "@/lib/api";
import { colors } from "@/lib/theme";

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
  vk: "ВКонтакте",
  website: "Сайт",
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
      <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
        Контакты
      </Text>

      {contacts.map((contact) => (
        <View
          key={contact.id}
          className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-2"
        >
          <View className="flex-1">
            <Text className="text-xs text-slate-400 mb-0.5">
              {CONTACT_TYPE_LABELS[contact.type] || contact.type}
            </Text>
            <Text className="text-sm font-medium text-slate-900">
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
      ))}

      {addingContact ? (
        <View className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-2">
          <Text className="text-sm font-medium text-slate-900 mb-2">Тип контакта</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Выбрать тип контакта"
            onPress={() => onShowTypePickerChange(!showTypePicker)}
            className="flex-row items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 mb-3"
          >
            <Text className="text-base text-slate-900">
              {CONTACT_TYPE_LABELS[newContactType]}
            </Text>
            <ChevronDown size={12} color={colors.placeholder} />
          </Pressable>
          {showTypePicker && (
            <View className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-3">
              {CONTACT_TYPES.map((t) => (
                <Pressable
                  accessibilityRole="button"
                  key={t}
                  accessibilityLabel={CONTACT_TYPE_LABELS[t]}
                  onPress={() => {
                    onNewContactTypeChange(t);
                    onShowTypePickerChange(false);
                  }}
                  className={`px-4 py-3 border-b border-slate-100 ${
                    newContactType === t ? "bg-blue-50" : ""
                  }`}
                >
                  <Text
                    className={`text-base ${
                      newContactType === t ? "text-blue-900 font-medium" : "text-slate-700"
                    }`}
                  >
                    {CONTACT_TYPE_LABELS[t]}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          <View className="mb-3">
            <Input
              label="Значение"
              value={newContactValue}
              onChangeText={onNewContactValueChange}
              placeholder={
                newContactType === "phone" || newContactType === "whatsapp"
                  ? "+7 (___) ___-__-__"
                  : newContactType === "telegram"
                  ? "@username"
                  : newContactType === "email"
                  ? "email@example.com"
                  : newContactType === "vk"
                  ? "vk.com/username"
                  : "https://example.com"
              }
              autoCapitalize="none"
              keyboardType={
                newContactType === "phone" || newContactType === "whatsapp"
                  ? "phone-pad"
                  : newContactType === "email"
                  ? "email-address"
                  : "default"
              }
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
          className="flex-row items-center justify-center py-3 border border-dashed border-slate-300 rounded-xl mb-4"
        >
          <Plus size={14} color={colors.primary} />
          <Text className="text-sm text-blue-900 ml-2 font-medium">
            Добавить контакт
          </Text>
        </Pressable>
      ) : (
        <Text className="text-xs text-slate-400 text-center mb-4">
          Максимум 6 контактов
        </Text>
      )}
    </View>
  );
}
