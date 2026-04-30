import { View, Text, Pressable, Image } from "react-native";
import { Bookmark, MessageCircle } from "lucide-react-native";
import { colors } from "@/lib/theme";
import { isAllCoreServicesSelected, getShortServiceName } from "@/lib/services";

interface FnsGroup {
  fnsId: string;
  fnsName: string;
  city: { id: string; name: string };
  services: { id: string; name: string }[];
}

interface SpecialistCardProps {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  createdAt?: string;
  services: { id: string; name: string }[];
  cities: { id: string; name: string }[];
  /** FNS-grouped services. When provided, used instead of flat services in vertical variant. */
  specialistFns?: FnsGroup[];
  description?: string | null;
  onPress: (id: string) => void;
  variant?: "vertical" | "horizontal";
  /** @deprecated Use variant="horizontal" instead */
  horizontal?: boolean;
  onBookmark?: (id: string) => void;
  bookmarked?: boolean;
  onWrite?: (id: string) => void;
  /** When set, only the matching FNS group is shown (cascade narrows to active filter). */
  activeFnsId?: string | null;
}

function getInitials(firstName: string | null, lastName: string | null): string {
  const f = firstName?.[0] || "";
  const l = lastName?.[0] || "";
  return (f + l).toUpperCase() || "?";
}

function formatSpecialistName(firstName: string | null, lastName: string | null): string {
  const f = (firstName || "").trim();
  const l = (lastName || "").trim();
  if (f && l) return `${f} ${l[0]}.`;
  return f || l || "Специалист";
}

