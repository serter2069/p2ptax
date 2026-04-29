import { View, Text, Pressable } from "react-native";
import { Pencil } from "lucide-react-native";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import ContactMethodsList, {
  ContactMethodItem,
} from "@/components/settings/ContactMethodsList";
import { colors } from "@/lib/theme";

interface FnsServiceItem {
  fns: { id: string; name: string; code: string };
  city: { id: string; name: string };
  services: { id: string; name: string }[];
}

interface SpecialistProfileData {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  isAvailable: boolean;
  profile: {
    description: string | null;
    phone: string | null;
    telegram: string | null;
    whatsapp: string | null;
    officeAddress: string | null;
    workingHours: string | null;
  } | null;
  fnsServices: FnsServiceItem[];
}

interface SpecialistTabProps {
  isSpecialistUser: boolean;
  specLoading: boolean;
  specData: SpecialistProfileData | null;
  description: string;
  officeAddress: string;
  workingHours: string;
  contacts: ContactMethodItem[];
  addingContact: boolean;
  newContactType: string;
  newContactValue: string;
  contactSaving: boolean;
  showTypePicker: boolean;
  onDescriptionChange: (v: string) => void;
  onOfficeAddressChange: (v: string) => void;
  onWorkingHoursChange: (v: string) => void;
  onContactsChange: (items: ContactMethodItem[]) => void;
  onAddingContactChange: (v: boolean) => void;
  onNewContactTypeChange: (v: string) => void;
  onNewContactValueChange: (v: string) => void;
  onContactSavingChange: (v: boolean) => void;
  onShowTypePickerChange: (v: boolean) => void;
  onGoToProfileTab: () => void;
  onGoToWorkArea: () => void;
}

export default function SpecialistTab({
  isSpecialistUser,
  specLoading,
  specData,
  description,
  officeAddress,
  workingHours,
  contacts,
  addingContact,
  newContactType,
  newContactValue,
  contactSaving,
  showTypePicker,
  onDescriptionChange,
  onOfficeAddressChange,
  onWorkingHoursChange,
  onContactsChange,
  onAddingContactChange,
  onNewContactTypeChange,
  onNewContactValueChange,
  onContactSavingChange,
  onShowTypePickerChange,
  onGoToProfileTab,
  onGoToWorkArea,
}: SpecialistTabProps) {
  if (!isSpecialistUser) {
    return (
      <View className="bg-white border border-border rounded-2xl px-5 py-8 mb-4 items-center">
        <Text className="text-base font-semibold text-text-base mb-2 text-center">
          Режим специалиста выключен
        </Text>
        <Text className="text-sm text-text-mute text-center mb-4">
          Включите его на вкладке Профиль, чтобы редактировать профиль специалиста.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={onGoToProfileTab}
          className="px-4 py-2 rounded-xl bg-accent-soft"
        >
          <Text className="text-sm font-medium text-accent">
            Перейти на Профиль
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      {/* Описание */}
      <View className="bg-white border border-border rounded-2xl px-4 py-5 mb-4">
        <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
          О себе
        </Text>
        <Input
          label="Описание"
          value={description}
          onChangeText={onDescriptionChange}
          placeholder="Расскажите о своём опыте и специализации..."
          multiline
          numberOfLines={4}
          maxLength={500}
        />
        <Text className="text-xs text-text-dim text-right mt-1">
          {description.length}/500
        </Text>
      </View>

      {/* ИФНС и услуги */}
      <View className="bg-white border border-border rounded-2xl px-4 py-5 mb-4">
        <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
          ИФНС и услуги
        </Text>
        {specLoading ? (
          <LoadingState variant="skeleton" lines={3} />
        ) : specData && specData.fnsServices.length === 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Добавить рабочую зону"
            onPress={onGoToWorkArea}
            className="flex-row items-center justify-center py-3 border border-dashed border-border rounded-xl"
          >
            <Text className="text-sm text-accent font-medium">
              + Добавить ИФНС и услуги
            </Text>
          </Pressable>
        ) : (
          <>
            {specData?.fnsServices.map((item) => (
              <View
                key={item.fns.id}
                className="bg-surface2 rounded-xl p-3 mb-2 border border-border"
              >
                <Text className="text-sm font-semibold text-text-base">
                  {item.city.name} — {item.fns.name}
                </Text>
                <Text className="text-xs text-text-mute mb-1">
                  {item.fns.code}
                </Text>
                <View className="flex-row flex-wrap gap-1 mt-1">
                  {item.services.map((s) => (
                    <View
                      key={s.id}
                      className="bg-accent-soft px-2.5 py-0.5 rounded-full"
                    >
                      <Text className="text-xs font-medium text-accent">
                        {s.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Изменить рабочую зону"
              onPress={onGoToWorkArea}
              className="flex-row items-center justify-center py-2 mt-1"
            >
              <Pencil size={13} color={colors.accent} />
              <Text className="text-sm text-accent ml-1.5 font-medium">
                Изменить рабочую зону
              </Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Контакты */}
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

      {/* Офис */}
      <View className="bg-white border border-border rounded-2xl px-4 py-5 mb-4">
        <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
          Офис
        </Text>
        <View className="mb-3">
          <Input
            label="Адрес офиса"
            value={officeAddress}
            onChangeText={onOfficeAddressChange}
            placeholder="Город, улица, дом"
          />
        </View>
        <Input
          label="Часы работы"
          value={workingHours}
          onChangeText={onWorkingHoursChange}
          placeholder="Пн-Пт 9:00-18:00"
        />
      </View>
    </>
  );
}

export type { SpecialistProfileData, FnsServiceItem };
