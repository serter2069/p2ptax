import { useState } from "react";
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
  // Auto-grow textarea: keep enough rows to render whatever the user has
  // typed. Capped at ~14 rows so a giant bio doesn't push everything else
  // off-screen — they can still scroll inside the textarea after that.
  const lineCount = Math.max(4, Math.min(14, description.split("\n").length + Math.floor(description.length / 60)));
  const [contentHeight, setContentHeight] = useState<number>(0);
  const minHeight = 96;
  const computedHeight = Math.max(minHeight, Math.min(contentHeight + 24, 380));

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
        onContentSizeChange={(e) => setContentHeight(e.nativeEvent.contentSize.height)}
        containerStyle={{ minHeight: computedHeight }}
      />
      <Text className="text-xs text-text-dim text-right mt-1">
        {description.length}/500
      </Text>
    </Card>
  );
}
