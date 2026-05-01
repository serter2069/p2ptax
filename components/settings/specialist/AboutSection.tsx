import { Text } from "react-native";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";

interface AboutSectionProps {
  description: string;
  onChange: (v: string) => void;
  /** Called when the underlying input loses focus — used by autosave. */
  onBlur?: () => void;
}

export default function AboutSection({
  description,
  onChange,
  onBlur,
}: AboutSectionProps) {
  return (
    <Card padding="none" className="mb-4" style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
      <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
        О себе
      </Text>
      <Input
        variant="bordered"
        label="Описание"
        value={description}
        onChangeText={onChange}
        onBlur={onBlur ? () => onBlur() : undefined}
        placeholder="Расскажите о своём опыте и специализации..."
        multiline
        numberOfLines={4}
        maxLength={500}
      />
      <Text className="text-xs text-text-dim text-right mt-1">
        {description.length}/500
      </Text>
    </Card>
  );
}
