import React, { useState } from 'react';
import { View, Text, TextInput, Image, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_USERS } from '../../../constants/protoMockData';

function UserRow({ name, email, role, city }: { name: string; email: string; role: string; city: string }) {
  return (
    <Pressable style={s.userRow}>
      <Image source={{ uri: `https://picsum.photos/seed/${name.replace(/\s/g, '')}/40/40` }} style={{ width: 40, height: 40, borderRadius: 20 }} />
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
          <Feather name="search" size={36} color={Colors.textMuted} />
          <Text style={s.emptyTitle}>Ничего не найдено</Text>
          <Text style={s.emptyText}>Попробуйте изменить фильтры</Text>
        </View>
      )}
    </View>
  );
}

export function AdminUsersStates() {
  return (
    <StateSection title="LIST">
      <UserListInteractive />
    </StateSection>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.md },
  pageTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    height: 44, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.card, paddingHorizontal: Spacing.md, ...Shadows.sm,
  },
  searchInput: {
    flex: 1, fontSize: Typography.fontSize.base, color: Colors.textPrimary, paddingVertical: 0,
  },
  filters: { flexDirection: 'row', gap: Spacing.sm },
  filterChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  filterText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  filterActiveText: { fontSize: Typography.fontSize.sm, color: Colors.white, fontWeight: Typography.fontWeight.semibold },
  emptyWrap: { alignItems: 'center', padding: Spacing['3xl'], gap: Spacing.sm },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  emptyText: { fontSize: Typography.fontSize.base, color: Colors.textMuted, textAlign: 'center' },
  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card,
    borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
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
});
