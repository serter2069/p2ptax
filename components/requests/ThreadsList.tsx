import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import Avatar from "@/components/ui/Avatar";
import { colors } from "@/lib/theme";
import { pluralizeRu } from "@/lib/ru";

export interface ThreadSummary {
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

function getSpecialistName(
  user: { firstName: string | null; lastName: string | null }
): string {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || "Специалист";
}

interface ThreadsListProps {
  threads: ThreadSummary[];
  requestId: string;
  threadsCount: number;
  unreadMessages: number;
  onOpenThread: (threadId: string) => void;
}

export default function ThreadsList({
  threads,
  requestId,
  threadsCount,
  unreadMessages,
  onOpenThread,
}: ThreadsListProps) {
  const router = useRouter()
  const nav = useTypedRouter();

  return (
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
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-xs font-semibold text-text-mute uppercase tracking-wide">
          Сообщения
        </Text>
        {unreadMessages > 0 && (
          <View className="bg-accent rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">
              {unreadMessages}
            </Text>
          </View>
        )}
      </View>

      {threads.length === 0 ? (
        <Text className="text-sm text-text-mute py-2 text-center">
          Специалисты ещё не написали
        </Text>
      ) : (
        <>
          <Text className="text-sm text-text-mute mb-3">
            {threadsCount}{" "}
            {pluralizeRu(threadsCount, [
              "специалист",
              "специалиста",
              "специалистов",
            ])}{" "}
            {pluralizeRu(threadsCount, ["написал", "написали", "написали"])}{" "}
            вам
          </Text>
          {threads.map((thread) => {
            const name = getSpecialistName(thread.otherUser);
            return (
              <View
                key={thread.id}
                className="flex-row items-center py-3 border-b border-border"
              >
                <Avatar
                  name={name}
                  imageUrl={thread.otherUser.avatarUrl ?? undefined}
                  size="sm"
                />
                <View className="flex-1 ml-3">
                  <Text className="text-sm font-semibold text-text-base">
                    {name}
                  </Text>
                  {thread.lastMessage && (
                    <Text
                      className="text-xs text-text-mute mt-0.5"
                      numberOfLines={1}
                    >
                      {thread.lastMessage.text}
                    </Text>
                  )}
                </View>
                <View className="flex-row items-center">
                  {thread.unreadCount > 0 && (
                    <View className="bg-accent rounded-full w-5 h-5 items-center justify-center mr-2">
                      <Text className="text-white text-xs font-bold">
                        {thread.unreadCount > 9 ? "9+" : thread.unreadCount}
                      </Text>
                    </View>
                  )}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Открыть чат с ${name}`}
                    onPress={() => onOpenThread(thread.id)}
                    className="bg-accent rounded-lg px-3 py-1.5"
                    style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                  >
                    <Text className="text-white text-xs font-semibold">
                      Открыть чат
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Все сообщения"
            onPress={() => nav.any(`/requests/${requestId}/messages`)}
            className="mt-3 border border-accent rounded-xl py-2.5 items-center"
            style={({ pressed }) => [pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }]}
          >
            <Text className="text-accent font-semibold text-sm">
              Все сообщения ({threadsCount})
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
