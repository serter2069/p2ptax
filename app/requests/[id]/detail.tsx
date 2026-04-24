import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Trash2, File, FileImage, Download } from "lucide-react-native";
import HeaderBack from "@/components/HeaderBack";
import StatusBadge from "@/components/StatusBadge";
import Button from "@/components/ui/Button";
import { api, apiPost, apiDelete } from "@/lib/api";
import { colors } from "@/lib/theme";
import ThreadsList, { ThreadSummary } from "@/components/requests/ThreadsList";
import SpecialistRecommendations, { SpecialistCard } from "@/components/requests/SpecialistRecommendations";
import EmptyState from "@/components/ui/EmptyState";

interface FileItem {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

interface RequestDetailData {
  id: string;
  title: string;
  description: string;
  status: "ACTIVE" | "CLOSING_SOON" | "CLOSED";
  createdAt: string;
  lastActivityAt: string;
  extensionsCount: number;
  maxExtensions: number;
  city: { id: string; name: string };
  fns: { id: string; name: string; code: string };
  files: FileItem[];
  threadsCount: number;
  unreadMessages: number;
}

export default function MyRequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;

  const [request, setRequest] = useState<RequestDetailData | null>(null);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [recommendations, setRecommendations] = useState<SpecialistCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extending, setExtending] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [detail, threadsRes] = await Promise.all([
        api<RequestDetailData>(`/api/requests/${id}/detail`),
        api<{ items: ThreadSummary[] }>(`/api/threads?request_id=${id}`),
      ]);
      setRequest(detail);
      setThreads(threadsRes.items);

      // Load recommendations in background — non-blocking
      api<{ items: SpecialistCard[] }>(`/api/requests/${id}/recommendations`)
        .then((r) => setRecommendations(r.items))
        .catch(() => {/* silent — not critical */});
    } catch (e) {
      setError("Не удалось загрузить заявку");
      console.error("Request detail error:", e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchAll();
  }, [id, fetchAll]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      "Удалить заявку",
      "Удалить заявку? Все сообщения и файлы будут потеряны. Это действие нельзя отменить.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Да, удалить",
          style: "destructive",
          onPress: async () => {
            try {
              await apiDelete(`/api/requests/${id}`);
              router.back();
            } catch (e) {
              console.error("Delete error:", e);
              Alert.alert("Ошибка", "Не удалось удалить заявку");
            }
          },
        },
      ]
    );
  }, [id, router]);

  const handleExtend = useCallback(async () => {
    if (extending) return;
    setExtending(true);
    try {
      const res = await apiPost<{ extensionsCount: number; status: string }>(
        `/api/requests/${id}/extend`,
        {}
      );
      setRequest((prev) =>
        prev
          ? {
              ...prev,
              extensionsCount: res.extensionsCount,
              status: res.status as "ACTIVE" | "CLOSING_SOON" | "CLOSED",
            }
          : null
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Не удалось продлить заявку";
      Alert.alert("Ошибка", msg);
    } finally {
      setExtending(false);
    }
  }, [id, extending]);

  const handleFilePress = useCallback(async (file: FileItem) => {
    try {
      const res = await api<{ url: string }>(
        `/api/upload/signed-url/${encodeURIComponent(file.url.replace(/^\/p2ptax\//, ""))}`
      );
      await Linking.openURL(res.url);
    } catch (e) {
      console.error("File open error:", e);
    }
  }, []);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <HeaderBack title="Заявка" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !request) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <HeaderBack title="Заявка" />
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-base text-danger text-center">
            {error || "Заявка не найдена"}
          </Text>
          <View className="mt-4">
            <Button
              label="Назад"
              onPress={() => router.back()}
              fullWidth={false}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const createdDate = new Date(request.createdAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const canExtend =
    request.status === "CLOSING_SOON" &&
    request.extensionsCount < request.maxExtensions;

  const containerStyle = isDesktop
    ? { maxWidth: 520, width: "100%" as const, alignSelf: "center" as const }
    : undefined;

  return (
    <SafeAreaView className="flex-1 bg-surface2">
      <HeaderBack
        title={request.title}
        rightAction={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Удалить заявку"
            onPress={handleDelete}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            <Trash2 size={18} color={colors.error} />
          </Pressable>
        }
      />
      <ScrollView className="flex-1">
        <View style={containerStyle} className={isDesktop ? "" : "px-4"}>
          <View className="py-4">

            {/* Status + date */}
            <View className="flex-row items-center mb-3">
              <StatusBadge status={request.status} />
              <Text className="text-sm text-text-mute ml-3">{createdDate}</Text>
            </View>

            {/* City + FNS chips */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              <View className="bg-white border border-border px-3 py-1 rounded-lg">
                <Text className="text-sm text-text-base">{request.city.name}</Text>
              </View>
              <View className="bg-white border border-border px-3 py-1 rounded-lg">
                <Text className="text-sm text-text-base">
                  {request.fns.name} ({request.fns.code})
                </Text>
              </View>
            </View>

            {/* Description */}
            <View
              className="bg-white rounded-2xl p-4 mb-4"
              style={{
                shadowColor: colors.text,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Text className="text-xs font-semibold text-text-mute mb-2 uppercase tracking-wide">
                Описание
              </Text>
              <Text className="text-base text-text-base leading-6">
                {request.description}
              </Text>
            </View>

            {/* Files */}
            <View
              className="bg-white rounded-2xl p-4 mb-4"
              style={{
                shadowColor: colors.text,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Text className="text-xs font-semibold text-text-mute mb-3 uppercase tracking-wide">
                Прикреплённые документы
              </Text>
              {request.files.length === 0 ? (
                <EmptyState title="Нет документов" subtitle="К этой заявке не прикреплены файлы" />
              ) : (
                request.files.map((file) => (
                  <Pressable
                    accessibilityRole="button"
                    key={file.id}
                    accessibilityLabel={`Открыть файл ${file.filename}`}
                    onPress={() => handleFilePress(file)}
                    className="flex-row items-center bg-surface2 rounded-xl p-3 mb-2"
                    style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                  >
                    {file.mimeType === "application/pdf"
                      ? <File size={20} color={colors.primary} />
                      : <FileImage size={20} color={colors.primary} />
                    }
                    <View className="ml-3 flex-1">
                      <Text className="text-sm text-text-base" numberOfLines={1}>
                        {file.filename}
                      </Text>
                      <Text className="text-xs text-text-mute">
                        {(file.size / 1024).toFixed(0)} КБ
                      </Text>
                    </View>
                    <Download size={14} color={colors.placeholder} />
                  </Pressable>
                ))
              )}
            </View>

            {/* Extend button */}
            {canExtend && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Продлить заявку"
                onPress={handleExtend}
                disabled={extending}
                className="bg-warning rounded-xl py-3 items-center mb-4"
                style={({ pressed }) => [pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }]}
              >
                {extending ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text className="text-white font-semibold text-base">
                    Продлить заявку — Продлений: {request.extensionsCount}/
                    {request.maxExtensions}
                  </Text>
                )}
              </Pressable>
            )}

            {/* Extend limit banner */}
            {request.status === "CLOSING_SOON" &&
              request.extensionsCount >= request.maxExtensions && (
                <View className="bg-warning-soft border border-amber-200 rounded-xl px-4 py-3 mb-4">
                  <Text className="text-sm text-warning text-center font-medium">
                    Продление использовано ({request.extensionsCount}/
                    {request.maxExtensions})
                  </Text>
                </View>
              )}

            <ThreadsList
              threads={threads}
              requestId={id}
              threadsCount={request.threadsCount}
              unreadMessages={request.unreadMessages}
              onOpenThread={(threadId) => router.push(`/threads/${threadId}` as never)}
            />

            <SpecialistRecommendations
              recommendations={recommendations}
              onContact={(specialistId) => router.push(`/specialists/${specialistId}` as never)}
            />

            {/* Meta stats */}
            <View
              className="bg-white rounded-2xl p-4 mb-6"
              style={{
                shadowColor: colors.text,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-text-mute">Сообщений</Text>
                <Text className="text-sm text-text-base">
                  {request.threadsCount}
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-text-mute">Продлений</Text>
                <Text className="text-sm text-text-base">
                  {request.extensionsCount}/{request.maxExtensions}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-text-mute">Город</Text>
                <Text className="text-sm text-text-base">{request.city.name}</Text>
              </View>
            </View>

          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
