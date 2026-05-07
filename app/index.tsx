import { useState, useEffect, useCallback } from "react";
import { View, ScrollView, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import { track } from "@/lib/analytics";
import LandingHeader from "@/components/landing/LandingHeader";
import HeroBlock, { type HeroSpecialistPreview } from "@/components/landing/HeroBlock";
import TrustStrip from "@/components/landing/TrustStrip";
import TrustPillarsSection from "@/components/landing/TrustPillarsSection";
import FnsSearchSection from "@/components/landing/FnsSearchSection";
import SpecialistOpportunitiesBlock from "@/components/landing/SpecialistOpportunitiesBlock";
import LiveRequestsBlock from "@/components/landing/LiveRequestsBlock";
import ServicesSection from "@/components/landing/ServicesSection";
import HowItWorksFlow from "@/components/landing/HowItWorksFlow";
import CasesSection from "@/components/landing/CasesSection";
import ComparisonBlock from "@/components/landing/ComparisonBlock";
import type { CaseCardData } from "@/components/landing/CaseCard";
import SpecialistCTASection from "@/components/landing/SpecialistCTASection";
import FaqSection from "@/components/landing/FaqSection";
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
    specialistFns?: Array<{
      fnsId: string;
      fnsName: string;
      city?: { id: string; name: string } | null;
    }>;
    createdAt?: string | null;
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
  const { isAuthenticated, isSpecialistUser } = useAuth();
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
        // 3 карточки на Hero. Каждая показывает РОВНО ОДНУ ИФНС
        // (герб с городом) и РОВНО ОДНУ услугу. Услуги между
        // карточками должны быть разными, чтобы посетитель видел
        // разнообразие специалистов (камеральная, выездная, опер.
        // контроль), а не три копии одной строчки.
        const candidates = (sp.items ?? []).filter(
          (s) => (s.specialistFns ?? []).length > 0 && (s.services ?? []).length > 0
        );
        const usedServiceIds = new Set<string>();
        const picked: HeroSpecialistPreview[] = [];
        // Pass 1: жадно берём по уникальной услуге.
        for (const s of candidates) {
          if (picked.length >= 3) break;
          const uniqueService = s.services.find((sv) => !usedServiceIds.has(sv.id));
          if (!uniqueService) continue;
          usedServiceIds.add(uniqueService.id);
          const f = s.specialistFns![0];
          picked.push({
            id: s.id,
            firstName: s.firstName,
            lastName: s.lastName,
            avatarUrl: s.avatarUrl,
            cities: s.cities,
            services: [uniqueService],
            fnsList: [{
              fnsId: f.fnsId,
              fnsName: f.fnsName,
              cityName: f.city?.name ?? null,
            }],
            createdAt: s.createdAt,
          });
        }
        // Pass 2: добиваем до 3 (если уник-услуги закончились,
        // допускаем повтор). Берём ещё не взятых специалистов.
        if (picked.length < 3) {
          const pickedIds = new Set(picked.map((p) => p.id));
          for (const s of candidates) {
            if (picked.length >= 3) break;
            if (pickedIds.has(s.id)) continue;
            const f = s.specialistFns![0];
            picked.push({
              id: s.id,
              firstName: s.firstName,
              lastName: s.lastName,
              avatarUrl: s.avatarUrl,
              cities: s.cities,
              services: [s.services[0]],
              fnsList: [{
                fnsId: f.fnsId,
                fnsName: f.fnsName,
                cityName: f.city?.name ?? null,
              }],
              createdAt: s.createdAt,
            });
          }
        }
        // Финальный фолбек: если у featured-специалистов вообще нет
        // ни услуг, ни ИФНС (свежий стейдж до seed-data), показываем
        // первых трёх как есть.
        if (picked.length === 0 && (sp.items ?? []).length > 0) {
          const fallback: HeroSpecialistPreview[] = sp.items.slice(0, 3).map((s) => {
            const f = (s.specialistFns ?? [])[0];
            return {
              id: s.id,
              firstName: s.firstName,
              lastName: s.lastName,
              avatarUrl: s.avatarUrl,
              cities: s.cities,
              services: s.services.slice(0, 1),
              fnsList: f
                ? [{ fnsId: f.fnsId, fnsName: f.fnsName, cityName: f.city?.name ?? null }]
                : [],
              createdAt: s.createdAt,
            };
          });
          setSpecialists(fallback);
        } else {
          setSpecialists(picked);
        }
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

  // Funnel entry — fire once per mount. Authenticated/anonymous split lives
  // in the prop rather than two events so PostHog Insights can group both.
  useEffect(() => {
    track("landing_view", { authenticated: isAuthenticated });
  }, [isAuthenticated]);

  const goCreateRequest = useCallback(() => {
    track("landing_cta_match_click", { source: "primary" });
    nav.routes.requestsNew();
  }, [router]);

  const goCatalog = useCallback(() => {
    nav.routes.specialists();
  }, [router]);

  const goFnsCatalog = useCallback(() => {
    nav.any("/fns");
  }, [router]);

  const goHome = useCallback(() => {
    nav.routes.home();
  }, [router]);

  const goLogin = useCallback(() => {
    nav.routes.login();
  }, [router]);

  const goBecomeSpecialist = useCallback(() => {
    nav.any('/login?intent=specialist');
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
          onFnsCatalog={goFnsCatalog}
          onRequestsBoard={() => nav.any("/requests")}
          isDesktop={isDesktop}
          onHome={goHome}
          onCatalog={goCatalog}
          onLogin={goLogin}
          onCreateRequest={goCreateRequest}
          onFindSpecialist={goCatalog}
          isAuthenticated={isAuthenticated}
          onOpenDashboard={() => nav.routes.dashboard()}
        />

        <HeroBlock
          isDesktop={isDesktop}
          specialists={specialists}
          loading={loading}
          onPrimaryCta={goCreateRequest}
          onSecondaryCta={goCatalog}
        />

        {/* Specific-FNS search sits directly under the hero — users with
            a known inspection code (highest discovery intent) see it
            without scrolling. */}
        <FnsSearchSection isDesktop={isDesktop} />

        {/* Trust pillars — moat below the search; ex-FNS / NDA / no-result
            messaging stays prominent for users still convincing themselves. */}
        <TrustPillarsSection isDesktop={isDesktop} />

        <TrustStrip
          isDesktop={isDesktop}
          specialistsCount={counts?.specialistsCount ?? 0}
          citiesCount={counts?.citiesCount ?? 0}
          resolvedCases={counts?.resolvedCases ?? counts?.consultationsCount ?? 0}
        />

        <CasesSection
          isDesktop={isDesktop}
          cases={cases}
          onCreateRequest={goCreateRequest}
        />

        <ComparisonBlock isDesktop={isDesktop} />

        <HowItWorksFlow isDesktop={isDesktop} />

        <ServicesSection isDesktop={isDesktop} />

        <FaqSection isDesktop={isDesktop} />

        <SpecialistCTASection
          isDesktop={isDesktop}
          onBecomeSpecialist={goBecomeSpecialist}
          specialistsCount={counts?.specialistsCount ?? 0}
        />

        {/* Лента живых запросов сразу под секцией «стать специалистом» —
            specialist'ы видят, что ждут отклика, а анонимы получают
            социальное доказательство (сайт активный, реальные клиенты).
            Авторизованным специалистам дополнительно показываем
            персональную «возможно, нужна ваша помощь» по их ИФНС. */}
        {isAuthenticated && isSpecialistUser && (
          <SpecialistOpportunitiesBlock isDesktop={isDesktop} />
        )}

        <LiveRequestsBlock isDesktop={isDesktop} />

        <FooterSection
          isDesktop={isDesktop}
          onHome={goHome}
          onViewCatalog={goCatalog}
          onFnsCatalog={goFnsCatalog}
          onCreateRequest={goCreateRequest}
          onBecomeSpecialist={goBecomeSpecialist}
          onLegal={goLegal}
        />

        <View style={{ height: 1 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
