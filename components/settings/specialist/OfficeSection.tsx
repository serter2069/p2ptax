import { View, Text } from "react-native";
import Input from "@/components/ui/Input";

interface OfficeSectionProps {
  officeAddress: string;
  workingHours: string;
  onOfficeAddressChange: (v: string) => void;
  onWorkingHoursChange: (v: string) => void;
}

export default function OfficeSection({
  officeAddress,
  workingHours,
  onOfficeAddressChange,
  onWorkingHoursChange,
}: OfficeSectionProps) {
  return (
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
  );
}
