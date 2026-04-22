import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Head from "expo-router/head";
import HeaderBack from "@/components/HeaderBack";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import StatusBadge from "@/components/StatusBadge";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { MessageCircle, Send } from "lucide-react-native";
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
        !last ? "border-b border-border" : ""
      }`}
    >
      <Text className="text-sm text-text-mute">{label}</Text>
      <Text className="text-sm text-text-base font-medium flex-1 text-right ml-4">
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
      <SafeAreaView className="flex-1 bg-surface2">
        <HeaderBack title="Заявка" />
        <ResponsiveContainer>
          <LoadingState variant="skeleton" lines={5} />
        </ResponsiveContainer>
      </SafeAreaView>
    );
  }

  if (notFound) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <HeaderBack title="Заявка" />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-2xl font-bold text-text-base text-center mb-2">
            Заявка не найдена
          </Text>
          <Text className="text-base text-text-mute text-center mb-6">
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
          <Text className="text-base text-danger text-center mb-4">
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
        <View className="border-t border-border bg-white px-4 py-3">
          <ResponsiveContainer>
            <View className="bg-surface2 border border-border rounded-xl py-3 items-center">
              <Text className="text-text-mute text-sm font-medium">Ваша заявка</Text>
            </View>
          </ResponsiveContainer>
        </View>
      );
    }

    if (isAuthenticated && isSpecialist) {
      if (request.hasExistingThread && request.existingThreadId) {
        return (
          <View className="border-t border-border bg-white px-4 py-3">
            <ResponsiveContainer>
              <Button
                label="Открыть чат"
                onPress={() =>
                  router.push(`/threads/${request.existingThreadId}` as never)
                }
                icon={MessageCircle}
              />
            </ResponsiveContainer>
          </View>
        );
      }
      return (
        <View className="border-t border-border bg-white px-4 py-3">
          <ResponsiveContainer>
            <Button
              label="Написать клиенту"
              onPress={() => router.push(`/requests/${id}/write` as never)}
              icon={Send}
            />
          </ResponsiveContainer>
        </View>
      );
    }

    // Guest or non-specialist authenticated user
    return (
      <View className="border-t border-border bg-white px-4 py-3">
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
    <SafeAreaView className="flex-1 bg-surface2">
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
          <View className="bg-white rounded-2xl mt-4 px-4 py-5 sm:mx-0">
            <View className="flex-row items-start justify-between mb-3 gap-2">
              <Text className="text-2xl font-bold text-text-base flex-1 leading-tight">
                {request.title}
              </Text>
              <StatusBadge status={request.status} />
            </View>

            <View className="flex-row flex-wrap gap-2 mb-3">
              <View className="bg-surface2 border border-border px-3 py-1 rounded-lg">
                <Text className="text-sm text-text-base">{request.city.name}</Text>
              </View>
              <View className="bg-surface2 border border-border px-3 py-1 rounded-lg">
                <Text className="text-sm text-text-base">{request.fns.name}</Text>
              </View>
            </View>

            <Text className="text-xs text-text-mute mb-4">{responsesLabel}</Text>

            <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-2">
              Описание
            </Text>
            <Text className="text-base text-text-base leading-6">
              {request.description}
            </Text>
          </View>

          {/* Meta card */}
          <View className="bg-white rounded-2xl mt-3 px-4 py-1 sm:mx-0">
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
