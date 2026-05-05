import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Platform,
  Pressable,
  useWindowDimensions,
} from "react-native";
import StyledSwitch from "@/components/ui/StyledSwitch";
import { dialog } from "@/lib/dialog";
import LandingHeader from "@/components/landing/LandingHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { ChevronLeft, X, Check } from "lucide-react-native";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { apiPost, api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCities } from "@/lib/hooks/useCities";
import { useServices } from "@/lib/hooks/useServices";
import { colors } from "@/lib/theme";
import CityFnsServicePicker, {
  type FnsCascadeOption,
} from "@/components/shared/CityFnsServicePicker";
import { Z } from "@/lib/zIndex";
import InlineOtpFlow from "@/components/requests/InlineOtpFlow";
import FileUploadSection, { type AttachedFile } from "@/components/requests/FileUploadSection";
import { draftStorage } from "@/lib/draftStorage";
import { track } from "@/lib/analytics";
import { useNoIndex } from "@/components/seo/NoIndex";

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

interface SpecialistMini {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

export default function CreateRequest() {
  useNoIndex();
  const router = useRouter();
  const nav = useTypedRouter();
  const { isAuthenticated, isLoading: authLoading, token } = useAuth();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ restore?: string; specialistId?: string }>();
  const restoreMode = params.restore === "1";

  // Specialist targeting — optional, set via specialistId query param
  const [targetSpecialistId, setTargetSpecialistId] = useState<string | null>(
    typeof params.specialistId === "string" ? params.specialistId : null
  );
  const [targetSpecialist, setTargetSpecialist] = useState<SpecialistMini | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedFnsId, setSelectedFnsId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  const { cities: citiesRaw, loading: citiesLoading } = useCities();
  const { services, loading: servicesLoading } = useServices();
  const cities = citiesRaw;
  const [fnsAll, setFnsAll] = useState<FnsCascadeOption[]>([]);

