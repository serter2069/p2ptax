import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { MapPin } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HeaderBack from "@/components/HeaderBack";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import { api, apiPost } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/lib/theme";
import CityFnsServicePicker, {
  CityOption,
  FnsOption,
  ServiceOption,
} from "@/components/requests/CityFnsServicePicker";

const DRAFT_KEY = "pending_request_draft";

interface RequestDraft {
  title: string;
  description: string;
  cityId: string | null;
  citySlug: string | null;
  fnsId: string | null;
  serviceId: string | null;
}

export default function CreateRequest() {
  const router = useRouter();
  const nav = useTypedRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const params = useLocalSearchParams<{ restore?: string }>();
  const restoreMode = params.restore === "1";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedFnsId, setSelectedFnsId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

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
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [atLimit, setAtLimit] = useState(false);

  // Load cities/services — public, no auth required
  useEffect(() => {
    async function init() {
      try {
        const [citiesRes, servicesRes] = await Promise.all([
          api<{ items: CityOption[] }>("/api/cities", { noAuth: true }),
          api<{ items: ServiceOption[] }>("/api/services", { noAuth: true }),
        ]);
        setCities(citiesRes.items);
        setServices(servicesRes.items);
      } catch {
        setLoadError(true);
      } finally {
        setLoadingInit(false);
      }
    }
    init();
  }, []);

  // Check request limit when authenticated
  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    api<{ requestsUsed: number; requestsLimit: number }>("/api/dashboard/stats")
      .then((stats) => {
        if (stats.requestsUsed >= stats.requestsLimit) {
          setAtLimit(true);
        }
      })
      .catch(() => {});
  }, [isAuthenticated, authLoading]);

  const loadFnsForCity = useCallback(async (citySlug: string) => {
    setLoadingFns(true);
    setFnsOffices([]);
    try {
      const data = await api<{
        city: { id: string; name: string; slug: string };
        items: FnsOption[];
      }>(`/api/cities/${citySlug}/ifns`, { noAuth: true });
      setFnsOffices(data.items);
    } catch {
      /* silent */
    } finally {
      setLoadingFns(false);
    }
  }, []);

  // Restore draft after post-login redirect
  useEffect(() => {
    if (!restoreMode || loadingInit) return;
    AsyncStorage.getItem(DRAFT_KEY)
      .then((raw) => {
        if (!raw) return;
        const draft: RequestDraft = JSON.parse(raw);
        if (draft.title) setTitle(draft.title);
        if (draft.description) setDescription(draft.description);
        if (draft.cityId) setSelectedCityId(draft.cityId);
        if (draft.fnsId) setSelectedFnsId(draft.fnsId);
        if (draft.serviceId) setSelectedServiceId(draft.serviceId);
        if (draft.citySlug) loadFnsForCity(draft.citySlug);
        AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
      })
      .catch(() => {});
  }, [restoreMode, loadingInit, loadFnsForCity]);

  const handleCitySelect = useCallback(
    (city: CityOption) => {
      setSelectedCityId(city.id);
      setSelectedFnsId(null);
      setCityOpen(false);
      loadFnsForCity(city.slug);
    },
    [loadFnsForCity]
  );

  const handleFnsSelect = useCallback((fns: FnsOption) => {
    setSelectedFnsId(fns.id);
    setFnsOpen(false);
  }, []);

  const handleServiceSelect = useCallback((svc: ServiceOption) => {
    setSelectedServiceId(svc.id);
    setServiceOpen(false);
  }, []);

  const titleValid = title.trim().length >= 3 && title.trim().length <= 100;
  const descriptionValid =
    description.trim().length >= 10 && description.trim().length <= 2000;

  const formValid =
    titleValid && descriptionValid && !!selectedCityId && !!selectedFnsId && !atLimit;

  const handleSubmit = useCallback(async () => {
    setSubmitted(true);
    setSubmitError("");

    if (!formValid || submitting) return;

    // Not logged in — save draft and redirect to auth with returnTo
    if (!isAuthenticated) {
      const selectedCity = cities.find((c) => c.id === selectedCityId);
      const draft: RequestDraft = {
        title: title.trim(),
        description: description.trim(),
        cityId: selectedCityId,
        citySlug: selectedCity?.slug ?? null,
        fnsId: selectedFnsId,
        serviceId: selectedServiceId,
      };
      try {
        await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        /* ignore storage errors */
      }
      nav.any({
        pathname: "/login",
        params: { returnTo: "/requests/create?restore=1" },
      });
      return;
    }

    // Logged in — submit directly
    setSubmitting(true);
    try {
      const result = await apiPost<{ id: string }>("/api/requests", {
        title: title.trim(),
        cityId: selectedCityId,
        fnsId: selectedFnsId,
        serviceId: selectedServiceId || undefined,
        description: description.trim(),
        files: [],
      });
      nav.replaceAny(`/requests/${result.id}/detail`);
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : "Не удалось опубликовать заявку. Проверьте данные и попробуйте ещё раз.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [
    formValid,
    submitting,
    isAuthenticated,
    title,
    description,
    cities,
    selectedCityId,
    selectedFnsId,
    selectedServiceId,
    nav,
  ]);

  const selectedCity = cities.find((c) => c.id === selectedCityId);
  const selectedFns = fnsOffices.find((f) => f.id === selectedFnsId);
  const selectedService = services.find((s) => s.id === selectedServiceId);

  if (authLoading || loadingInit) {
    return (
      <SafeAreaView className="flex-1 bg-surface2">
        <HeaderBack title="Создать заявку" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (loadError && cities.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-surface2">
        <HeaderBack title="Создать заявку" />
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
      <HeaderBack title="Создать заявку" />
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
          {/* Info banner for unauthenticated users */}
          {!isAuthenticated && (
            <View className="bg-accent-soft border border-accent rounded-xl p-4 mb-4">
              <Text className="text-sm font-semibold text-accent mb-0.5">
                Войдите, чтобы опубликовать заявку
              </Text>
              <Text className="text-sm text-accent">
                Заполните форму — после входа заявка будет отправлена автоматически.
              </Text>
            </View>
          )}

          {atLimit && (
            <View className="bg-danger-soft border border-danger rounded-xl p-4 mb-4">
              <Text className="text-danger text-sm font-semibold mb-0.5">
                Лимит заявок исчерпан
              </Text>
              <Text className="text-danger text-sm">
                Закройте неактуальные заявки, чтобы создать новую.
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
            label={
              isAuthenticated
                ? "Опубликовать заявку"
                : "Продолжить (войти и отправить)"
            }
            onPress={handleSubmit}
            disabled={submitting || atLimit}
            loading={submitting}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
