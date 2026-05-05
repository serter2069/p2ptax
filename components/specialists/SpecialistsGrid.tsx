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
import { getShortServiceName, isAllCoreServicesSelected } from "@/lib/services";
// MessageSquare matches the icon on the public profile detail page
// (SpecialistContactCTA / SpecialistMobileBottomCTA) so the catalog and
// detail use a single 'Написать' visual.
import { MessageSquare, Bookmark } from "lucide-react-native";

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
  profile?: {
    exFnsStartYear?: number | null;
    exFnsEndYear?: number | null;
    exFnsOffice?: string | null;
    verifiedExFns?: boolean;
  } | null;
  avgResponseMinutes?: number | null;
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
  onWrite?: (id: string) => void;
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  ListHeaderComponent?: React.ComponentType | React.ReactElement | null;
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
  onWrite,
  activeFnsId,
}: {
  item: SpecialistItem;
  onPress: (id: string) => void;
  bookmarked: boolean;
  onBookmark: (id: string) => void;
  onWrite?: (id: string) => void;
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
        // role="link" so RN-Web renders an <a> element instead of a
        // <button>; otherwise the card has nested <Pressable>s
        // ('Написать', bookmark) which become buttons inside a button —
        // invalid HTML + React hydration warning. The card-as-link
        // semantics is also more accurate (clicks navigate to /profile).
        accessibilityRole="link"
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
            // 'stretch' lets the right column expand to the card's
            // height. The Write button inside that column then anchors
            // to the BOTTOM of the row (justifyContent:'flex-end') —
            // user wanted the CTA at bottom-right rather than the old
            // vertical-center placement.
            alignItems: "stretch",
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
                  {isAllCoreServicesSelected(g.services.map((s) => s.name)) ? (
                    <View
                      style={{
                        backgroundColor: colors.accentSoft,
                        borderRadius: 99,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                      }}
                    >
                      <Text style={{ color: colors.primary, fontSize: 11 }} numberOfLines={1}>
                        Все услуги
                      </Text>
                    </View>
                  ) : (
                    g.services.map((s) => (
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
                          {getShortServiceName(s.name)}
                        </Text>
                      </View>
                    ))
                  )}
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

        {/* Right column: primary CTA pinned to the bottom-right of the
            card (bookmark stays at top-right via the absolute Pressable
            below). The flex column takes the full card height (parent
            uses alignItems:'stretch') and pushes its child down with
            justifyContent:'flex-end'. */}
        <View
          style={{
            alignItems: "flex-end",
            justifyContent: "flex-end",
            flexShrink: 0,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Написать"
            onPress={(e) => {
              e.stopPropagation?.();
              if (onWrite) onWrite(item.id);
              else onPress(item.id);
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
            <MessageSquare size={14} color={colors.white} />
            <Text style={{ color: colors.white, fontSize: 13, fontWeight: "600" }}>
              Написать
            </Text>
          </Pressable>
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={bookmarked ? "Убрать из сохранённых" : "Сохранить"}
        onPress={() => onBookmark(item.id)}
        hitSlop={8}
        style={({ pressed }) => [
          {
            position: "absolute",
            top: 8,
            right: 8,
            width: 32,
            height: 32,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 16,
            zIndex: 2,
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

      {/* Hover popover with the full FNS list was removed — its
          z-index was unreliable against the sticky filter bar above
          and the "+N" inline counter on the card already conveys
          there are more inspections. The card itself is a link to
          the profile, where the full list lives. */}
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
  onWrite,
  onScroll,
  ListHeaderComponent,
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
          paddingHorizontal: 24,
          paddingBottom: 48,
          paddingTop: 8,
          // House rule: content/list/feed pages cap at 960 with 24 padding (CLAUDE.md).
          maxWidth: 960,
          alignSelf: "center" as const,
          width: "100%" as const,
        }}
        renderItem={({ item }) => (
          <DesktopSpecialistRow
            item={item}
            onPress={onPress}
            bookmarked={bookmarkedIds.has(item.id)}
            onBookmark={onBookmark}
            onWrite={onWrite}
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
        ListHeaderComponent={ListHeaderComponent}
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
            exFns={item.profile ? {
              office: item.profile.exFnsOffice ?? null,
              startYear: item.profile.exFnsStartYear ?? null,
              endYear: item.profile.exFnsEndYear ?? null,
              verified: !!item.profile.verifiedExFns,
            } : undefined}
            avgResponseMinutes={item.avgResponseMinutes ?? null}
            onPress={onPress}
            onBookmark={onBookmark}
            bookmarked={bookmarkedIds.has(item.id)}
            onWrite={onWrite}
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
