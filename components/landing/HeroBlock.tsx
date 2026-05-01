import { useMemo } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { colors, gray, AVATAR_COLORS, shadowColor } from "@/lib/theme";

export interface HeroSpecialistPreview {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl?: string | null;
  cities: Array<{ id: string; name: string }>;
  services: Array<{ id: string; name: string }>;
  fnsName?: string | null;
  createdAt?: string | null;
}

/**
 * Shorten verbose FNS names to fit card layout.
 * e.g. "Межрайонная ИФНС №39 по Республике Башкортостан" → "ИФНС №39, Уфа"
 */
function shortFnsName(name: string): string {
  if (!name) return name;
  // Extract number like №39 or №3
  const numMatch = name.match(/№\s*(\d+)/);
  const num = numMatch ? `№${numMatch[1]}` : null;

  // City mappings based on region/city patterns in the name
  if (/Башкортостан|Уфа/i.test(name) && num) return `ИФНС ${num}, Уфа`;
  if (/Москв/i.test(name) && num) return `ИФНС ${num}, Москва`;
  if (/Санкт-Петербург|Петербург|СПб/i.test(name) && num) return `ИФНС ${num}, СПб`;
  if (/Казан/i.test(name) && num) return `ИФНС ${num}, Казань`;
  if (/Новосибирск/i.test(name) && num) return `ИФНС ${num}, Новосибирск`;
  if (/Екатеринбург/i.test(name) && num) return `ИФНС ${num}, Екатеринбург`;
  if (/Краснодар/i.test(name) && num) return `ИФНС ${num}, Краснодар`;
  if (/Нижний Новгород/i.test(name) && num) return `ИФНС ${num}, Н.Новгород`;
  if (/Самар/i.test(name) && num) return `ИФНС ${num}, Самара`;
  if (/Ростов/i.test(name) && num) return `ИФНС ${num}, Ростов`;

  // Generic shortening: strip "Межрайонная" prefix and long suffixes
  return name
    .replace(/^Межрайонная\s+/i, "")
    .replace(/\s+по\s+.+$/, "")
    .trim();
}

interface HeroBlockProps {
  isDesktop: boolean;
  specialists: HeroSpecialistPreview[];
  loading: boolean;
  onPrimaryCta: () => void;
  onSecondaryCta: () => void;
}

/**
 * Full-viewport hero. Left: H1 / subcopy / CTAs. Right (desktop):
 * live 3-card stack of real specialists with subtle rotation to read
 * as a curated human-first feed instead of stock illustration.
 */
