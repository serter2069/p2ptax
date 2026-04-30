import { useLocalSearchParams, useRouter } from "expo-router";
import { Platform, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import InlineChatView from "@/components/InlineChatView";
import LoadingState from "@/components/ui/LoadingState";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { colors } from "@/lib/theme";

// On web there are no physical safe areas (no device notch/home bar),
// so we strip bottom edge to prevent the composer from being clipped.
const SAFE_EDGES = Platform.OS === "web"
  ? (["top"] as const)
  : (["top", "bottom"] as const);

export default function ChatThread() {
  const { id, requestId } = useLocalSearchParams<{ id: string; requestId?: string }>();
  const router = useRouter();
  const { ready, isLoading: authLoading } = useRequireAuth();

  function handleBack() {
    if (requestId) {
      router.push(`/requests/${requestId}/detail` as never);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.push("/(tabs)/messages" as never);
    }
  }

  // Show spinner while auth is loading OR while unauthenticated (redirect pending).
  // This prevents InlineChatView from mounting before auth is resolved, which
  // caused a flash: InlineChatView would fetch/render then vanish on redirect.
  // issue #1611
  if (authLoading || !ready) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={SAFE_EDGES}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={SAFE_EDGES}>
      <View
        className="flex-row items-center px-3 py-2 border-b border-gray-100"
        style={{ minHeight: 48 }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Назад"
          onPress={handleBack}
          className="flex-row items-center"
          style={{ minHeight: 44, paddingHorizontal: 4 }}
        >
          <ChevronLeft size={20} color={colors.text} />
          <Text className="ml-1 text-base" style={{ color: colors.text }}>
            Назад
          </Text>
        </Pressable>
      </View>
      {id ? <InlineChatView threadId={id} /> : null}
    </SafeAreaView>
  );
}
