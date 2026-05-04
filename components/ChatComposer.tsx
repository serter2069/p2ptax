import { useRef, useState } from "react";
import { Platform, Pressable, View, Text, ActivityIndicator } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FileUploadZone, {
  FileUploadChips,
  type PendingFile,
} from "@/components/ui/FileUploadZone";
import Input from "@/components/ui/Input";
import { colors, radiusValue } from "@/lib/theme";
import { Z } from "@/lib/zIndex";

export type { PendingFile };

interface ChatComposerProps {
  /** Text value (controlled). */
  value: string;
  /** Text change handler. */
  onChangeText: (next: string) => void;
  /** Pending files (uploaded immediately on pick by FileUploadZone). */
  files: PendingFile[];
  /** Pending files setter. */
  onFilesChange: (files: PendingFile[]) => void;
  /** Send handler — invoked on send button press. */
  onSend: () => void;
  /** Sending in flight (disables send + shows spinner). */
  sending?: boolean;
  /** Disable everything (e.g. closed thread / rate-limited). */
  disabled?: boolean;
  /** Bearer token for the upload endpoint. */
  authToken?: string | null;
  /** Upload endpoint — e.g. `/api/upload/chat-file`. */
  uploadEndpoint?: string;
  /** Max files to attach. Defaults to 10 (raised from 3 — bug #3). */
  maxFiles?: number;
  /** Max bytes per file (in MB). Defaults to 10. */
  maxSizeMB?: number;
  /** Allowed mime types. Defaults to PDF / JPG / PNG. */
  allowedTypes?: string[];
  /** Placeholder text inside the input. */
  placeholder?: string;
  /** Hard cap for character count. */
  maxLength?: number;
  /** Accessibility label for the text field. */
  accessibilityLabel?: string;
}

/**
 * Unified chat-style composer used by:
 *   - `/threads/:id` (live chat — InlineChatView)
 *   - `/requests/:id/detail` (specialist quick-reply / new-thread send)
 *
 * Layout (column):
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ [chip] [chip] [chip] …                                    │  ← chips row (above input)
 *   ├──────────────────────────────────────────────────────────┤
 *   │ [paperclip] [text input …………………………] [send]               │  ← input row
 *   └──────────────────────────────────────────────────────────┘
 *
 * The whole composer wrapper is the drag-and-drop target — dropping a file
 * anywhere over the composer triggers the upload. (Bug #2 fix: previously
 * the listeners were attached to the paperclip-sized container only.)
 *
 * Chips are rendered ABOVE the input row, never inside it, so the input
 * area keeps a fixed height even with multiple attached files.
 * (Bug #4 fix: file list expanded the input row and broke chat layout.)
 */
export default function ChatComposer({
  value,
  onChangeText,
  files,
  onFilesChange,
  onSend,
  sending = false,
  disabled = false,
  authToken,
  uploadEndpoint = "/api/upload/chat-file",
  maxFiles = 10,
  maxSizeMB = 10,
  allowedTypes,
  placeholder = "Введите сообщение...",
  maxLength = 5000,
  accessibilityLabel = "Введите сообщение",
}: ChatComposerProps) {
  const canSend =
    !disabled && !sending && (value.trim().length > 0 || files.length > 0);

  // Auto-expand: track TextInput content height, clamped between
  // MIN_HEIGHT and MAX_HEIGHT (≈5 rows). MIN_HEIGHT matches the 44px
  // square of the paperclip + send buttons so the single-line state
  // sits perfectly centered on the icons (was 36 before — left the
  // placeholder visually below the icons). When the input grows past
  // 44, items-end pins the icons to the bottom and the text wraps up.
  const MIN_HEIGHT = 44;
  const MAX_HEIGHT = 140;
  const [inputHeight, setInputHeight] = useState(MIN_HEIGHT);

  // Composer-wide drop target — used by FileUploadZone via dropTargetRef.
  // RN-Web forwards the ref to the underlying <div>, but RN's typings still
  // claim it's a `View`. We use a callback ref to capture the host node and
  // store it in `dropZoneRef.current` as an HTMLElement.
  const dropZoneRef = useRef<HTMLElement | null>(null);
  const setDropZoneNode = (node: unknown) => {
    dropZoneRef.current = (node as HTMLElement | null) ?? null;
  };
  const [isDragOver, setIsDragOver] = useState(false);

  const removeFile = (id: string) => {
    onFilesChange(files.filter((f) => f.id !== id));
  };

  return (
    <View
      ref={setDropZoneNode}
      className="border-t border-border bg-white"
      style={{ position: "relative" }}
    >
      {/* Composer-wide drag overlay (web only).
          Painted across both rows so users get visual feedback no matter
          where over the composer they're hovering with the dragged file. */}
      {isDragOver && Platform.OS === "web" && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: Z.DRAG,
            backgroundColor: "rgba(59,130,246,0.10)",
            borderWidth: 2,
            borderStyle: "dashed",
            borderColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "600" }}>
            Отпустите чтобы прикрепить
          </Text>
        </View>
      )}

      {/* Chip strip above the input — caps height via internal flex-wrap. */}
      <FileUploadChips files={files} onRemove={removeFile} />

      <View className="flex-row items-end px-3 py-2">
        {/* Shared upload control: paperclip button + drag handler.
            Compact mode + dropTargetRef → only the button is rendered;
            chips and the drop overlay are painted by this composer. */}
        <FileUploadZone
          files={files}
          onFilesChange={onFilesChange}
          uploadEndpoint={uploadEndpoint}
          authToken={authToken}
          maxFiles={maxFiles}
          maxSizeMB={maxSizeMB}
          allowedTypes={allowedTypes}
          compact
          disabled={disabled || sending}
          dropTargetRef={dropZoneRef}
          onDragStateChange={setIsDragOver}
        />

        {/* Text input — strip Input's underline; only the parent strip's
            top border is visible, otherwise web stacks a double-border. */}
        <Input
          accessibilityLabel={accessibilityLabel}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          multiline
          maxLength={maxLength}
          editable={!disabled}
          onContentSizeChange={(e) => {
            const h = e.nativeEvent.contentSize.height;
            setInputHeight(Math.min(Math.max(MIN_HEIGHT, h), MAX_HEIGHT));
          }}
          style={{ flex: 1 }}
          containerStyle={{
            borderRadius: radiusValue.xl,
            height: inputHeight,
            // Explicit minHeight beats the Input component's default 80px
            // multiline floor — composer needs to start at the same 44px
            // height as the paperclip / send buttons so the single-line
            // text sits centered on the icons.
            minHeight: MIN_HEIGHT,
            paddingVertical: 12,
            borderBottomWidth: 0,
            borderTopWidth: 0,
            borderLeftWidth: 0,
            borderRightWidth: 0,
          }}
        />

        {/* Send button — aligned to flex-end so it stays at bottom when input expands. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Отправить сообщение"
          onPress={onSend}
          disabled={!canSend}
          style={({ pressed }) => [
            {
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              marginLeft: 8,
              alignSelf: "flex-end",
              marginBottom: 0,
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <FontAwesome
              name="send"
              size={20}
              color={canSend ? colors.primary : colors.textSecondary}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}
