import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Head from "expo-router/head";
import HeaderBack from "@/components/HeaderBack";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import StatusBadge from "@/components/StatusBadge";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiError } from "@/lib/api";

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
  hasExistingThread: boolean;
  existingThreadId: string | null;
}

function DetailSkeleton() {
  return (
    <View className="py-4 px-4">
      <View className="h-7 bg-slate-200 rounded-lg mb-2" style={{ width: "80%" }} />
      <View className="h-7 bg-slate-200 rounded-lg mb-4" style={{ width: "55%" }} />
      <View className="h-6 bg-slate-200 rounded-full mb-4" style={{ width: 80 }} />
      <View className="flex-row gap-2 mb-4">
        <View className="h-7 bg-slate-200 rounded-lg" style={{ width: 90 }} />
        <View className="h-7 bg-slate-200 rounded-lg" style={{ width: 130 }} />
      </View>
      <View className="h-4 bg-slate-200 rounded mb-2" style={{ width: "100%" }} />
      <View className="h-4 bg-slate-200 rounded mb-2" style={{ width: "92%" }} />
      <View className="h-4 bg-slate-200 rounded mb-2" style={{ width: "75%" }} />
      <View className="h-4 bg-slate-200 rounded mb-6" style={{ width: "60%" }} />
      <View className="border-t border-slate-100 pt-4 gap-3">
        <View className="flex-row justify-between">
          <View className="h-4 bg-slate-200 rounded" style={{ width: 60 }} />
          <View className="h-4 bg-slate-200 rounded" style={{ width: 110 }} />
        </View>
        <View className="flex-row justify-between">
          <View className="h-4 bg-slate-200 rounded" style={{ width: 80 }} />
          <View className="h-4 bg-slate-200 rounded" style={{ width: 70 }} />
        </View>
      </View>
    </View>
  );
}

function MetaRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      className={`flex-row justify-between items-center py-3 ${
        !last ? "border-b border-slate-100" : ""
      }`}
    >
      <Text className="text-sm text-slate-400">{label}</Text>
      <Text className="text-sm text-slate-900 font-medium flex-1 text-right ml-4">
        {value}
      </Text>
    </View>
  );
}

export default function PublicRequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      // Optional auth: api() attaches token when available; API handles missing token gracefully
      const res = await api<RequestDetail>(`/api/requests/${id}/public`);
      setRequest(res);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setNotFound(true);
      } else {
        setError("Не удалось загрузить заявку");
        console.error("PublicRequestDetail error:", e);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // Wait for auth to settle so the token is available before fetching
    if (!authLoading) {
      load();
    }
  }, [authLoading, load]);

  if (loading || authLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <HeaderBack title="Заявка" />
        <ResponsiveContainer>
          <DetailSkeleton />
        </ResponsiveContainer>
      </SafeAreaView>
    );
  }

  if (notFound) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <HeaderBack title="Заявка" />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-2xl font-bold text-slate-900 text-center mb-2">
            Заявка не найдена
          </Text>
          <Text className="text-base text-slate-500 text-center mb-6">
            Возможно, она была удалена или вы перешли по неверной ссылке
          </Text>
          <Button
            label="Назад к заявкам"
            onPress={() => router.push("/requests" as never)}
            fullWidth={false}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !request) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <HeaderBack title="Заявка" />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base text-red-600 text-center mb-4">
            {error || "Не удалось загрузить заявку"}
          </Text>
          <Button variant="secondary" label="Повторить" onPress={load} fullWidth={false} />
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = !!user && user.id === request.user.id;
  const isSpecialist = user?.role === "SPECIALIST";

  const createdDate = new Date(request.createdAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const responsesLabel =
    request.threadsCount === 1
      ? "1 специалист откликнулся"
      : request.threadsCount > 0
      ? `${request.threadsCount} специалистов откликнулись`
      : "Нет откликов";

  const renderFooter = () => {
    if (isOwner) {
      return (
        <View className="border-t border-slate-100 bg-white px-4 py-3">
          <ResponsiveContainer>
            <View className="bg-slate-50 border border-slate-200 rounded-xl py-3 items-center">
              <Text className="text-slate-500 text-sm font-medium">Ваша заявка</Text>
            </View>
          </ResponsiveContainer>
        </View>
      );
    }

    if (isAuthenticated && isSpecialist) {
      if (request.hasExistingThread && request.existingThreadId) {
        return (
          <View className="border-t border-slate-100 bg-white px-4 py-3">
            <ResponsiveContainer>
              <Button
                label="Открыть чат"
                onPress={() =>
                  router.push(`/threads/${request.existingThreadId}` as never)
                }
                icon="message-circle"
              />
            </ResponsiveContainer>
          </View>
        );
      }
      return (
        <View className="border-t border-slate-100 bg-white px-4 py-3">
          <ResponsiveContainer>
            <Button
              label="Написать клиенту"
              onPress={() => router.push(`/requests/${id}/write` as never)}
              icon="send"
            />
          </ResponsiveContainer>
        </View>
      );
    }

    // Guest or non-specialist authenticated user
    return (
      <View className="border-t border-slate-100 bg-white px-4 py-3">
        <ResponsiveContainer>
          <Button
            label="Войдите, чтобы откликнуться"
            onPress={() => router.push("/auth/email" as never)}
          />
        </ResponsiveContainer>
      </View>
    );
  };

  const ogDescription = `Заявка на налоговую помощь в ${request.city.name}. ${request.description}`.slice(0, 160);

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <Head>
        <title>{request.title} | P2PTax</title>
        <meta property="og:title" content={`${request.title} | P2PTax`} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:url" content={`https://p2ptax.ru/requests/${id}`} />
        <meta property="og:type" content="article" />
      </Head>
      <HeaderBack title="Заявка" />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 16 }}>
        <ResponsiveContainer>
          {/* Main card: title, status, chips, description */}
          <View className="bg-white rounded-2xl mx-4 mt-4 px-4 py-5">
            <View className="flex-row items-start justify-between mb-3 gap-2">
              <Text className="text-2xl font-bold text-slate-900 flex-1 leading-tight">
                {request.title}
              </Text>
              <StatusBadge status={request.status} />
            </View>

            <View className="flex-row flex-wrap gap-2 mb-3">
              <View className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
                <Text className="text-sm text-slate-700">{request.city.name}</Text>
              </View>
              <View className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
                <Text className="text-sm text-slate-700">{request.fns.name}</Text>
              </View>
            </View>

            <Text className="text-xs text-slate-400 mb-4">{responsesLabel}</Text>

            <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Описание
            </Text>
            <Text className="text-base text-slate-900 leading-6">
              {request.description}
            </Text>
          </View>

          {/* Meta card */}
          <View className="bg-white rounded-2xl mx-4 mt-3 px-4 py-1">
            <MetaRow label="Город" value={request.city.name} />
            <MetaRow label="Инспекция" value={request.fns.name} />
            <MetaRow label="Создана" value={createdDate} last />
          </View>
        </ResponsiveContainer>
      </ScrollView>

      {renderFooter()}
    </SafeAreaView>
  );
}
