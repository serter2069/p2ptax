import React, { useState } from 'react';
import { View, Text, TextInput, Image, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';
import { MOCK_USERS } from '../../../constants/protoMockData';

function UserRow({ name, email, role, city }: { name: string; email: string; role: string; city: string }) {
  return (
    <View style={s.userRow}>
      <Image source={{ uri: `https://picsum.photos/seed/${name.replace(/\s/g, '')}/40/40` }} style={{ width: 40, height: 40, borderRadius: 20 }} />
      <View style={s.userInfo}>
        <Text style={s.userName}>{name}</Text>
        <Text style={s.userEmail}>{email}</Text>
      </View>
      <View style={s.userMeta}>
        <View style={[s.roleBadge, { backgroundColor: role === 'SPECIALIST' ? Colors.statusBg.success : Colors.bgSecondary }]}>
          <Text style={[s.roleText, { color: role === 'SPECIALIST' ? Colors.statusSuccess : Colors.brandPrimary }]}>
            {role === 'SPECIALIST' ? 'Специалист' : 'Клиент'}
          </Text>
        </View>
        <Text style={s.userCity}>{city}</Text>
      </View>
    </View>
  );
}

function UserPopup() {
  return (
    <View style={s.overlay}>
      <View style={s.popup}>
        <View style={s.popupHeader}>
          <Text style={s.popupTitle}>Алексей Петров</Text>
          <Text style={s.popupClose}>{'x'}</Text>
        </View>
        <View style={s.popupBody}>
          <View style={s.popupRow}><Text style={s.popupLabel}>Email</Text><Text style={s.popupValue}>apetrov@yandex.ru</Text></View>
          <View style={s.popupRow}><Text style={s.popupLabel}>Роль</Text><Text style={s.popupValue}>Специалист</Text></View>
          <View style={s.popupRow}><Text style={s.popupLabel}>Город</Text><Text style={s.popupValue}>Санкт-Петербург</Text></View>
          <View style={s.popupRow}><Text style={s.popupLabel}>Регистрация</Text><Text style={s.popupValue}>10.01.2026</Text></View>
          <View style={s.popupRow}><Text style={s.popupLabel}>Заявки</Text><Text style={s.popupValue}>215 завершено</Text></View>
          <View style={s.popupRow}><Text style={s.popupLabel}>Рейтинг</Text><Text style={s.popupValue}>4.8 (42 отзыва)</Text></View>
          <View style={s.popupRow}><Text style={s.popupLabel}>Статус</Text><Text style={[s.popupValue, { color: Colors.statusSuccess }]}>Активен</Text></View>
        </View>
        <View style={s.popupActions}>
          <View style={s.popupBtn}><Text style={s.popupBtnText}>Заблокировать</Text></View>
          <View style={s.popupBtnDanger}><Text style={s.popupBtnDangerText}>Удалить</Text></View>
        </View>
      </View>
    </View>
  );
}

function UserListInteractive() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'CLIENT' | 'SPECIALIST'>('all');

  const filtered = MOCK_USERS.filter((u) => {
    if (filter !== 'all' && u.role !== filter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <View style={s.container}>
      <Text style={s.pageTitle}>Пользователи (1 247)</Text>
      <View style={s.searchWrap}>
        <Feather name="search" size={16} color={Colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Поиск по имени, email..."
          placeholderTextColor={Colors.textMuted}
          style={s.searchInput}
        />
      </View>
      <View style={s.filters}>
        <Pressable style={[s.filterChip, filter === 'all' ? s.filterActive : null]} onPress={() => setFilter('all')}>
          <Text style={[s.filterText, filter === 'all' ? s.filterActiveText : null]}>Все</Text>
        </Pressable>
        <Pressable style={[s.filterChip, filter === 'CLIENT' ? s.filterActive : null]} onPress={() => setFilter('CLIENT')}>
          <Text style={[s.filterText, filter === 'CLIENT' ? s.filterActiveText : null]}>Клиенты</Text>
        </Pressable>
        <Pressable style={[s.filterChip, filter === 'SPECIALIST' ? s.filterActive : null]} onPress={() => setFilter('SPECIALIST')}>
          <Text style={[s.filterText, filter === 'SPECIALIST' ? s.filterActiveText : null]}>Специалисты</Text>
        </Pressable>
      </View>
      {filtered.map((u) => (
        <UserRow key={u.id} name={u.name} email={u.email} role={u.role} city={u.city} />
      ))}
      {filtered.length === 0 && (
        <View style={s.emptyWrap}>
          <Text style={s.emptyTitle}>Ничего не найдено</Text>
          <Text style={s.emptyText}>Попробуйте изменить фильтры</Text>
        </View>
      )}
    </View>
  );
}

export function AdminUsersStates() {
  return (
    <>
      <StateSection title="LIST" maxWidth={800}>
        <UserListInteractive />
      </StateSection>
      <StateSection title="DETAIL_POPUP" maxWidth={800}>
        <View style={[s.container, { minHeight: 500 }]}>
          <Text style={s.pageTitle}>Пользователи</Text>
          {MOCK_USERS.slice(0, 3).map((u) => (
            <UserRow key={u.id} name={u.name} email={u.email} role={u.role} city={u.city} />
          ))}
          <UserPopup />
        </View>
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.md, position: 'relative' },
  pageTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    height: 40, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md,
  },
  searchInput: {
    flex: 1, fontSize: Typography.fontSize.sm, color: Colors.textPrimary, paddingVertical: 0,
  },
  filters: { flexDirection: 'row', gap: Spacing.sm },
  filterChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  filterText: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  filterActiveText: { fontSize: Typography.fontSize.xs, color: Colors.white, fontWeight: Typography.fontWeight.semibold },
  emptyWrap: { alignItems: 'center', padding: Spacing['3xl'], gap: Spacing.sm },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  emptyText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.bgSecondary,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },
  userInfo: { flex: 1 },
  userName: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary },
  userEmail: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  userMeta: { alignItems: 'flex-end', gap: 2 },
  roleBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 1, borderRadius: BorderRadius.full },
  roleText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },
  userCity: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 10, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.lg,
  },
  popup: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: Spacing.lg,
    width: '100%', maxWidth: 380, gap: Spacing.md,
  },
  popupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  popupTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  popupClose: { fontSize: Typography.fontSize.lg, color: Colors.textMuted, padding: Spacing.xs },
  popupBody: { gap: Spacing.sm },
  popupRow: { flexDirection: 'row', justifyContent: 'space-between' },
  popupLabel: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  popupValue: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary },
  popupActions: { gap: Spacing.sm, marginTop: Spacing.sm },
  popupBtn: {
    height: 40, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  popupBtnText: { fontSize: Typography.fontSize.sm, color: Colors.textPrimary },
  popupBtnDanger: {
    height: 40, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.statusBg.error,
  },
  popupBtnDangerText: { fontSize: Typography.fontSize.sm, color: Colors.statusError, fontWeight: Typography.fontWeight.medium },
});
