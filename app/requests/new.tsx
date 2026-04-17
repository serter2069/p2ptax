import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HeaderBack from "@/components/HeaderBack";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import { api, apiPost } from "@/lib/api";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { colors } from "@/lib/theme";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3812";

interface CityOption {
  id: string;
  name: string;
}

interface FnsOption {
  id: string;
  name: string;
  code: string;
  cityId: string;
}

interface ServiceOption {
  id: string;
  name: string;
}

interface AttachedFile {
  name: string;
  mimeType: string;
  size: number;
  uploadedUrl?: string;
  uploading?: boolean;
  error?: string;
}

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

  // Web-only hidden file input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
  const loadFnsForCity = useCallback(async (cityId: string) => {
    setLoadingFns(true);
    setFnsOffices([]);
    try {
      const data = await api<{ offices: FnsOption[] }>(`/api/fns?city_id=${cityId}`, { noAuth: true });
      setFnsOffices(data.offices);
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
    loadFnsForCity(city.id);
  }, [loadFnsForCity]);

  const handleFnsSelect = useCallback((fns: FnsOption) => {
    setSelectedFnsId(fns.id);
    setFnsOpen(false);
  }, []);

  const handleServiceSelect = useCallback((svc: ServiceOption) => {
    setSelectedServiceId(svc.id);
    setServiceOpen(false);
  }, []);

  const handleAddFilePress = () => {
    if (Platform.OS === "web" && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const uploadFile = useCallback(async (file: File) => {
    const mimeType = file.type || "application/octet-stream";
    const fileName = file.name;

    setFiles((prev) => [
      ...prev,
      { name: fileName, mimeType, size: file.size, uploading: true },
    ]);

    try {
      const token = await AsyncStorage.getItem("p2ptax_access_token");
      const formData = new FormData();
      formData.append("files", file);

      const uploadRes = await fetch(`${API_URL}/api/upload/documents`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }

      const uploadData = (await uploadRes.json()) as { files: { url: string }[] };
      const uploadedUrl = uploadData.files[0]?.url;

      setFiles((prev) =>
        prev.map((f, i) =>
          i === prev.length - 1 && f.name === fileName && f.uploading
            ? { ...f, uploading: false, uploadedUrl }
            : f
        )
      );
    } catch {
      setFiles((prev) =>
        prev.map((f, i) =>
          i === prev.length - 1 && f.name === fileName && f.uploading
            ? { ...f, uploading: false, error: "Ошибка загрузки" }
            : f
        )
      );
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (files.length >= MAX_FILES || file.size > MAX_FILE_SIZE) {
      e.target.value = "";
      return;
    }

    void uploadFile(file);
    e.target.value = "";
  };

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
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
              <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <Text className="text-red-600 text-sm font-medium">
                  Лимит заявок исчерпан ({limitInfo.used}/{limitInfo.limit}). Закройте неактуальные заявки, чтобы создать новую.
                </Text>
              </View>
            )}

            {/* Title */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-slate-700 mb-1.5">
                Заголовок <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                accessibilityLabel="Заголовок заявки"
                value={title}
                onChangeText={setTitle}
                placeholder="Кратко опишите суть проблемы"
                maxLength={100}
                editable={!atLimit && !submitting}
                placeholderTextColor={colors.textSecondary}
                style={{
                  height: 48,
                  borderWidth: 1,
                  borderColor:
                    (submitted || title.length > 0) && !titleValid
                      ? colors.error
                      : "#e2e8f0",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  fontSize: 16,
                  backgroundColor: atLimit ? "#f8fafc" : "#ffffff",
                  color: colors.text,
                  outlineWidth: 0,
                } as any}
              />
              <View className="flex-row justify-between mt-1">
                {(submitted || title.length > 0) && !titleValid ? (
                  <Text className="text-xs text-red-600">
                    {title.trim().length < 3 ? "Минимум 3 символа" : "Максимум 100 символов"}
                  </Text>
                ) : (
                  <View />
                )}
                <Text className="text-xs text-slate-400">{title.length}/100</Text>
              </View>
            </View>

            {/* City select */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-slate-700 mb-1.5">
                Город <Text className="text-red-500">*</Text>
              </Text>
              <Pressable
                accessibilityLabel="Выбрать город"
                onPress={() => {
                  if (atLimit || submitting) return;
                  setCityOpen(!cityOpen);
                  setFnsOpen(false);
                  setServiceOpen(false);
                }}
                className={`h-12 border rounded-xl px-4 flex-row items-center justify-between ${
                  submitted && !selectedCityId
                    ? "border-red-400 bg-red-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <Text className={selectedCity ? "text-slate-900 text-base" : "text-slate-400 text-base"}>
                  {selectedCity?.name || "Выберите город"}
                </Text>
                <FontAwesome name={cityOpen ? "chevron-up" : "chevron-down"} size={12} color="#94a3b8" />
              </Pressable>
              {submitted && !selectedCityId && (
                <Text className="text-xs text-red-600 mt-1">Выберите город</Text>
              )}
              {cityOpen && (
                <View
                  className="border border-slate-200 rounded-xl mt-1 bg-white overflow-hidden"
                  style={{ maxHeight: 192 }}
                >
                  <ScrollView nestedScrollEnabled>
                    {cities.length === 0 ? (
                      <View className="px-4 py-3">
                        <Text className="text-sm text-slate-400">Загрузка...</Text>
                      </View>
                    ) : (
                      cities.map((city) => (
                        <Pressable
                          key={city.id}
                          accessibilityLabel={city.name}
                          onPress={() => handleCitySelect(city)}
                          className="px-4 py-3 border-b border-slate-50 active:bg-slate-50"
                        >
                          <Text className="text-base text-slate-900">{city.name}</Text>
                        </Pressable>
                      ))
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* FNS select */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-slate-700 mb-1.5">
                Инспекция <Text className="text-red-500">*</Text>
              </Text>
              <Pressable
                accessibilityLabel="Выбрать инспекцию ФНС"
                onPress={() => {
                  if (!selectedCityId || atLimit || submitting) return;
                  setFnsOpen(!fnsOpen);
                  setCityOpen(false);
                  setServiceOpen(false);
                }}
                className={`h-12 border rounded-xl px-4 flex-row items-center justify-between ${
                  !selectedCityId
                    ? "border-slate-200 bg-slate-50"
                    : submitted && !selectedFnsId
                    ? "border-red-400 bg-red-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <Text className={selectedFns ? "text-slate-900 text-base" : "text-slate-400 text-base"}>
                  {loadingFns
                    ? "Загрузка..."
                    : selectedFns?.name ||
                      (selectedCityId ? "Выберите инспекцию" : "Сначала выберите город")}
                </Text>
                {loadingFns ? (
                  <ActivityIndicator size="small" color="#94a3b8" />
                ) : (
                  <FontAwesome name={fnsOpen ? "chevron-up" : "chevron-down"} size={12} color="#94a3b8" />
                )}
              </Pressable>
              {submitted && selectedCityId && !selectedFnsId && (
                <Text className="text-xs text-red-600 mt-1">Выберите инспекцию</Text>
              )}
              {fnsOpen && (
                <View
                  className="border border-slate-200 rounded-xl mt-1 bg-white overflow-hidden"
                  style={{ maxHeight: 192 }}
                >
                  <ScrollView nestedScrollEnabled>
                    {fnsOffices.length === 0 ? (
                      <View className="px-4 py-3">
                        <Text className="text-sm text-slate-400">Нет отделений для выбранного города</Text>
                      </View>
                    ) : (
                      fnsOffices.map((fns) => (
                        <Pressable
                          key={fns.id}
                          accessibilityLabel={fns.name}
                          onPress={() => handleFnsSelect(fns)}
                          className="px-4 py-3 border-b border-slate-50 active:bg-slate-50"
                        >
                          <Text className="text-base text-slate-900">{fns.name}</Text>
                          <Text className="text-xs text-slate-400">{fns.code}</Text>
                        </Pressable>
                      ))
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Service type select (optional) */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-slate-700 mb-1.5">Тип проверки</Text>
              <Pressable
                accessibilityLabel="Выбрать тип проверки"
                onPress={() => {
                  if (atLimit || submitting) return;
                  setServiceOpen(!serviceOpen);
                  setCityOpen(false);
                  setFnsOpen(false);
                }}
                className="h-12 border border-slate-200 rounded-xl bg-white px-4 flex-row items-center justify-between"
              >
                <Text className={selectedService ? "text-slate-900 text-base" : "text-slate-400 text-base"}>
                  {selectedService?.name || "Не знаю / не указывать"}
                </Text>
                <FontAwesome name={serviceOpen ? "chevron-up" : "chevron-down"} size={12} color="#94a3b8" />
              </Pressable>
              {serviceOpen && (
                <View
                  className="border border-slate-200 rounded-xl mt-1 bg-white overflow-hidden"
                  style={{ maxHeight: 192 }}
                >
                  <ScrollView nestedScrollEnabled>
                    <Pressable
                      accessibilityLabel="Не знаю"
                      onPress={() => {
                        setSelectedServiceId(null);
                        setServiceOpen(false);
                      }}
                      className="px-4 py-3 border-b border-slate-50 active:bg-slate-50"
                    >
                      <Text className="text-base text-slate-400">Не знаю / не указывать</Text>
                    </Pressable>
                    {services.map((svc) => (
                      <Pressable
                        key={svc.id}
                        accessibilityLabel={svc.name}
                        onPress={() => handleServiceSelect(svc)}
                        className="px-4 py-3 border-b border-slate-50 active:bg-slate-50"
                      >
                        <Text className="text-base text-slate-900">{svc.name}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-slate-700 mb-1.5">
                Описание <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                accessibilityLabel="Описание заявки"
                value={description}
                onChangeText={setDescription}
                placeholder="Подробно опишите ситуацию: что произошло, какие документы получили, что требует инспекция, какая помощь нужна"
                multiline
                maxLength={2000}
                editable={!atLimit && !submitting}
                placeholderTextColor={colors.textSecondary}
                style={{
                  minHeight: 120,
                  borderWidth: 1,
                  borderColor:
                    (submitted || description.length > 0) && !descriptionValid
                      ? colors.error
                      : "#e2e8f0",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingTop: 12,
                  paddingBottom: 12,
                  fontSize: 16,
                  backgroundColor: atLimit ? "#f8fafc" : "#ffffff",
                  color: colors.text,
                  textAlignVertical: "top",
                  outlineWidth: 0,
                } as any}
              />
              <View className="flex-row justify-between mt-1">
                {(submitted || description.length > 0) && !descriptionValid ? (
                  <Text className="text-xs text-red-600">
                    {description.trim().length < 10
                      ? "Минимум 10 символов"
                      : "Максимум 2000 символов"}
                  </Text>
                ) : (
                  <View />
                )}
                <Text className="text-xs text-slate-400">{description.length}/2000</Text>
              </View>
            </View>

            {/* File upload */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-slate-700 mb-1">Документы</Text>
              <Text className="text-xs text-slate-400 mb-3">
                PDF, JPG, PNG — до 10 МБ каждый, не более 5 файлов
              </Text>

              {/* Attached files list */}
              {files.map((file, index) => (
                <View
                  key={`file-${index}`}
                  className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 mb-2"
                >
                  <FontAwesome
                    name={file.mimeType === "application/pdf" ? "file-pdf-o" : "file-image-o"}
                    size={18}
                    color={file.error ? colors.error : colors.primary}
                  />
                  <View className="flex-1 mx-2">
                    <Text className="text-sm text-slate-900" numberOfLines={1}>
                      {file.name}
                    </Text>
                    {file.uploading && (
                      <Text className="text-xs text-slate-400">Загрузка...</Text>
                    )}
                    {file.error && (
                      <Text className="text-xs text-red-600">{file.error}</Text>
                    )}
                    {file.uploadedUrl && !file.uploading && (
                      <Text className="text-xs text-emerald-600">Загружен</Text>
                    )}
                  </View>
                  {file.uploading ? (
                    <ActivityIndicator size="small" color="#94a3b8" />
                  ) : (
                    <Pressable
                      accessibilityLabel="Удалить файл"
                      onPress={() => handleRemoveFile(index)}
                      className="w-8 h-8 items-center justify-center"
                    >
                      <FontAwesome name="times" size={14} color="#94a3b8" />
                    </Pressable>
                  )}
                </View>
              ))}

              {/* Add file button */}
              {files.length < MAX_FILES && !atLimit && (
                <Pressable
                  accessibilityLabel="Прикрепить файл"
                  onPress={handleAddFilePress}
                  className="flex-row items-center justify-center py-3 border border-dashed border-slate-300 rounded-xl active:bg-slate-50"
                >
                  <FontAwesome name="plus" size={13} color={colors.accent} />
                  <Text className="text-sm text-amber-700 ml-2 font-medium">
                    + Прикрепить файл
                  </Text>
                </Pressable>
              )}

              {/* Hidden web file input */}
              {Platform.OS === "web" && (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              )}
            </View>

            {/* Submit error */}
            {submitError ? (
              <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <Text className="text-sm font-medium text-red-700 mb-0.5">Ошибка публикации</Text>
                <Text className="text-sm text-red-600">{submitError}</Text>
              </View>
            ) : null}

          </View>
        </ResponsiveContainer>
      </ScrollView>

      {/* Sticky submit button */}
      <View className="border-t border-slate-200 px-4 py-3 bg-white">
        <View style={{ maxWidth: 520, width: "100%", alignSelf: "center" }}>
          <Pressable
            accessibilityLabel="Опубликовать заявку"
            onPress={handleSubmit}
            disabled={submitting || atLimit}
            className={`rounded-xl h-12 items-center justify-center ${
              !atLimit && !submitting ? "bg-blue-900 active:bg-slate-900" : "bg-blue-900 opacity-40"
            }`}
            style={
              !atLimit && !submitting
                ? {
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 3,
                  }
                : undefined
            }
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-base font-semibold">Опубликовать заявку</Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
