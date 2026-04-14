import React, { useState } from 'react';
import { View, Text, TextInput, Image, Pressable, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_USERS } from '../../../constants/protoMockData';

function navigate(pageId: string) {
  if (Platform.OS === 'web') {
    window.open(`/proto/states/${pageId}`, '_self');
  }
}

function SkeletonBlock({ width, height, radius }: { width: string | number; height: number; radius?: number }) {
  return (
    <View style={[s.skeleton, { width: width as any, height, borderRadius: radius || BorderRadius.md }]} />
  );
}

function UserRow({ name, email, role, city, onPress }: { name: string; email: string; role: string; city: string; onPress?: () => void }) {
  return (
    <Pressable style={s.userRow} onPress={onPress}>
      <View style={s.avatarCircle}>
        <Text style={s.avatarText}>{name.split(' ').map(w => w[0]).join('')}</Text>
      </View>
      <View style={s.userInfo}>
        <Text style={s.userName}>{name}</Text>
        <View style={s.userEmailRow}>
          <Feather name="mail" size={11} color={Colors.textMuted} />
          <Text style={s.userEmail}>{email}</Text>
        </View>
      </View>
      <View style={s.userMeta}>
        <View style={[s.roleBadge, { backgroundColor: role === 'SPECIALIST' ? Colors.statusBg.success : Colors.bgSecondary }]}>
          <Feather name={role === 'SPECIALIST' ? 'briefcase' : 'user'} size={11} color={role === 'SPECIALIST' ? Colors.statusSuccess : Colors.brandPrimary} />
          <Text style={[s.roleText, { color: role === 'SPECIALIST' ? Colors.statusSuccess : Colors.brandPrimary }]}>
            {role === 'SPECIALIST' ? 'Специалист' : 'Клиент'}
          </Text>
        </View>
        <View style={s.cityRow}>
          <Feather name="map-pin" size={11} color={Colors.textMuted} />
          <Text style={s.userCity}>{city}</Text>
        </View>
      </View>
      <Feather name="chevron-right" size={16} color={Colors.textMuted} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// STATE: POPULATED (list with search/filter)
// ---------------------------------------------------------------------------

function UserListPopulated() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'CLIENT' | 'SPECIALIST'>('all');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const filtered = MOCK_USERS.filter((u) => {
    if (filter !== 'all' && u.role !== filter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <View style={s.container}>
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>Пользователи</Text>
        <Text style={s.pageCount}>1 247 зарегистрированных</Text>
      </View>

      <View style={s.searchWrap}>
        <Feather name="search" size={16} color={Colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Поиск по имени, email..."
          placeholderTextColor={Colors.textMuted}
          style={s.searchInput}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Feather name="x" size={16} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      <View style={s.filters}>
        <Pressable style={[s.filterChip, filter === 'all' ? s.filterActive : null]} onPress={() => setFilter('all')}>
          <Text style={[s.filterText, filter === 'all' ? s.filterActiveText : null]}>Все (1 247)</Text>
        </Pressable>
        <Pressable style={[s.filterChip, filter === 'CLIENT' ? s.filterActive : null]} onPress={() => setFilter('CLIENT')}>
          <Text style={[s.filterText, filter === 'CLIENT' ? s.filterActiveText : null]}>Клиенты (1 058)</Text>
        </Pressable>
        <Pressable style={[s.filterChip, filter === 'SPECIALIST' ? s.filterActive : null]} onPress={() => setFilter('SPECIALIST')}>
          <Text style={[s.filterText, filter === 'SPECIALIST' ? s.filterActiveText : null]}>Специалисты (189)</Text>
        </Pressable>
      </View>

      <View style={s.userList}>
        {filtered.map((u) => (
          <UserRow key={u.id} name={u.name} email={u.email} role={u.role} city={u.city} onPress={() => setSelectedUser(u.id)} />
        ))}
      </View>

      {filtered.length > 0 && (
        <View style={s.paginationRow}>
          <Text style={s.paginationText}>Показано {filtered.length} из 1 247</Text>
          <Pressable style={s.paginationBtn}>
            <Text style={s.paginationBtnText}>Загрузить ещё</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: EMPTY (no search results)
// ---------------------------------------------------------------------------

function UserListEmpty() {
  return (
    <View style={s.container}>
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>Пользователи</Text>
        <Text style={s.pageCount}>1 247 зарегистрированных</Text>
      </View>

      <View style={s.searchWrap}>
        <Feather name="search" size={16} color={Colors.textMuted} />
        <TextInput
          value="несуществующий@email.com"
          editable={false}
          style={s.searchInput}
        />
      </View>

      <View style={s.emptyWrap}>
        <View style={s.emptyIconWrap}>
          <Feather name="search" size={36} color={Colors.textMuted} />
        </View>
        <Text style={s.emptyTitle}>Ничего не найдено</Text>
        <Text style={s.emptyText}>Попробуйте изменить поисковый запрос или фильтры</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: LOADING
// ---------------------------------------------------------------------------

function UserListLoading() {
  return (
    <View style={s.container}>
      <View style={s.pageHeader}>
        <SkeletonBlock width="50%" height={22} />
        <SkeletonBlock width="35%" height={14} />
      </View>
      <SkeletonBlock width="100%" height={44} radius={BorderRadius.card} />
      <View style={s.filters}>
        <SkeletonBlock width={80} height={32} radius={BorderRadius.full} />
        <SkeletonBlock width={100} height={32} radius={BorderRadius.full} />
        <SkeletonBlock width={110} height={32} radius={BorderRadius.full} />
      </View>
      {[0, 1, 2, 3, 4].map((i) => (
        <SkeletonBlock key={i} width="100%" height={64} radius={BorderRadius.card} />
      ))}
      <View style={{ alignItems: 'center', paddingTop: Spacing.md }}>
        <ActivityIndicator size="small" color={Colors.brandPrimary} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: USER_DETAIL (sidebar detail view)
// ---------------------------------------------------------------------------

function UserDetailView() {
  return (
    <View style={s.container}>
      <Pressable style={s.backRow}>
        <Feather name="arrow-left" size={16} color={Colors.brandPrimary} />
        <Text style={s.backText}>Назад к списку</Text>
      </Pressable>

      <View style={s.detailCard}>
        <View style={s.detailHeader}>
          <View style={s.detailAvatarLg}>
            <Text style={s.detailAvatarText}>АП</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.detailName}>Алексей Петров</Text>
            <Text style={s.detailEmail}>apetrov@yandex.ru</Text>
          </View>
          <View style={[s.roleBadge, { backgroundColor: Colors.statusBg.success }]}>
            <Feather name="briefcase" size={11} color={Colors.statusSuccess} />
            <Text style={[s.roleText, { color: Colors.statusSuccess }]}>Специалист</Text>
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.detailGrid}>
          <View style={s.detailItem}>
            <Text style={s.detailLabel}>Город</Text>
            <Text style={s.detailValue}>Санкт-Петербург</Text>
          </View>
          <View style={s.detailItem}>
            <Text style={s.detailLabel}>Регистрация</Text>
            <Text style={s.detailValue}>15.01.2026</Text>
          </View>
          <View style={s.detailItem}>
            <Text style={s.detailLabel}>Заявок выполнено</Text>
            <Text style={s.detailValue}>215</Text>
          </View>
          <View style={s.detailItem}>
            <Text style={s.detailLabel}>Рейтинг</Text>
            <View style={s.ratingRow}>
              <Feather name="star" size={14} color={Colors.statusWarning} />
              <Text style={s.detailValue}>4.8 (42 отзыва)</Text>
            </View>
          </View>
          <View style={s.detailItem}>
            <Text style={s.detailLabel}>Статус</Text>
            <View style={[s.statusBadge, { backgroundColor: Colors.statusBg.success }]}>
              <Text style={[s.statusBadgeText, { color: Colors.statusSuccess }]}>Активен</Text>
            </View>
          </View>
          <View style={s.detailItem}>
            <Text style={s.detailLabel}>Верификация</Text>
            <View style={[s.statusBadge, { backgroundColor: Colors.statusBg.success }]}>
              <Feather name="check" size={12} color={Colors.statusSuccess} />
              <Text style={[s.statusBadgeText, { color: Colors.statusSuccess }]}>Подтверждён</Text>
            </View>
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.actionRow}>
          <Pressable style={s.viewProfileBtn} onPress={() => navigate('specialist-profile-public')}>
            <Feather name="external-link" size={14} color={Colors.brandPrimary} />
            <Text style={s.viewProfileText}>Открыть профиль</Text>
          </Pressable>
          <Pressable style={s.blockBtn}>
            <Feather name="slash" size={14} color={Colors.statusError} />
            <Text style={s.blockBtnText}>Заблокировать</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function AdminUsersStates() {
  return (
    <>
      <StateSection title="POPULATED">
        <UserListPopulated />
      </StateSection>
      <StateSection title="EMPTY">
        <UserListEmpty />
      </StateSection>
      <StateSection title="LOADING">
        <UserListLoading />
      </StateSection>
      <StateSection title="USER_DETAIL">
        <UserDetailView />
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.md },

  pageHeader: { gap: Spacing.xs },
  pageTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  pageCount: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    height: 44, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.input, paddingHorizontal: Spacing.md, ...Shadows.sm,
  },
  searchInput: {
    flex: 1, fontSize: Typography.fontSize.base, color: Colors.textPrimary, paddingVertical: 0,
  },

  filters: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  filterChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  filterText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  filterActiveText: { fontSize: Typography.fontSize.sm, color: Colors.white, fontWeight: Typography.fontWeight.semibold },

  userList: { gap: Spacing.sm },
  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card,
    borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgSurface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  avatarText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },
  userInfo: { flex: 1 },
  userName: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary },
  userEmailRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  userEmail: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  userMeta: { alignItems: 'flex-end', gap: 4 },
  roleBadge: {
    paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  roleText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  userCity: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },

  paginationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.sm },
  paginationText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  paginationBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.btn, backgroundColor: Colors.bgSurface },
  paginationBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.brandPrimary },

  // Empty
  emptyWrap: { alignItems: 'center', padding: Spacing['3xl'], gap: Spacing.sm },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.bgSurface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  emptyText: { fontSize: Typography.fontSize.base, color: Colors.textMuted, textAlign: 'center' },

  // User detail
  backRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  backText: { fontSize: Typography.fontSize.sm, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.medium },

  detailCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.lg, ...Shadows.sm,
  },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  detailAvatarLg: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.bgSurface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  detailAvatarText: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },
  detailName: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  detailEmail: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, marginTop: 2 },

  divider: { height: 1, backgroundColor: Colors.border },

  detailGrid: { gap: Spacing.md },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  detailValue: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  statusBadgeText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },

  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  viewProfileBtn: {
    flex: 1, height: 40, borderRadius: BorderRadius.btn, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
    borderWidth: 1, borderColor: Colors.brandPrimary,
  },
  viewProfileText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.brandPrimary },
  blockBtn: {
    flex: 1, height: 40, borderRadius: BorderRadius.btn, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
    backgroundColor: Colors.statusBg.error,
  },
  blockBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.statusError },

  // Loading
  skeleton: { backgroundColor: Colors.bgSurface, opacity: 0.7 },
});
