import { View, Text, Pressable } from "react-native";
import { File, FileImage, Download } from "lucide-react-native";
import { colors } from "@/lib/theme";
import { FileItem } from "./types";

interface Props {
  files: FileItem[];
  onFilePress: (file: FileItem) => void;
  isDesktop?: boolean;
}

// Issue #1610: hide block entirely when no files attached.
export default function RequestDocuments({ files, onFilePress, isDesktop }: Props) {
  if (files.length === 0) return null;

  const padding = isDesktop ? "p-5" : "p-4";

  return (
    <View
      className={`bg-white rounded-2xl ${padding} mb-4`}
      style={{
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <Text className="text-xs font-semibold text-text-mute mb-3 uppercase tracking-wide">
        Прикреплённые документы
      </Text>
      {files.map((file) => (
        <Pressable
          accessibilityRole="button"
          key={file.id}
          accessibilityLabel={`Открыть файл ${file.filename}`}
          onPress={() => onFilePress(file)}
          className="flex-row items-center bg-surface2 rounded-xl p-3 mb-2"
          style={({ pressed }) => [pressed && { opacity: 0.7 }]}
        >
          {file.mimeType === "application/pdf"
            ? <File size={20} color={colors.primary} />
            : <FileImage size={20} color={colors.primary} />
          }
          <View className="ml-3 flex-1">
            <Text className="text-sm text-text-base" numberOfLines={1}>
              {file.filename}
            </Text>
            <Text className="text-xs text-text-mute">
              {(file.size / 1024).toFixed(0)} КБ
            </Text>
          </View>
          <Download size={14} color={colors.placeholder} />
        </Pressable>
      ))}
    </View>
  );
}
