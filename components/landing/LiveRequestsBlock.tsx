import { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ArrowRight, FileText, Paperclip, Activity } from "lucide-react-native";
import { api } from "@/lib/api";
import FnsLogo from "@/components/fns/FnsLogo";
import { colors } from "@/lib/theme";

interface PublicRequestItem {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  city: { id: string; name: string };
  fns: { id: string; name: string; code: string };
  threadsCount?: number;
  hasFiles?: boolean;
  filesCount?: number;
  user?: { firstName: string | null; lastName: string | null };
}

const LIMIT = 12;

/**
 * Лента публичных запросов на лендинге, видна всем (анонимам и
 * авторизованным). Цель — социальное доказательство: сайт живой,
 * клиенты пишут реальные запросы прямо сейчас. Карточки кликабельные,
 * ведут на /requests/[id]/detail.
 */
export default function LiveRequestsBlock({ isDesktop }: { isDesktop: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState<PublicRequestItem[] | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api<{ items: PublicRequestItem[]; total: number }>(
      `/api/requests/public?limit=${LIMIT}`,
      { noAuth: true }
    )
      .then((res) => {
        setItems(res.items ?? []);
        setTotal(res.total ?? 0);
      })
      .catch(() => setItems([]));
  }, []);

  if (items === null) {
    return (
      <View style={{ paddingVertical: 32, alignItems: "center" }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <View
      style={{
        paddingVertical: isDesktop ? 56 : 36,
        paddingHorizontal: 16,
        backgroundColor: colors.surface,
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ width: "100%", maxWidth: 1080, gap: 16 }}>
        <View
          className="flex-row items-center"
          style={{ gap: 8, justifyContent: isDesktop ? "flex-start" : "center" }}
        >
          <Activity size={20} color={colors.primary} />
          <Text
            style={{
              fontSize: 12,
              color: colors.primary,
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Живая лента запросов
          </Text>
        </View>
        <View>
          <Text
            style={{
              fontSize: isDesktop ? 28 : 22,
              fontWeight: "800",
              color: colors.text,
              textAlign: isDesktop ? "left" : "center",
            }}
          >
            Клиенты пишут запросы прямо сейчас
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              marginTop: 6,
              lineHeight: 20,
              textAlign: isDesktop ? "left" : "center",
            }}
          >
            Реальные обращения по конкретным ИФНС. Сейчас активных: {total}. Откройте интересный — узнайте детали или откликнитесь.
          </Text>
        </View>

        {/* Сетка из 12 карточек. На мобиле — 1 колонка, на десктопе — 2.
            Если запросов больше 4, оборачиваем в ScrollView с
            фиксированной высотой, чтобы блок не растягивал страницу
            бесконечно. */}
        <ScrollView
          style={{ maxHeight: isDesktop ? 480 : 520 }}
          contentContainerStyle={{ paddingBottom: 4 }}
          nestedScrollEnabled
        >
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {items.map((item) => {
              const author = item.user
                ? [item.user.firstName, item.user.lastName ? `${item.user.lastName[0]}.` : ""]
                    .filter(Boolean)
                    .join(" ") || "Анонимно"
                : null;
              const created = new Date(item.createdAt).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "short",
              });
              const isClosingSoon = item.status === "CLOSING_SOON";
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="link"
                  accessibilityLabel={`Открыть запрос: ${item.title}`}
                  onPress={() => router.push(`/requests/${item.id}/detail` as never)}
                  style={({ pressed }) => [
                    {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      flexBasis: (isDesktop ? "calc(50% - 6px)" : "100%") as any,
                      flexGrow: 1,
                      backgroundColor: colors.white,
                      borderWidth: 1,
                      borderColor: isClosingSoon ? colors.warning ?? colors.border : colors.border,
                      borderRadius: 12,
                      padding: 14,
                      flexDirection: "row",
                      gap: 12,
                    },
                    pressed && { opacity: 0.88, borderColor: colors.primary },
                  ]}
                >
                  <FnsLogo
                    name={item.fns.name}
                    cityName={item.city.name}
                    size="sm"
                  />
                  <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
                    <View
                      className="flex-row items-center"
                      style={{ gap: 6, flexWrap: "wrap" }}
                    >
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>
                        {created}
                      </Text>
                      {isClosingSoon && (
                        <Text
                          style={{
                            fontSize: 10,
                            color: colors.warning ?? colors.error,
                            fontWeight: "700",
                          }}
                        >
                          СКОРО ЗАКРОЕТСЯ
                        </Text>
                      )}
                    </View>
                    <Text
                      style={{ fontSize: 14, fontWeight: "700", color: colors.text }}
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 16 }}
                      numberOfLines={2}
                    >
                      {item.description}
                    </Text>
                    <View
                      className="flex-row items-center"
                      style={{
                        gap: 10,
                        marginTop: 2,
                        flexWrap: "wrap",
                      }}
                    >
                      {author && (
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>
                          {author}
                        </Text>
                      )}
                      {item.threadsCount && item.threadsCount > 0 && (
                        <View className="flex-row items-center" style={{ gap: 3 }}>
                          <FileText size={10} color={colors.textMuted} />
                          <Text style={{ fontSize: 11, color: colors.textMuted }}>
                            {item.threadsCount} {item.threadsCount === 1 ? "отклик" : "откликов"}
                          </Text>
                        </View>
                      )}
                      {item.hasFiles && (
                        <View className="flex-row items-center" style={{ gap: 3 }}>
                          <Paperclip size={10} color={colors.textMuted} />
                          <Text style={{ fontSize: 11, color: colors.textMuted }}>
                            {item.filesCount}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Все публичные запросы"
          onPress={() => router.push("/requests" as never)}
          style={({ pressed }) => [
            {
              alignSelf: isDesktop ? "flex-start" : "stretch",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingHorizontal: 16,
              paddingVertical: 11,
              borderRadius: 12,
              backgroundColor: colors.primary,
            },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={{ color: colors.white, fontWeight: "700", fontSize: 14 }}>
            Открыть все запросы
          </Text>
          <ArrowRight size={16} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}
