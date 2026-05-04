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
  // Auto-grow textarea — fully unbounded. The 380px cap that used to be
  // here forced the user to scroll inside the field once their bio passed
  // ~10 lines, even though the entire page is already scrollable. Outer
  // scroll handles overflow now; minHeight just guards an empty box.
  const lineCount = Math.max(4, description.split("\n").length + Math.floor(description.length / 60));
  const [contentHeight, setContentHeight] = useState<number>(0);
  const minHeight = 96;
  const computedHeight = Math.max(minHeight, contentHeight + 24);

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
