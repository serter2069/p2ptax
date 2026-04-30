import { View, Text, Pressable } from "react-native";
import Input from "@/components/ui/Input";
import CityFnsServicePicker from "@/components/shared/CityFnsServicePicker";
import type { CityOption as CityCascadeOption, ServiceOption } from "@/components/shared/CityFnsServicePicker";
import FileUploadSection, { AttachedFile } from "@/components/requests/FileUploadSection";
import { ChevronUp, ChevronDown } from "lucide-react-native";
import { colors } from "@/lib/theme";

interface RequestFormProps {
  title: string;
  description: string;
  cities: CityCascadeOption[];
  services: ServiceOption[];
  selectedCityId: string | null;
  selectedFnsId: string | null;
  selectedServiceId: string | null;
  submitted: boolean;
  atLimit: boolean;
  submitting: boolean;
  titleValid: boolean;
  descriptionValid: boolean;
  files: AttachedFile[];
  tipsOpen: boolean;
  setTitle: (val: string) => void;
  setDescription: (val: string) => void;
  setFiles: (val: AttachedFile[]) => void;
  setTipsOpen: (val: boolean) => void;
  onPickerChange: (v: { cityId: string | null; fnsId: string | null; serviceId: string | null }) => void;
}

export default function RequestForm({
  title, description, cities, services,
  selectedCityId, selectedFnsId, selectedServiceId,
  submitted, atLimit, submitting,
  titleValid, descriptionValid,
  files, tipsOpen,
  setTitle, setDescription, setFiles, setTipsOpen,
  onPickerChange,
}: RequestFormProps) {

  return (
    <View className="bg-white border border-border rounded-2xl px-4 pt-4 pb-4 mb-4">
      <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
        Описание запроса
      </Text>

      <View className="mb-4">
        <Text className="text-sm font-medium text-text-base mb-1.5">
          Заголовок <Text className="text-danger">*</Text>
        </Text>
        <Input
          placeholder="Кратко опишите суть проблемы"
          value={title}
          onChangeText={setTitle}
          error={
            (submitted || title.length > 0) && !titleValid
              ? title.trim().length < 3
                ? "Минимум 3 символа"
                : "Максимум 100 символов"
              : undefined
          }
          maxLength={100}
          editable={!atLimit && !submitting}
        />
        <Text className="text-xs text-text-dim text-right mt-1">
          {title.length}/100
        </Text>
      </View>

      {/* Negative margin compensates for cascade's internal px-4 so its
          chip rows align with the card's edge padding. */}
      <View className="mb-4 -mx-4">
        <CityFnsServicePicker
          cities={cities}
          services={services}
          cityId={selectedCityId}
          fnsId={selectedFnsId}
          serviceId={selectedServiceId}
          onChange={onPickerChange}
          submitted={submitted}
          disabled={atLimit || submitting}
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-text-base mb-1.5">
          Описание <Text className="text-danger">*</Text>
        </Text>
        <Input
          placeholder="Подробно опишите ситуацию: что произошло, какие документы получили, что требует инспекция, какая помощь нужна"
          value={description}
          onChangeText={setDescription}
          multiline
          error={
            (submitted || description.length > 0) && !descriptionValid
              ? description.trim().length < 10
                ? "Минимум 10 символов"
                : "Максимум 2000 символов"
              : undefined
          }
          maxLength={2000}
          editable={!atLimit && !submitting}
          containerStyle={{ minHeight: 120 }}
        />
        <Text className="text-xs text-text-dim text-right mt-1">
          {description.length}/2000
        </Text>
      </View>

      <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3 mt-2">
        Файлы
      </Text>
      <FileUploadSection
        files={files}
        disabled={atLimit || submitting}
        onFilesChange={setFiles}
      />
    </View>
  );
}

export function TipsSection({ tipsOpen, setTipsOpen }: { tipsOpen: boolean; setTipsOpen: (v: boolean) => void }) {
  return (
    <View className="mt-6 border border-border rounded-2xl overflow-hidden bg-white">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tipsOpen ? "Скрыть советы" : "Показать советы"}
        onPress={() => setTipsOpen(!tipsOpen)}
        className="flex-row items-center justify-between px-4 py-3 active:bg-surface2"
      >
        <Text className="text-sm font-semibold text-text-base">
          Советы: что указать в запросе
        </Text>
        {tipsOpen
          ? <ChevronUp size={16} color={colors.textMuted} />
          : <ChevronDown size={16} color={colors.textMuted} />}
      </Pressable>

      {tipsOpen && (
        <View className="px-4 py-3 border-t border-border" style={{ gap: 10 }}>
          <Tip title="Вид проверки" text="Камеральная, выездная или оперативный контроль — специалисты фильтруют по этому полю." />
          <Tip title="Регион ФНС" text="Инспекция и город определяют, кому покажут запрос в первую очередь." />
          <Tip title="Текущий этап" text="Требование получено, назначен выезд, решение вручено — это сужает круг экспертов." />
          <Tip title="Сроки и бюджет" text="Опишите рамки — так специалисты сразу напишут, берутся или нет." />
          <Tip title="Контакт" text="Телефон не обязателен: вся связь идёт через чат внутри сервиса." />
        </View>
      )}
    </View>
  );
}

function Tip({ title, text }: { title: string; text: string }) {
  return (
    <View>
      <Text className="text-text-base font-semibold" style={{ fontSize: 13 }}>
        {title}
      </Text>
      <Text
        className="text-text-mute"
        style={{ fontSize: 13, lineHeight: 19, marginTop: 2 }}
      >
        {text}
      </Text>
    </View>
  );
}
