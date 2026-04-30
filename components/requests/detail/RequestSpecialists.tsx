import { View, Text } from "react-native";
import { colors } from "@/lib/theme";
import ChatComposer, { type PendingFile } from "@/components/ChatComposer";
import SpecialistRecommendations, { SpecialistCard } from "@/components/requests/SpecialistRecommendations";

const FIRST_MESSAGE_MIN = 10;
const FIRST_MESSAGE_MAX = 2000;

interface Props {
  recommendations: SpecialistCard[];
  onOpenProfile: (specialistId: string) => void;
  onWrite: (specialistId: string) => void;
  // Inline composer — issue #1566
  showInlineComposer: boolean;
  composerText: string;
  composerFiles: PendingFile[];
  composerSending: boolean;
  composerError: string | null;
  authToken: string | null | undefined;
  onComposerChangeText: (text: string) => void;
  onComposerFilesChange: (files: PendingFile[]) => void;
  onComposerSend: () => void;
}

export default function RequestSpecialists({
  recommendations,
  onOpenProfile,
  onWrite,
  showInlineComposer,
  composerText,
  composerFiles,
  composerSending,
  composerError,
  authToken,
  onComposerChangeText,
  onComposerFilesChange,
  onComposerSend,
}: Props) {
  return (
    <>
      {/* Recommended specialists feed (horizontal scroll) — issue #1550 */}
      {recommendations.length > 0 && (
        <View className="mb-4">
          <SpecialistRecommendations
            recommendations={recommendations}
            onOpenProfile={onOpenProfile}
            onWrite={onWrite}
          />
        </View>
      )}

      {/* Inline message composer — issue #1566. Shown only for
          authenticated specialists with completed profile on
          non-closed requests. */}
      {showInlineComposer && (
        <View
          className="bg-white rounded-2xl mb-4 overflow-hidden"
          style={{
            shadowColor: colors.text,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View className="px-4 pt-4 pb-2">
            <Text className="text-xs font-semibold text-text-mute mb-1 uppercase tracking-wide">
              Написать клиенту
            </Text>
            <Text className="text-xs text-text-mute mb-2">
              Минимум {FIRST_MESSAGE_MIN} символов · можно прикрепить один файл (PDF, JPG, PNG до 10 МБ)
            </Text>
          </View>
          <ChatComposer
            value={composerText}
            onChangeText={onComposerChangeText}
            files={composerFiles}
            onFilesChange={onComposerFilesChange}
            onSend={onComposerSend}
            sending={composerSending}
            authToken={authToken}
            maxFiles={1}
            maxLength={FIRST_MESSAGE_MAX}
            placeholder="Напишите первое сообщение клиенту..."
            accessibilityLabel="Сообщение клиенту"
          />
          {composerError ? (
            <View className="px-4 py-2">
              <Text className="text-xs text-danger">{composerError}</Text>
            </View>
          ) : null}
        </View>
      )}
    </>
  );
}
