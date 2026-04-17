import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import HeaderHome from "@/components/HeaderHome";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import RequestCard from "@/components/RequestCard";
import EmptyState from "@/components/EmptyState";
import { api, apiPatch } from "@/lib/api";

interface RequestItem {
  id: string;
  title: string;
  description: string;
  status: "ACTIVE" | "CLOSING_SOON" | "CLOSED";
  createdAt: string;
  city: { id: string; name: string };
  fns: { id: string; name: string; code: string };
  threadsCount: number;
}

export default function MyRequests() {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await api<{ items: RequestItem[] }>("/api/requests/my");
      setRequests(res.items);
    } catch (e) {
      console.error("Fetch my requests error:", e);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchRequests().finally(() => setLoading(false));
  }, [fetchRequests]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  }, [fetchRequests]);

  const handleClose = useCallback(
    (id: string, title: string) => {
      Alert.alert(
        "Закрыть заявку",
        `Вы уверены, что хотите закрыть "${title}"?`,
        [
          { text: "Отмена", style: "cancel" },
          {
            text: "Закрыть",
            style: "destructive",
            onPress: async () => {
              try {
                await apiPatch(`/api/requests/${id}/status`, {
                  status: "CLOSED",
                });
                setRequests((prev) =>
                  prev.map((r) =>
                    r.id === id ? { ...r, status: "CLOSED" as const } : r
                  )
                );
              } catch (e) {
                console.error("Close request error:", e);
                Alert.alert("Ошибка", "Не удалось закрыть заявку");
              }
            },
          },
        ]
      );
    },
    []
  );

  const handleRequestPress = useCallback(
    (id: string) => {
      router.push(`/requests/${id}/detail` as never);
    },
    [router]
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <HeaderHome />
      <ResponsiveContainer>
        <Text className="text-2xl font-bold text-slate-900 mt-4 mb-4">
          Мои заявки
        </Text>

        {loading ? (
          <View className="flex-1 items-center justify-center py-16">
            <ActivityIndicator size="large" color="#1e3a8a" />
          </View>
        ) : requests.length === 0 ? (
          <EmptyState
            icon="file-text-o"
            title="Заявок пока нет"
            subtitle="Создайте заявку, чтобы найти специалиста"
            actionLabel="Создать заявку"
            onAction={() => router.push("/requests/new" as never)}
          />
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            contentContainerClassName="pb-4"
            renderItem={({ item }) => (
              <View>
                <RequestCard
                  id={item.id}
                  title={item.title}
                  description={item.description}
                  status={item.status}
                  city={item.city}
                  fns={item.fns}
                  threadsCount={item.threadsCount}
                  onPress={handleRequestPress}
                />
                {item.status !== "CLOSED" && (
                  <Pressable
                    accessibilityLabel="Закрыть заявку"
                    onPress={() => handleClose(item.id, item.title)}
                    className="self-end -mt-1 mb-3 px-3 py-1.5 bg-red-600 rounded-lg"
                  >
                    <Text className="text-white text-xs font-medium">
                      Закрыть
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListFooterComponent={
              <Pressable
                accessibilityLabel="Создать заявку"
                onPress={() => router.push("/requests/new" as never)}
                className="bg-blue-900 rounded-xl py-3 items-center mt-2"
              >
                <Text className="text-white font-semibold text-base">
                  Создать заявку
                </Text>
              </Pressable>
            }
          />
        )}
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
