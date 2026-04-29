import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import InlineChatView from "@/components/InlineChatView";
import LoadingState from "@/components/ui/LoadingState";
import { useRequireAuth } from "@/lib/useRequireAuth";

export default function ChatThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ready } = useRequireAuth();

  if (!ready) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      {id ? <InlineChatView threadId={id} /> : null}
    </SafeAreaView>
  );
}
