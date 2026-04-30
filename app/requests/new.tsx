import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  useWindowDimensions,
} from "react-native";
import StyledSwitch from "@/components/ui/StyledSwitch";
import LandingHeader from "@/components/landing/LandingHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { MapPin, ChevronLeft, RefreshCw } from "lucide-react-native";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { api, apiPost } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/lib/theme";
import type {
  CityOption,
  ServiceOption,
} from "@/components/shared/CityFnsServicePicker";
import CityFnsCascade from "@/components/filters/CityFnsCascade";
import InlineOtpFlow from "@/components/requests/InlineOtpFlow";
import FileUploadZone, { type PendingFile } from "@/components/ui/FileUploadZone";
import { draftStorage } from "@/lib/draftStorage";
import EmptyState from "@/components/ui/EmptyState";

// Single canonical key (v1). Replaces legacy "pending_request_draft".
const DRAFT_KEY = "p2ptax_request_draft_v1";
const LEGACY_DRAFT_KEY = "pending_request_draft";

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
  const { isAuthenticated, isLoading: authLoading, token } = useAuth();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ restore?: string }>();
  const restoreMode = params.restore === "1";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedFnsId, setSelectedFnsId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  const [cities, setCities] = useState<CityOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);

  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [showOtpFlow, setShowOtpFlow] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<PendingFile[]>([]);

  // Load cities/services — public, no auth required. Re-runs on retry.
  useEffect(() => {
    setLoadingInit(true);
    setLoadError(false);
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
  }, [retryCount]);

  // Restore draft on mount (anyone — anon or returning post-login).
  // Reads new key first, falls back to legacy key for in-flight users.
  // FNS list is fetched internally by CityFnsCascade once selectedCityId is set.
  useEffect(() => {
    if (loadingInit || draftLoaded) return;
    (async () => {
      try {
        let raw = await draftStorage.get(DRAFT_KEY);
        if (!raw) {
          raw = await draftStorage.get(LEGACY_DRAFT_KEY);
          if (raw) {
            // Migrate legacy → v1 key, then drop the old one.
            await draftStorage.set(DRAFT_KEY, raw);
            await draftStorage.del(LEGACY_DRAFT_KEY);
          }
        }
        if (raw) {
          const draft: RequestDraft = JSON.parse(raw);
          if (draft.title) setTitle(draft.title);
          if (draft.description) setDescription(draft.description);
          if (draft.cityId) setSelectedCityId(draft.cityId);
          if (draft.fnsId) setSelectedFnsId(draft.fnsId);
          if (draft.serviceId) setSelectedServiceId(draft.serviceId);
        }
      } catch {
        /* ignore parse / storage errors */
      } finally {
        setDraftLoaded(true);
        if (restoreMode) {
          // legacy returnTo path — already restored, nothing else to do.
        }
      }
    })();
  }, [loadingInit, draftLoaded, restoreMode]);

  // Persist draft on every form-field change (after initial load to avoid wiping).
  useEffect(() => {
    if (!draftLoaded) return;
    const selectedCity = cities.find((c) => c.id === selectedCityId);
    const draft: RequestDraft = {
      title,
      description,
      cityId: selectedCityId,
      citySlug: selectedCity?.slug ?? null,
      fnsId: selectedFnsId,
      serviceId: selectedServiceId,
    };
    const isEmpty =
      !draft.title &&
      !draft.description &&
      !draft.cityId &&
      !draft.fnsId &&
      !draft.serviceId;
    if (isEmpty) return;
    draftStorage.set(DRAFT_KEY, JSON.stringify(draft)).catch(() => {});
  }, [
    draftLoaded,
    title,
    description,
    selectedCityId,
    selectedFnsId,
    selectedServiceId,
    cities,
  ]);

  const handleCascadeChange = useCallback(
    (v: { cities: string[]; fns: string[] }) => {
      setSelectedCityId(v.cities[0] ?? null);
      setSelectedFnsId(v.fns[0] ?? null);
    },
    []
  );

  const titleValid = title.trim().length >= 3 && title.trim().length <= 100;
  const descriptionValid =
    description.trim().length >= 10 && description.trim().length <= 2000;

  const formValid =
    titleValid && descriptionValid && !!selectedCityId && !!selectedFnsId;

  // Actually post the request — used by both auth and post-OTP paths.
  const submitRequestAuthed = useCallback(async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const fileIds = attachedFiles
        .filter((f) => !!f.uploadedId && f.status === "done")
        .map((f) => f.uploadedId as string);
      const result = await apiPost<{ id: string }>("/api/requests", {
        title: title.trim(),
        cityId: selectedCityId,
        fnsId: selectedFnsId,
        serviceId: selectedServiceId || undefined,
        description: description.trim(),
        fileIds,
        isPublic,
      });
      // Clear draft on success.
      await draftStorage.del(DRAFT_KEY).catch(() => {});
      await draftStorage.del(LEGACY_DRAFT_KEY).catch(() => {});

      const goToDetail = () => nav.replaceAny(`/requests/${result.id}/detail`);
      if (Platform.OS === "web") {
        goToDetail();
      } else {
        Alert.alert(
          "Запрос опубликован",
          "Специалисты по вашей ФНС увидят его и напишут вам. Обычно первый отклик приходит в течение 24 часов.",
          [{ text: "OK", onPress: goToDetail }],
          { onDismiss: goToDetail }
        );
      }
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : "Не удалось опубликовать запрос. Проверьте данные и попробуйте ещё раз.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [title, description, selectedCityId, selectedFnsId, selectedServiceId, nav, attachedFiles, isPublic]);

  const handleSubmit = useCallback(async () => {
    setSubmitted(true);
    setSubmitError("");
    if (!formValid || submitting) return;

    if (isAuthenticated) {
      await submitRequestAuthed();
      return;
    }

    // Anonymous path — open inline OTP block.
    setShowOtpFlow(true);
  }, [formValid, submitting, isAuthenticated, submitRequestAuthed]);

  if (authLoading || loadingInit) {
    return (
      <SafeAreaView className="flex-1 bg-surface2">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (loadError && cities.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-surface2">
        <View className="flex-1 items-center justify-center px-4">
          <EmptyState
            icon={MapPin}
            title="Не удалось загрузить данные"
            subtitle="Проверьте соединение и попробуйте снова"
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => setRetryCount((n) => n + 1)}
            className="flex-row items-center mt-4 px-6 py-3 bg-accent rounded-xl"
            style={{ minHeight: 44 }}
          >
            <RefreshCw size={16} color="#ffffff" style={{ marginRight: 8 }} />
            <Text className="text-white font-semibold text-sm">Повторить</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface2">
      {!isAuthenticated && (
        <LandingHeader
          isDesktop={width >= 768}
          onHome={() => nav.routes.home()}
          onCatalog={() => nav.routes.specialists()}
          onLogin={() => nav.routes.login()}
          onCreateRequest={() => {}}
          isAuthenticated={false}
        />
      )}
      <View
        className="bg-surface2"
        style={{
          ...(Platform.OS === "web" ? ({ position: "sticky", top: 0, zIndex: 10 } as object) : {}),
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 640,
            alignSelf: "center",
            paddingHorizontal: 16,
            paddingTop: 16,
          }}
        >
          {width < 640 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Назад"
              onPress={() => router.back()}
              className="flex-row items-center mb-2"
              style={{ minHeight: 44 }}
            >
              <ChevronLeft size={20} color={colors.text} />
              <Text className="text-text-base ml-1">Назад</Text>
            </Pressable>
          )}
          <Text className="text-2xl font-extrabold text-text-base mb-3">Создать запрос</Text>
        </View>
      </View>
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 640,
            alignSelf: "center",
            paddingHorizontal: 16,
            paddingTop: 8,
          }}
        >
          {!isAuthenticated && (
            <View className="bg-accent-soft border border-accent rounded-xl p-4 mb-4">
              <Text className="text-sm font-semibold text-accent mb-0.5">
                Заполните запрос — войдёте в один шаг при отправке
              </Text>
              <Text className="text-sm text-accent">
                Подтверждение по email кодом. Без паролей.
              </Text>
            </View>
          )}

          <View
            className="bg-white border border-border rounded-2xl px-4 pt-4 pb-4 mb-4"
            style={{ overflow: "hidden" }}
          >
            <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
              Описание запроса
            </Text>

            <View className="mb-4">
              <Text className="text-sm font-medium text-text-base mb-1.5">
                Заголовок <Text className="text-danger">*</Text>
              </Text>
              <Input
                variant="bordered"
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
                editable={!submitting}
              />
              <Text
                className={`text-xs text-right mt-1 ${
                  title.length >= 100 ? "text-danger" : "text-text-dim"
                }`}
              >
                {title.length}/100
              </Text>
            </View>

            {/* Negative margin compensates for cascade's internal px-4 so its
                chip rows align with the card's edge padding. */}
            <View className="mb-4 -mx-4">
              <CityFnsCascade
                mode="single"
                value={{
                  cities: selectedCityId ? [selectedCityId] : [],
                  fns: selectedFnsId ? [selectedFnsId] : [],
                }}
                onChange={handleCascadeChange}
                citiesSource={cities.map((c) => ({ id: c.id, name: c.name }))}
                services={services}
                selectedServiceId={selectedServiceId}
                onServiceChange={setSelectedServiceId}
              />
              {submitted && !selectedCityId && (
                <Text className="text-xs text-danger mt-1 px-4">Выберите город</Text>
              )}
              {submitted && selectedCityId && !selectedFnsId && (
                <Text className="text-xs text-danger mt-1 px-4">Выберите инспекцию</Text>
              )}
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-text-base mb-1.5">
                Описание <Text className="text-danger">*</Text>
              </Text>
              <Input
                variant="bordered"
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
                editable={!submitting}
                containerStyle={{ minHeight: 120 }}
              />
              <Text
                className={`text-xs text-right mt-1 ${
                  description.length >= 2000 ? "text-danger" : "text-text-dim"
                }`}
              >
                {description.length}/2000
              </Text>
            </View>

            {/* Visibility toggle */}
            <View className="flex-row items-center justify-between py-3 mb-1">
              <View className="flex-1 mr-4">
                <Text className="text-sm font-medium text-text-base mb-0.5">
                  Публичная заявка
                </Text>
                <Text className="text-xs text-text-mute leading-4">
                  Видна всем в каталоге. Выключите, если хотите показывать только авторизованным пользователям.
                </Text>
              </View>
              <StyledSwitch
                value={isPublic}
                onValueChange={setIsPublic}
                disabled={submitting}
              />
            </View>

            {isAuthenticated && (
              <FileUploadZone
                files={attachedFiles}
                disabled={submitting}
                onFilesChange={setAttachedFiles}
                uploadEndpoint="/api/upload/documents"
                authToken={token}
                compact={false}
              />
            )}
          </View>

          {submitError ? (
            <View className="bg-danger-soft border border-danger rounded-xl p-3 mb-4">
              <Text className="text-sm font-semibold text-danger mb-0.5">
                Ошибка публикации
              </Text>
              <Text className="text-sm text-danger">{submitError}</Text>
            </View>
          ) : null}

          {/* Inline OTP block — anon submit only */}
          {!isAuthenticated && showOtpFlow && (
            <InlineOtpFlow
              onAuthenticated={submitRequestAuthed}
              onCancel={() => setShowOtpFlow(false)}
              parentSubmitting={submitting}
              returnTo="/requests/new"
            />
          )}

          {/* Primary submit button — hidden once inline OTP block is open. */}
          {(isAuthenticated || !showOtpFlow) && (
            <Button
              label={
                isAuthenticated
                  ? "Опубликовать запрос"
                  : "Отправить запрос"
              }
              onPress={handleSubmit}
              disabled={submitting}
              loading={submitting}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
