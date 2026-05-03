import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  Image,
  Platform,
} from "react-native";
import * as Linking from "expo-linking";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react-native";
import { getFileIcon, isImage, isPdf } from "@/lib/files";
import { colors } from "@/lib/theme";
import { dialog } from "@/lib/dialog";

export interface LightboxFile {
  url: string;
  filename: string;
  mimeType?: string;
}

interface LightboxProps {
  /** Files to show. If length > 1, navigation arrows are shown. */
  files: LightboxFile[];
  /** Index of the initially visible file. */
  initialIndex?: number;
  /** Whether the modal is open. */
  visible: boolean;
  /** Called when the modal should close. */
  onClose: () => void;
}

/**
 * Unified Lightbox modal used across the app.
 *
 * Image: full-screen resizeMode="contain".
 * PDF: iframe on web; download fallback on native.
 * Doc/other: icon + download button.
 * Multi-file: ← → navigation.
 * Web: backdrop click → close.
 */
export default function Lightbox({
  files,
  initialIndex = 0,
  visible,
  onClose,
}: LightboxProps) {
  const [idx, setIdx] = useState(initialIndex);

  // Reset index when files or initial index changes (new open event).
  const item = files[idx] ?? files[0];

  if (!item) return null;

  const mimeType = item.mimeType ?? "";
  const imageFile = isImage(mimeType);
  const pdfFile = isPdf(mimeType);
  const multi = files.length > 1;

  const goBack = () => setIdx((i) => Math.max(0, i - 1));
  const goNext = () => setIdx((i) => Math.min(files.length - 1, i + 1));

  const handleDownload = () => {
    if (Platform.OS === "web") {
      const a = document.createElement("a");
      a.href = item.url;
      a.download = item.filename;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      Linking.openURL(item.url).catch(() => {
        dialog.alert({ title: "Ошибка", message: "Не удалось открыть файл" });
      });
    }
  };

  const Icon = getFileIcon(mimeType);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop — clicking on it on web closes the modal */}
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.92)",
          justifyContent: "center",
          alignItems: "center",
        }}
        onPress={Platform.OS === "web" ? onClose : undefined}
        accessible={false}
      >
        {/* Inner content — stop propagation so clicking content doesn't close */}
        <Pressable
          style={{ flex: 1, width: "100%" }}
          onPress={(e) => e.stopPropagation?.()}
          accessible={false}
        >
          {/* Top bar: filename + close */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              flexDirection: "row",
              alignItems: "center",
              paddingTop: 48,
              paddingHorizontal: 16,
              paddingBottom: 12,
              backgroundColor: "rgba(0,0,0,0.4)",
            }}
          >
            <Text
              style={{
                flex: 1,
                color: "#fff",
                fontSize: 14,
                fontWeight: "600",
              }}
              numberOfLines={1}
            >
              {item.filename}
            </Text>
            {/* Download button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Скачать файл"
              onPress={handleDownload}
              style={({ pressed }) => [
                {
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 8,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Download size={18} color="#fff" />
            </Pressable>
            {/* Close button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Закрыть"
              onPress={onClose}
              style={({ pressed }) => [
                {
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <X size={20} color="#fff" />
            </Pressable>
          </View>

          {/* Main content area */}
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingTop: 100,
              paddingBottom: multi ? 80 : 40,
              paddingHorizontal: 16,
            }}
          >
            {imageFile ? (
              <Image
                source={{ uri: item.url }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
                accessibilityLabel={item.filename}
              />
            ) : pdfFile && Platform.OS === "web" ? (
              /* PDF on web: embedded iframe */
              <iframe
                src={item.url}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  borderRadius: 8,
                  background: "#fff",
                }}
                title={item.filename}
              />
            ) : (
              /* Doc/other or native PDF: icon + download prompt */
              <View style={{ alignItems: "center", paddingHorizontal: 32 }}>
                <Icon size={72} color="#fff" />
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: "600",
                    textAlign: "center",
                    marginTop: 20,
                    marginBottom: 8,
                  }}
                  numberOfLines={3}
                >
                  {item.filename}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Скачать файл"
                  onPress={handleDownload}
                  style={({ pressed }) => [
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: colors.primary,
                      paddingHorizontal: 24,
                      paddingVertical: 12,
                      borderRadius: 12,
                      gap: 8,
                      marginTop: 24,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Download size={16} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>
                    Скачать
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Navigation arrows (multi-file only) */}
          {multi && (
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingBottom: 24,
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Предыдущий файл"
                onPress={goBack}
                disabled={idx === 0}
                style={({ pressed }) => [
                  {
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: idx === 0 ? 0.3 : 1,
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <ChevronLeft size={24} color="#fff" />
              </Pressable>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                {idx + 1} / {files.length}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Следующий файл"
                onPress={goNext}
                disabled={idx === files.length - 1}
                style={({ pressed }) => [
                  {
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: idx === files.length - 1 ? 0.3 : 1,
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <ChevronRight size={24} color="#fff" />
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
