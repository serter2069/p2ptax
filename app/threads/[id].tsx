import { useLocalSearchParams } from "expo-router";
import { Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import InlineChatView from "@/components/InlineChatView";
import LoadingState from "@/components/ui/LoadingState";
import { useRequireAuth } from "@/lib/useRequireAuth";

// On web there are no physical safe areas (no device notch/home bar),
// so we strip bottom edge to prevent the composer from being clipped.
const SAFE_EDGES = Platform.OS === "web"
  ? (["top"] as const)
  : (["top", "bottom"] as const);

export default function ChatThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ready } = useRequireAuth();

  if (!ready) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={SAFE_EDGES}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={SAFE_EDGES}>
      {id ? <InlineChatView threadId={id} /> : null}
    </SafeAreaView>
  );
}
