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
  // Auto-grow textarea. Capped high (1200px ≈ ~50 lines) so the field
  // can't grow without bound — without an upper bound onContentSizeChange
  // and the wrapper's minHeight feed each other and React throws
  // 'Maximum update depth exceeded'. The cap is never visible to a
  // 500-char bio (≈8–10 lines).
  const lineCount = Math.max(4, description.split("\n").length + Math.floor(description.length / 60));
  const [contentHeight, setContentHeight] = useState<number>(0);
  const MIN_HEIGHT = 96;
  const MAX_HEIGHT = 1200;
  const computedHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, contentHeight + 24));

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
        onContentSizeChange={(e) => {
          // Bail if the new height is within 1px of the cached value —
          // RN-Web emits onContentSizeChange whenever the wrapper resizes,
          // which would re-trigger this and re-resize the wrapper, etc.
          // The 1px hysteresis breaks the feedback loop without needing
          // a hard cap.
          const next = e.nativeEvent.contentSize.height;
          setContentHeight((prev) => (Math.abs(prev - next) < 1 ? prev : next));
        }}
        containerStyle={{ minHeight: computedHeight }}
      />
      <Text className="text-xs text-text-dim text-right mt-1">
        {description.length}/500
      </Text>
    </Card>
  );
}
