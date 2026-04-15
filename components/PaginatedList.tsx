/**
 * FlatList wrapper with built-in infinite scroll, pull-to-refresh,
 * loading/error/empty states.
 *
 * Works with usePaginatedList hook — just spread the hook return:
 * ```tsx
 * const pagination = usePaginatedList<Item>(fetchFn);
 * <PaginatedList {...pagination} renderItem={renderItem} keyExtractor={(i) => i.id} />
 * ```
 */
import React from 'react';
import {
  FlatList,
  View,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  type FlatListProps,
  type ListRenderItem,
} from 'react-native';
import { Colors, Spacing } from '../constants/Colors';
import { EmptyState } from './EmptyState';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface PaginatedListProps<T> extends Omit<FlatListProps<T>, 'data' | 'renderItem'> {
  data: T[];
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;

  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;

  /** Custom empty state (replaces default) */
  emptyIcon?: React.ComponentProps<typeof EmptyState>['icon'];
  emptyTitle?: string;
  emptySubtitle?: string;

  /** Threshold for triggering loadMore (default 0.3) */
  endReachedThreshold?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function PaginatedList<T>({
  data,
  loading,
  loadingMore,
  refreshing,
  error,
  hasMore,
  loadMore,
  refresh,
  renderItem,
  keyExtractor,
  emptyIcon = 'file-tray-outline',
  emptyTitle = 'Nothing here yet',
  emptySubtitle,
  endReachedThreshold = 0.3,
  ...flatListProps
}: PaginatedListProps<T>) {
  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={Colors.brandPrimary}
        />
      }
      onEndReached={() => {
        if (hasMore && !loadingMore) loadMore();
      }}
      onEndReachedThreshold={endReachedThreshold}
      ListEmptyComponent={
        loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.brandPrimary} />
          </View>
        ) : error ? (
          <EmptyState
            icon="alert-circle-outline"
            title="Loading error"
            subtitle={error}
            ctaLabel="Retry"
            onCtaPress={refresh}
          />
        ) : (
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            subtitle={emptySubtitle}
          />
        )
      }
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.footer}>
            <ActivityIndicator size="small" color={Colors.brandPrimary} />
          </View>
        ) : null
      }
      {...flatListProps}
    />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  centered: {
    paddingTop: Spacing['4xl'],
    alignItems: 'center',
  },
  footer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
});
