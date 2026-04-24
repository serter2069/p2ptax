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
import { Settings, AlertTriangle, Users, FileCheck2 } from "lucide-react-native";
import HeaderBack from "@/components/HeaderBack";
import TwoColumnForm from "@/components/layout/TwoColumnForm";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL, api } from "@/lib/api";
import { colors } from "@/lib/theme";


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

  const getValue = (key: string, defaultValue: string): string => {
    return values[key] ?? defaultValue;
  };

  const setValue = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const totalUsers = (stats?.totalClients ?? 0) + (stats?.totalSpecialists ?? 0);

  const leftPane = (
    <View style={{ gap: 24 }}>
      <View
        className="rounded-2xl items-center justify-center bg-white self-start"
        style={{ width: 56, height: 56 }}
      >
        <Settings size={26} color={colors.accent} />
      </View>
      <View style={{ gap: 12 }}>
        <Text
          className="font-extrabold text-text-base"
          style={{ fontSize: 24, lineHeight: 30 }}
        >
          Глобальные настройки
        </Text>
        <Text className="text-text-mute" style={{ fontSize: 14, lineHeight: 20 }}>
          Изменения применяются ко всей платформе и вступают в силу сразу.
        </Text>
      </View>

      {/* Warning */}
      <View
        className="rounded-2xl border bg-white"
        style={{
          padding: 14,
          borderColor: colors.warning,
          borderLeftWidth: 4,
          gap: 8,
        }}
      >
        <View className="flex-row items-center gap-2">
          <AlertTriangle size={16} color={colors.warning} />
          <Text
            className="font-extrabold"
            style={{ fontSize: 13, color: colors.warning }}
          >
            Влияет на пользователей
          </Text>
        </View>
        <Text className="text-text-base" style={{ fontSize: 13, lineHeight: 19 }}>
          Эти настройки затрагивают {totalUsers || "всех"} пользователей платформы. Проверяйте
          дважды перед сохранением.
        </Text>
      </View>

      <View
        className="bg-white rounded-2xl border border-border"
        style={{ padding: 16, gap: 12 }}
      >
        <StatRow
          icon={Users}
          label="Пользователей"
          value={totalUsers ? String(totalUsers) : "—"}
        />
        <StatRow
          icon={FileCheck2}
          label="Активных заявок"
          value={stats?.activeRequests ? String(stats.activeRequests) : "—"}
        />
      </View>
    </View>
  );

  const rightForm = (
    <SafeAreaView className="flex-1 bg-surface2" edges={["top"]}>
      <HeaderBack title="Настройки системы" />
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
        <ScrollView className="flex-1">
          <View className="px-4">
            <View className="py-4 gap-4">
              {SETTINGS_FIELDS.length === 0 ? (
                <EmptyState
                  icon={Settings}
                  title="Нет настроек"
                  subtitle="Настройки системы недоступны"
                />
              ) : (
                SETTINGS_FIELDS.map((field) => (
                  <Input
                    key={field.key}
                    label={field.label}
                    value={getValue(field.key, field.defaultValue)}
                    onChangeText={(val) => setValue(field.key, val)}
                    keyboardType="numeric"
                  />
                ))
              )}

              <View className="mt-2">
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

  return <TwoColumnForm left={leftPane} right={rightForm} />;
}

function StatRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <View
        className="rounded-lg items-center justify-center bg-accent-soft"
        style={{ width: 32, height: 32 }}
      >
        <Icon size={14} color={colors.accent} />
      </View>
      <Text className="text-text-mute flex-1" style={{ fontSize: 13 }}>
        {label}
      </Text>
      <Text
        className="text-text-base font-extrabold"
        style={{ fontSize: 14 }}
      >
        {value}
      </Text>
    </View>
  );
}
