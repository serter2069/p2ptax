import { View, Text, Pressable } from "react-native";
import Input from "@/components/ui/Input";
import CityFnsServicePicker, { CityOption, FnsOption, ServiceOption } from "@/components/requests/CityFnsServicePicker";
import FileUploadSection, { AttachedFile } from "@/components/requests/FileUploadSection";
import { ChevronUp, ChevronDown } from "lucide-react-native";
import { colors } from "@/lib/theme";

interface RequestFormProps {
  title: string;
  description: string;
  cities: CityOption[];
  fnsOffices: FnsOption[];
  services: ServiceOption[];
  selectedCity?: CityOption;
  selectedFns?: FnsOption;
  selectedService?: ServiceOption;
  cityOpen: boolean;
  fnsOpen: boolean;
  serviceOpen: boolean;
  loadingFns: boolean;
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
  setCityOpen: (val: boolean) => void;
  setFnsOpen: (val: boolean) => void;
  setServiceOpen: (val: boolean) => void;
  setTipsOpen: (val: boolean) => void;
  handleCitySelect: (city: CityOption) => void;
  handleFnsSelect: (fns: FnsOption) => void;
  handleServiceSelect: (svc: ServiceOption) => void;
  handleServiceClear: () => void;
}

export default function RequestForm({
  title, description, cities, fnsOffices, services,
  selectedCity, selectedFns, selectedService,
  cityOpen, fnsOpen, serviceOpen, loadingFns,
  submitted, atLimit, submitting,
  titleValid, descriptionValid,
  files, tipsOpen,
  setTitle, setDescription, setFiles,
  setCityOpen, setFnsOpen, setServiceOpen, setTipsOpen,
  handleCitySelect, handleFnsSelect, handleServiceSelect, handleServiceClear,
}: RequestFormProps) {

  return (
    <View className="bg-white border border-border rounded-2xl px-4 pt-4 pb-4 mb-4">
      <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
        Описание заявки
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

      <CityFnsServicePicker
        cities={cities}
        fnsOffices={fnsOffices}
        services={services}
        selectedCity={selectedCity}
        selectedFns={selectedFns}
        selectedService={selectedService}
        cityOpen={cityOpen}
        fnsOpen={fnsOpen}
        serviceOpen={serviceOpen}
        loadingFns={loadingFns}
        submitted={submitted}
        disabled={atLimit || submitting}
        onCitySelect={handleCitySelect}
        onFnsSelect={handleFnsSelect}
        onServiceSelect={handleServiceSelect}
        onServiceClear={handleServiceClear}
        onCityOpenChange={setCityOpen}
        onFnsOpenChange={setFnsOpen}
        onServiceOpenChange={setServiceOpen}
      />

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
          Советы: что указать в заявке
        </Text>
        {tipsOpen
          ? <ChevronUp size={16} color={colors.textMuted} />
          : <ChevronDown size={16} color={colors.textMuted} />}
      </Pressable>

      {tipsOpen && (
        <View className="px-4 py-3 border-t border-border" style={{ gap: 10 }}>
          <Tip title="Вид проверки" text="Камеральная, выездная или оперативный контроль — специалисты фильтруют по этому полю." />
          <Tip title="Регион ФНС" text="Инспекция и город определяют, кому покажут заявку в первую очередь." />
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
