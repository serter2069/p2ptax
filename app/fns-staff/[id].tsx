import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Clock,
  ArrowRight,
} from "lucide-react-native";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import CopyableValue from "@/components/ui/CopyableValue";
import ErrorState from "@/components/ui/ErrorState";
import LandingHeader from "@/components/landing/LandingHeader";
import FooterSection from "@/components/landing/FooterSection";
import { useAuth } from "@/contexts/AuthContext";
import { useTypedRouter } from "@/lib/navigation";
import { api } from "@/lib/api";
import { colors, BREAKPOINT } from "@/lib/theme";

interface StaffDetail {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  position: string;
  department: string | null;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  fns: {
    id: string;
    name: string;
    code: string;
    workingHours: string | null;
    officialPhone: string | null;
    city: { id: string; name: string; slug: string };
  };
  colleagues: Array<{
    id: string;
    firstName: string;
    lastName: string;
    middleName: string | null;
    position: string;
    photoUrl: string | null;
  }>;
}

/**
 * Публичный профиль сотрудника ИФНС. Структура:
 *   - Хедер
 *   - Back-link «Назад к ИФНС»
 *   - Hero: фото + ФИО + должность + отдел + ИФНС/город
 *   - Контакты (email/phone — копируются по клику)
 *   - Био-заглушка (под будущий контент)
 *   - Коллеги по отделу
 *   - Footer
 */
