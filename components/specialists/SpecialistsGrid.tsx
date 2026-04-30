import { useState } from "react";
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Pressable, Image, Platform } from "react-native";
import { colors } from "@/lib/theme";
import { MessageCircle } from "lucide-react-native";

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
  onRefresh: () => void;
  onLoadMore: () => void;
  onPress: (id: string) => void;
  onBookmark: (id: string) => void;
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
}: {
  item: SpecialistItem;
  onPress: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  const name = [item.firstName, item.lastName].filter(Boolean).join(" ") || "Специалист";
  const initials = getInitials(item.firstName, item.lastName);
  const year = item.createdAt ? new Date(item.createdAt).getFullYear() : null;
  const cityLabel = item.cities.length > 0 ? item.cities.map((c) => c.name).join(", ") : null;

  const desc = item.description
    ? item.description.length > 120
      ? item.description.slice(0, 120) + "..."
      : item.description
    : null;

  // Resolve services
  const flatServices =
    item.specialistFns && item.specialistFns.length > 0
      ? item.specialistFns.flatMap((g) => g.services)
      : item.services;
  const uniqueServices = flatServices.filter(
    (svc, idx, arr) => arr.findIndex((s) => s.id === svc.id) === idx
  );
  const visibleServices = uniqueServices.slice(0, 2);
  const serviceOverflow = uniqueServices.length - visibleServices.length;

  // FNS for hover tooltip
  const fnsList = item.specialistFns ?? [];
  const visibleFns = fnsList.slice(0, 3);
  const fnsOverflow = fnsList.length - visibleFns.length;

  // All services for hover tooltip
  const allVisibleServices = uniqueServices.slice(0, 5);
  const allServiceOverflow = uniqueServices.length - allVisibleServices.length;

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

        {/* Center: name + desc + year + city */}
        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <Text
            style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}
            numberOfLines={1}
          >
            {name}
          </Text>
          {year && (
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>
              С {year}
              {cityLabel ? ` · ${cityLabel}` : ""}
            </Text>
          )}
          {!year && cityLabel && (
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{cityLabel}</Text>
          )}
          {desc && (
            <Text
              style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18 }}
              numberOfLines={2}
            >
              {desc}
            </Text>
          )}
        </View>

        {/* Right: service chips + "Написать" button */}
        <View style={{ alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, justifyContent: "flex-end", maxWidth: 220 }}>
            {visibleServices.map((s) => (
              <View
                key={s.id}
                style={{
                  backgroundColor: colors.accentSoft,
                  borderRadius: 99,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                }}
              >
                <Text style={{ color: colors.primary, fontSize: 12 }} numberOfLines={1}>
                  {s.name}
                </Text>
              </View>
            ))}
            {serviceOverflow > 0 && (
              <Text style={{ color: colors.textMuted, fontSize: 12, alignSelf: "center" }}>
                +{serviceOverflow}
              </Text>
            )}
          </View>
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

      {/* Hover tooltip */}
      {hovered && Platform.OS === "web" && (fnsList.length > 0 || uniqueServices.length > 2) && (
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
          {fnsList.length > 0 && (
            <View style={{ gap: 4 }}>
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
                ИФНС
              </Text>
              <View style={{ gap: 3 }}>
                {visibleFns.map((g) => (
                  <Text key={g.fnsId} style={{ color: colors.text, fontSize: 13 }} numberOfLines={1}>
                    {g.fnsName}
                  </Text>
                ))}
                {fnsOverflow > 0 && (
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                    +{fnsOverflow} ещё
                  </Text>
                )}
              </View>
            </View>
          )}

          {uniqueServices.length > 2 && (
            <View style={{ gap: 4 }}>
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Услуги
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                {allVisibleServices.map((s) => (
                  <View
                    key={s.id}
                    style={{
                      backgroundColor: colors.accentSoft,
                      borderRadius: 99,
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                    }}
                  >
                    <Text style={{ color: colors.primary, fontSize: 12 }}>{s.name}</Text>
                  </View>
                ))}
                {allServiceOverflow > 0 && (
                  <Text style={{ color: colors.textMuted, fontSize: 12, alignSelf: "center" }}>
                    +{allServiceOverflow} ещё
                  </Text>
                )}
              </View>
            </View>
          )}
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
  onRefresh,
  onLoadMore,
  onPress,
  onBookmark,
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
          <DesktopSpecialistRow item={item} onPress={onPress} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
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
          />
        </View>
      )}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
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
