import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import HeaderBack from "@/components/HeaderBack";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

interface RequestDetail {
  id: string;
  title: string;
  description: string;
  status: "ACTIVE" | "CLOSING_SOON" | "CLOSED";
  createdAt: string;
  lastActivityAt: string;
  city: { id: string; name: string };
  fns: { id: string; name: string; code: string };
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
  threadsCount: number;
}

export default function PublicRequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api<RequestDetail>(`/api/requests/${id}/public`, {
          noAuth: true,
        });
        setRequest(res);
      } catch (e) {
        setError("Не удалось загрузить заявку");
        console.error("Request detail error:", e);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <HeaderBack title="Заявка" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1e3a5f" />
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
            onPress={() => router.back()}
            className="mt-4 bg-blue-900 rounded-xl px-6 py-3"
          >
            <Text className="text-white font-semibold">Назад</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isSpecialist = user?.role === "SPECIALIST";
  const authorName = [request.user.firstName, request.user.lastName]
    .filter(Boolean)
    .join(" ") || "Клиент";

  const createdDate = new Date(request.createdAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      <HeaderBack title="Заявка" />
      <ScrollView className="flex-1">
        <ResponsiveContainer>
          <View className="py-4">
            {/* Title + status */}
            <View className="flex-row items-start justify-between mb-3">
              <Text className="text-2xl font-bold text-slate-900 flex-1 mr-3">
                {request.title}
              </Text>
              <StatusBadge status={request.status} />
            </View>

            {/* Chips */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              <View className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
                <Text className="text-sm text-slate-900">{request.city.name}</Text>
              </View>
              <View className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
                <Text className="text-sm text-slate-900">{request.fns.name}</Text>
              </View>
            </View>

            {/* Description */}
            <Text className="text-base text-slate-900 leading-6 mb-4">
              {request.description}
            </Text>

            {/* Meta */}
            <View className="border-t border-slate-200 pt-4 mb-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-slate-400">Создано</Text>
                <Text className="text-sm text-slate-900">{createdDate}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-slate-400">Автор</Text>
                <Text className="text-sm text-slate-900">{authorName}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-slate-400">Откликов</Text>
                <Text className="text-sm text-slate-900">{request.threadsCount}</Text>
              </View>
            </View>
          </View>
        </ResponsiveContainer>
      </ScrollView>

      {/* Footer CTA */}
      <View className="border-t border-slate-200 px-4 py-3">
        <ResponsiveContainer>
          {isAuthenticated && isSpecialist ? (
            <Pressable className="bg-blue-900 rounded-xl py-3 items-center">
              <Text className="text-white font-semibold text-base">
                Написать клиенту
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => router.push("/(auth)/email" as never)}
              className="bg-blue-900 rounded-xl py-3 items-center"
            >
              <Text className="text-white font-semibold text-base">
                {isAuthenticated ? "Написать клиенту" : "Войти для ответа"}
              </Text>
            </Pressable>
          )}
        </ResponsiveContainer>
      </View>
    </SafeAreaView>
  );
}
