import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import InlineChatView from "@/components/InlineChatView";

export default function ChatThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      {id ? <InlineChatView threadId={id} /> : null}
    </SafeAreaView>
  );
}
