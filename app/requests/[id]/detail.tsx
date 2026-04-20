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
import FontAwesome from "@expo/vector-icons/FontAwesome";
import HeaderBack from "@/components/HeaderBack";
import StatusBadge from "@/components/StatusBadge";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { api, apiPost, apiDelete } from "@/lib/api";
import { colors } from "@/lib/theme";

interface FileItem {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

interface ThreadSummary {
  id: string;
  otherUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
  lastMessage: { text: string; createdAt: string } | null;
  unreadCount: number;
}

interface SpecialistCard {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  description: string | null;
  services: string[];
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

function getSpecialistName(
  user: { firstName: string | null; lastName: string | null }
): string {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || "Специалист";
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
          <ActivityIndicator size="large" color="#1e3a8a" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !request) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <HeaderBack title="Заявка" />
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-base text-red-600 text-center">
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
    <SafeAreaView className="flex-1 bg-slate-50">
      <HeaderBack
        title={request.title}
        rightAction={
          <Pressable accessibilityLabel="Удалить заявку" onPress={handleDelete}>
            <FontAwesome name="trash-o" size={18} color={colors.error} />
          </Pressable>
        }
      />
      <ScrollView className="flex-1">
        <View style={containerStyle} className={isDesktop ? "" : "px-4"}>
          <View className="py-4">

            {/* Status + date */}
            <View className="flex-row items-center mb-3">
              <StatusBadge status={request.status} />
              <Text className="text-sm text-slate-400 ml-3">{createdDate}</Text>
            </View>

