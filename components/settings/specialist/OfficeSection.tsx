import { View, Text } from "react-native";
import Input from "@/components/ui/Input";

interface OfficeSectionProps {
  officeAddress: string;
  workingHours: string;
  onOfficeAddressChange: (v: string) => void;
  onWorkingHoursChange: (v: string) => void;
  /** Called when any input loses focus — used by autosave. */
  onBlur?: () => void;
}

export default function OfficeSection({
  officeAddress,
  workingHours,
  onOfficeAddressChange,
  onWorkingHoursChange,
  onBlur,
}: OfficeSectionProps) {
  return (
    <View className="bg-white border border-border rounded-2xl px-4 py-5 mb-4">
      <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
        Офис
      </Text>
      <View className="mb-3">
        <Input
          variant="bordered"
          label="Адрес офиса"
          value={officeAddress}
          onChangeText={onOfficeAddressChange}
          onBlur={onBlur ? () => onBlur() : undefined}
          placeholder="Город, улица, дом"
        />
      </View>
      <Input
        variant="bordered"
        label="Часы работы"
        value={workingHours}
        onChangeText={onWorkingHoursChange}
        onBlur={onBlur ? () => onBlur() : undefined}
        placeholder="Пн-Пт 9:00-18:00"
      />
    </View>
  );
}
