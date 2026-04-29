import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { MapPin, Mail } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HeaderBack from "@/components/HeaderBack";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import { api, apiPost } from "@/lib/api";
import { useAuth, UserData } from "@/contexts/AuthContext";
import { colors } from "@/lib/theme";
import CityFnsServicePicker, {
  CityOption,
  FnsOption,
  ServiceOption,
} from "@/components/requests/CityFnsServicePicker";

// Single canonical key (v1). Replaces legacy "pending_request_draft".
const DRAFT_KEY = "p2ptax_request_draft_v1";
const LEGACY_DRAFT_KEY = "pending_request_draft";
const CODE_LENGTH = 6;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RequestDraft {
  title: string;
  description: string;
  cityId: string | null;
  citySlug: string | null;
  fnsId: string | null;
  serviceId: string | null;
}

// Cross-platform storage shim: localStorage on web, AsyncStorage on native.
const storage = {
  get: async (k: string): Promise<string | null> => {
    if (Platform.OS === "web") {
      try {
        return typeof window !== "undefined" ? window.localStorage.getItem(k) : null;
      } catch {
        return null;
      }
    }
    return AsyncStorage.getItem(k);
  },
  set: async (k: string, v: string): Promise<void> => {
    if (Platform.OS === "web") {
      try {
        if (typeof window !== "undefined") window.localStorage.setItem(k, v);
      } catch {
        /* quota / private mode — fall back silently */
      }
      return;
    }
    await AsyncStorage.setItem(k, v);
  },
  del: async (k: string): Promise<void> => {
    if (Platform.OS === "web") {
      try {
        if (typeof window !== "undefined") window.localStorage.removeItem(k);
      } catch {
        /* ignore */
      }
      return;
    }
    await AsyncStorage.removeItem(k);
  },
};

