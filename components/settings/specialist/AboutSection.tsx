import { View, Text } from "react-native";
import Input from "@/components/ui/Input";

interface AboutSectionProps {
  description: string;
  onChange: (v: string) => void;
}

export default function AboutSection({
  description,
  onChange,
}: AboutSectionProps) {
  return (
    <View className="bg-white border border-border rounded-2xl px-4 py-5 mb-4">
      <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
        О себе
      </Text>
      <Input
        variant="bordered"
        label="Описание"
        value={description}
        onChangeText={onChange}
        placeholder="Расскажите о своём опыте и специализации..."
        multiline
        numberOfLines={4}
        maxLength={500}
      />
      <Text className="text-xs text-text-dim text-right mt-1">
        {description.length}/500
      </Text>
    </View>
  );
}
