import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react-native";
import HeaderBack from "@/components/HeaderBack";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import { api, apiPost } from "@/lib/api";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { colors } from "@/lib/theme";
import CityFnsServicePicker, {
  CityOption,
  FnsOption,
  ServiceOption,
} from "@/components/requests/CityFnsServicePicker";
import FileUploadSection, { AttachedFile } from "@/components/requests/FileUploadSection";

export default function NewRequest() {
  const router = useRouter();
  const { ready, isLoading, isAuthenticated } = useRequireAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedFnsId, setSelectedFnsId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [files, setFiles] = useState<AttachedFile[]>([]);

  const [cities, setCities] = useState<CityOption[]>([]);
  const [fnsOffices, setFnsOffices] = useState<FnsOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);

  const [cityOpen, setCityOpen] = useState(false);
  const [fnsOpen, setFnsOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [loadingFns, setLoadingFns] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [atLimit, setAtLimit] = useState(false);
  const [limitInfo, setLimitInfo] = useState({ used: 0, limit: 5 });
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [tipsOpen, setTipsOpen] = useState(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    async function init() {
      try {
        const [citiesRes, servicesRes, statsRes] = await Promise.all([
          api<{ items: CityOption[] }>("/api/cities", { noAuth: true }),
          api<{ items: ServiceOption[] }>("/api/services", { noAuth: true }),
          api<{ requestsUsed: number; requestsLimit: number }>("/api/dashboard/stats"),
        ]);
        setCities(citiesRes.items);
        setServices(servicesRes.items);
        setLimitInfo({ used: statsRes.requestsUsed, limit: statsRes.requestsLimit });
        if (statsRes.requestsUsed >= statsRes.requestsLimit) {
          setAtLimit(true);
        }
      } catch (e) {
        console.error("Init error:", e);
        setLoadError(true);
      } finally {
        setLoadingInit(false);
      }
    }
    init();
  }, [isLoading, isAuthenticated]);

  const loadFnsForCity = useCallback(async (citySlug: string) => {
    setLoadingFns(true);
    setFnsOffices([]);
    try {
      const data = await api<{ city: { id: string; name: string; slug: string }; items: FnsOption[] }>(
        `/api/cities/${citySlug}/ifns`,
        { noAuth: true }
      );
      setFnsOffices(data.items);
    } catch {
      /* silent */
    } finally {
      setLoadingFns(false);
    }
  }, []);

  const handleCitySelect = useCallback((city: CityOption) => {
    setSelectedCityId(city.id);
    setSelectedFnsId(null);
    setCityOpen(false);
    loadFnsForCity(city.slug);
  }, [loadFnsForCity]);

  const handleFnsSelect = useCallback((fns: FnsOption) => {
    setSelectedFnsId(fns.id);
    setFnsOpen(false);
  }, []);

  const handleServiceSelect = useCallback((svc: ServiceOption) => {
    setSelectedServiceId(svc.id);
    setServiceOpen(false);
  }, []);

  const titleValid = title.trim().length >= 3 && title.trim().length <= 100;
  const descriptionValid = description.trim().length >= 10 && description.trim().length <= 2000;
  const filesReady = files.every((f) => !f.uploading && !f.error);

  const formValid =
    titleValid &&
    descriptionValid &&
    !!selectedCityId &&
    !!selectedFnsId &&
    !atLimit &&
    filesReady;

  const handleSubmit = useCallback(async () => {
    setSubmitted(true);
    setSubmitError("");

    if (!formValid || submitting) return;

    setSubmitting(true);
    try {
      const fileUrls = files
        .filter((f) => f.uploadedUrl)
        .map((f) => f.uploadedUrl as string);

      const result = await apiPost<{ id: string }>("/api/requests", {
        title: title.trim(),
        cityId: selectedCityId,
        fnsId: selectedFnsId,
        serviceId: selectedServiceId || undefined,
        description: description.trim(),
        files: fileUrls,
      });

      router.replace(`/requests/${result.id}/detail` as never);
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : "Не удалось опубликовать заявку. Проверьте данные и попробуйте ещё раз.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [formValid, submitting, title, selectedCityId, selectedFnsId, selectedServiceId, description, files, router]);

  const selectedCity = cities.find((c) => c.id === selectedCityId);
  const selectedFns = fnsOffices.find((f) => f.id === selectedFnsId);
  const selectedService = services.find((s) => s.id === selectedServiceId);

  if (isLoading || (ready && loadingInit)) {
    return (
      <SafeAreaView className="flex-1 bg-surface2">
        <HeaderBack title="Новая заявка" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (loadError && cities.length === 0 && services.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-surface2">
        <HeaderBack title="Новая заявка" />
        <View className="flex-1 items-center justify-center">
          <EmptyState
            icon={MapPin}
            title="Не удалось загрузить данные"
            subtitle="Проверьте соединение и попробуйте снова"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface2">
      <HeaderBack title="Новая заявка" />
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 720,
            alignSelf: "center",
            paddingHorizontal: 16,
            paddingTop: 16,
          }}
        >
          {atLimit && (
            <View className="bg-danger-soft border border-danger rounded-xl p-4 mb-4">
              <Text className="text-danger text-sm font-semibold mb-0.5">
                Лимит заявок исчерпан
              </Text>
              <Text className="text-danger text-sm">
                {limitInfo.used}/{limitInfo.limit} заявок использовано. Закройте
                неактуальные, чтобы создать новую.
              </Text>
            </View>
          )}

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
              onServiceClear={() => {
                setSelectedServiceId(null);
                setServiceOpen(false);
              }}
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

          {submitError ? (
            <View className="bg-danger-soft border border-danger rounded-xl p-3 mb-4">
              <Text className="text-sm font-semibold text-danger mb-0.5">
                Ошибка публикации
              </Text>
              <Text className="text-sm text-danger">{submitError}</Text>
            </View>
          ) : null}

          <Button
            label="Опубликовать заявку"
            onPress={handleSubmit}
            disabled={submitting || atLimit}
            loading={submitting}
          />

          {/* Collapsible tips */}
          <View className="mt-6 border border-border rounded-2xl overflow-hidden bg-white">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tipsOpen ? "Скрыть советы" : "Показать советы"}
              onPress={() => setTipsOpen((v) => !v)}
              className="flex-row items-center justify-between px-4 py-3 active:bg-surface2"
            >
              <Text className="text-sm font-semibold text-text-base">
                Советы: что указать в заявке
              </Text>
              {tipsOpen ? (
                <ChevronUp size={16} color={colors.textMuted} />
              ) : (
                <ChevronDown size={16} color={colors.textMuted} />
              )}
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
        </View>
      </ScrollView>
    </SafeAreaView>
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