export default function FnsStaffPage() {
  const router = useRouter();
  const nav = useTypedRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const staffId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : null;
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINT;
  const { user } = useAuth();
  const isAuthenticated = !!user;

  const [staff, setStaff] = useState<StaffDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!staffId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api<StaffDetail>(`/api/fns-staff/${staffId}`, { noAuth: true });
      setStaff(res);
    } catch {
      setError("Не удалось загрузить сотрудника");
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    void load();
  }, [load]);

  const fullName = staff
    ? `${staff.lastName} ${staff.firstName} ${staff.middleName ?? ""}`.trim()
    : "";

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <LandingHeader
          isDesktop={isDesktop}
          onHome={() => nav.routes.home()}
          onCatalog={() => nav.routes.specialists()}
          onFnsCatalog={() => nav.any("/fns")}
          onLogin={() => nav.routes.login()}
          onCreateRequest={() => nav.routes.requestsNew()}
          isAuthenticated={isAuthenticated}
          onOpenDashboard={() => nav.routes.dashboard()}
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !staff) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <LandingHeader
          isDesktop={isDesktop}
          onHome={() => nav.routes.home()}
          onCatalog={() => nav.routes.specialists()}
          onFnsCatalog={() => nav.any("/fns")}
          onLogin={() => nav.routes.login()}
          onCreateRequest={() => nav.routes.requestsNew()}
          isAuthenticated={isAuthenticated}
          onOpenDashboard={() => nav.routes.dashboard()}
        />
        <View className="flex-1 items-center justify-center px-4">
          <ErrorState message={error ?? "Сотрудник не найден"} onRetry={load} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.surface }}>
      <LandingHeader
        isDesktop={isDesktop}
        onHome={() => nav.routes.home()}
        onCatalog={() => nav.routes.specialists()}
        onFnsCatalog={() => nav.any("/fns")}
        onLogin={() => nav.routes.login()}
        onCreateRequest={() => nav.routes.requestsNew()}
        isAuthenticated={isAuthenticated}
        onOpenDashboard={() => nav.routes.dashboard()}
      />
      <ScrollView
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 0, alignItems: "center" }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: isDesktop ? 880 : "100%",
            gap: 16,
            paddingHorizontal: 16,
            paddingBottom: 40,
          }}
        >
          {/* Back */}
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Назад к ИФНС"
            onPress={() => router.push(`/fns/${staff.fns.id}` as never)}
            style={({ pressed }) => [
              {
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 10,
                alignSelf: "flex-start",
              },
              pressed && { backgroundColor: colors.accentSoft },
            ]}
          >
            <ArrowLeft size={16} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              К {staff.fns.name}
            </Text>
          </Pressable>

          {/* Hero */}
          <Card>
            <View
              style={{
                flexDirection: isDesktop ? "row" : "column",
                gap: 18,
                alignItems: isDesktop ? "flex-start" : "center",
              }}
            >
              <Avatar
                name={fullName}
                imageUrl={staff.photoUrl ?? undefined}
                size="xl"
              />
              <View style={{ flex: 1, minWidth: 0, alignItems: isDesktop ? "flex-start" : "center" }}>
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.primary,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Налоговая инспекция · код {staff.fns.code}
                </Text>
                <Text
                  style={{
                    fontSize: isDesktop ? 26 : 22,
                    fontWeight: "800",
                    color: colors.text,
                    marginTop: 4,
                    textAlign: isDesktop ? "left" : "center",
                  }}
                >
                  {fullName}
                </Text>
                <View
                  className="flex-row items-center"
                  style={{ gap: 6, marginTop: 6, flexWrap: "wrap", justifyContent: isDesktop ? "flex-start" : "center" }}
                >
                  <Briefcase size={14} color={colors.primary} />
                  <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "700" }}>
                    {staff.position}
                  </Text>
                </View>
                {staff.department && (
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.textSecondary,
                      marginTop: 4,
                      textAlign: isDesktop ? "left" : "center",
                    }}
                  >
                    {staff.department}
                  </Text>
                )}
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={`Перейти на страницу ${staff.fns.name}`}
                  onPress={() => router.push(`/fns/${staff.fns.id}` as never)}
                  style={({ pressed }) => [
                    {
                      marginTop: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: colors.border,
                      alignSelf: isDesktop ? "flex-start" : "center",
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Building2 size={14} color={colors.textSecondary} />
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                    {staff.fns.name}, {staff.fns.city.name}
                  </Text>
                  <ArrowRight size={14} color={colors.textMuted} />
                </Pressable>
              </View>
            </View>
          </Card>

          {/* Контакты */}
          <Card>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 12,
              }}
            >
              Контакты
            </Text>
            <View style={{ gap: 10 }}>
              {staff.phone && (
                <CopyableValue
                  value={staff.phone}
                  primaryColor
                  icon={<Phone size={14} color={colors.textMuted} />}
                />
              )}
              {staff.email && (
                <CopyableValue
                  value={staff.email}
                  primaryColor
                  icon={<Mail size={14} color={colors.textMuted} />}
                />
              )}
              {staff.fns.workingHours && (
                <View className="flex-row items-start" style={{ gap: 8 }}>
                  <Clock size={14} color={colors.textMuted} style={{ marginTop: 2 }} />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: colors.text,
                      lineHeight: 18,
                    }}
                  >
                    {staff.fns.workingHours}
                  </Text>
                </View>
              )}
            </View>
          </Card>

          {/* Био-заглушка */}
          <Card>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
              О сотруднике
            </Text>
            <Text style={{ fontSize: 14, color: colors.text, lineHeight: 21 }}>
              {fullName} — государственный налоговый инспектор, занимает
              должность «{staff.position.toLowerCase()}»
              {staff.department ? ` в подразделении «${staff.department}»` : ""}{" "}
              в составе {staff.fns.name}. Подробное досье и часы приёма
              появятся после публикации внутренних регламентов инспекции.
            </Text>
          </Card>

          {/* Коллеги по отделу */}
          {staff.colleagues.length > 0 && (
            <View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: colors.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 8,
                  paddingHorizontal: 4,
                }}
              >
                {staff.department ?? "В этой инспекции"} · ещё {staff.colleagues.length}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                {staff.colleagues.map((c) => {
                  const cName = `${c.lastName} ${c.firstName} ${c.middleName ?? ""}`.trim();
                  return (
                    <Pressable
                      key={c.id}
                      accessibilityRole="link"
                      accessibilityLabel={`Профиль ${cName}`}
                      onPress={() => router.push(`/fns-staff/${c.id}` as never)}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      style={({ pressed }) => [
                        {
                          flexBasis: (isDesktop ? "calc(50% - 6px)" : "100%") as any,
                          flexGrow: 1,
                          backgroundColor: colors.white,
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: 10,
                          padding: 12,
                          flexDirection: "row",
                          gap: 10,
                          alignItems: "center",
                        },
                        pressed && { opacity: 0.85, borderColor: colors.primary },
                      ]}
                    >
                      <Avatar name={cName} imageUrl={c.photoUrl ?? undefined} size="sm" />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={{ fontSize: 13, fontWeight: "700", color: colors.text }}
                          numberOfLines={1}
                        >
                          {cName}
                        </Text>
                        <Text
                          style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}
                          numberOfLines={1}
                        >
                          {c.position}
                        </Text>
                      </View>
                      <ArrowRight size={14} color={colors.textMuted} />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {!isAuthenticated && (
          <View style={{ width: "100%", marginTop: 24 }}>
            <FooterSection
              isDesktop={isDesktop}
              onHome={() => nav.routes.home()}
              onViewCatalog={() => nav.routes.specialists()}
              onFnsCatalog={() => nav.any("/fns")}
              onCreateRequest={() => nav.routes.requestsNew()}
              onBecomeSpecialist={() => nav.any("/login?intent=specialist")}
              onLegal={(t) =>
                t === "terms" ? nav.routes.legalTerms() : nav.routes.legalPrivacy()
              }
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