            {/* City + FNS chips */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              <View className="bg-white border border-slate-200 px-3 py-1 rounded-lg">
                <Text className="text-sm text-slate-700">{request.city.name}</Text>
              </View>
              <View className="bg-white border border-slate-200 px-3 py-1 rounded-lg">
                <Text className="text-sm text-slate-700">
                  {request.fns.name} ({request.fns.code})
                </Text>
              </View>
            </View>

            {/* Description */}
            <View
              className="bg-white rounded-2xl p-4 mb-4"
              style={{
                shadowColor: "#0F172A",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Text className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                Описание
              </Text>
              <Text className="text-base text-slate-900 leading-6">
                {request.description}
              </Text>
            </View>

            {/* Files */}
            {request.files.length > 0 && (
              <View
                className="bg-white rounded-2xl p-4 mb-4"
                style={{
                  shadowColor: "#0F172A",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <Text className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">
                  Прикреплённые документы
                </Text>
                {request.files.map((file) => (
                  <Pressable
                    key={file.id}
                    accessibilityLabel={`Открыть файл ${file.filename}`}
                    onPress={() => handleFilePress(file)}
                    className="flex-row items-center bg-slate-50 rounded-xl p-3 mb-2"
                  >
                    <FontAwesome
                      name={
                        file.mimeType === "application/pdf"
                          ? "file-pdf-o"
                          : "file-image-o"
                      }
                      size={20}
                      color="#1e3a8a"
                    />
                    <View className="ml-3 flex-1">
                      <Text className="text-sm text-slate-900" numberOfLines={1}>
                        {file.filename}
                      </Text>
                      <Text className="text-xs text-slate-400">
                        {(file.size / 1024).toFixed(0)} КБ
                      </Text>
                    </View>
                    <FontAwesome name="download" size={14} color="#94a3b8" />
                  </Pressable>
                ))}
              </View>
            )}

            {/* Extend button (closing_soon + extensions remaining) */}
            {canExtend && (
              <Pressable
                accessibilityLabel="Продлить заявку"
                onPress={handleExtend}
                disabled={extending}
                className="bg-amber-500 rounded-xl py-3 items-center mb-4"
              >
                {extending ? (
                  <ActivityIndicator color="#ffffff" />
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
                <View className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
                  <Text className="text-sm text-amber-700 text-center font-medium">
                    Продление использовано ({request.extensionsCount}/
                    {request.maxExtensions})
                  </Text>
                </View>
              )}

            {/* Messages / response threads */}
            <View
              className="bg-white rounded-2xl p-4 mb-4"
              style={{
                shadowColor: "#0F172A",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Сообщения
                </Text>
                {request.unreadMessages > 0 && (
                  <View className="bg-blue-900 rounded-full px-2 py-0.5">
                    <Text className="text-white text-xs font-bold">
                      {request.unreadMessages}
                    </Text>
                  </View>
                )}
              </View>

              {threads.length === 0 ? (
                <Text className="text-sm text-slate-400 py-2 text-center">
                  Специалисты ещё не написали
                </Text>
              ) : (
                <>
                  <Text className="text-sm text-slate-500 mb-3">
                    {request.threadsCount}{" "}
                    {request.threadsCount === 1
                      ? "специалист написал"
                      : "специалистов написали"}{" "}
                    вам
                  </Text>
                  {threads.map((thread) => {
                    const name = getSpecialistName(thread.otherUser);
                    return (
                      <View
                        key={thread.id}
                        className="flex-row items-center py-3 border-b border-slate-100"
                      >
                        <Avatar
                          name={name}
                          imageUrl={thread.otherUser.avatarUrl ?? undefined}
                          size="sm"
                        />
                        <View className="flex-1 ml-3">
                          <Text className="text-sm font-semibold text-slate-900">
                            {name}
                          </Text>
                          {thread.lastMessage && (
                            <Text
                              className="text-xs text-slate-400 mt-0.5"
                              numberOfLines={1}
                            >
                              {thread.lastMessage.text}
                            </Text>
                          )}
                        </View>
                        <View className="flex-row items-center">
                          {thread.unreadCount > 0 && (
                            <View className="bg-blue-900 rounded-full w-5 h-5 items-center justify-center mr-2">
                              <Text className="text-white text-xs font-bold">
                                {thread.unreadCount > 9 ? "9+" : thread.unreadCount}
                              </Text>
                            </View>
                          )}
                          <Pressable
                            accessibilityLabel={`Открыть чат с ${name}`}
                            onPress={() =>
                              router.push(`/threads/${thread.id}` as never)
                            }
                            className="bg-blue-900 rounded-lg px-3 py-1.5"
                          >
                            <Text className="text-white text-xs font-semibold">
                              Открыть чат
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}

                  {/* View all button */}
                  <Pressable
                    accessibilityLabel="Все сообщения"
                    onPress={() =>
                      router.push(`/requests/${id}/messages` as never)
                    }
                    className="mt-3 border border-blue-900 rounded-xl py-2.5 items-center"
                  >
                    <Text className="text-blue-900 font-semibold text-sm">
                      Все сообщения ({request.threadsCount})
                    </Text>
                  </Pressable>
                </>
              )}
            </View>

            {/* Recommended specialists */}
            {recommendations.length > 0 && (
              <View className="mb-4">
                <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  Рекомендованные специалисты
                </Text>
                {recommendations.map((spec) => {
                  const name = getSpecialistName(spec);
                  return (
                    <Pressable
                      key={spec.id}
                      accessibilityLabel={`Профиль специалиста ${name}`}
                      onPress={() =>
                        router.push(`/specialists/${spec.id}` as never)
                      }
                      className="bg-white rounded-2xl p-4 mb-3"
                      style={{
                        shadowColor: "#0F172A",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 8,
                        elevation: 2,
                      }}
                    >
                      <View className="flex-row items-center">
                        <Avatar
                          name={name}
                          imageUrl={spec.avatarUrl ?? undefined}
                          size="md"
                        />
                        <View className="ml-3 flex-1">
                          <Text className="text-base font-semibold text-slate-900">
                            {name}
                          </Text>
                          {spec.services.length > 0 && (
                            <Text
                              className="text-xs text-slate-400 mt-0.5"
                              numberOfLines={1}
                            >
                              {spec.services.join(", ")}
                            </Text>
                          )}
                          {spec.description && (
                            <Text
                              className="text-sm text-slate-600 mt-1 leading-5"
                              numberOfLines={2}
                            >
                              {spec.description}
                            </Text>
                          )}
                        </View>
                        <FontAwesome name="chevron-right" size={12} color="#94a3b8" />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Meta stats */}
            <View
              className="bg-white rounded-2xl p-4 mb-6"
              style={{
                shadowColor: "#0F172A",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-slate-400">Откликов</Text>
                <Text className="text-sm text-slate-900">
                  {request.threadsCount}
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-slate-400">Продлений</Text>
                <Text className="text-sm text-slate-900">
                  {request.extensionsCount}/{request.maxExtensions}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-slate-400">Город</Text>
                <Text className="text-sm text-slate-900">{request.city.name}</Text>
              </View>
            </View>

          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
