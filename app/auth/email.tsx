import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Landmark, MapPin, Shield } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { colors, textStyle } from "@/lib/theme";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import TwoColumnForm from "@/components/layout/TwoColumnForm";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthEmailScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "CLIENT") {
        router.replace("/(client-tabs)/dashboard" as never);
      } else if (user.role === "SPECIALIST") {
        router.replace("/(specialist-tabs)/dashboard" as never);
      } else if (user.role === "ADMIN") {
        router.replace("/(admin-tabs)/dashboard" as never);
      }
    }
  }, [isAuthenticated, user, router]);

  const handleContinue = async () => {
    setError("");
    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Некорректный email");
      return;
    }
    setIsLoading(true);
    try {
      await api("/api/auth/request-otp", {
        method: "POST",
        body: { email: email.trim().toLowerCase() },
        noAuth: true,
      });
      router.push({
        pathname: "/auth/otp" as never,
        params: { email: email.trim().toLowerCase() },
      } as never);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Что-то пошло не так";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const leftPane = (
    <View style={{ gap: 24 }}>
      <View
        className="items-center justify-center bg-accent rounded-3xl self-start"
        style={{ width: 64, height: 64 }}
      >
        <Text className="text-xl font-extrabold text-white">P2P</Text>
      </View>
      <View style={{ gap: 12 }}>
        <Text
          style={{ ...textStyle.h1, color: colors.text, fontSize: 32, lineHeight: 38 }}
        >
          Специалисты по вашей ФНС
        </Text>
        <Text
          style={{ ...textStyle.body, color: colors.textSecondary, fontSize: 16, lineHeight: 24 }}
        >
          Проверенные эксперты по выездной, камеральной проверке и оперативному контролю. Ответы
          в течение 24 часов.
        </Text>
      </View>
      <View style={{ gap: 12 }}>
        <Feature icon={Landmark} title="Все ФНС России" text="Выездная · камеральная · оперативный контроль" />
        <Feature icon={MapPin} title="В вашем городе" text="Специалисты знают местную инспекцию" />
        <Feature icon={Shield} title="Без комиссий и оплаты" text="MVP — полностью бесплатно и для клиентов, и для специалистов" />
      </View>
    </View>
  );

  const rightPane = (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 4 }}>
        <Text style={{ ...textStyle.h2, color: colors.text }}>Вход</Text>
        <Text style={{ ...textStyle.body, color: colors.textSecondary }}>
          Введите email — отправим код подтверждения
        </Text>
      </View>

      <Input
        accessibilityLabel="Email адрес"
        placeholder="your@email.com"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          if (error) setError("");
        }}
        error={error}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        editable={!isLoading}
        onSubmitEditing={handleContinue}
      />

      <Button
        label="Продолжить"
        onPress={handleContinue}
        disabled={isLoading || !email.trim()}
        loading={isLoading}
        testID="send-otp"
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Условия использования"
        onPress={() => router.push("/legal/terms" as never)}
        className="py-3"
      >
        <Text className="text-sm text-text-mute text-center underline">
          Условия использования
        </Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <TwoColumnForm left={leftPane} right={rightPane} />
    </SafeAreaView>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Landmark;
  title: string;
  text: string;
}) {
  return (
    <View className="flex-row items-start gap-3">
      <View
        className="rounded-xl items-center justify-center bg-white"
        style={{ width: 40, height: 40 }}
      >
        <Icon size={18} color={colors.accent} />
      </View>
      <View className="flex-1 min-w-0">
        <Text className="text-text-base font-bold" style={{ fontSize: 14 }}>
          {title}
        </Text>
        <Text className="text-text-mute mt-0.5" style={{ fontSize: 13 }}>
          {text}
        </Text>
      </View>
    </View>
  );
}
