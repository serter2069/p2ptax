import { View, Text, Pressable } from "react-native";
import { Paperclip, X } from "lucide-react-native";
import { colors } from "@/lib/theme";

export interface PendingFileInfo {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
}

interface FileAttachmentRowProps {
  pendingFile: PendingFileInfo | null;
  onAttach: () => void;
  onRemove: () => void;
  disabled?: boolean;
  error?: string | null;
}

/**
 * Inline file attachment control: either an "Attach file" pill or a chip
 * showing the currently selected file with a remove button.
 */
export default function FileAttachmentRow({
  pendingFile,
  onAttach,
  onRemove,
  disabled = false,
  error,
}: FileAttachmentRowProps) {
  return (
    <View className="mt-3">
      {pendingFile ? (
        <View className="flex-row items-center justify-between bg-slate-100 border border-slate-200 rounded-xl px-3 py-2">
          <View className="flex-1 mr-2">
            <Text className="text-sm text-slate-900" numberOfLines={1}>
              {pendingFile.name}
            </Text>
            <Text className="text-xs text-slate-500">
              {(pendingFile.size / 1024).toFixed(0)} КБ
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Удалить файл"
            onPress={onRemove}
            hitSlop={8}
            className="p-1"
          >
            <X size={18} color={colors.text} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityLabel="Прикрепить файл"
          onPress={onAttach}
          disabled={disabled}
          className="flex-row items-center self-start px-3 py-2 rounded-xl border border-slate-200 bg-white"
          style={{ opacity: disabled ? 0.5 : 1 }}
        >
          <Paperclip size={16} color={colors.text} />
          <Text className="text-sm text-slate-700 ml-2">Прикрепить файл</Text>
        </Pressable>
      )}
      {error ? <Text className="text-xs text-red-500 mt-2">{error}</Text> : null}
    </View>
  );
}
