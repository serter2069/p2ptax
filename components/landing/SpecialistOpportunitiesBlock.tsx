import { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Bell, ArrowRight, FileText, Paperclip } from "lucide-react-native";
import { api } from "@/lib/api";
import { colors } from "@/lib/theme";

interface OpportunityItem {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  city: { id: string; name: string };
  fns: { id: string; name: string; code: string };
  threadsCount: number;
  hasFiles: boolean;
  filesCount: number;
  user: { firstName: string | null; lastName: string | null };
}

/**
 * Лендинговый блок «Возможно, нужна ваша помощь» — рендерим только
 * для авторизованных специалистов. Показываем последние активные
 * публичные запросы в их scope (по specialist_fns) с кнопкой
 * перехода на детальную страницу.
 */
export default function SpecialistOpportunitiesBlock({ isDesktop }: { isDesktop: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState<OpportunityItem[] | null>(null);

  useEffect(() => {
    api<{ items: OpportunityItem[] }>("/api/requests/specialist-opportunities?limit=6")
      .then((res) => setItems(res.items ?? []))
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
        paddingVertical: isDesktop ? 48 : 32,
        paddingHorizontal: 16,
        backgroundColor: colors.accentSoft,
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
          <Bell size={20} color={colors.primary} />
          <Text
            style={{
              fontSize: 12,
              color: colors.primary,
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Для вас
          </Text>
        </View>
        <View>
          <Text
            style={{
              fontSize: isDesktop ? 26 : 20,
              fontWeight: "800",
              color: colors.text,
              textAlign: isDesktop ? "left" : "center",
            }}
          >
            Возможно, нужна ваша помощь
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
            Свежие запросы по вашим ИФНС — клиенты ждут отклика. Откройте интересный — напишите первым.
          </Text>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {items.map((item) => {
            const author = [item.user.firstName, item.user.lastName ? `${item.user.lastName[0]}.` : ""]
              .filter(Boolean)
              .join(" ") || "Анонимно";
            const created = new Date(item.createdAt).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "short",
            });
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
                    borderColor: colors.border,
                    borderRadius: 12,
                    padding: 14,
                    gap: 6,
                  },
                  pressed && { opacity: 0.88, borderColor: colors.primary },
                ]}
              >
                <View className="flex-row items-center" style={{ gap: 6, flexWrap: "wrap" }}>
                  <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "700" }}>
                    {item.fns.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>· {created}</Text>
                </View>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text
                  style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
                <View
                  className="flex-row items-center"
                  style={{
                    gap: 12,
                    marginTop: 4,
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    flexWrap: "wrap",
                  }}
                >
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>{author}</Text>
                  {item.threadsCount > 0 && (
                    <View className="flex-row items-center" style={{ gap: 4 }}>
                      <FileText size={11} color={colors.textMuted} />
                      <Text style={{ fontSize: 12, color: colors.textMuted }}>
                        {item.threadsCount} {item.threadsCount === 1 ? "отклик" : "откликов"}
                      </Text>
                    </View>
                  )}
                  {item.hasFiles && (
                    <View className="flex-row items-center" style={{ gap: 4 }}>
                      <Paperclip size={11} color={colors.textMuted} />
                      <Text style={{ fontSize: 12, color: colors.textMuted }}>
                        {item.filesCount}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Все запросы по моим ИФНС"
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
            Все запросы по моим ИФНС
          </Text>
          <ArrowRight size={16} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}
