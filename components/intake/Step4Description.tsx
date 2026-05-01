import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import Input from "@/components/ui/Input";
import FileUploadSection, {
  type AttachedFile,
} from "@/components/requests/FileUploadSection";
import { colors } from "@/lib/theme";
import type { DocumentType } from "./types";

interface Step4Props {
  documentType: DocumentType | null;
  description: string;
  disputedAmount: string;
  files: AttachedFile[];
  /** Auth token — null when anon (file upload then hidden until OTP completes). */
  authToken: string | null;
  isAuthenticated: boolean;
  submitting: boolean;
  onChangeDescription: (v: string) => void;
  onChangeDisputedAmount: (v: string) => void;
  onChangeFiles: (files: AttachedFile[]) => void;
}

const DESC_MAX = 2000;

const PLACEHOLDER_BY_TYPE: Record<DocumentType, string> = {
  TREBOVANIE:
    "Например: ФНС запрашивает документы по контрагенту ООО Ромашка за 2024 год. Не понимаю, что предоставить.",
  RESHENIE:
    "Например: получили акт камеральной проверки с доначислением 1.2 млн, не согласны с выводами по контрагенту.",
  VYEZDNAYA:
    "Например: уведомили о выездной за 2022–2024 гг., нужно подготовить документы и сопровождение.",
  OTHER:
    "Опишите ситуацию своими словами — что произошло, какие документы есть, что хотите получить.",
};

/**
 * Step 4 — narrative + optional fields + file upload. The "Дополнительно"
 * accordion stays collapsed by default to keep the surface light; users
 * with a disputed amount tap to reveal.
 */
export default function Step4Description({
  documentType,
  description,
  disputedAmount,
  files,
  authToken,
  isAuthenticated,
  submitting,
  onChangeDescription,
  onChangeDisputedAmount,
  onChangeFiles,
}: Step4Props) {
  const [extraOpen, setExtraOpen] = useState(false);

  const placeholder = documentType
    ? PLACEHOLDER_BY_TYPE[documentType]
    : PLACEHOLDER_BY_TYPE.OTHER;

  const showAmountByDefault =
    documentType === "RESHENIE" || documentType === "VYEZDNAYA";
  const extraExpanded = extraOpen || showAmountByDefault;

  return (
    <View>
      <Text className="text-2xl font-bold text-text-base mb-2">
        Кратко опишите ситуацию
      </Text>
      <Text className="text-sm text-text-mute mb-6 leading-5">
        Чем подробнее, тем точнее специалисты оценят сложность и помогут.
        Если можете — приложите сам документ от ФНС.
      </Text>

      <View className="mb-4">
        <Text className="text-sm font-medium text-text-base mb-1.5">
          Описание <Text className="text-danger">*</Text>
        </Text>
        <Input
          variant="bordered"
          placeholder={placeholder}
          value={description}
          onChangeText={onChangeDescription}
          multiline
          maxLength={DESC_MAX}
          editable={!submitting}
          containerStyle={{ minHeight: 140 }}
        />
        <Text
          className={`text-xs text-right mt-1 ${
            description.length >= DESC_MAX ? "text-danger" : "text-text-dim"
          }`}
        >
          {description.length}/{DESC_MAX}
        </Text>
      </View>

      {/* "Дополнительно" — collapsed by default; expanded for RESHENIE/VYEZDNAYA */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Дополнительные поля"
        onPress={() => setExtraOpen((s) => !s)}
        className="flex-row items-center justify-between py-3"
      >
        <Text className="text-sm font-semibold text-text-base">
          Дополнительно
        </Text>
        {extraExpanded ? (
          <ChevronUp size={18} color={colors.text} />
        ) : (
          <ChevronDown size={18} color={colors.text} />
        )}
      </Pressable>
      {extraExpanded && (
        <View className="mb-4">
          <Text className="text-sm font-medium text-text-base mb-1.5">
            Сумма доначислений (если есть)
          </Text>
          <Input
            variant="bordered"
            placeholder="например, 1500000"
            value={disputedAmount}
            onChangeText={(v) => {
              // Strip non-digits so backend math doesn't have to.
              const digits = v.replace(/\D+/g, "").slice(0, 13);
              onChangeDisputedAmount(digits);
            }}
            keyboardType="numeric"
            editable={!submitting}
          />
          <Text className="text-xs text-text-dim mt-1">
            В рублях, целое число. Поможет специалисту быстрее оценить кейс.
          </Text>
        </View>
      )}

      {/* File upload — auth-only; anon path defers until after OTP. */}
      {isAuthenticated ? (
        <FileUploadSection
          files={files}
          disabled={submitting}
          onFilesChange={onChangeFiles}
          authToken={authToken}
        />
      ) : (
        <View
          className="rounded-xl p-3 mt-2"
          style={{
            backgroundColor: colors.accentSoft,
            borderWidth: 1,
            borderColor: colors.primary,
          }}
        >
          <Text className="text-sm" style={{ color: colors.accentSoftInk }}>
            После подтверждения email вы сможете приложить документ от ФНС
            (PDF, фото). Это сильно ускорит ответ.
          </Text>
        </View>
      )}
    </View>
  );
}
