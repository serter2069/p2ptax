import { View, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import SpecialistCard from "@/components/SpecialistCard";
import { colors } from "@/lib/theme";

interface SpecialistItem {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  services: { id: string; name: string }[];
  cities: { id: string; name: string }[];
  specialistFns?: {
    fnsId: string;
    fnsName: string;
    city: { id: string; name: string };
    services: { id: string; name: string }[];
  }[];
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
  onWrite: (id: string) => void;
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
  onWrite,
}: Props) {
  return (
    <FlatList
      key={`grid-${gridCols}`}
      data={specialists}
      keyExtractor={(item) => item.id}
      numColumns={gridCols}
      columnWrapperStyle={
        gridCols > 1
          ? { gap: 16, paddingHorizontal: isWide ? 32 : 16 }
          : undefined
      }
      contentContainerStyle={{
        paddingHorizontal: gridCols > 1 ? 0 : 16,
        paddingBottom: 48,
        paddingTop: 8,
        maxWidth: isWide ? 1200 : isDesktop ? 900 : undefined,
        alignSelf: isDesktop ? ("center" as const) : undefined,
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
            onWrite={onWrite}
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
