import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState, useCallback } from "react";
import HeaderBack from "@/components/HeaderBack";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ErrorState from "@/components/ui/ErrorState";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";
import { colors } from "@/lib/theme";


interface SettingField {
  key: string;
  label: string;
  defaultValue: string;
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
  const [values, setValues] = useState<Record<string, string>>({});
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

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

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

  const getValue = (key: string, defaultValue: string): string => {
    return values[key] ?? defaultValue;
  };

  const setValue = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <HeaderBack title="Настройки системы" />
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center">
          <ErrorState message="Не удалось загрузить настройки" onRetry={fetchSettings} />
        </View>
      ) : (
        <ScrollView className="flex-1">
          <ResponsiveContainer>
            <View className="py-4 gap-4">
              {SETTINGS_FIELDS.map((field) => (
                <Input
                  key={field.key}
                  label={field.label}
                  value={getValue(field.key, field.defaultValue)}
                  onChangeText={(val) => setValue(field.key, val)}
                  keyboardType="numeric"
                />
              ))}

              <View className="mt-2">
                <Button
                  label="Сохранить"
                  onPress={handleSave}
                  disabled={saving}
                  loading={saving}
                />
              </View>
            </View>
          </ResponsiveContainer>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
