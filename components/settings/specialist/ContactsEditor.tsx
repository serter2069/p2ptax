import { View, Text } from "react-native";
import ContactMethodsList, {
  ContactMethodItem,
} from "@/components/settings/ContactMethodsList";

interface ContactsSectionProps {
  contacts: ContactMethodItem[];
  addingContact: boolean;
  newContactType: string;
  newContactValue: string;
  contactSaving: boolean;
  showTypePicker: boolean;
  onContactsChange: (items: ContactMethodItem[]) => void;
  onAddingContactChange: (v: boolean) => void;
  onNewContactTypeChange: (v: string) => void;
  onNewContactValueChange: (v: string) => void;
  onContactSavingChange: (v: boolean) => void;
  onShowTypePickerChange: (v: boolean) => void;
}

export default function ContactsEditor({
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
}: ContactsSectionProps) {
  return (
    <View className="bg-white border border-border rounded-2xl px-4 py-5 mb-4">
      <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
        Контакты
      </Text>
      <ContactMethodsList
        contacts={contacts}
        addingContact={addingContact}
        newContactType={newContactType}
        newContactValue={newContactValue}
        contactSaving={contactSaving}
        showTypePicker={showTypePicker}
        onContactsChange={onContactsChange}
        onAddingContactChange={onAddingContactChange}
        onNewContactTypeChange={onNewContactTypeChange}
        onNewContactValueChange={onNewContactValueChange}
        onContactSavingChange={onContactSavingChange}
        onShowTypePickerChange={onShowTypePickerChange}
      />
    </View>
  );
}