export default function SpecialistCard({
  id,
  firstName,
  lastName,
  avatarUrl,
  createdAt,
  services,
  cities,
  specialistFns,
  description,
  onPress,
  variant,
  horizontal = false,
  onBookmark,
  bookmarked = false,
  onWrite,
  activeFnsId,
}: SpecialistCardProps) {
  const resolvedVariant = variant ?? (horizontal ? "horizontal" : "vertical");
  const name = formatSpecialistName(firstName, lastName);
  const initials = getInitials(firstName, lastName);
  const year = createdAt ? new Date(createdAt).getFullYear() : null;
  const desc = description
    ? description.length > 120
      ? description.slice(0, 120) + "..."
      : description
    : null;

  if (resolvedVariant === "horizontal") {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={name}
        onPress={() => onPress(id)}
        className="bg-white border border-border rounded-xl p-4 mr-3"
        style={({ pressed }) => [{ maxWidth: 200, flex: 1 }, pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }]}
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            className="w-12 h-12 rounded-full mb-2"
            accessibilityLabel={name}
          />
        ) : (
          <View className="w-12 h-12 rounded-full items-center justify-center mb-2" style={{ backgroundColor: colors.primary }}>
            <Text className="text-white font-bold text-base">{initials}</Text>
          </View>
        )}
        <Text className="text-base font-semibold mb-1" style={{ color: colors.text }} numberOfLines={1}>
          {name}
        </Text>
        <View className="flex-row flex-wrap gap-1 mb-1">
          {services.slice(0, 2).map((s) => (
            <View key={s.id} className="px-1.5 py-0.5 rounded" style={{ backgroundColor: colors.accentSoft }}>
              <Text className="text-xs" style={{ color: colors.primary }}>{s.name}</Text>
            </View>
          ))}
          {services.length > 2 && (
            <Text className="text-xs" style={{ color: colors.textMuted }}>+{services.length - 2}</Text>
          )}
        </View>
        {cities.length > 0 && (
          <Text className="text-xs" style={{ color: colors.textMuted }} numberOfLines={1}>
            {cities.map((c) => c.name).join(", ")}
          </Text>
        )}
      </Pressable>
    );
  }

  // Vertical variant — cascade FNS-group layout:
  //   Row 1: avatar + name + "На сайте с YYYY" + bookmark
  //   Row 2..N: per FNS group → "city · ИФНС" line + service chips below
  //   Overflow: "+N ещё" tap-to-profile link

  const allFns = specialistFns ?? [];
  const fnsList = activeFnsId
    ? allFns.filter((g) => g.fnsId === activeFnsId)
    : allFns;
  const visibleFns = fnsList.slice(0, 2);
  const fnsOverflow = fnsList.length - visibleFns.length;

  // Fallback to flat services if no specialistFns provided
  const fallbackServices = services.filter(
    (svc, idx, arr) => arr.findIndex((s) => s.id === svc.id) === idx
  );
  const fallbackVisible = fallbackServices.slice(0, 3);
  const fallbackOverflow = fallbackServices.length - fallbackVisible.length;
  const fallbackCity = cities.length > 0 ? cities.map((c) => c.name).join(", ") : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={() => onPress(id)}
      className="bg-white border border-border rounded-2xl p-3 mb-3"
      style={({ pressed }) => [
        { position: 'relative', shadowColor: colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
        pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
      ]}
    >
      {/* Bookmark: absolute top-right corner */}
      {onBookmark && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={bookmarked ? "Убрать из сохранённых" : "Сохранить"}
          onPress={(e) => { e.stopPropagation?.(); onBookmark(id); }}
          hitSlop={8}
          style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}
        >
          <Bookmark
            size={18}
            color={bookmarked ? colors.primary : colors.textMuted}
            fill={bookmarked ? colors.primary : "none"}
          />
        </Pressable>
      )}

      {/* Row 1: avatar + name + city (same line) */}
      <View className="flex-row items-center" style={{ gap: 10 }}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: 40, height: 40, borderRadius: 20 }}
            accessibilityLabel={name}
          />
        ) : (
          <View
            className="rounded-full items-center justify-center"
            style={{ width: 40, height: 40, backgroundColor: colors.primary }}
          >
            <Text className="text-white font-bold text-sm">{initials}</Text>
          </View>
        )}

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            className="text-sm font-bold"
            style={{ color: colors.text }}
            numberOfLines={1}
          >
            {name}
          </Text>
          {year ? (
            <Text
              className="text-xs"
              style={{ color: colors.textMuted }}
              numberOfLines={1}
            >
              На сайте с {year}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Cascade rows: city · FNS + service chips per group */}
      {visibleFns.length > 0 ? (
        <View className="mt-2" style={{ gap: 8 }}>
          {visibleFns.map((g) => (
            <View key={g.fnsId} style={{ gap: 4 }}>
              <Text
                className="text-xs font-medium"
                style={{ color: colors.textSecondary }}
                numberOfLines={1}
              >
                {g.fnsName}
              </Text>
              {g.services.length > 0 && (
                <View className="flex-row flex-wrap items-center" style={{ gap: 6 }}>
                  {isAllCoreServicesSelected(g.services.map((s) => s.name)) ? (
                    <View
                      className="px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: colors.accentSoft }}
                    >
                      <Text className="text-xs" style={{ color: colors.primary }} numberOfLines={1}>
                        Все
                      </Text>
                    </View>
                  ) : (
                    g.services.map((s) => (
                      <View
                        key={`${g.fnsId}-${s.id}`}
                        className="px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: colors.accentSoft }}
                      >
                        <Text className="text-xs" style={{ color: colors.primary }} numberOfLines={1}>
                          {getShortServiceName(s.name)}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>
          ))}
          {fnsOverflow > 0 && (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Ещё ${fnsOverflow} инспекций — открыть профиль`}
              onPress={(e) => { e.stopPropagation?.(); onPress(id); }}
              hitSlop={6}
            >
              <Text className="text-xs" style={{ color: colors.primary, textDecorationLine: "underline" }}>
                +{fnsOverflow} ещё
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        // Fallback: no specialistFns → flat list (legacy callers)
        <>
          {fallbackCity ? (
            <Text
              className="text-xs mt-1.5"
              style={{ color: colors.textMuted }}
              numberOfLines={1}
            >
              {fallbackCity}
            </Text>
          ) : null}
          {fallbackVisible.length > 0 ? (
            <View className="flex-row flex-wrap items-center mt-1.5" style={{ gap: 6 }}>
              {fallbackVisible.map((s) => (
                <View
                  key={s.id}
                  className="px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: colors.accentSoft }}
                >
                  <Text className="text-xs" style={{ color: colors.primary }} numberOfLines={1}>
                    {s.name}
                  </Text>
                </View>
              ))}
              {fallbackOverflow > 0 && (
                <Text className="text-xs" style={{ color: colors.textMuted }}>
                  +{fallbackOverflow}
                </Text>
              )}
            </View>
          ) : null}
        </>
      )}

      {/* Description (truncated to 2 lines) */}
      {desc ? (
        <Text
          className="text-xs mt-2"
          style={{ color: colors.textSecondary, lineHeight: 16 }}
          numberOfLines={2}
        >
          {desc}
        </Text>
      ) : null}

      {/* Row 4: "Написать" CTA — direct chat without a request */}
      {onWrite && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Написать специалисту"
          onPress={(e) => { e.stopPropagation?.(); onWrite(id); }}
          className="flex-row items-center justify-center mt-2 py-1.5 rounded-xl border border-border"
          style={{ gap: 6 }}
        >
          <MessageCircle size={14} color={colors.primary} />
          <Text className="text-xs font-medium" style={{ color: colors.primary }}>
            Написать
          </Text>
        </Pressable>
      )}
    </Pressable>
  );
}
