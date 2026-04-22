import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import HeaderBack from "@/components/HeaderBack";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
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
  const { ready } = useRequireAuth();

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedFnsId, setSelectedFnsId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [files, setFiles] = useState<AttachedFile[]>([]);

  // Data
  const [cities, setCities] = useState<CityOption[]>([]);
  const [fnsOffices, setFnsOffices] = useState<FnsOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);

  // UI state
  const [cityOpen, setCityOpen] = useState(false);
  const [fnsOpen, setFnsOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [loadingFns, setLoadingFns] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);
  const [atLimit, setAtLimit] = useState(false);
  const [limitInfo, setLimitInfo] = useState({ used: 0, limit: 5 });
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Load cities, services, and check limit on mount
  useEffect(() => {
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
      } finally {
        setLoadingInit(false);
      }
    }
    init();
  }, []);

  // Load FNS offices when city changes
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
      // silent — user can retry by reselecting city
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

  // Validation
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

  if (!ready || loadingInit) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <HeaderBack title="Новая заявка" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <HeaderBack title="Новая заявка" />
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <ResponsiveContainer>
          <View className="py-4">

            {/* Limit banner */}
            {atLimit && (
              <View className="bg-danger-soft border border-red-200 rounded-xl p-4 mb-4">
                <Text className="text-danger text-sm font-medium">
                  Лимит заявок исчерпан ({limitInfo.used}/{limitInfo.limit}). Закройте неактуальные заявки, чтобы создать новую.
                </Text>
              </View>
            )}

            {/* Title */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-text-base mb-1.5">
                Заголовок <Text className="text-danger">*</Text>
              </Text>
              <Input
                placeholder="Кратко опишите суть проблемы"
                value={title}
                onChangeText={setTitle}
                error={(submitted || title.length > 0) && !titleValid
                  ? (title.trim().length < 3 ? "Минимум 3 символа" : "Максимум 100 символов")
                  : undefined}
                maxLength={100}
                editable={!atLimit && !submitting}
              />
              <Text className="text-xs text-text-mute text-right mt-1">{title.length}/100</Text>
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
              onServiceClear={() => { setSelectedServiceId(null); setServiceOpen(false); }}
              onCityOpenChange={setCityOpen}
              onFnsOpenChange={setFnsOpen}
              onServiceOpenChange={setServiceOpen}
            />

            {/* Description */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-text-base mb-1.5">
                Описание <Text className="text-danger">*</Text>
              </Text>
              <Input
                placeholder="Подробно опишите ситуацию: что произошло, какие документы получили, что требует инспекция, какая помощь нужна"
                value={description}
                onChangeText={setDescription}
                multiline
                error={(submitted || description.length > 0) && !descriptionValid
                  ? (description.trim().length < 10 ? "Минимум 10 символов" : "Максимум 2000 символов")
                  : undefined}
                maxLength={2000}
                editable={!atLimit && !submitting}
                containerStyle={{ minHeight: 120 }}
              />
              <Text className="text-xs text-text-mute text-right mt-1">{description.length}/2000</Text>
            </View>

            <FileUploadSection
              files={files}
              disabled={atLimit || submitting}
              onFilesChange={setFiles}
            />

            {/* Submit error */}
            {submitError ? (
              <View className="bg-danger-soft border border-red-200 rounded-xl p-3 mb-4">
                <Text className="text-sm font-medium text-danger mb-0.5">Ошибка публикации</Text>
                <Text className="text-sm text-danger">{submitError}</Text>
              </View>
            ) : null}

          </View>
        </ResponsiveContainer>
      </ScrollView>

      {/* Sticky submit button */}
      <View className="border-t border-border px-4 py-3 bg-white">
        <View style={{ maxWidth: 520, width: "100%", alignSelf: "center" }}>
          <Button
            label="Опубликовать заявку"
            onPress={handleSubmit}
            disabled={submitting || atLimit}
            loading={submitting}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
