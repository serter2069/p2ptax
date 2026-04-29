import { View, Text, Pressable, Image } from "react-native";
import { Bookmark } from "lucide-react-native";
import { colors } from "@/lib/theme";

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
}

function getInitials(firstName: string | null, lastName: string | null): string {
  const f = firstName?.[0] || "";
  const l = lastName?.[0] || "";
  return (f + l).toUpperCase() || "?";
}

export default function SpecialistCard({
  id,
  firstName,
  lastName,
  avatarUrl,
  services,
  cities,
  specialistFns,
  onPress,
  variant,
  horizontal = false,
  onBookmark,
  bookmarked = false,
}: SpecialistCardProps) {
  const resolvedVariant = variant ?? (horizontal ? "horizontal" : "vertical");
  const name = [firstName, lastName].filter(Boolean).join(" ") || "Специалист";
  const initials = getInitials(firstName, lastName);

  if (resolvedVariant === "horizontal") {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={name}
        onPress={() => onPress(id)}
        className="bg-white border border-border rounded-xl p-4 mr-3"
        style={({ pressed }) => [{ maxWidth: 200, flex: 1 }, pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }]}
      >
        <View className="w-12 h-12 rounded-full items-center justify-center mb-2" style={{ backgroundColor: colors.primary }}>
          <Text className="text-white font-bold text-base">{initials}</Text>
        </View>
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

  // Vertical variant — compact 3-row layout (T2 redesign):
  //   Row 1: avatar + name (bold) + city (muted) + bookmark
  //   Row 2: ИФНС text (1 line, truncated)
  //   Row 3: up to 3 service chips ("+N" if more)
  const cityLabel = cities.length > 0 ? cities.map((c) => c.name).join(", ") : null;

  // Resolve flat list of services + ИФНС label (prefer specialistFns when available).
  const fnsLabel = specialistFns && specialistFns.length > 0
    ? specialistFns.map((g) => g.fnsName).join(", ")
    : null;
  const flatServices = specialistFns && specialistFns.length > 0
    ? specialistFns.flatMap((g) => g.services)
    : services;

  // Dedupe services by id (FNS groups can repeat the same service across offices).
  const uniqueServices = flatServices.filter(
    (svc, idx, arr) => arr.findIndex((s) => s.id === svc.id) === idx
  );
  const visibleServices = uniqueServices.slice(0, 3);
  const overflow = uniqueServices.length - visibleServices.length;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={() => onPress(id)}
      className="bg-white border border-border rounded-2xl p-3 mb-3"
      style={({ pressed }) => [
        { shadowColor: colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
        pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
      ]}
    >
      {/* Row 1: avatar + name + city (same line) + bookmark */}
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
          <View className="flex-row items-baseline" style={{ gap: 6 }}>
            <Text
              className="text-sm font-bold flex-shrink"
              style={{ color: colors.text }}
              numberOfLines={1}
            >
              {name}
            </Text>
            {cityLabel ? (
              <Text
                className="text-xs flex-shrink"
                style={{ color: colors.textMuted }}
                numberOfLines={1}
              >
                · {cityLabel}
              </Text>
            ) : null}
          </View>
        </View>

        {onBookmark && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={bookmarked ? "Убрать из сохранённых" : "Сохранить"}
            onPress={(e) => { e.stopPropagation?.(); onBookmark(id); }}
            hitSlop={8}
          >
            <Bookmark
              size={18}
              color={bookmarked ? colors.primary : colors.textMuted}
              fill={bookmarked ? colors.primary : "none"}
            />
          </Pressable>
        )}
      </View>

      {/* Row 2: ИФНС (1 line, truncated) */}
      {fnsLabel ? (
        <Text
          className="text-xs mt-1.5"
          style={{ color: colors.textMuted }}
          numberOfLines={1}
        >
          {fnsLabel}
        </Text>
      ) : null}

      {/* Row 3: up to 3 service chips + "+N" */}
      {visibleServices.length > 0 ? (
        <View className="flex-row flex-wrap items-center mt-1.5" style={{ gap: 6 }}>
          {visibleServices.map((s) => (
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
          {overflow > 0 && (
            <Text className="text-xs" style={{ color: colors.textMuted }}>
              +{overflow}
            </Text>
          )}
        </View>
      ) : null}
    </Pressable>
  );
}