export default function HeroBlock({
  isDesktop,
  specialists,
  loading,
  onPrimaryCta,
  onSecondaryCta,
}: HeroBlockProps) {
  const visible = useMemo(() => specialists.slice(0, 3), [specialists]);
  const placeholderCount = Math.max(0, 3 - visible.length);

  return (
    <View
      className="w-full"
      style={{
        minHeight: isDesktop ? 640 : undefined,
        paddingTop: isDesktop ? 80 : 48,
        paddingBottom: isDesktop ? 64 : 48,
        paddingHorizontal: isDesktop ? 32 : 20,
        backgroundColor: colors.accentTintBg,
      }}
    >
      {/* Soft gradient overlay via layered background pads. */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 360,
          backgroundColor: colors.accentSoft,
          opacity: 0.5,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 180,
          right: -80,
          width: 360,
          height: 360,
          borderRadius: 360,
          backgroundColor: colors.accentTintShape,
          opacity: 0.55,
        }}
      />

      <View
        style={{
          width: "100%",
          maxWidth: 1280,
          marginHorizontal: "auto",
          flexDirection: isDesktop ? "row" : "column",
          alignItems: isDesktop ? "center" : "stretch",
          gap: isDesktop ? 56 : 40,
        }}
      >
        {/* Left — copy column. */}
        <View style={{ flex: isDesktop ? 1.2 : undefined }}>
          <View
            className="self-start flex-row items-center rounded-full"
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              backgroundColor: colors.white,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 24,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 6,
                backgroundColor: colors.success,
                marginRight: 8,
              }}
            />
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 12,
                fontWeight: "600",
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              Сервис для получивших уведомление ФНС
            </Text>
          </View>

          <Text
            style={{
              color: colors.text,
              fontSize: isDesktop ? 52 : 34,
              lineHeight: isDesktop ? 60 : 40,
              fontWeight: "800",
              letterSpacing: -1,
            }}
          >
            Получили требование от ФНС?{"\n"}
            <Text style={{ color: colors.primary }}>
              Защитят ex-инспекторы — за 30 минут получите план.
            </Text>
          </Text>

          <Text
            style={{
              marginTop: 20,
              color: colors.textSecondary,
              fontSize: 18,
              lineHeight: 28,
              fontWeight: "400",
              maxWidth: 540,
            }}
          >
            Все специалисты на платформе — бывшие сотрудники ФНС. Знают
            процедуры изнутри, защищали налогоплательщиков от знакомых им коллег.
          </Text>

          <View
            style={{
              marginTop: 32,
              flexDirection: isDesktop ? "row" : "column",
              gap: 12,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Подобрать специалиста"
              onPress={onPrimaryCta}
              className="rounded-xl items-center justify-center"
              style={{
                height: 56,
                paddingHorizontal: 32,
                backgroundColor: colors.primary,
              }}
            >
              <Text className="text-white font-semibold" style={{ fontSize: 16 }}>
                Подобрать специалиста
              </Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Посмотреть всех специалистов"
            onPress={onSecondaryCta}
            style={{ marginTop: 16, alignSelf: "flex-start" }}
          >
            <Text
              style={{
                color: colors.primary,
                fontSize: 13,
                lineHeight: 18,
                textDecorationLine: "underline",
              }}
            >
              или посмотреть всех специалистов
            </Text>
          </Pressable>

          <Text
            style={{
              marginTop: 20,
              color: colors.textMuted,
              fontSize: 12,
              lineHeight: 18,
            }}
          >
            Без подписок. Без комиссий. Без скрытых платежей.
          </Text>
        </View>

        {/* Right — live specialist feed. */}
        {isDesktop && (
          <View style={{ flex: 1, maxWidth: 440, gap: 14 }}>
            {visible.map((s, idx) => (
              <SpecialistCard key={s.id} specialist={s} index={idx} />
            ))}
            {Array.from({ length: placeholderCount }).map((_, idx) => (
              <SpecialistSkeleton key={`ph-${idx}`} index={visible.length + idx} loading={loading} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function SpecialistCard({
  specialist,
  index,
}: {
  specialist: HeroSpecialistPreview;
  index: number;
}) {
  const rotation = index === 1 ? "1deg" : index === 2 ? "-1deg" : "0deg";
  const name = [specialist.firstName, specialist.lastName].filter(Boolean).join(" ") || "Специалист";
  const city = specialist.cities[0]?.name ?? null;
  // Show only the first service to prevent card layout breaking.
  const firstService = specialist.services[0] ?? null;
  const avatarBg = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const since = specialist.createdAt ? new Date(specialist.createdAt).getFullYear() : null;

  return (
    <View
      className="rounded-2xl"
      style={{
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 20,
        flexDirection: "row",
        gap: 16,
        // eslint-disable-next-line react-native/no-inline-styles
        transform: [{ rotate: rotation }],
        shadowColor: shadowColor.heroDeep,
        shadowOpacity: 0.06,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
      }}
    >
      {specialist.avatarUrl ? (
        <Image
          source={{ uri: specialist.avatarUrl }}
          className="rounded-full"
          style={{ width: 56, height: 56 }}
          accessibilityLabel={name}
        />
      ) : (
        <View
          className="items-center justify-center rounded-full"
          style={{
            width: 56,
            height: 56,
            backgroundColor: avatarBg,
          }}
        >
          <Text className="text-white font-extrabold" style={{ fontSize: 22 }}>
            {(specialist.firstName?.[0] ?? "С").toUpperCase()}
          </Text>
        </View>
      )}

      <View style={{ flex: 1 }}>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="font-semibold" style={{ color: colors.text, fontSize: 15 }}>
              {name}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
              {since ? `На сайте с ${since}` : "Специалист"}
            </Text>
          </View>
        </View>

        <View className="flex-row flex-wrap" style={{ gap: 6, marginTop: 10 }}>
          {/* Show FNS name if available, otherwise fall back to city */}
          {specialist.fnsName
            ? <Chip label={shortFnsName(specialist.fnsName)} tone="default" />
            : city
            ? <Chip label={city} tone="default" />
            : null}
        </View>

        <View className="flex-row flex-wrap" style={{ gap: 6, marginTop: 8 }}>
          {firstService && <Chip key={firstService.id} label={firstService.name} tone="accent" />}
        </View>
      </View>
    </View>
  );
}

function SpecialistSkeleton({ index, loading }: { index: number; loading: boolean }) {
  const rotation = index === 1 ? "1deg" : index === 2 ? "-1deg" : "0deg";
  return (
    <View
      className="rounded-2xl"
      style={{
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 20,
        flexDirection: "row",
        gap: 16,
        // eslint-disable-next-line react-native/no-inline-styles
        transform: [{ rotate: rotation }],
        opacity: loading ? 0.7 : 0.45,
      }}
    >
      <View
        className="rounded-full"
        style={{
          width: 56,
          height: 56,
          backgroundColor: gray[200],
        }}
      />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={{ height: 12, width: "50%", backgroundColor: gray[200], borderRadius: 4 }} />
        <View style={{ height: 10, width: "70%", backgroundColor: gray[100], borderRadius: 4 }} />
        <View style={{ height: 10, width: "40%", backgroundColor: gray[100], borderRadius: 4 }} />
      </View>
    </View>
  );
}

function Chip({ label, tone }: { label: string; tone: "default" | "accent" }) {
  const bg = tone === "accent" ? colors.accentSoft : gray[100];
  const color = tone === "accent" ? colors.accentSoftInk : colors.textSecondary;
  return (
    <View
      className="rounded-full"
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: bg,
      }}
    >
      <Text style={{ color, fontSize: 12, fontWeight: "500" }}>{label}</Text>
    </View>
  );
}
