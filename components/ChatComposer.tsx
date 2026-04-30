import { View, Pressable, ActivityIndicator } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FileUploadZone, { type PendingFile } from "@/components/ui/FileUploadZone";
import Input from "@/components/ui/Input";
import { colors, radiusValue } from "@/lib/theme";

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
  /** Max files to attach. Defaults to 3. */
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
 * Combines the three building blocks of a chat input bar into one
 * component so both screens render the same UX:
 *
 *   - `FileUploadZone` (compact mode) — paperclip + chip strip +
 *     drag-and-drop overlay; uploads files immediately on pick.
 *   - `Input` (multi-line) — the actual text field, with NativeWind
 *     double-border guards.
 *   - send button — paperplane / spinner with disabled-state styling.
 *
 * For the long-form first-message textarea (character counter + min-length
 * hint) used inside `/requests/:id/write`, see
 * `components/requests/MessageComposer.tsx`.
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
  maxFiles = 3,
  maxSizeMB = 10,
  allowedTypes,
  placeholder = "Введите сообщение...",
  maxLength = 5000,
  accessibilityLabel = "Введите сообщение",
}: ChatComposerProps) {
  const canSend = !disabled && !sending && (value.trim().length > 0 || files.length > 0);

  return (
    <View className="flex-row items-end border-t border-border px-3 py-2 bg-white">
      {/* Shared upload control: paperclip button, chip preview strip,
          immediate upload to the chat-file endpoint, drag-and-drop overlay. */}
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
        style={{ flex: 1 }}
        containerStyle={{
          borderRadius: radiusValue.xl,
          minHeight: 40,
          maxHeight: 120,
          borderBottomWidth: 0,
          borderTopWidth: 0,
          borderLeftWidth: 0,
          borderRightWidth: 0,
        }}
      />

      {/* Send button. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Отправить сообщение"
        onPress={onSend}
        disabled={!canSend}
        className="w-11 h-11 items-center justify-center ml-2"
        style={({ pressed }) => [pressed && { opacity: 0.7 }]}
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
  );
}
