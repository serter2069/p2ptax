import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { api } from '../../lib/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Header } from '../../components/Header';

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('');
  const [newSortOrder, setNewSortOrder] = useState('');

  const fetchCategories = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const data = await api.get<ServiceCategory[]>('/categories/admin/all');
      setCategories(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load categories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleRefresh = () => { setRefreshing(true); fetchCategories(true); };

  const handleToggleActive = async (cat: ServiceCategory) => {
    try {
      await api.patch(`/categories/${cat.id}`, { isActive: !cat.isActive });
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, isActive: !c.isActive } : c));
    } catch (e: any) {
      Alert.alert('Ошибка', e?.message ?? 'Failed to update');
    }
  };

  const handleDelete = (cat: ServiceCategory) => {
    Alert.alert(
      'Удалить категорию',
      `Удалить "${cat.name}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(cat.id);
            try {
              await api.del(`/categories/${cat.id}`);
              setCategories(prev => prev.filter(c => c.id !== cat.id));
            } catch (e: any) {
              Alert.alert('Ошибка', e?.message ?? 'Failed to delete');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const sortOrder = newSortOrder.trim() ? parseInt(newSortOrder.trim(), 10) : 0;
      const created = await api.post<ServiceCategory>('/categories', {
        name: newName.trim(),
        icon: newIcon.trim() || undefined,
        sortOrder,
      });
      setCategories(prev => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder));
      setNewName('');
      setNewIcon('');
      setNewSortOrder('');
    } catch (e: any) {
      Alert.alert('Ошибка', e?.message ?? 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Категории услуг" showBack />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.brandPrimary} />
        }
      >
        <View style={styles.container}>
          {/* Add new category form */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Добавить категорию</Text>
            <TextInput
              style={[styles.input, { outlineStyle: 'none' } as any]}
              value={newName}
              onChangeText={setNewName}
              placeholder="Название"
              placeholderTextColor={Colors.textMuted}
            />
            <TextInput
              style={[styles.input, { outlineStyle: 'none' } as any]}
              value={newIcon}
              onChangeText={setNewIcon}
              placeholder="Иконка (emoji, необязательно)"
              placeholderTextColor={Colors.textMuted}
            />
            <TextInput
              style={[styles.input, { outlineStyle: 'none' } as any]}
              value={newSortOrder}
              onChangeText={setNewSortOrder}
              placeholder="Порядок сортировки (число, необязательно)"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={[styles.createBtn, (saving || !newName.trim()) && styles.createBtnDisabled]}
              onPress={handleCreate}
              disabled={saving || !newName.trim()}
              activeOpacity={0.75}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.createBtnText}>Добавить</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Categories list */}
          <Text style={styles.sectionTitle}>Список категорий</Text>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.brandPrimary} style={styles.loader} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : categories.length === 0 ? (
            <Text style={styles.emptyText}>Нет категорий</Text>
          ) : (
            <View style={styles.list}>
              {categories.map(cat => (
                <View key={cat.id} style={styles.catRow}>
                  <View style={styles.catInfo}>
                    <Text style={styles.catIcon}>{cat.icon || '•'}</Text>
                    <View style={styles.catTextBlock}>
                      <Text style={[styles.catName, !cat.isActive && styles.catNameInactive]}>
                        {cat.name}
                      </Text>
                      <Text style={styles.catMeta}>
                        #{cat.sortOrder}{' '}
                        {cat.isActive ? (
                          <Text style={styles.activeLabel}>активна</Text>
                        ) : (
                          <Text style={styles.inactiveLabel}>скрыта</Text>
                        )}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.catActions}>
                    <TouchableOpacity
                      style={styles.toggleBtn}
                      onPress={() => handleToggleActive(cat)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.toggleBtnText}>
                        {cat.isActive ? 'Скрыть' : 'Показать'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(cat)}
                      disabled={deletingId === cat.id}
                      activeOpacity={0.7}
                    >
                      {deletingId === cat.id ? (
                        <ActivityIndicator size="small" color={Colors.statusError} />
                      ) : (
                        <Text style={styles.deleteBtnText}>Удалить</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  container: {
    width: '100%',
    maxWidth: 430,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgPrimary,
  },
  createBtn: {
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  createBtnDisabled: {
    opacity: 0.5,
  },
  createBtnText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  loader: {
    marginVertical: Spacing['2xl'],
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.statusError,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  list: {
    gap: Spacing.sm,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  catInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  catIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  catTextBlock: {
    flex: 1,
  },
  catName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  catNameInactive: {
    color: Colors.textMuted,
  },
  catMeta: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  activeLabel: {
    color: '#1A7848',
  },
  inactiveLabel: {
    color: Colors.textMuted,
  },
  catActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  toggleBtn: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
  },
  toggleBtnText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  deleteBtn: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.statusError,
    minWidth: 60,
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.statusError,
    fontWeight: Typography.fontWeight.medium,
  },
});
