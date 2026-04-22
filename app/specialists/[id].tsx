import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Head from "expo-router/head";
import {
  AlertCircle, Pencil, Phone, Mail, Send, MessageCircle,
  ExternalLink, Globe, ChevronRight, MapPin, Clock, type LucideIcon,
} from "lucide-react-native";
import HeaderBack from "@/components/HeaderBack";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import SpecialistCard from "@/components/SpecialistCard";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { colors } from "@/lib/theme";

interface FnsServiceGroup {
  fns: { id: string; name: string; code: string };
  city: { id: string; name: string };
  services: { id: string; name: string }[];
}

interface SpecialistProfile {
  description: string | null;
  phone: string | null;
  telegram: string | null;
  whatsapp: string | null;
  officeAddress: string | null;
  workingHours: string | null;
}

interface ContactMethodItem {
  id: string;
  type: string;
  value: string;
  label: string | null;
  order: number;
}

interface SpecialistDetail {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  isAvailable: boolean;
  createdAt: string;
  profile: SpecialistProfile | null;
  fnsServices: FnsServiceGroup[];
  requestsCount?: number;
}

function getContactUrl(type: string, value: string): string | null {
  switch (type) {
    case "phone":
      return `tel:${value}`;
    case "email":
      return `mailto:${value}`;
    case "telegram":
      return `https://t.me/${value.replace("@", "")}`;
    case "whatsapp":
      return `https://wa.me/${value.replace(/\D/g, "")}`;
    case "vk":
      return value.startsWith("http") ? value : `https://vk.com/${value.replace(/^vk\.com\//, "")}`;
    case "website":
      return value.startsWith("http") ? value : `https://${value}`;
    default:
      return null;
  }
}

const CONTACT_TYPE_CONFIG: Record<string, { label: string; Icon: LucideIcon; bg: string; color: string }> = {
  phone: { label: "Телефон", Icon: Phone, bg: "#eff6ff", color: colors.primary },
  email: { label: "Email", Icon: Mail, bg: "#f0fdf4", color: "#166534" },
  telegram: { label: "Telegram", Icon: Send, bg: "#f0f9ff", color: "#0284c7" },
  whatsapp: { label: "WhatsApp", Icon: MessageCircle, bg: "#f0fdf4", color: "#059669" },
  vk: { label: "ВКонтакте", Icon: ExternalLink, bg: "#eff6ff", color: "#2563eb" },
  website: { label: "Сайт", Icon: Globe, bg: "#fafaf9", color: "#57534e" },
};

interface SimilarSpecialist {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  services: { id: string; name: string }[];
  cities: { id: string; name: string }[];
}

function getInitials(firstName: string | null, lastName: string | null): string {
  const f = firstName?.[0] || "";
  const l = lastName?.[0] || "";
  return (f + l).toUpperCase() || "?";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { year: "numeric", month: "long" });
}

