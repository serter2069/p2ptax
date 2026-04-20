import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState, useCallback } from "react";
import HeaderBack from "@/components/HeaderBack";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";


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

  const fetchSettings = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setValues(data);
      }
    } catch {
      // ignore
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
          <ActivityIndicator size="large" color="#1e3a8a" />
        </View>
      ) : (
        <ScrollView className="flex-1">
          <ResponsiveContainer>
            <View className="py-4 gap-4">
              {SETTINGS_FIELDS.map((field) => (
                <View key={field.key}>
                  <Text className="text-sm font-medium text-slate-700 mb-1">
                    {field.label}
                  </Text>
                  <TextInput
                    accessibilityLabel={field.label}
                    style={{
                      backgroundColor: "#ffffff",
                      borderWidth: 1,
                      borderColor: "#e2e8f0",
                      borderRadius: 10,
                      height: 48,
                      paddingHorizontal: 14,
                      fontSize: 16,
                      color: "#0f172a",
                    }}
                    value={getValue(field.key, field.defaultValue)}
                    onChangeText={(val) => setValue(field.key, val)}
                    keyboardType="numeric"
                  />
                </View>
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
