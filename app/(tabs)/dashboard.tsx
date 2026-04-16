import React, { useEffect, useState } from "react";
import { View, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Spacing, BorderRadius, Typography } from "../../constants/Colors";
import { useAuth } from "../../lib/auth/AuthContext";
import { requests, threads } from "../../lib/api/endpoints";
import { Header } from "../../components/Header";
import {
  Button,
  Card,
  Container,
  EmptyState,
  Heading,
  Screen,
  Text,
  Badge,
} from "../../components/ui";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Доброй ночи";
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Добрый вечер";
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Активная",
  CLOSING_SOON: "Истекает скоро",
  CLOSED: "Закрыта",
  active: "Новая",
  in_progress: "В работе",
  closed: "Закрыта",
  cancelled: "Отменена",
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "default" | "danger" | "info"> = {
  ACTIVE: "success",
  CLOSING_SOON: "warning",
  CLOSED: "default",
  active: "info",
  in_progress: "warning",
  closed: "default",
  cancelled: "danger",
};

function RequestCard({ id, title, service, fns, city, date, messageCount, status }: {
  id: string; title: string; service: string; fns?: string; city?: string; date: string;
  messageCount: number; status: string;
}) {
  const statusLabel = STATUS_LABEL[status] ?? status;
  const statusVariant = STATUS_VARIANT[status] ?? "default";
  return (
    <Card onPress={() => router.push(`/(dashboard)/my-requests/${id}` as any)}>
      <View style={{ gap: Spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: Spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Text variant="body" weight="semibold" numberOfLines={2}>{title}</Text>
          </View>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: Spacing.xs, columnGap: Spacing.md, alignItems: "center" }}>
          {service ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs }}>
              <Feather name="briefcase" size={12} color={Colors.textMuted} />
              <Text variant="caption">{service}</Text>
            </View>
          ) : null}
          {fns ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs }}>
              <Feather name="home" size={12} color={Colors.textMuted} />
              <Text variant="caption">{fns}</Text>
            </View>
          ) : null}
          {city ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs }}>
              <Feather name="map-pin" size={12} color={Colors.textMuted} />
              <Text variant="caption">{city}</Text>
            </View>
          ) : null}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs }}>
            <Feather name="calendar" size={12} color={Colors.textMuted} />
            <Text variant="caption">{date}</Text>
          </View>
          {messageCount > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs }}>
              <Feather name="message-circle" size={12} color={Colors.brandPrimary} />
              <Text variant="caption" weight="medium" style={{ color: Colors.brandPrimary }}>
                {messageCount} сообщ.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatThreadTime(isoString: string): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = diffMs / 1000 / 3600;
  if (diffH < 24) {
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffH < 48) return "вчера";
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

function MessagePreview({ id, initials, name, snippet, time, unread }: {
  id: string; initials: string; name: string; snippet: string; time: string; unread?: boolean;
}) {
  return (
    <Card onPress={() => router.push(`/chat/${id}` as any)} padding="sm" variant="outlined">
      <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.md }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: BorderRadius.full,
            backgroundColor: Colors.bgSurface,
            borderWidth: 1,
            borderColor: Colors.borderLight,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: Colors.brandPrimary, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold }}>
            {initials}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text weight={unread ? "bold" : "medium"} variant="body" numberOfLines={1}>{name}</Text>
            <Text variant="caption">{time}</Text>
          </View>
          <Text
            variant={unread ? "body" : "caption"}
            weight={unread ? "medium" : undefined}
            numberOfLines={1}
          >
            {snippet}
          </Text>
        </View>
        {unread && (
          <View style={{ width: 10, height: 10, borderRadius: BorderRadius.full, backgroundColor: Colors.brandPrimary }} />
        )}
      </View>
    </Card>
  );
}

function QuickActions() {
  return (
    <View style={{ flexDirection: "row", gap: Spacing.sm }}>
      <View style={{ flex: 1 }}>
        <Button
          variant="primary"
          icon={<Feather name="plus" size={16} color={Colors.white} />}
          onPress={() => router.push("/(dashboard)/my-requests/new" as any)}
          fullWidth
        >
          Новая заявка
        </Button>
      </View>
      <View style={{ flex: 1 }}>
        <Button
          variant="secondary"
          icon={<Feather name="list" size={16} color={Colors.brandPrimary} />}
          onPress={() => router.push("/(tabs)/requests" as any)}
          fullWidth
        >
          Мои заявки
        </Button>
      </View>
      <View style={{ flex: 1 }}>
        <Button
          variant="secondary"
          icon={<Feather name="message-circle" size={16} color={Colors.brandPrimary} />}
          onPress={() => router.push("/(tabs)/messages" as any)}
          fullWidth
        >
          Сообщения
        </Button>
      </View>
    </View>
  );
}

