import { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, Linking, Platform, Image } from "react-native";
import { X, Download, FileText } from "lucide-react-native";
import { colors, gray } from "@/lib/theme";
import { api } from "@/lib/api";

export interface PreviewFile {
  id: string;
  url: string;        // raw key (MinIO) or full http(s) URL (legacy/external)
  filename: string;
  mimeType: string;
  size: number;
}

interface Props {
  file: PreviewFile | null;
  visible: boolean;
  onClose: () => void;
}

/**
 * In-page file preview modal: image / pdf / fallback. The preview is
 * resolved via /api/upload/signed-url for MinIO keys, or the URL is
 * used as-is when it's already an http(s) link (seeded files,
 * external attachments).
 *
 * Replaces the previous "click → Linking.openURL" behavior, which
 * jumped the user out of the page into a new tab. The user wanted to
 * inspect attachments without leaving the request and to download
 * explicitly via a button.
 */
export default function FilePreviewModal({ file, visible, onClose }: Props) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) {
      setResolvedUrl(null);
      return;
    }
    let cancelled = false;
    if (/^https?:\/\//i.test(file.url)) {
      setResolvedUrl(file.url);
      return;
    }
    setLoading(true);
    setResolvedUrl(null);
    api<{ url: string }>(
      `/api/upload/signed-url/${encodeURIComponent(file.url.replace(/^\/p2ptax\//, ""))}`
    )
      .then((res) => {
        if (cancelled) return;
        setResolvedUrl(res.url);
      })
      .catch(() => {
        if (cancelled) return;
        setResolvedUrl(null);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  if (!file) return null;

  const isImage = file.mimeType.startsWith("image/");
  const isPdf = file.mimeType === "application/pdf";

  const handleDownload = () => {
    if (!resolvedUrl) return;
    if (Platform.OS === "web") {
      // anchor with download attr triggers a save dialog rather than
      // navigation; presigned MinIO URLs honor Content-Disposition we
      // set server-side, but the explicit download attr forces it
      // even when the server wouldn't.
      const a = document.createElement("a");
      a.href = resolvedUrl;
      a.download = file.filename;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }
    Linking.openURL(resolvedUrl).catch(() => {});
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(15,23,42,0.65)",
          justifyContent: "center",
          alignItems: "center",
          padding: 16,
        }}
      >
        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: 16,
            width: "100%",
            maxWidth: 880,
            maxHeight: "90%",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 14,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              gap: 12,
            }}
          >
            <Text
              style={{ flex: 1, fontSize: 14, fontWeight: "600", color: colors.text }}
              numberOfLines={1}
            >
              {file.filename}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Скачать"
              onPress={handleDownload}
              disabled={!resolvedUrl}
              style={({ pressed }) => [
                {
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: resolvedUrl ? colors.primary : gray[200],
                  opacity: pressed ? 0.85 : 1,
                  gap: 6,
                },
              ]}
            >
              <Download size={14} color={colors.white} />
              <Text style={{ color: colors.white, fontSize: 13, fontWeight: "600" }}>
                Скачать
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Закрыть"
              onPress={onClose}
              style={{ padding: 6 }}
            >
              <X size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Body */}
          <View
            style={{
              minHeight: 320,
              maxHeight: 720,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.surface2,
            }}
          >
            {loading || !resolvedUrl ? (
              <Text style={{ color: colors.textSecondary, padding: 32 }}>
                {loading ? "Загрузка превью…" : "Не удалось загрузить файл"}
              </Text>
            ) : isImage ? (
              <Image
                source={{ uri: resolvedUrl }}
                resizeMode="contain"
                style={{ width: "100%", height: 600 }}
                accessibilityLabel={file.filename}
              />
            ) : isPdf && Platform.OS === "web" ? (
              <iframe
                src={resolvedUrl}
                title={file.filename}
                style={{
                  width: "100%",
                  height: 720,
                  border: "0",
                  backgroundColor: colors.white,
                }}
              />
            ) : (
              <View style={{ alignItems: "center", padding: 32, gap: 12 }}>
                <FileText size={42} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: "center" }}>
                  Превью недоступно для этого типа файла. Нажмите «Скачать» чтобы открыть его на устройстве.
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
