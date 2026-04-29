import { useState, useEffect, useCallback } from "react";
import { View, ScrollView, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import LandingHeader from "@/components/landing/LandingHeader";
import HeroBlock, { type HeroSpecialistPreview } from "@/components/landing/HeroBlock";
import TrustStrip from "@/components/landing/TrustStrip";
import ServicesSection from "@/components/landing/ServicesSection";
import HowItWorksFlow from "@/components/landing/HowItWorksFlow";
import CasesSection from "@/components/landing/CasesSection";
import type { CaseCardData } from "@/components/landing/CaseCard";
import FearTimeline from "@/components/landing/FearTimeline";
import SpecialistCTASection from "@/components/landing/SpecialistCTASection";
import FinalCTA from "@/components/landing/FinalCTA";
import FooterSection from "@/components/landing/FooterSection";
import { colors } from "@/lib/theme";

interface LandingCounts {
  specialistsCount: number;
  citiesCount: number;
  consultationsCount: number;
  resolvedCases?: number;
}

interface FeaturedSpecialistsResponse {
  items: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl?: string | null;
    cities: Array<{ id: string; name: string }>;
    services: Array<{ id: string; name: string }>;
  }>;
}

interface RecentWinsResponse {
  items: Array<{
    id: string;
    specialistName: string;
    amount: number | null;
    savedAmount: number | null;
    days: number | null;
    ifnsLabel: string | null;
    city: string | null;
    category: string;
    date: string | null;
  }>;
}

/**
 * Public landing (/). Accessible by both authenticated and unauthenticated
 * users — no automatic redirect. Authenticated users can navigate manually.
 *
 * Layout (top → bottom):
 *   Header → Hero (copy + 3 specialist cards) → Trust strip (3 counters)
 *   → Services (3 cards) → How It Works (3 steps) → Cases (credibility)
 *   → Fear timeline (ждать дорого) → Specialist CTA (audience #2) →
 *   Final CTA → Footer.
 *
 * Data sources:
 *   /api/stats/landing-counts  — counters (public)
 *   /api/specialists/featured  — live specialist feed (public)
 *   /api/stats/recent-wins     — credibility cases (public)
 *
 * No mock data. Empty states handled per-section.
 */
export default function LandingScreen() {
  const router = useRouter()
  const nav = useTypedRouter();
  const { isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [counts, setCounts] = useState<LandingCounts | null>(null);
  const [specialists, setSpecialists] = useState<HeroSpecialistPreview[]>([]);
  const [cases, setCases] = useState<CaseCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      // Counters are critical — failure here is a real error state.
      const countsRes = await api<LandingCounts>("/api/stats/landing-counts", { noAuth: true });
      setCounts(countsRes);

      // Specialists + wins are non-blocking. Missing data just collapses
      // a card or swaps to an empty-state — never a full-screen error.
      try {
        const sp = await api<FeaturedSpecialistsResponse>(
          "/api/specialists/featured",
          { noAuth: true }
        );
        const mapped: HeroSpecialistPreview[] = (sp.items ?? []).slice(0, 3).map((s) => ({
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          avatarUrl: s.avatarUrl,
          cities: s.cities,
          services: s.services,
          fnsName: null,
          isOnline: true,
        }));
        setSpecialists(mapped);
      } catch {
        setSpecialists([]);
      }

      try {
        const winsRes = await api<RecentWinsResponse>(
          "/api/stats/recent-wins?limit=3",
          { noAuth: true }
        );
        const mapped: CaseCardData[] = (winsRes.items ?? []).slice(0, 3).map((w) => ({
          id: w.id,
          specialistName: w.specialistName,
          category: w.category,
          ifnsLabel: w.ifnsLabel,
          city: w.city,
          days: w.days,
          savedAmount: w.savedAmount,
          amount: w.amount,
        }));
        setCases(mapped);
      } catch {
        setCases([]);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const goCreateRequest = useCallback(() => {
    nav.routes.requestsCreate();
  }, [router]);

  const goCatalog = useCallback(() => {
    nav.routes.specialists();
  }, [router]);

  const goHome = useCallback(() => {
    nav.routes.home();
  }, [router]);

  const goLogin = useCallback(() => {
    nav.routes.login();
  }, [router]);

  const goBecomeSpecialist = useCallback(() => {
    nav.routes.login();
  }, [router]);

  const goLegal = useCallback(
    (target: "terms" | "privacy") => {
      target === "terms" ? nav.routes.legalTerms() : nav.routes.legalPrivacy();
    },
    [router]
  );

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
        <ErrorState
          message="Не удалось загрузить данные. Проверьте соединение и попробуйте снова."
          onRetry={loadData}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ backgroundColor: colors.white }}
      >
        <LandingHeader
          isDesktop={isDesktop}
          onHome={goHome}
          onCatalog={goCatalog}
          onLogin={goLogin}
          onCreateRequest={goCreateRequest}
          onFindSpecialist={goCatalog}
          isAuthenticated={isAuthenticated}
          onOpenDashboard={() => nav.routes.tabs()}
        />

        <HeroBlock
          isDesktop={isDesktop}
          specialists={specialists}
          loading={loading}
          onPrimaryCta={goCreateRequest}
          onSecondaryCta={goCatalog}
        />

        <TrustStrip
          isDesktop={isDesktop}
          specialistsCount={counts?.specialistsCount ?? 0}
          citiesCount={counts?.citiesCount ?? 0}
          resolvedCases={counts?.resolvedCases ?? counts?.consultationsCount ?? 0}
        />

        <ServicesSection isDesktop={isDesktop} />

        <HowItWorksFlow isDesktop={isDesktop} />

        <CasesSection
          isDesktop={isDesktop}
          cases={cases}
          onCreateRequest={goCreateRequest}
        />

        <FearTimeline isDesktop={isDesktop} />

        <SpecialistCTASection
          isDesktop={isDesktop}
          onBecomeSpecialist={goBecomeSpecialist}
          specialistsCount={counts?.specialistsCount ?? 0}
        />

        <FinalCTA
          isDesktop={isDesktop}
          onCreateRequest={goCreateRequest}
          onViewCatalog={goCatalog}
        />

        <FooterSection
          isDesktop={isDesktop}
          onHome={goHome}
          onViewCatalog={goCatalog}
          onCreateRequest={goCreateRequest}
          onBecomeSpecialist={goBecomeSpecialist}
          onLegal={goLegal}
        />

        <View style={{ height: 1 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
