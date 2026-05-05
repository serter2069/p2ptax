import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Platform, Pressable, View, Text, ActivityIndicator, TextInput } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FileUploadZone, {
  FileUploadChips,
  type PendingFile,
} from "@/components/ui/FileUploadZone";
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
  /**
   * Optional ref to a parent element that should be the drag-and-drop
   * target instead of the composer itself. When present, files dropped
   * anywhere over that element are uploaded — used by InlineChatView
   * so the whole chat surface (messages list + composer) accepts a
   * file drop, not just the input row.
   */
  externalDropTargetRef?: React.RefObject<HTMLElement | null>;
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
  externalDropTargetRef,
}: ChatComposerProps) {
  const canSend =
    !disabled && !sending && (value.trim().length > 0 || files.length > 0);

  // Auto-expand: textarea grows with content up to MAX_HEIGHT (≈5 rows)
  // then scrolls. MIN_HEIGHT matches the 44px paperclip + send buttons so
  // the single-line state sits centered on the icons.
  //
  // Web and native take different paths:
  //   - Web: classic textarea-autogrow trick — set height='auto' to let
  //     the textarea collapse, read scrollHeight, set height. Both grow
  //     and shrink work cleanly. Driven by useEffect on `value`.
  //   - Native: onContentSizeChange fires reliably on both grow and
  //     shrink for native multiline TextInput, so a state-driven
  //     `height: inputHeight` is enough.
  const MIN_HEIGHT = 44;
  const MAX_HEIGHT = 140;
  const [inputHeight, setInputHeight] = useState(MIN_HEIGHT);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const captureTextareaRef = (node: unknown) => {
    textareaRef.current = (node as HTMLTextAreaElement | null) ?? null;
  };
  // Run autogrow synchronously *after* DOM mutation but *before* paint,
  // so the user never sees a frame with the previous height. Plain
  // useEffect runs after paint → one stale frame → the visible "jump"
  // the user noticed when typing fast or pressing Enter.
  useLayoutEffect(() => {
    if (Platform.OS !== "web") return;
    const el = textareaRef.current;
    if (!el) return;
    // Reset to auto so scrollHeight reflects the natural content size,
    // not the previous applied height. Then clamp to MAX_HEIGHT so the
    // textarea scrolls instead of growing forever. The lower bound is
    // enforced by paddingVertical (12+20+12 = 44) baked into the
    // textarea style — no Math.max needed.
    el.style.height = "auto";
    el.style.height = Math.min(MAX_HEIGHT, el.scrollHeight) + "px";
  }, [value]);

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
          dropTargetRef={externalDropTargetRef ?? dropZoneRef}
          onDragStateChange={setIsDragOver}
        />

        {/* Wrapper around the TextInput. The textarea itself owns its
            min height via paddingVertical (12+20+12 = 44), so the
            wrapper just bounds it from above (maxHeight) and stretches
            with grown content. items-end on the parent row keeps the
            paperclip/send icons pinned to the bottom as the textarea
            grows. */}
        <View
          style={{
            flex: 1,
            maxHeight: MAX_HEIGHT,
          }}
        >
          <TextInput
            ref={captureTextareaRef as never}
            accessibilityLabel={accessibilityLabel}
            placeholder={placeholder}
            placeholderTextColor={colors.placeholder}
            value={value}
            onChangeText={onChangeText}
            multiline
            maxLength={maxLength}
            editable={!disabled}
            textAlignVertical="top"
            onContentSizeChange={
              Platform.OS === "web"
                ? undefined
                : (e) => {
                    const h = e.nativeEvent.contentSize.height;
                    setInputHeight(Math.min(Math.max(20, h), MAX_HEIGHT));
                  }
            }
            style={{
              // Vertical centering of single-line text is done via
              // paddingVertical, NOT by toggling line-height between
              // 20 and 44. The toggle was the source of the "jump":
              // the moment a user pressed Enter, line-height collapsed
              // from 44→20 and the first line of text shifted ~12px up
              // while scrollHeight (= lines × line-height) shrank from
              // 44 to 40 — so the textarea got SHORTER as the user
              // added content. Stable line-height + symmetric padding
              // gives a smooth grow: 44 → 64 → 84 → 104 → 124 → 140.
              paddingTop: 12,
              paddingBottom: 12,
              paddingHorizontal: 12,
              borderWidth: 0,
              fontSize: 14,
              lineHeight: 20,
              color: colors.text,
              backgroundColor: "transparent",
              borderRadius: radiusValue.xl,
              ...(Platform.OS === "web"
                ? {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    outlineWidth: 0 as any,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    outlineStyle: "none" as any,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    resize: "none" as any,
                    // RN-Web ignores `border: 0` from style sometimes;
                    // belt-and-suspenders explicit border-* zeroing.
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    borderStyle: "none" as any,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    boxSizing: "content-box" as any,
                  }
                : { height: inputHeight }),
            }}
          />
        </View>

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