export default function CreateRequest() {
  const router = useRouter();
  const nav = useTypedRouter();
  const { isAuthenticated, isLoading: authLoading, signIn } = useAuth();
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
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Inline OTP state — only used for anonymous submit path.
  const [otpStage, setOtpStage] = useState<"hidden" | "email" | "code">("hidden");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpEmailError, setOtpEmailError] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpCodeError, setOtpCodeError] = useState("");
  const [otpRequesting, setOtpRequesting] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const pendingSubmitAfterAuth = useRef(false);

  // Load cities/services — public, no auth required.
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

  // Check request limit when authenticated.
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

  // Restore draft on mount (anyone — anon or returning post-login).
  // Reads new key first, falls back to legacy key for in-flight users.
  useEffect(() => {
    if (loadingInit || draftLoaded) return;
    (async () => {
      try {
        let raw = await storage.get(DRAFT_KEY);
        if (!raw) {
          raw = await storage.get(LEGACY_DRAFT_KEY);
          if (raw) {
            // Migrate legacy → v1 key, then drop the old one.
            await storage.set(DRAFT_KEY, raw);
            await storage.del(LEGACY_DRAFT_KEY);
          }
        }
        if (raw) {
          const draft: RequestDraft = JSON.parse(raw);
          if (draft.title) setTitle(draft.title);
          if (draft.description) setDescription(draft.description);
          if (draft.cityId) setSelectedCityId(draft.cityId);
          if (draft.fnsId) setSelectedFnsId(draft.fnsId);
          if (draft.serviceId) setSelectedServiceId(draft.serviceId);
          if (draft.citySlug) loadFnsForCity(draft.citySlug);
        }
      } catch {
        /* ignore parse / storage errors */
      } finally {
        setDraftLoaded(true);
        // restore flag may be stale — clear it from URL by no-op (no nav change here).
        if (restoreMode) {
          // legacy returnTo path — already restored, nothing else to do.
        }
      }
    })();
  }, [loadingInit, draftLoaded, restoreMode, loadFnsForCity]);

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
    // Skip writing an empty/blank draft.
    const isEmpty =
      !draft.title &&
      !draft.description &&
      !draft.cityId &&
      !draft.fnsId &&
      !draft.serviceId;
    if (isEmpty) return;
    storage.set(DRAFT_KEY, JSON.stringify(draft)).catch(() => {});
  }, [
    draftLoaded,
    title,
    description,
    selectedCityId,
    selectedFnsId,
    selectedServiceId,
    cities,
  ]);

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

  // Actually post the request — used by both auth and post-OTP paths.
  const submitRequestAuthed = useCallback(async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const result = await apiPost<{ id: string }>("/api/requests", {
        title: title.trim(),
        cityId: selectedCityId,
        fnsId: selectedFnsId,
        serviceId: selectedServiceId || undefined,
        description: description.trim(),
        files: [],
      });
      // Clear draft on success.
      await storage.del(DRAFT_KEY).catch(() => {});
      await storage.del(LEGACY_DRAFT_KEY).catch(() => {});

      const goToDetail = () => nav.replaceAny(`/requests/${result.id}/detail`);
      // Native: confirm via Alert; Web: skip Alert (no useful UX) and navigate.
      if (Platform.OS === "web") {
        goToDetail();
      } else {
        Alert.alert(
          "Заявка опубликована",
          "Специалисты по вашей ФНС увидят её и напишут вам. Обычно первый отклик приходит в течение 24 часов.",
          [{ text: "OK", onPress: goToDetail }],
          { onDismiss: goToDetail }
        );
      }
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : "Не удалось опубликовать заявку. Проверьте данные и попробуйте ещё раз.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [title, description, selectedCityId, selectedFnsId, selectedServiceId, nav]);

  // If user becomes authenticated while inline OTP flow finished, post the request.
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!pendingSubmitAfterAuth.current) return;
    pendingSubmitAfterAuth.current = false;
    submitRequestAuthed();
  }, [isAuthenticated, submitRequestAuthed]);

  const handleSubmit = useCallback(async () => {
    setSubmitted(true);
    setSubmitError("");
    if (!formValid || submitting) return;

    if (isAuthenticated) {
      await submitRequestAuthed();
      return;
    }

    // Anonymous path — open inline OTP block (email step).
    setOtpStage("email");
  }, [formValid, submitting, isAuthenticated, submitRequestAuthed]);

  const handleRequestOtp = useCallback(async () => {
    setOtpEmailError("");
    const trimmed = otpEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmed)) {
      setOtpEmailError("Некорректный email");
      return;
    }
    setOtpRequesting(true);
    try {
      await api("/api/auth/request-otp", {
        method: "POST",
        body: { email: trimmed },
        noAuth: true,
      });
      setOtpEmail(trimmed);
      setOtpStage("code");
      setOtpCode("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Не удалось отправить код";
      setOtpEmailError(msg);
    } finally {
      setOtpRequesting(false);
    }
  }, [otpEmail]);

  const handleVerifyOtp = useCallback(async () => {
    setOtpCodeError("");
    if (otpCode.length !== CODE_LENGTH) {
      setOtpCodeError("Введите 6-значный код");
      return;
    }
    setOtpVerifying(true);
    try {
      const data = await api<{
        accessToken: string;
        refreshToken: string;
        user: UserData;
      }>("/api/auth/verify-otp", {
        method: "POST",
        body: { email: otpEmail, code: otpCode },
        noAuth: true,
      });
      // New users with null role: route to standard OTP screen for role choice.
      // We've still saved the JWT, so they'll come back authenticated.
      if (!data.user.role) {
        await signIn(data.accessToken, data.refreshToken, data.user);
        nav.any({
          pathname: "/otp",
          params: {
            email: otpEmail,
            returnTo: "/requests/create",
          },
        });
        return;
      }
      // Mark a pending submit; signIn triggers the effect that posts the request.
      pendingSubmitAfterAuth.current = true;
      await signIn(data.accessToken, data.refreshToken, data.user);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Неверный код";
      setOtpCodeError(msg);
      setOtpCode("");
    } finally {
      setOtpVerifying(false);
    }
  }, [otpCode, otpEmail, signIn, nav]);

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
                Заполните заявку — войдёте в один шаг при отправке
              </Text>
              <Text className="text-sm text-accent">
                Подтверждение по email кодом. Без паролей.
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
              <Text
                className={`text-xs text-right mt-1 ${
                  title.length >= 100 ? "text-danger" : "text-text-dim"
                }`}
              >
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
              <Text
                className={`text-xs text-right mt-1 ${
                  description.length >= 2000 ? "text-danger" : "text-text-dim"
                }`}
              >
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

          {/* Inline OTP block — anon submit only */}
          {!isAuthenticated && otpStage !== "hidden" && (
            <View
              className="bg-white border border-border rounded-2xl px-4 pt-4 pb-4 mb-4"
              testID="inline-otp-block"
            >
              <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
                Подтверждение
              </Text>

              {otpStage === "email" && (
                <View>
                  <Text className="text-sm font-medium text-text-base mb-1.5">
                    Email <Text className="text-danger">*</Text>
                  </Text>
                  <View
                    className="flex-row items-center rounded-xl border bg-white"
                    style={{
                      borderColor: otpEmailError ? colors.error : colors.border,
                      height: 48,
                      paddingHorizontal: 14,
                      marginBottom: otpEmailError ? 6 : 12,
                    }}
                  >
                    <Mail size={18} color={colors.placeholder} />
                    <TextInput
                      accessibilityLabel="Email адрес"
                      placeholder="your@email.com"
                      placeholderTextColor={colors.placeholder}
                      value={otpEmail}
                      onChangeText={(t) => {
                        setOtpEmail(t);
                        if (otpEmailError) setOtpEmailError("");
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      editable={!otpRequesting}
                      onSubmitEditing={handleRequestOtp}
                      style={{
                        flex: 1,
                        marginLeft: 10,
                        fontSize: 15,
                        color: colors.text,
                        borderWidth: 0,
                        ...(Platform.OS === "web"
                          ? {
                              minHeight: 44,
                              alignSelf: "stretch" as never,
                              borderColor: "transparent",
                              outlineStyle: "none" as never,
                              outlineWidth: 0,
                              appearance: "none" as never,
                            }
                          : {}),
                      }}
                    />
                  </View>
                  {otpEmailError ? (
                    <Text
                      className="text-sm text-danger mb-3"
                      style={{ fontSize: 13 }}
                    >
                      {otpEmailError}
                    </Text>
                  ) : null}
                  <Button
                    label="Получить код"
                    onPress={handleRequestOtp}
                    loading={otpRequesting}
                    disabled={otpRequesting || !otpEmail.trim()}
                    testID="inline-otp-request"
                  />
                </View>
              )}

              {otpStage === "code" && (
                <View>
                  <Text
                    className="text-sm text-text-mute mb-3"
                    style={{ lineHeight: 20 }}
                  >
                    Код отправлен на{" "}
                    <Text className="text-text-base font-semibold">
                      {otpEmail}
                    </Text>
                    . Введите 6 цифр.
                  </Text>
                  <Text className="text-sm font-medium text-text-base mb-1.5">
                    Код <Text className="text-danger">*</Text>
                  </Text>
                  <TextInput
                    accessibilityLabel="6-значный код"
                    placeholder="000000"
                    placeholderTextColor={colors.placeholder}
                    value={otpCode}
                    onChangeText={(t) => {
                      const cleaned = t.replace(/\D/g, "").slice(0, CODE_LENGTH);
                      setOtpCode(cleaned);
                      if (otpCodeError) setOtpCodeError("");
                    }}
                    keyboardType="number-pad"
                    inputMode="numeric"
                    maxLength={CODE_LENGTH}
                    editable={!otpVerifying}
                    onSubmitEditing={handleVerifyOtp}
                    style={{
                      borderWidth: otpCodeError ? 1 : 1,
                      borderColor: otpCodeError ? colors.error : colors.border,
                      borderRadius: 12,
                      height: 48,
                      paddingHorizontal: 14,
                      fontSize: 18,
                      letterSpacing: 4,
                      textAlign: "center",
                      color: colors.text,
                      marginBottom: otpCodeError ? 6 : 12,
                      ...(Platform.OS === "web"
                        ? {
                            outlineStyle: "none" as never,
                            outlineWidth: 0,
                            appearance: "none" as never,
                          }
                        : {}),
                    }}
                    testID="inline-otp-code"
                  />
                  {otpCodeError ? (
                    <Text
                      className="text-sm text-danger mb-3"
                      style={{ fontSize: 13 }}
                    >
                      {otpCodeError}
                    </Text>
                  ) : null}
                  <Button
                    label="Подтвердить и опубликовать"
                    onPress={handleVerifyOtp}
                    loading={otpVerifying || submitting}
                    disabled={
                      otpVerifying || submitting || otpCode.length !== CODE_LENGTH
                    }
                    testID="inline-otp-verify"
                  />
                  <View style={{ marginTop: 10 }}>
                    <Button
                      variant="secondary"
                      label="Изменить email"
                      onPress={() => {
                        setOtpStage("email");
                        setOtpCode("");
                        setOtpCodeError("");
                      }}
                      disabled={otpVerifying}
                    />
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Primary submit button — hidden once inline OTP block is open. */}
          {(isAuthenticated || otpStage === "hidden") && (
            <Button
              label={
                isAuthenticated
                  ? "Опубликовать заявку"
                  : "Отправить заявку"
              }
              onPress={handleSubmit}
              disabled={submitting || atLimit}
              loading={submitting}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
