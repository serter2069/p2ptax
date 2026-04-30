import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Image,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { colors } from "@/lib/theme";
import { MessageCircle, Bookmark } from "lucide-react-native";

function formatSpecialistName(firstName: string | null, lastName: string | null): string {
  const f = (firstName || "").trim();
  const l = (lastName || "").trim();
  if (f && l) return `${f} ${l[0]}.`;
  return f || l || "Специалист";
}

interface FnsGroup {
  fnsId: string;
  fnsName: string;
  city: { id: string; name: string };
  services: { id: string; name: string }[];
}

interface SpecialistItem {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  services: { id: string; name: string }[];
  cities: { id: string; name: string }[];
  specialistFns?: FnsGroup[];
  description?: string | null;
}

interface Props {
  specialists: SpecialistItem[];
  gridCols: number;
  isDesktop: boolean;
  isWide: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  bookmarkedIds: Set<string>;
  /** When a specific FNS filter is active, cards show only the matching FNS group. */
  activeFnsId?: string | null;
  onRefresh: () => void;
  onLoadMore: () => void;
  onPress: (id: string) => void;
  onBookmark: (id: string) => void;
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

function getInitials(firstName: string | null, lastName: string | null): string {
  const f = firstName?.[0] || "";
  const l = lastName?.[0] || "";
  return (f + l).toUpperCase() || "?";
}

// Horizontal row card for desktop (1 column)
function DesktopSpecialistRow({
  item,
  onPress,
  bookmarked,
  onBookmark,
  activeFnsId,
}: {
  item: SpecialistItem;
  onPress: (id: string) => void;
  bookmarked: boolean;
  onBookmark: (id: string) => void;
  activeFnsId?: string | null;
}) {
  const [hovered, setHovered] = useState(false);

  const name = formatSpecialistName(item.firstName, item.lastName);
  const initials = getInitials(item.firstName, item.lastName);
  const year = item.createdAt ? new Date(item.createdAt).getFullYear() : null;

  const desc = item.description
    ? item.description.length > 120
      ? item.description.slice(0, 120) + "..."
      : item.description
    : null;

  // Cascade: show FNS groups (each = ИФНС + service chips).
  // When an FNS filter is active, narrow to that single group.
  const allFns = item.specialistFns ?? [];
  const fnsList = activeFnsId
    ? allFns.filter((g) => g.fnsId === activeFnsId)
    : allFns;
  const visibleFns = fnsList.slice(0, 2);
  const fnsOverflow = fnsList.length - visibleFns.length;

  // Hover tooltip lists ALL groups up to 5, with a "see profile" link if more remain.
  const tooltipFns = fnsList.slice(0, 5);
  const tooltipOverflow = fnsList.length - tooltipFns.length;

  const hoverProps =
    Platform.OS === "web"
      ? {
          onMouseEnter: () => setHovered(true),
          onMouseLeave: () => setHovered(false),
        }
      : {};

  return (
    <View style={{ position: "relative" }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={name}
        onPress={() => onPress(item.id)}
        style={({ pressed }) => [
          {
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: hovered ? colors.primary : colors.border,
            borderRadius: 16,
            padding: 16,
            marginBottom: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: hovered ? 0.12 : 0.06,
            shadowRadius: 6,
            elevation: 2,
          },
          pressed && { opacity: 0.85 },
        ]}
        {...hoverProps}
      >
        {/* Avatar */}
        {item.avatarUrl ? (
          <Image
            source={{ uri: item.avatarUrl }}
            style={{ width: 60, height: 60, borderRadius: 30, flexShrink: 0 }}
            accessibilityLabel={name}
          />
        ) : (
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Text style={{ color: colors.white, fontWeight: "700", fontSize: 18 }}>
              {initials}
            </Text>
          </View>
        )}

        {/* Center: name + cascade FNS groups + description */}
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <Text
              style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}
              numberOfLines={1}
            >
              {name}
            </Text>
            {year && (
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                На сайте с {year}
              </Text>
            )}
          </View>

          {/* Cascade: each FNS group on its own line */}
          {visibleFns.length > 0 && (
            <View style={{ gap: 4, marginTop: 2 }}>
              {visibleFns.map((g) => (
                <View
                  key={g.fnsId}
                  style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 }}
                >
                  <Text
                    style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "500" }}
                    numberOfLines={1}
                  >
                    {g.fnsName}
                  </Text>
                  {g.services.map((s) => (
                    <View
                      key={`${g.fnsId}-${s.id}`}
                      style={{
                        backgroundColor: colors.accentSoft,
                        borderRadius: 99,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                      }}
                    >
                      <Text style={{ color: colors.primary, fontSize: 11 }} numberOfLines={1}>
                        {s.name}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
              {fnsOverflow > 0 && (
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={`Ещё ${fnsOverflow} инспекций — открыть профиль`}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    onPress(item.id);
                  }}
                  hitSlop={6}
                >
                  <Text style={{ color: colors.primary, fontSize: 12, textDecorationLine: "underline" }}>
                    +{fnsOverflow} ещё
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {desc && (
            <Text
              style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 2 }}
              numberOfLines={2}
            >
              {desc}
            </Text>
          )}
        </View>

        {/* Right: bookmark + "Написать" button */}
        <View style={{ alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={bookmarked ? "Убрать из сохранённых" : "Сохранить"}
            onPress={(e) => {
              e.stopPropagation?.();
              onBookmark(item.id);
            }}
            hitSlop={8}
            style={({ pressed }) => [
              {
                width: 32,
                height: 32,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 16,
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Bookmark
              size={18}
              color={bookmarked ? colors.primary : colors.textMuted}
              fill={bookmarked ? colors.primary : "none"}
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Написать"
            onPress={(e) => {
              e.stopPropagation?.();
              onPress(item.id);
            }}
            style={({ pressed }) => [
              {
                backgroundColor: colors.primary,
                borderRadius: 8,
                paddingHorizontal: 14,
                paddingVertical: 7,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            <MessageCircle size={14} color={colors.white} />
            <Text style={{ color: colors.white, fontSize: 13, fontWeight: "600" }}>
              Написать
            </Text>
          </Pressable>
        </View>
      </Pressable>

      {/* Hover tooltip — show all FNS groups up to 5, link to profile if more */}
      {hovered && Platform.OS === "web" && fnsList.length > 2 && (
        <View
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 50,
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 14,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
            elevation: 8,
            gap: 10,
          }}
          {...hoverProps}
        >
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Все инспекции
          </Text>
          <View style={{ gap: 6 }}>
            {tooltipFns.map((g) => (
              <View
                key={g.fnsId}
                style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 }}
              >
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: "500" }} numberOfLines={1}>
                  {g.fnsName}
                </Text>
                {g.services.map((s) => (
                  <View
                    key={`${g.fnsId}-${s.id}`}
                    style={{
                      backgroundColor: colors.accentSoft,
                      borderRadius: 99,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ color: colors.primary, fontSize: 11 }}>{s.name}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
          {tooltipOverflow > 0 && (
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>
              И ещё {tooltipOverflow}…
            </Text>
          )}
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Посмотреть профиль специалиста"
            onPress={(e) => {
              e.stopPropagation?.();
              onPress(item.id);
            }}
            style={({ pressed }) => [
              { paddingTop: 4 },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>
              Посмотреть профиль →
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function SpecialistsGrid({
  specialists,
  gridCols,
  isDesktop,
  isWide,
  refreshing,
  loadingMore,
  bookmarkedIds,
  activeFnsId,
  onRefresh,
  onLoadMore,
  onPress,
  onBookmark,
  onScroll,
}: Props) {
  // On desktop we always render 1 column of horizontal rows
  if (isDesktop) {
    return (
      <FlatList
        key="desktop-list"
        data={specialists}
        keyExtractor={(item) => item.id}
        numColumns={1}
        contentContainerStyle={{
          paddingHorizontal: isWide ? 48 : 24,
          paddingBottom: 48,
          paddingTop: 8,
          maxWidth: isWide ? 1100 : 860,
          alignSelf: "center" as const,
          width: "100%" as const,
        }}
        renderItem={({ item }) => (
          <DesktopSpecialistRow
            item={item}
            onPress={onPress}
            bookmarked={bookmarkedIds.has(item.id)}
            onBookmark={onBookmark}
            activeFnsId={activeFnsId}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        onScroll={onScroll}
        scrollEventThrottle={16}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ paddingVertical: 16 }}
            />
          ) : null
        }
      />
    );
  }

  // Mobile: original card grid (1 column)
  const SpecialistCard = require("@/components/SpecialistCard").default;
  return (
    <FlatList
      key={`grid-${gridCols}`}
      data={specialists}
      keyExtractor={(item) => item.id}
      numColumns={gridCols}
      columnWrapperStyle={
        gridCols > 1
          ? { gap: 16, paddingHorizontal: 16 }
          : undefined
      }
      contentContainerStyle={{
        paddingHorizontal: gridCols > 1 ? 0 : 16,
        paddingBottom: 48,
        paddingTop: 8,
        width: "100%" as const,
      }}
      renderItem={({ item }) => (
        <View style={gridCols > 1 ? { flex: 1 } : undefined}>
          <SpecialistCard
            id={item.id}
            firstName={item.firstName}
            lastName={item.lastName}
            avatarUrl={item.avatarUrl}
            createdAt={item.createdAt}
            services={item.services}
            cities={item.cities}
            specialistFns={item.specialistFns}
            description={item.description}
            onPress={onPress}
            onBookmark={onBookmark}
            bookmarked={bookmarkedIds.has(item.id)}
            variant="vertical"
            activeFnsId={activeFnsId}
          />
        </View>
      )}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      onScroll={onScroll}
      scrollEventThrottle={16}
      ListFooterComponent={
        loadingMore ? (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={{ paddingVertical: 16 }}
          />
        ) : null
      }
    />
  );
}
