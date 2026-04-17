import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import HeaderBack from "@/components/HeaderBack";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import { api, apiPost } from "@/lib/api";

interface CityOption {
  id: string;
  name: string;
  fnsOffices: { id: string; name: string; code: string }[];
}

export default function NewRequest() {
  const router = useRouter();

  const [cities, setCities] = useState<CityOption[]>([]);
  const [title, setTitle] = useState("");
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedFnsId, setSelectedFnsId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingCities, setLoadingCities] = useState(true);
  const [atLimit, setAtLimit] = useState(false);

  // City selector open state
  const [cityOpen, setCityOpen] = useState(false);
  const [fnsOpen, setFnsOpen] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const [citiesRes, statsRes] = await Promise.all([
          api<{ items: CityOption[] }>("/api/cities", { noAuth: true }),
          api<{ requestsUsed: number; requestsLimit: number }>("/api/dashboard/stats"),
        ]);
        setCities(citiesRes.items);
        if (statsRes.requestsUsed >= statsRes.requestsLimit) {
          setAtLimit(true);
        }
      } catch (e) {
        console.error("Init error:", e);
      } finally {
        setLoadingCities(false);
      }
    }
    init();
  }, []);

  const selectedCity = cities.find((c) => c.id === selectedCityId);
  const fnsOptions = selectedCity?.fnsOffices || [];

  const handleCitySelect = useCallback((cityId: string) => {
    setSelectedCityId(cityId);
    setSelectedFnsId(null);
    setCityOpen(false);
  }, []);

  const handleFnsSelect = useCallback((fnsId: string) => {
    setSelectedFnsId(fnsId);
    setFnsOpen(false);
  }, []);

  const titleValid = title.length >= 3 && title.length <= 100;
  const descriptionValid = description.length >= 10 && description.length <= 2000;
  const formValid = titleValid && selectedCityId && selectedFnsId && descriptionValid && !atLimit;

  const handleSubmit = useCallback(async () => {
    if (!formValid || submitting) return;

    setSubmitting(true);
    try {
      await apiPost("/api/requests", {
        title: title.trim(),
        cityId: selectedCityId,
        fnsId: selectedFnsId,
        description: description.trim(),
      });
      router.back();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка при создании заявки";
      Alert.alert("Ошибка", msg);
    } finally {
      setSubmitting(false);
    }
  }, [formValid, submitting, title, selectedCityId, selectedFnsId, description, router]);

  if (loadingCities) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <HeaderBack title="Новая заявка" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1e3a8a" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <HeaderBack title="Новая заявка" />
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        <ResponsiveContainer>
          <View className="py-4">
            {atLimit && (
              <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <Text className="text-red-600 text-sm font-medium">
                  Лимит заявок исчерпан. Закройте существующую заявку, чтобы создать новую.
                </Text>
              </View>
            )}

            {/* Title */}
            <Text className="text-sm font-medium text-slate-900 mb-1">
              Заголовок
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Опишите кратко вашу ситуацию"
              maxLength={100}
              style={{
                height: 48,
                borderWidth: 1,
                borderColor: title.length > 0 && !titleValid ? "#ef4444" : "#e2e8f0",
                borderRadius: 10,
                paddingHorizontal: 16,
                fontSize: 16,
                backgroundColor: "#f9fafb",
                color: "#0f172a",
              }}
            />
            <Text className="text-xs text-slate-400 mt-1 text-right">
              {title.length}/100
            </Text>

            {/* City select */}
            <Text className="text-sm font-medium text-slate-900 mb-1 mt-3">
              Город
            </Text>
            <Pressable
              onPress={() => { setCityOpen(!cityOpen); setFnsOpen(false); }}
              className="h-12 border border-slate-200 rounded-[10px] bg-slate-50 px-4 flex-row items-center justify-between"
            >
              <Text className={selectedCity ? "text-slate-900 text-base" : "text-slate-400 text-base"}>
                {selectedCity?.name || "Выберите город"}
              </Text>
              <FontAwesome name={cityOpen ? "chevron-up" : "chevron-down"} size={12} color="#94a3b8" />
            </Pressable>
            {cityOpen && (
              <View className="border border-slate-200 rounded-xl mt-1 bg-white overflow-hidden">
                {cities.map((city) => (
                  <Pressable
                    key={city.id}
                    onPress={() => handleCitySelect(city.id)}
                    className="px-4 py-3 border-b border-slate-50 active:bg-slate-50"
                  >
                    <Text className="text-base text-slate-900">{city.name}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* FNS select */}
            <Text className="text-sm font-medium text-slate-900 mb-1 mt-3">
              Отделение ФНС
            </Text>
            <Pressable
              onPress={() => {
                if (!selectedCityId) return;
                setFnsOpen(!fnsOpen);
                setCityOpen(false);
              }}
              className={`h-12 border border-slate-200 rounded-[10px] px-4 flex-row items-center justify-between ${
                selectedCityId ? "bg-slate-50" : "bg-slate-100"
              }`}
            >
              <Text className={selectedFnsId ? "text-slate-900 text-base" : "text-slate-400 text-base"}>
                {fnsOptions.find((f) => f.id === selectedFnsId)?.name || "Выберите отделение ФНС"}
              </Text>
              <FontAwesome name={fnsOpen ? "chevron-up" : "chevron-down"} size={12} color="#94a3b8" />
            </Pressable>
            {!selectedCityId && (
              <Text className="text-xs text-slate-400 mt-1">
                Сначала выберите город
              </Text>
            )}
            {fnsOpen && fnsOptions.length > 0 && (
              <View className="border border-slate-200 rounded-xl mt-1 bg-white overflow-hidden">
                {fnsOptions.map((fns) => (
                  <Pressable
                    key={fns.id}
                    onPress={() => handleFnsSelect(fns.id)}
                    className="px-4 py-3 border-b border-slate-50 active:bg-slate-50"
                  >
                    <Text className="text-base text-slate-900">
                      {fns.name} ({fns.code})
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Description */}
            <Text className="text-sm font-medium text-slate-900 mb-1 mt-3">
              Описание
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Опишите подробно вашу ситуацию (минимум 10 символов)"
              multiline
              maxLength={2000}
              style={{
                minHeight: 120,
                borderWidth: 1,
                borderColor: description.length > 0 && !descriptionValid ? "#ef4444" : "#e2e8f0",
                borderRadius: 10,
                paddingHorizontal: 16,
                paddingTop: 12,
                paddingBottom: 12,
                fontSize: 16,
                backgroundColor: "#f9fafb",
                color: "#0f172a",
                textAlignVertical: "top",
              }}
            />
            <Text className="text-xs text-slate-400 mt-1 text-right">
              {description.length}/2000
            </Text>
          </View>
        </ResponsiveContainer>
      </ScrollView>

      {/* Sticky submit button */}
      <View className="border-t border-slate-200 px-4 py-3 bg-white">
        <View className="w-full" style={{ maxWidth: 520, alignSelf: "center" }}>
          <Pressable
            onPress={handleSubmit}
            disabled={!formValid || submitting}
            className={`rounded-xl py-3 items-center ${
              formValid && !submitting ? "bg-blue-900" : "bg-slate-300"
            }`}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Опубликовать
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