export default function SpecialistPublicProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [specialist, setSpecialist] = useState<SpecialistDetail | null>(null);
  const [contacts, setContacts] = useState<ContactMethodItem[]>([]);
  const [similar, setSimilar] = useState<SimilarSpecialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = !!user && user.id === id;
  const isSpecialist = user?.role === "SPECIALIST";

  useEffect(() => {
    async function load() {
      try {
        const [specRes, similarRes, contactsRes] = await Promise.all([
          api<SpecialistDetail>(`/api/specialists/${id}`, { noAuth: true }),
          api<{ items: SimilarSpecialist[] }>("/api/specialists/featured", { noAuth: true }),
          api<{ items: ContactMethodItem[] }>(`/api/specialists/${id}/contacts`, { noAuth: true }),
        ]);
        setSpecialist(specRes);
        setSimilar(similarRes.items.filter((s) => s.id !== id));
        setContacts(contactsRes.items);
      } catch (e) {
        setError("Не удалось загрузить профиль");
        console.error("Specialist detail error:", e);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  const handleSimilarPress = useCallback(
    (specId: string) => {
      router.push(`/specialists/${specId}` as never);
    },
    [router]
  );

  const handleWritePress = useCallback(() => {
    if (!isAuthenticated) {
      router.push("/auth/email" as never);
    } else {
      router.push("/requests/new" as never);
    }
  }, [isAuthenticated, router]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <HeaderBack title="Профиль специалиста" />
        <LoadingState variant="skeleton" lines={5} />
      </SafeAreaView>
    );
  }

  if (error || !specialist) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <HeaderBack title="Профиль специалиста" />
        <View className="flex-1 items-center justify-center px-6">
          <AlertCircle size={48} color={colors.placeholder} />
          <Text className="text-xl font-semibold mt-4 text-center" style={{ color: "#0f172a" }}>
            Специалист не найден
          </Text>
          <Text className="text-sm mt-2 text-center leading-5" style={{ color: "#64748B" }}>
            Возможно, профиль был удалён или вы перешли по неверной ссылке
          </Text>
          <View className="mt-6">
            <Button
              label="Назад к каталогу"
              onPress={() => router.push("/specialists" as never)}
              fullWidth={false}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const name =
    [specialist.firstName, specialist.lastName].filter(Boolean).join(" ") || "Специалист";
  const initials = getInitials(specialist.firstName, specialist.lastName);

  // Collect unique cities from fnsServices
  const citySet = new Set<string>();
  const cities: string[] = [];
  for (const g of specialist.fnsServices) {
    if (!citySet.has(g.city.id)) {
      citySet.add(g.city.id);
      cities.push(g.city.name);
    }
  }

  const fnsCount = specialist.fnsServices.length;
  const servicesCount = new Set(specialist.fnsServices.flatMap((g) => g.services.map((s) => s.id))).size;

  const rightAction = isOwnProfile ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Редактировать профиль"
      onPress={() => router.push("/settings" as never)}
    >
      <Pencil size={16} color={colors.text} />
    </Pressable>
  ) : undefined;

  const hasContacts = contacts.length > 0 ||
    (specialist.profile &&
      (specialist.profile.officeAddress || specialist.profile.workingHours));

  const cardShadow = {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  };

  const ogDescription = specialist.profile?.description
    ? specialist.profile.description.slice(0, 160)
    : `Специалист по налогам P2P ${cities.length > 0 ? `в ${cities[0]}` : ""}`.trim();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Head>
        <title>{name} — специалист по налогам P2P | P2PTax</title>
        <meta property="og:title" content={`${name} — специалист по налогам P2P | P2PTax`} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:url" content={`https://p2ptax.ru/specialists/${id}`} />
        <meta property="og:type" content="profile" />
      </Head>
      <HeaderBack title="Профиль специалиста" rightAction={rightAction} />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <ResponsiveContainer>
          <View className="py-4">

            {/* Hero — horizontal layout */}
            <View className="flex-row items-start p-4 pb-0">
              {/* Avatar */}
              <View
                className="rounded-full items-center justify-center mr-4 flex-shrink-0"
                style={{ width: 80, height: 80, backgroundColor: "#1e3a8a" }}
              >
                <Text className="text-white font-bold text-2xl">{initials}</Text>
              </View>

              {/* Info column */}
              <View className="flex-1">
                {/* Name row with CTA */}
                <View className="flex-row items-start justify-between">
                  <Text className="text-2xl font-bold flex-1 mr-2" style={{ color: "#0f172a" }}>{name}</Text>
                  {!isOwnProfile && !isSpecialist && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Написать"
                      onPress={handleWritePress}
                      className="rounded-xl px-4 min-h-[44px] items-center justify-center flex-row"
                      style={{ backgroundColor: "#b45309" }}
                    >
                      <Text className="text-white font-semibold text-sm">Написать →</Text>
                    </Pressable>
                  )}
                </View>

                {/* City */}
                {cities.length > 0 && (
                  <Text className="text-sm mt-0.5" style={{ color: "#64748B" }}>{cities.join(", ")}</Text>
                )}

                {/* Availability */}
                <View className="flex-row items-center mt-2 flex-wrap" style={{ gap: 8 }}>
                  <View className="flex-row items-center">
                    <View className={`w-2 h-2 rounded-full mr-1 ${specialist.isAvailable ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <Text
                      className="text-xs font-semibold uppercase"
                      style={{ letterSpacing: 1, color: specialist.isAvailable ? "#059669" : "#94a3b8" }}
                    >
                      {specialist.isAvailable ? "На связи" : "Недоступен"}
                    </Text>
                  </View>
                  <Text className="text-xs" style={{ color: "#94a3b8" }}>
                    · на P2PTax с {formatDate(specialist.createdAt)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Stats */}
            <View className="flex-row mx-4 mt-4 mb-2 py-4 border-t border-b border-slate-100">
              <View className="flex-1 items-center">
                <Text className="text-2xl font-bold" style={{ color: "#0f172a" }}>
                  {specialist.requestsCount ?? fnsCount}
                </Text>
                <Text className="text-xs mt-1" style={{ color: "#64748B", letterSpacing: 2 }}>
                  КЕЙСОВ
                </Text>
              </View>
              <View style={{ width: 1, backgroundColor: "#e2e8f0" }} />
              <View className="flex-1 items-center">
                <Text className="text-2xl font-bold" style={{ color: "#0f172a" }}>{fnsCount}</Text>
                <Text className="text-xs mt-1 text-center" style={{ color: "#64748B", letterSpacing: 2 }}>
                  ИФНС В РАБОТЕ
                </Text>
              </View>
              <View style={{ width: 1, backgroundColor: "#e2e8f0" }} />
              <View className="flex-1 items-center">
                <Text className="text-2xl font-bold" style={{ color: "#0f172a" }}>{servicesCount}</Text>
                <Text className="text-xs mt-1 text-center" style={{ color: "#64748B", letterSpacing: 2 }}>
                  ВИДОВ ПРОВЕРОК
                </Text>
              </View>
            </View>

            {/* About */}
            {specialist.profile?.description ? (
              <View
                className="bg-white rounded-2xl border border-slate-100 p-4 mx-4 mt-4"
                style={cardShadow}
              >
                <Text style={{ color: "#94a3b8", fontSize: 11, letterSpacing: 3, marginBottom: 8 }}>
                  О СЕБЕ
                </Text>
                <Text className="text-base leading-6" style={{ color: "#334155" }}>
                  {specialist.profile.description}
                </Text>
              </View>
            ) : null}

            {/* FNS + Services */}
            {specialist.fnsServices.length > 0 && (
              <View
                className="bg-white rounded-2xl border border-slate-100 p-4 mx-4 mt-4"
                style={cardShadow}
              >
                <Text style={{ color: "#94a3b8", fontSize: 11, letterSpacing: 3, marginBottom: 8 }}>
                  РАБОЧИЕ ИНСПЕКЦИИ
                </Text>
                {specialist.fnsServices.map((group) => (
                  <View
                    key={group.fns.id}
                    className="border border-slate-200 rounded-xl p-3 mb-2"
                    style={{ backgroundColor: "#f8fafc" }}
                  >
                    <Text className="text-sm font-semibold mb-2" style={{ color: "#0f172a" }}>
                      {group.city.name} — {group.fns.name}
                    </Text>
                    <View className="flex-row flex-wrap" style={{ gap: 6 }}>
                      {group.services.map((s) => (
                        <View
                          key={s.id}
                          className="px-2.5 py-1 rounded-lg"
                          style={{ backgroundColor: "rgba(180, 83, 9, 0.1)" }}
                        >
                          <Text className="text-xs font-medium" style={{ color: "#b45309" }}>{s.name}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Contacts — PUBLIC to everyone including guests */}
            {hasContacts && (
              <View
                className="bg-white rounded-2xl border border-slate-100 p-4 mx-4 mt-4"
                style={cardShadow}
              >
                <Text style={{ color: "#94a3b8", fontSize: 11, letterSpacing: 3, marginBottom: 8 }}>
                  КОНТАКТЫ
                </Text>

                {contacts.map((contact, index) => {
                  const cfg = CONTACT_TYPE_CONFIG[contact.type] || {
                    label: contact.type,
                    Icon: ExternalLink,
                    bg: colors.background,
                    color: colors.textSecondary,
                  };
                  const url = getContactUrl(contact.type, contact.value);
                  const isLast =
                    index === contacts.length - 1 &&
                    !specialist.profile?.officeAddress &&
                    !specialist.profile?.workingHours;

                  if (url) {
                    return (
                      <Pressable
                        accessibilityRole="button"
                        key={contact.id}
                        accessibilityLabel={`${cfg.label} ${contact.value}`}
                        onPress={() => Linking.openURL(url)}
                        className={`flex-row items-center py-2.5 ${isLast ? "" : "border-b border-slate-100"}`}
                      >
                        <View
                          className="w-8 h-8 rounded-full items-center justify-center mr-3"
                          style={{ backgroundColor: cfg.bg }}
                        >
                          <cfg.Icon size={14} color={cfg.color} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs mb-0.5" style={{ color: "#94a3b8" }}>{cfg.label}</Text>
                          <Text className="text-sm font-medium" style={{ color: cfg.color }}>
                            {contact.value}
                          </Text>
                        </View>
                        <ChevronRight size={12} color={colors.borderLight} />
                      </Pressable>
                    );
                  }
                  return (
                    <View
                      key={contact.id}
                      className={`flex-row items-center py-2.5 ${isLast ? "" : "border-b border-slate-100"}`}
                    >
                      <View
                        className="w-8 h-8 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: cfg.bg }}
                      >
                        <cfg.Icon size={14} color={cfg.color} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs mb-0.5" style={{ color: "#94a3b8" }}>{cfg.label}</Text>
                        <Text className="text-sm font-medium" style={{ color: "#334155" }}>{contact.value}</Text>
                      </View>
                    </View>
                  );
                })}

                {specialist.profile?.officeAddress && (
                  <View className={`flex-row items-start py-2.5 ${specialist.profile?.workingHours ? "border-b border-slate-100" : ""}`}>
                    <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: "#f1f5f9" }}>
                      <MapPin size={14} color={colors.textSecondary} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs mb-0.5" style={{ color: "#94a3b8" }}>Адрес офиса</Text>
                      <Text className="text-sm leading-5" style={{ color: "#334155" }}>
                        {specialist.profile.officeAddress}
                      </Text>
                    </View>
                  </View>
                )}

                {specialist.profile?.workingHours && (
                  <View className="flex-row items-center py-2.5">
                    <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: "#f1f5f9" }}>
                      <Clock size={14} color={colors.textSecondary} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs mb-0.5" style={{ color: "#94a3b8" }}>Часы работы</Text>
                      <Text className="text-sm" style={{ color: "#334155" }}>
                        {specialist.profile.workingHours}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Reviews stub */}
            <View
              className="bg-white rounded-2xl border border-slate-100 p-4 mx-4 mt-4"
              style={cardShadow}
            >
              <Text style={{ color: "#94a3b8", fontSize: 11, letterSpacing: 3, marginBottom: 8 }}>
                ОТЗЫВЫ
              </Text>
              <Text className="text-sm italic" style={{ color: "#94a3b8" }}>
                Отзывы появятся в следующих версиях
              </Text>
            </View>

            {/* Similar specialists */}
            {similar.length > 0 && (
              <View className="mx-4 mt-4 mb-4">
                <Text style={{ color: "#94a3b8", fontSize: 11, letterSpacing: 3, marginBottom: 8 }}>
                  ПОХОЖИЕ СПЕЦИАЛИСТЫ
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {similar.slice(0, 5).map((s) => (
                    <SpecialistCard
                      key={s.id}
                      id={s.id}
                      firstName={s.firstName}
                      lastName={s.lastName}
                      avatarUrl={s.avatarUrl}
                      services={s.services}
                      cities={s.cities}
                      onPress={handleSimilarPress}
                      variant="horizontal"
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Own profile banner */}
            {isOwnProfile && (
              <View className="mx-4 mt-2 mb-4 rounded-xl py-3.5 items-center" style={{ backgroundColor: "#f1f5f9" }}>
                <Text className="text-sm font-semibold" style={{ color: "#64748B" }}>Это вы</Text>
              </View>
            )}

          </View>
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
