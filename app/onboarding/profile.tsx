import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import HeaderBack from "@/components/HeaderBack";
import { api } from "@/lib/api";
import ResponsiveContainer from "@/components/ResponsiveContainer";

export default function OnboardingProfileScreen() {
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const formatPhone = (text: string) => {
    // Keep only digits
    const digits = text.replace(/\D/g, "");
    // Auto-prepend 7 if user starts typing
    if (digits.length === 0) return "";
    let formatted = "+7";
    const rest = digits.startsWith("7") ? digits.slice(1) : digits.startsWith("8") ? digits.slice(1) : digits;
    if (rest.length > 0) formatted += " (" + rest.slice(0, 3);
    if (rest.length >= 3) formatted += ") " + rest.slice(3, 6);
    if (rest.length >= 6) formatted += "-" + rest.slice(6, 8);
    if (rest.length >= 8) formatted += "-" + rest.slice(8, 10);
    return formatted;
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    setError("");
    setIsLoading(true);

    try {
      await api("/api/onboarding/profile", {
        method: "PUT",
        body: {
          description: description.trim() || null,
          phone: phone.trim() || null,
          telegram: telegram.trim() || null,
          whatsapp: whatsapp.trim() || null,
          officeAddress: officeAddress.trim() || null,
          workingHours: workingHours.trim() || null,
        },
      });

      router.replace("/(specialist-tabs)/dashboard" as never);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Что-то пошло не так";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <HeaderBack title="" />
      <ResponsiveContainer>
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={{ paddingTop: "6%" }}>
            <Text className="text-sm text-amber-700 text-center mb-2">
              Шаг 3 из 3
            </Text>
            <Text className="text-2xl font-bold text-slate-900 text-center mb-6">
              Профиль
            </Text>

            {/* Avatar area */}
            <Pressable accessibilityLabel="Добавить фото" className="items-center mb-6">
              <View className="w-20 h-20 rounded-full bg-slate-100 items-center justify-center border-2 border-dashed border-slate-300">
                <FontAwesome name="camera" size={24} color="#94a3b8" />
              </View>
              <Text className="text-sm text-slate-400 mt-2">
                Добавить фото
              </Text>
            </Pressable>

            {/* About */}
            <Text className="text-sm text-slate-500 mb-1">О себе</Text>
            <TextInput
              accessibilityLabel="О себе"
              style={{
                height: 100,
                borderRadius: 12,
                backgroundColor: "#f8fafc",
                borderWidth: 1,
                borderColor: "#e2e8f0",
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                color: "#0f172a",
                textAlignVertical: "top",
                marginBottom: 4,
              }}
              placeholder="Расскажите о своем опыте..."
              placeholderTextColor="#94a3b8"
              value={description}
              onChangeText={(t) => {
                if (t.length <= 1000) setDescription(t);
              }}
              multiline
              editable={!isLoading}
            />
            <Text className="text-xs text-slate-400 text-right mb-4">
              {description.length}/1000
            </Text>

            {/* Phone */}
            <Text className="text-sm text-slate-500 mb-1">Телефон</Text>
            <TextInput
              accessibilityLabel="Телефон"
              style={{
                height: 48,
                borderRadius: 12,
                backgroundColor: "#f8fafc",
                borderWidth: 1,
                borderColor: "#e2e8f0",
                paddingHorizontal: 16,
                fontSize: 16,
                color: "#0f172a",
                marginBottom: 16,
              }}
              placeholder="+7 (___) ___-__-__"
              placeholderTextColor="#94a3b8"
              value={phone}
              onChangeText={(t) => setPhone(formatPhone(t))}
              keyboardType="phone-pad"
              editable={!isLoading}
            />

            {/* Telegram */}
            <Text className="text-sm text-slate-500 mb-1">Telegram</Text>
            <TextInput
              accessibilityLabel="Telegram"
              style={{
                height: 48,
                borderRadius: 12,
                backgroundColor: "#f8fafc",
                borderWidth: 1,
                borderColor: "#e2e8f0",
                paddingHorizontal: 16,
                fontSize: 16,
                color: "#0f172a",
                marginBottom: 16,
              }}
              placeholder="@username"
              placeholderTextColor="#94a3b8"
              value={telegram}
              onChangeText={setTelegram}
              autoCapitalize="none"
              editable={!isLoading}
            />

            {/* WhatsApp */}
            <Text className="text-sm text-slate-500 mb-1">WhatsApp</Text>
            <TextInput
              accessibilityLabel="WhatsApp"
              style={{
                height: 48,
                borderRadius: 12,
                backgroundColor: "#f8fafc",
                borderWidth: 1,
                borderColor: "#e2e8f0",
                paddingHorizontal: 16,
                fontSize: 16,
                color: "#0f172a",
                marginBottom: 16,
              }}
              placeholder="+7 (___) ___-__-__"
              placeholderTextColor="#94a3b8"
              value={whatsapp}
              onChangeText={(t) => setWhatsapp(formatPhone(t))}
              keyboardType="phone-pad"
              editable={!isLoading}
            />

            {/* Office address */}
            <Text className="text-sm text-slate-500 mb-1">Адрес офиса</Text>
            <TextInput
              style={{
                height: 48,
                borderRadius: 12,
                backgroundColor: "#f8fafc",
                borderWidth: 1,
                borderColor: "#e2e8f0",
                paddingHorizontal: 16,
                fontSize: 16,
                color: "#0f172a",
                marginBottom: 16,
              }}
              accessibilityLabel="Адрес офиса"
              placeholder="г. Москва, ул. Примерная, 1"
              placeholderTextColor="#94a3b8"
              value={officeAddress}
              onChangeText={setOfficeAddress}
              editable={!isLoading}
            />

            {/* Working hours */}
            <Text className="text-sm text-slate-500 mb-1">Часы работы</Text>
            <TextInput
              style={{
                height: 48,
                borderRadius: 12,
                backgroundColor: "#f8fafc",
                borderWidth: 1,
                borderColor: "#e2e8f0",
                paddingHorizontal: 16,
                fontSize: 16,
                color: "#0f172a",
                marginBottom: 24,
              }}
              accessibilityLabel="Часы работы"
              placeholder="Пн-Пт 9:00-18:00"
              placeholderTextColor="#94a3b8"
              value={workingHours}
              onChangeText={setWorkingHours}
              editable={!isLoading}
            />

            {error ? (
              <Text className="text-xs text-red-600 text-center mb-4">
                {error}
              </Text>
            ) : null}

            <Pressable
              accessibilityLabel="Завершить"
              onPress={handleSubmit}
              disabled={isLoading}
              className={`h-12 rounded-xl items-center justify-center ${
                isLoading
                  ? "bg-blue-900 opacity-50"
                  : "bg-blue-900 active:bg-slate-900"
              }`}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-base font-semibold">
                  Завершить
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
