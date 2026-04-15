import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { api } from '../../lib/api';
import { Colors } from '../../constants/Colors';
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
    <View className="flex-1 bg-bgPrimary">
      <Header title="Категории услуг" showBack />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.brandPrimary} />
        }
      >
        <View className="w-full max-w-lg px-5 gap-4">
          {/* Add new category form */}
          <View className="bg-bgCard rounded-xl p-4 border border-border gap-2 shadow-sm">
            <Text className="text-sm font-semibold text-textMuted uppercase tracking-wider mt-3 mb-2">Добавить категорию</Text>
            <TextInput
              className="border border-border rounded-lg py-2 px-3 text-base text-textPrimary bg-bgPrimary"
              style={{ outlineStyle: 'none' } as any}
              value={newName}
              onChangeText={setNewName}
              placeholder="Название"
              placeholderTextColor={Colors.textMuted}
            />
            <TextInput
              className="border border-border rounded-lg py-2 px-3 text-base text-textPrimary bg-bgPrimary"
              style={{ outlineStyle: 'none' } as any}
              value={newIcon}
              onChangeText={setNewIcon}
              placeholder="Иконка (emoji, необязательно)"
              placeholderTextColor={Colors.textMuted}
            />
            <TextInput
              className="border border-border rounded-lg py-2 px-3 text-base text-textPrimary bg-bgPrimary"
              style={{ outlineStyle: 'none' } as any}
              value={newSortOrder}
              onChangeText={setNewSortOrder}
              placeholder="Порядок сортировки (число, необязательно)"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
            />
            <Pressable
              className="rounded-lg py-3 items-center mt-1"
              style={{
                backgroundColor: Colors.brandPrimary,
                opacity: (saving || !newName.trim()) ? 0.5 : 1,
              }}
              onPress={handleCreate}
              disabled={saving || !newName.trim()}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text className="text-base font-semibold text-white">Добавить</Text>
              )}
            </Pressable>
          </View>

          {/* Categories list */}
          <Text className="text-sm font-semibold text-textMuted uppercase tracking-wider mt-3 mb-2">Список категорий</Text>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.brandPrimary} style={{ marginVertical: 24 }} />
          ) : error ? (
            <Text className="text-sm text-statusError text-center py-4">{error}</Text>
          ) : categories.length === 0 ? (
            <Text className="text-sm text-textMuted text-center py-4">Нет категорий</Text>
          ) : (
            <View className="gap-2">
              {categories.map(cat => (
                <View key={cat.id} className="flex-row items-center bg-bgCard rounded-xl p-3 border border-border shadow-sm">
                  <View className="flex-1 flex-row items-center gap-2">
                    <Text className="text-[20px] w-7 text-center">{cat.icon || '•'}</Text>
                    <View className="flex-1">
                      <Text className={`text-base font-medium ${cat.isActive ? 'text-textPrimary' : 'text-textMuted'}`}>
                        {cat.name}
                      </Text>
                      <Text className="text-xs text-textMuted mt-0.5">
                        #{cat.sortOrder}{' '}
                        {cat.isActive ? (
                          <Text style={{ color: '#1A7848' }}>активна</Text>
                        ) : (
                          <Text className="text-textMuted">скрыта</Text>
                        )}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row gap-1">
                    <Pressable
                      className="py-1 px-2 rounded border border-brandPrimary"
                      onPress={() => handleToggleActive(cat)}
                    >
                      <Text className="text-xs text-brandPrimary font-medium">
                        {cat.isActive ? 'Скрыть' : 'Показать'}
                      </Text>
                    </Pressable>
                    <Pressable
                      className="py-1 px-2 rounded border border-statusError min-w-[60px] items-center"
                      onPress={() => handleDelete(cat)}
                      disabled={deletingId === cat.id}
                    >
                      {deletingId === cat.id ? (
                        <ActivityIndicator size="small" color={Colors.statusError} />
                      ) : (
                        <Text className="text-xs text-statusError font-medium">Удалить</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
