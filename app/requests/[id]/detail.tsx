import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import HeaderBack from "@/components/HeaderBack";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import StatusBadge from "@/components/StatusBadge";
import { api, apiPost, apiDelete } from "@/lib/api";

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

  const [request, setRequest] = useState<RequestDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extending, setExtending] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await api<RequestDetailData>(`/api/requests/${id}/detail`);
      setRequest(res);
    } catch (e) {
      setError("Не удалось загрузить заявку");
      console.error("Request detail error:", e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchDetail();
  }, [id, fetchDetail]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      "Удалить заявку",
      "Вы уверены? Это действие нельзя отменить.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
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
          <Pressable
            accessibilityLabel="Назад"
            onPress={() => router.back()}
            className="mt-4 bg-blue-900 rounded-xl px-6 py-3"
          >
            <Text className="text-white font-semibold">Назад</Text>
          </Pressable>
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

  return (
    <SafeAreaView className="flex-1 bg-white">
      <HeaderBack
        title={request.title}
        rightAction={
          <Pressable accessibilityLabel="Удалить заявку" onPress={handleDelete}>
            <FontAwesome name="trash-o" size={18} color="#ef4444" />
          </Pressable>
        }
      />
      <ScrollView className="flex-1">
        <ResponsiveContainer>
          <View className="py-4">
            {/* Status badge */}
            <View className="flex-row items-center mb-3">
              <StatusBadge status={request.status} />
              <Text className="text-sm text-slate-400 ml-3">{createdDate}</Text>
            </View>

            {/* City + FNS chips */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              <View className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
                <Text className="text-sm text-slate-900">{request.city.name}</Text>
              </View>
              <View className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
                <Text className="text-sm text-slate-900">
                  {request.fns.name} ({request.fns.code})
                </Text>
              </View>
            </View>

            {/* Description */}
            <Text className="text-base text-slate-900 leading-6 mb-4">
              {request.description}
            </Text>

            {/* Files */}
            {request.files.length > 0 && (
              <View className="mb-4">
                <Text className="text-sm font-semibold text-slate-900 mb-2">
                  Прикрепленные файлы
                </Text>
                {request.files.map((file) => (
                  <Pressable
                    key={file.id}
                    accessibilityLabel={`Открыть файл ${file.filename}`}
                    onPress={() => handleFilePress(file)}
                    className="flex-row items-center bg-slate-50 rounded-lg p-3 mb-2"
                  >
                    <FontAwesome
                      name={file.mimeType === "application/pdf" ? "file-pdf-o" : "file-image-o"}
                      size={20}
                      color="#1e3a8a"
                    />
                    <View className="ml-3 flex-1">
                      <Text className="text-sm text-slate-900" numberOfLines={1}>
                        {file.filename}
                      </Text>
                      <Text className="text-xs text-slate-400">
                        {(file.size / 1024).toFixed(0)} KB
                      </Text>
                    </View>
                    <FontAwesome name="download" size={14} color="#94a3b8" />
                  </Pressable>
                ))}
              </View>
            )}

            {/* Messages button */}
            <Pressable
              accessibilityLabel="Сообщения"
              onPress={() => router.push(`/requests/${id}/messages` as never)}
              className="flex-row items-center justify-center bg-slate-50 border border-slate-200 rounded-xl py-3 mb-4"
            >
              <FontAwesome name="comments-o" size={18} color="#1e3a8a" />
              <Text className="text-blue-900 font-semibold text-base ml-2">
                Сообщения ({request.unreadMessages})
              </Text>
            </Pressable>

            {/* Extend button (for closing_soon) */}
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
                    Продлить ({request.extensionsCount}/{request.maxExtensions})
                  </Text>
                )}
              </Pressable>
            )}

            {/* Stats */}
            <View className="border-t border-slate-200 pt-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-slate-400">Откликов</Text>
                <Text className="text-sm text-slate-900">{request.threadsCount}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-slate-400">Продлений</Text>
                <Text className="text-sm text-slate-900">
                  {request.extensionsCount}/{request.maxExtensions}
                </Text>
              </View>
            </View>
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
