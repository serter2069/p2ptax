import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import HeroSection from "@/components/landing/HeroSection";
import StatsStrip from "@/components/landing/StatsStrip";
import ProblemsSection from "@/components/landing/ProblemsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import CTASection from "@/components/landing/CTASection";
import FooterSection from "@/components/landing/FooterSection";

interface PlatformStats {
  specialistsCount: number;
  citiesCount: number;
  consultationsCount: number;
}

export default function LandingScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role) {
      if (user.role === "SPECIALIST") {
        router.replace("/(specialist-tabs)/dashboard" as never);
      } else if (user.role === "CLIENT") {
        router.replace("/(client-tabs)/dashboard" as never);
      } else if (user.role === "ADMIN") {
        router.replace("/(admin-tabs)/dashboard" as never);
      }
    }
  }, [isAuthenticated, user, router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const statsRes = await api<PlatformStats>("/api/stats", { noAuth: true });
      setStats(statsRes);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateRequest = useCallback(() => {
    router.push("/auth/email" as never);
  }, [router]);

  const handleViewCatalog = useCallback(() => {
    router.push("/specialists" as never);
  }, [router]);

  const handleHome = useCallback(() => {
    router.push("/" as never);
  }, [router]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center justify-between h-16 bg-white px-4">
          <Text className="text-lg font-extrabold" style={{ color: "#1e3a8a" }}>P2PTax</Text>
        </View>
        <ErrorState
          message="Не удалось загрузить данные. Проверьте соединение с интернетом и попробуйте снова."
          onRetry={loadData}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View
        className="flex-row items-center justify-between h-16 bg-white px-4"
        style={
          scrollY > 10
            ? { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }
            : undefined
        }
      >
        <View style={{ width: "100%", alignItems: "center" }}>
          <View
            className="flex-row items-center justify-between"
            style={{ width: "100%", maxWidth: 1152, paddingHorizontal: isDesktop ? 24 : 0 }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="P2PTax Home"
              onPress={handleHome}
              className="min-h-[44px] justify-center"
            >
              <Text className="text-xl font-extrabold" style={{ color: "#1e3a8a" }}>P2PTax</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Создать заявку"
              onPress={handleCreateRequest}
              className="rounded-lg px-4 min-h-[44px] items-center justify-center"
              style={{ backgroundColor: "#b45309" }}
            >
              <Text className="text-white font-semibold text-sm">Создать заявку</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
        <HeroSection isDesktop={isDesktop} onCreateRequest={handleCreateRequest} onViewCatalog={handleViewCatalog} stats={stats} />
        {stats && <StatsStrip stats={stats} isDesktop={isDesktop} />}
        <ProblemsSection isDesktop={isDesktop} />
        <HowItWorksSection isDesktop={isDesktop} />
        <FeaturesSection isDesktop={isDesktop} />
        <CTASection isDesktop={isDesktop} onCreateRequest={handleCreateRequest} onViewCatalog={handleViewCatalog} />
        <FooterSection isDesktop={isDesktop} onHome={handleHome} onViewCatalog={handleViewCatalog} onCreateRequest={handleCreateRequest} />
      </ScrollView>
    </SafeAreaView>
  );
}
