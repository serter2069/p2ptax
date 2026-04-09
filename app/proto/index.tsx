import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, useWindowDimensions } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
import { protoRegistry, PROTO_GROUPS, getPagesByGroup } from '../../constants/protoRegistry';
import { ProtoCard } from '../../components/proto/ProtoCard';

const GROUP_LABELS: Record<string, string> = {
  Auth: 'Авторизация',
  Onboarding: 'Онбординг',
  Dashboard: 'Кабинет клиента',
  Specialist: 'Специалист',
  Public: 'Публичные страницы',
  Admin: 'Администрирование',
};

export default function ProtoIndex() {
  const [search, setSearch] = useState('');
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && !isDesktop;

  const columns = isDesktop ? 3 : isTablet ? 2 : 1;
  const totalStates = protoRegistry.reduce((s, p) => s + p.stateCount, 0);

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return protoRegistry.filter(
      (p) => p.title.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.route.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>P2PTax — Прототипы</Text>
        <Text style={styles.subtitle}>
          {protoRegistry.length} страниц, {totalStates} состояний
        </Text>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Поиск по названию, роуту..."
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
        />
      </View>

      {filtered ? (
        <View style={styles.groupSection}>
          <Text style={styles.groupTitle}>Результаты поиска ({filtered.length})</Text>
          <View style={[styles.grid, { flexDirection: 'row', flexWrap: 'wrap' }]}>
            {filtered.map((page) => (
              <View key={page.id} style={{ width: columns === 1 ? '100%' : columns === 2 ? '50%' : '33.33%', padding: Spacing.xs }}>
                <ProtoCard page={page} />
              </View>
            ))}
          </View>
          {filtered.length === 0 && (
            <Text style={styles.emptyText}>Ничего не найдено</Text>
          )}
        </View>
      ) : (
        PROTO_GROUPS.map((group) => {
          const pages = getPagesByGroup(group);
          if (pages.length === 0) return null;
          return (
            <View key={group} style={styles.groupSection}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>{GROUP_LABELS[group] || group}</Text>
                <Text style={styles.groupCount}>{pages.length}</Text>
              </View>
              <View style={[styles.grid, { flexDirection: 'row', flexWrap: 'wrap' }]}>
                {pages.map((page) => (
                  <View key={page.id} style={{ width: columns === 1 ? '100%' : columns === 2 ? '50%' : '33.33%', padding: Spacing.xs }}>
                    <ProtoCard page={page} />
                  </View>
                ))}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  content: {
    padding: Spacing.lg,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 64,
  },
  header: {
    marginBottom: Spacing['2xl'],
    gap: Spacing.xs,
  },
  title: {
    fontSize: 30,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
  },
  searchWrap: {
    marginBottom: Spacing['2xl'],
  },
  searchInput: {
    height: 44,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  groupSection: {
    marginBottom: Spacing['3xl'],
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  groupTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  groupCount: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brandPrimary,
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  grid: {},
  emptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing['2xl'],
  },
});