interface RequestItem {
  id: string;
  title: string;
  serviceType?: string;
  ifnsName?: string;
  city?: string;
  createdAt: string;
  status: string;
  _count?: { threads?: number };
}

interface ThreadParticipant {
  firstName?: string;
  lastName?: string;
  nick?: string;
}

interface ThreadItem {
  id: string;
  specialist?: ThreadParticipant;
  client?: ThreadParticipant;
  lastMessage?: { content?: string; createdAt?: string };
  unreadCount?: number;
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function DashboardScreen() {
  const { user } = useAuth();

  const [reqs, setReqs] = useState<RequestItem[]>([]);
  const [reqsLoading, setReqsLoading] = useState(true);

  const [msgs, setMsgs] = useState<ThreadItem[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(true);

  useEffect(() => {
    requests.getMyRequests({ limit: 3, status: "active" })
      .then((res: any) => {
        const data = res.data;
        setReqs(Array.isArray(data) ? data : (data.items ?? data.data ?? []));
      })
      .catch(() => setReqs([]))
      .finally(() => setReqsLoading(false));
  }, []);

  useEffect(() => {
    threads.getThreads()
      .then((res: any) => {
        const data = res.data;
        const list: ThreadItem[] = Array.isArray(data) ? data : (data.items ?? data.data ?? []);
        setMsgs(list.slice(0, 3));
      })
      .catch(() => setMsgs([]))
      .finally(() => setMsgsLoading(false));
  }, []);

  const firstName = user?.firstName ?? user?.email?.split("@")[0] ?? "друг";

  return (
    <Screen bg={Colors.white}>
      <Header variant="auth" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: Spacing.lg }}>
        <Container>
          <View style={{ gap: Spacing.lg }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <Heading level={3}>{getGreeting()}, {firstName}!</Heading>
                <Text variant="muted">Ваши заявки и сообщения</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Уведомления"
                onPress={() => router.push("/(tabs)/messages" as any)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: BorderRadius.full,
                  backgroundColor: Colors.bgSurface,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name="bell" size={20} color={Colors.textPrimary} />
              </Pressable>
            </View>

            <QuickActions />

            {/* Active requests */}
            <View style={{ gap: Spacing.md }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text variant="body" weight="semibold">Активные заявки</Text>
                <Button variant="ghost" size="md" onPress={() => router.push("/(tabs)/requests" as any)}>
                  Все заявки
                </Button>
              </View>
              {reqsLoading ? (
                <ActivityIndicator color={Colors.brandPrimary} />
              ) : reqs.length === 0 ? (
                <Card variant="outlined">
                  <EmptyState
                    icon={<Feather name="file-text" size={32} color={Colors.textMuted} />}
                    title="Нет активных заявок"
                    action={
                      <Button
                        variant="primary"
                        icon={<Feather name="plus" size={16} color={Colors.white} />}
                        onPress={() => router.push("/(dashboard)/my-requests/new" as any)}
                      >
                        Создать заявку
                      </Button>
                    }
                  />
                </Card>
              ) : (
                <View style={{ gap: Spacing.md }}>
                  {reqs.map((req) => (
                    <RequestCard
                      key={req.id}
                      id={req.id}
                      title={req.title}
                      service={req.serviceType ?? ""}
                      fns={req.ifnsName}
                      city={req.city}
                      date={formatDate(req.createdAt)}
                      messageCount={req._count?.threads ?? 0}
                      status={req.status}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* Recent messages */}
            <View style={{ gap: Spacing.md }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text variant="body" weight="semibold">Новые сообщения</Text>
                <Button variant="ghost" size="md" onPress={() => router.push("/(tabs)/messages" as any)}>
                  Все сообщения
                </Button>
              </View>
              {msgsLoading ? (
                <ActivityIndicator color={Colors.brandPrimary} />
              ) : msgs.length === 0 ? (
                <Card variant="outlined">
                  <View style={{ alignItems: "center", paddingVertical: Spacing.md }}>
                    <Text variant="muted">Нет сообщений</Text>
                  </View>
                </Card>
              ) : (
                <View style={{ gap: Spacing.sm }}>
                  {msgs.map((thread) => {
                    const other = thread.specialist ?? thread.client;
                    const name = other
                      ? [other.firstName, other.lastName].filter(Boolean).join(" ") || other.nick || "Специалист"
                      : "Специалист";
                    const initials = getInitials(name);
                    const snippet = thread.lastMessage?.content ?? "";
                    const time = thread.lastMessage?.createdAt ? formatThreadTime(thread.lastMessage.createdAt) : "";
                    const unread = (thread.unreadCount ?? 0) > 0;
                    return (
                      <MessagePreview
                        key={thread.id}
                        id={thread.id}
                        initials={initials}
                        name={name}
                        snippet={snippet}
                        time={time}
                        unread={unread}
                      />
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        </Container>
      </ScrollView>
    </Screen>
  );
}