  const [isPublic, setIsPublic] = useState(true);
  // Terms acceptance — only enforced for anonymous visitors (authed
  // users accepted at /login). Pre-checked so a returning user with
  // a fresh tab isn't blocked by a stray uncheck.
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const loadingInit = citiesLoading || servicesLoading;
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [showOtpFlow, setShowOtpFlow] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  // Stable per-visitor session id used to tie pre-OTP file uploads to the
  // request once the user signs in. Generated on first mount (or first
  // touch of /requests/new), persisted in localStorage so a draft survives
  // refresh, cleared after a successful submit so the next request starts
  // a clean session.
  const [anonSessionId, setAnonSessionId] = useState<string | null>(null);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    let id: string | null = null;
    try {
      id = window.localStorage.getItem("p2ptax_anon_session_v1");
      if (!id) {
        id = (window.crypto && "randomUUID" in window.crypto)
          ? window.crypto.randomUUID()
          : `anon-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
        window.localStorage.setItem("p2ptax_anon_session_v1", id);
      }
    } catch {
      // Storage blocked — files just won't persist across refresh.
      id = `anon-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
    }
    setAnonSessionId(id);
  }, []);

  // Funnel — wizard mount counts as the single intake step view today.
  // When the form splits into multi-step, fire `intake_step_view` per step
  // with `{ step: N }` instead of remounting this once.
  useEffect(() => {
    track("intake_step_view", {
      step: 1,
      authenticated: isAuthenticated,
      hasTargetSpecialist: !!targetSpecialistId,
    });
    // Run once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch targeted specialist name when specialistId is present.
  useEffect(() => {
    if (!targetSpecialistId) {
      setTargetSpecialist(null);
      return;
    }
    api<{ id: string; firstName: string | null; lastName: string | null }>(
      `/api/specialists/${targetSpecialistId}`,
      { noAuth: true }
    )
      .then((s) => setTargetSpecialist({ id: s.id, firstName: s.firstName, lastName: s.lastName }))
      .catch(() => setTargetSpecialist(null));
  }, [targetSpecialistId]);

  // Load all FNS offices once cities are available — needed for typeahead.
  useEffect(() => {
    if (cities.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const ids = cities.map((c) => c.id).join(",");
        const res = await api<{ offices: { id: string; name: string; code: string; cityId: string; city?: { name: string } }[] }>(
          `/api/fns?city_ids=${ids}`,
          { noAuth: true }
        );
        if (cancelled) return;
        setFnsAll(
          res.offices.map((f) => ({
            id: f.id,
            name: f.name,
            code: f.code,
            cityId: f.cityId,
            cityName: f.city?.name,
          }))
        );
      } catch {
        /* typeahead degrades gracefully */
      }
    })();
    return () => { cancelled = true; };
  }, [cities]);

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

  const titleValid = title.trim().length >= 3 && title.trim().length <= 100;
  const descriptionValid =
    description.trim().length >= 10 && description.trim().length <= 2000;

  const formValid =
    titleValid && descriptionValid && !!selectedCityId && !!selectedFnsId;

  // Actually post the request — used by both auth and post-OTP paths.
  // freshToken: when provided (post-OTP path), passed explicitly to avoid
  // stale-closure race on AuthContext update settling.
  const submitRequestAuthed = useCallback(async (_freshToken?: string) => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const fileIds = attachedFiles
        .filter((f) => !!f.uploadedId && !f.uploading && !f.error)
        .map((f) => f.uploadedId as string);
      // api() reads token from AsyncStorage automatically; explicit token not
      // needed here since signIn() stores it before calling this callback.
      const result = await apiPost<{ id: string }>("/api/requests", {
        title: title.trim(),
        cityId: selectedCityId,
        fnsId: selectedFnsId,
        serviceId: selectedServiceId || undefined,
        description: description.trim(),
        fileIds,
        // Anon-session id is sent so the server can claim files uploaded
        // before OTP completed. Server clears the TTL on those rows.
        ...(anonSessionId ? { pendingFileSessionId: anonSessionId } : {}),
        isPublic,
        ...(targetSpecialistId ? { targetSpecialistId } : {}),
      });
      track("intake_submit", {
        ok: true,
        isPublic,
        hasTargetSpecialist: !!targetSpecialistId,
        fileCount: fileIds.length,
      });
      // Clear draft + anon session on success.
      await draftStorage.del(DRAFT_KEY).catch(() => {});
      await draftStorage.del(LEGACY_DRAFT_KEY).catch(() => {});
      if (Platform.OS === "web") {
        try { window.localStorage.removeItem("p2ptax_anon_session_v1"); } catch { /* ignore */ }
      }

      // Stop the loading spinner BEFORE we await the post-publish
      // confirmation dialog — otherwise the submit button keeps
      // spinning while the success popup is open, which contradicts
      // the popup's 'опубликован' message.
      setSubmitting(false);

      // Post-publish: offer two paths. Default action is the friendly
      // 'Перейти к запросу' (so passive users land on the detail page,
      // unchanged behaviour). Confirm action — labelled 'Найти
      // специалистов самостоятельно' — deep-links to the catalog
      // filtered by the FNS the user just picked, so impatient clients
      // can immediately browse matching specialists instead of waiting
      // for replies.
      const goToDetail = () => nav.replaceAny(`/requests/${result.id}/detail`);
      const goToSpecialists = () => {
        if (selectedFnsId) {
          nav.replaceAny(`/specialists?fns_ids=${selectedFnsId}`);
        } else {
          nav.replaceRoutes.specialists();
        }
      };
      const findThem = await dialog.confirm({
        title: "Запрос опубликован",
        message:
          "Специалисты по вашей ИФНС увидят его и напишут вам. Обычно первый отклик приходит в течение 24 часов.",
        confirmLabel: "Найти специалистов",
        cancelLabel: "Перейти к запросу",
        tone: "success",
        confirmIcon: "search",
      });
      if (findThem) {
        goToSpecialists();
      } else {
        goToDetail();
      }
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : "Не удалось опубликовать запрос. Проверьте данные и попробуйте ещё раз.";
      track("intake_submit", { ok: false, reason: msg });
      setSubmitError(msg);
      // Only reset submitting on error path — the success branch above
      // already cleared it before opening the dialog.
      setSubmitting(false);
    }
  }, [title, description, selectedCityId, selectedFnsId, selectedServiceId, nav, attachedFiles, anonSessionId, isPublic, targetSpecialistId]);

  const handleSubmit = useCallback(async () => {
    setSubmitted(true);
    setSubmitError("");
    if (!formValid || submitting) return;

    if (!isAuthenticated && !termsAccepted) {
      setSubmitError("Чтобы продолжить, примите условия использования.");
      return;
    }

    if (isAuthenticated) {
      await submitRequestAuthed();
      return;
    }

    // Anonymous path — open inline OTP block.
    setShowOtpFlow(true);
  }, [formValid, submitting, isAuthenticated, termsAccepted, submitRequestAuthed]);

  if (authLoading || loadingInit) {
    return (
      <SafeAreaView className="flex-1 bg-surface2">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
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
          ...(Platform.OS === "web" ? ({ position: "sticky", top: 0, zIndex: Z.STICKY } as object) : {}),
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 720,
            alignSelf: "center",
            paddingHorizontal: 24,
          }}
        >
          {width < 640 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Назад"
              onPress={() => router.back()}
              className="flex-row items-center mt-4 mb-1"
              style={{ minHeight: 44 }}
            >
              <ChevronLeft size={20} color={colors.text} />
              <Text className="text-text-base ml-1">Назад</Text>
            </Pressable>
          )}
          <Text
            className="text-xl font-bold text-text-base"
            style={{ paddingTop: 16, paddingBottom: 16 }}
          >
            Новый запрос
          </Text>
        </View>
      </View>
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View
          // House rule: forms (request creation) cap at 720 with 24 padding (CLAUDE.md).
          style={{
            width: "100%",
            maxWidth: 720,
            alignSelf: "center",
            paddingHorizontal: 24,
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

          {/* Specialist targeting banner */}
          {targetSpecialistId && (
            <View
              className="flex-row items-center justify-between rounded-xl px-4 py-3 mb-4 border"
              style={{ backgroundColor: colors.greenSoft, borderColor: colors.success }}
            >
              <View className="flex-row items-center flex-1" style={{ gap: 8 }}>
                <View
                  className="rounded-full"
                  style={{ width: 8, height: 8, backgroundColor: colors.success, flexShrink: 0 }}
                />
                <Text className="text-sm font-medium flex-1" style={{ color: colors.success }}>
                  {targetSpecialist
                    ? `Запрос для: ${[targetSpecialist.firstName, targetSpecialist.lastName].filter(Boolean).join(" ")}`
                    : "Адресован специалисту"}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Убрать адресацию специалисту"
                onPress={() => setTargetSpecialistId(null)}
                className="ml-2 p-1"
                hitSlop={8}
              >
                <X size={14} color={colors.success} />
              </Pressable>
            </View>
          )}

          <Card className="mb-4">
            <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
              Налоговая инспекция и ситуация
            </Text>
            <CityFnsServicePicker
              mode="single"
              cities={cities.map((c) => ({ id: c.id, name: c.name }))}
              fnsAll={fnsAll}
              services={services}
              value={{
                cityId: selectedCityId,
                fnsId: selectedFnsId,
                serviceId: selectedServiceId,
              }}
              onChange={(v) => {
                setSelectedCityId(v.cityId);
                setSelectedFnsId(v.fnsId);
                setSelectedServiceId(v.serviceId);
              }}
              submitted={submitted}
              labelFns="Инспекция ФНС"
            />
          </Card>

          <Card className="mb-4">
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

            {/* Files section. Hint copy lists common attachment types
                so the user knows what to upload — was previously a
                bare 'Документы' label with no guidance. */}
            <View className="mb-1">
              <Text className="text-sm font-medium text-text-base mb-0.5">
                Документы
              </Text>
              <Text className="text-xs text-text-mute leading-5 mb-2">
                Например: требование от ФНС, копия декларации, акт
                камеральной проверки, переписка с инспекцией. Можно
                прикрепить несколько файлов.
              </Text>
            </View>
            <FileUploadSection
              files={attachedFiles}
              disabled={submitting}
              onFilesChange={setAttachedFiles}
              authToken={token}
              anonSessionId={anonSessionId}
            />

            {/* Visibility toggle — sits at the very bottom of the card
                (just above the publish button) since it's the final
                'shape' decision the author makes about their request. */}
            <View className="flex-row items-center justify-between py-3 mt-3 border-t border-border">
              <View className="flex-1 mr-4">
                <Text className="text-sm font-medium text-text-base mb-0.5">
                  Показывать в публичной ленте
                </Text>
                <Text className="text-xs text-text-mute leading-4">
                  По умолчанию запрос виден в общем каталоге. Выключите — он не появится в ленте, но останется доступным по прямой ссылке (например, специалисту, которому вы её отправите сами).
                </Text>
              </View>
              <StyledSwitch
                value={isPublic}
                onValueChange={setIsPublic}
                disabled={submitting}
              />
            </View>
          </Card>

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
              returnTo={
                targetSpecialistId
                  ? `/requests/new?specialistId=${targetSpecialistId}`
                  : "/requests/new"
              }
            />
          )}

          {/* Primary submit button — hidden once inline OTP block is open. */}
          {(isAuthenticated || !showOtpFlow) && (
            <>
              {!isAuthenticated && (
                /* Terms-of-use checkbox — same shape as on /login.
                   Hidden for authed users since they already accepted
                   at sign-in time. Pre-checked; uncheck blocks submit. */
                <View
                  className="flex-row items-start mb-4"
                  style={{ gap: 10 }}
                >
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: termsAccepted }}
                    accessibilityLabel="Я принимаю условия использования"
                    onPress={() => setTermsAccepted((v) => !v)}
                    hitSlop={8}
                    style={{
                      width: 20,
                      height: 20,
                      marginTop: 1,
                      borderRadius: 6,
                      borderWidth: 1.5,
                      borderColor: termsAccepted ? colors.accent : colors.border,
                      backgroundColor: termsAccepted ? colors.accent : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {termsAccepted ? (
                      <Check size={14} color={colors.white} strokeWidth={3} />
                    ) : null}
                  </Pressable>
                  <Text
                    className="flex-1 text-text-base"
                    style={{ fontSize: 13, lineHeight: 18 }}
                  >
                    Я принимаю{" "}
                    <Text
                      accessibilityRole="link"
                      onPress={() => nav.routes.legalIndex()}
                      className="underline"
                      style={{ color: colors.accent }}
                    >
                      условия использования и политику конфиденциальности
                    </Text>
                    .
                  </Text>
                </View>
              )}
              <Button
                label={
                  isAuthenticated
                    ? "Опубликовать запрос"
                    : "Отправить запрос"
                }
                onPress={handleSubmit}
                disabled={submitting || (!isAuthenticated && !termsAccepted)}
                loading={submitting}
              />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
