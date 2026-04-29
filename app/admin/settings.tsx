import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { AlertTriangle, Settings, ChevronLeft } from "lucide-react-native";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL, api } from "@/lib/api";
import { colors, textStyle } from "@/lib/theme";

interface SettingField {
  key: string;
  label: string;
  defaultValue: string;
}

interface AdminExtra {
  totalClients?: number;
  totalSpecialists?: number;
  activeRequests?: number;
}

const SETTINGS_FIELDS: SettingField[] = [
  { key: "requests_limit", label: "Макс. заявок на клиента", defaultValue: "5" },
  { key: "threads_per_request_limit", label: "Макс. диалогов на заявку", defaultValue: "10" },
  { key: "auto_close_days", label: "Автозакрытие через (дней)", defaultValue: "30" },
  { key: "max_extensions", label: "Макс. продлений", defaultValue: "3" },
  { key: "warning_days", label: "Предупреждение за (дней)", defaultValue: "3" },
  { key: "max_file_size_mb", label: "Макс. размер файла (МБ)", defaultValue: "10" },
  { key: "max_files_per_message", label: "Макс. файлов в сообщении", defaultValue: "5" },
];

export default function AdminSettings() {
  const { token } = useAuth();
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<AdminExtra | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!token) return;
    setError(false);
    try {
      const res = await fetch(`${API_URL}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setValues(data);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchStats = useCallback(async () => {
    try {
      const s = await api<AdminExtra>("/api/stats/admin-dashboard");
      setStats(s);
    } catch {
      setStats(null);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchStats();
  }, [fetchSettings, fetchStats]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        const data = await res.json();
        setValues(data);
        if (Platform.OS === "web") {
          window.alert("Сохранено");
        } else {
          Alert.alert("Готово", "Настройки сохранены");
        }
      }
    } catch {
      if (Platform.OS === "web") {
        window.alert("Ошибка сохранения");
      } else {
        Alert.alert("Ошибка", "Не удалось сохранить настройки");
      }
    } finally {
      setSaving(false);
    }
  };

  const getValue = (key: string, defaultValue: string): string =>
    values[key] ?? defaultValue;

  const setValue = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const totalUsers =
    (stats?.totalClients ?? 0) + (stats?.totalSpecialists ?? 0);

  return (
    <SafeAreaView className="flex-1 bg-surface2" edges={["top"]}>
      <View className="px-4 pt-4">
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
        <Text className="text-2xl font-extrabold text-text-base mb-4">Настройки системы</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center">
          <ErrorState
            message="Не удалось загрузить настройки"
            onRetry={fetchSettings}
          />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
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
            <Text
              style={{
                ...textStyle.h1,
                color: colors.text,
                fontSize: 24,
                lineHeight: 30,
                marginBottom: 6,
              }}
            >
              Глобальные настройки
            </Text>
            <Text className="text-text-mute mb-4" style={{ fontSize: 14, lineHeight: 20 }}>
              Изменения применяются ко всей платформе и вступают в силу сразу.
            </Text>

            <View
              className="rounded-2xl border bg-white mb-4"
              style={{
                padding: 14,
                borderColor: colors.warning,
                borderLeftWidth: 4,
              }}
            >
              <View className="flex-row items-center gap-2 mb-1">
                <AlertTriangle size={16} color={colors.warning} />
                <Text
                  className="font-extrabold"
                  style={{ fontSize: 13, color: colors.warning }}
                >
                  Влияет на пользователей
                </Text>
              </View>
              <Text
                className="text-text-base"
                style={{ fontSize: 13, lineHeight: 19 }}
              >
                Эти настройки затрагивают {totalUsers || "всех"} пользователей
                платформы. Проверяйте дважды перед сохранением.
              </Text>
            </View>

            <View className="bg-white border border-border rounded-2xl px-4 py-5 mb-4">
              <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
                Лимиты
              </Text>

              {SETTINGS_FIELDS.length === 0 ? (
                <EmptyState
                  icon={Settings}
                  title="Нет настроек"
                  subtitle="Настройки системы недоступны"
                />
              ) : (
                <View style={{ gap: 12 }}>
                  {SETTINGS_FIELDS.map((field) => (
                    <Input
                      key={field.key}
                      label={field.label}
                      value={getValue(field.key, field.defaultValue)}
                      onChangeText={(val) => setValue(field.key, val)}
                      keyboardType="numeric"
                    />
                  ))}
                </View>
              )}

              <View className="mt-4">
                <Button
                  label="Сохранить"
                  onPress={handleSave}
                  disabled={saving}
                  loading={saving}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
