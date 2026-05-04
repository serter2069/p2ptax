import { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "@/lib/theme";

const DISMISSED_KEY = "p2ptax_stranded_dismissed_v1";

/**
 * Cross-platform persistence shim — web uses localStorage (sync, survives
 * tab close), native uses AsyncStorage. Banner stays dismissed until the
 * key is cleared on logout.
 */
async function readDismissed(): Promise<boolean> {
  try {
    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(DISMISSED_KEY) === "true";
    }
    const v = await AsyncStorage.getItem(DISMISSED_KEY);
    return v === "true";
  } catch {
    return false;
  }
}

async function writeDismissed(): Promise<void> {
  try {
    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(DISMISSED_KEY, "true");
      return;
    }
    await AsyncStorage.setItem(DISMISSED_KEY, "true");
  } catch {
    // ignore — non-fatal, banner just shows again next session
  }
}

export interface StrandedSpecialistBannerProps {
  stranded: boolean;
}

/**
 * Persistent inline banner for specialists who started onboarding but
 * never finished — `isSpecialist=true && specialistProfileCompletedAt=null`.
 * Replaces the previous force-redirect to /onboarding/name. The user can
 * navigate freely; only writing to a chat is hard-gated (see write.tsx
 * and InlineChatView). Dismissable until logout via X button.
 */
export default function StrandedSpecialistBanner({ stranded }: StrandedSpecialistBannerProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(true); // start hidden, fade in if not yet dismissed
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    readDismissed().then((d) => {
      if (!cancelled) {
        setDismissed(d);
        setHydrated(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    writeDismissed();
  }, []);

  const handleFinish = useCallback(() => {
    // Wave 5 / specialist-split — specialist editor lives at /specialist.
    router.push("/specialist" as never);
  }, [router]);

  if (!stranded || !hydrated || dismissed) return null;

  return (
    <View
      accessibilityRole="alert"
      style={{ backgroundColor: "#FEF3C7", borderBottomWidth: 1, borderBottomColor: "#FDE68A" }}
      className="px-4 py-3 flex-row items-center"
    >
      <Text className="flex-1 text-sm" style={{ color: "#78350F" }}>
        Профиль специалиста не завершён — клиенты не видят вас в каталоге.
      </Text>
      <Pressable
        accessibilityLabel="Завершить профиль специалиста"
        onPress={handleFinish}
        className="ml-3 px-3 py-1.5 rounded-md"
        style={{ backgroundColor: colors.primary }}
      >
        <Text className="text-sm font-semibold text-white">Завершить →</Text>
      </Pressable>
      <Pressable
        accessibilityLabel="Скрыть уведомление"
        onPress={handleDismiss}
        hitSlop={8}
        className="ml-2 p-1"
      >
        <X size={16} color="#78350F" />
      </Pressable>
    </View>
  );
}
