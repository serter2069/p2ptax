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
  // Auto-grow textarea — driven only by the derived lineCount, NEVER
  // by onContentSizeChange. The previous implementation tracked content
  // size into useState and used it to set the wrapper minHeight. On
  // web, RN-Web emits a fresh onContentSizeChange after the wrapper
  // resizes (because scrollHeight of a textarea matches its current
  // height), so the two states fed each other and React threw
  // 'Maximum update depth exceeded' the moment the user typed.
  //
  // On web RN translates numberOfLines → rows, and the browser sizes
  // the <textarea> from rows directly. No JS height tracking needed;
  // a 500-char bio caps at ~10 rows naturally.
  const lineCount = Math.max(
    4,
    Math.min(20, description.split("\n").length + Math.floor(description.length / 60)),
  );

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
        numberOfLines={lineCount}
        maxLength={500}
      />
      <Text className="text-xs text-text-dim text-right mt-1">
        {description.length}/500
      </Text>
    </Card>
  );
}
