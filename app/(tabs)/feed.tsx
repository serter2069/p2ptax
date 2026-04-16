import React, { useEffect, useState } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '../../constants/Colors';
import { requests as requestsApi, ifns, categories as categoriesApi } from '../../lib/api/endpoints';
import { WriteConfirmModal, WriteConfirmModalRequest } from '../../components/WriteConfirmModal';
import { Header } from '../../components/Header';
import {
  Button,
  Card,
  Container,
  EmptyState,
  Heading,
  Screen,
  Text,
} from '../../components/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface FeedRequest {
  id: string;
  title: string;
  description?: string | null;
  city?: string | null;
  ifnsName?: string | null;
  serviceType?: string | null;
  category?: string | null;
  createdAt: string;
  client?: { firstName?: string | null; lastName?: string | null; createdAt?: string | null } | null;
  _count?: { threads?: number };
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function pluralSpecialists(n: number): string {
  if (n === 0) return '0 специалистов написали';
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} специалист написал`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} специалиста написали`;
  return `${n} специалистов написали`;
}

// ---------------------------------------------------------------------------
// Simple single-select dropdown
// ---------------------------------------------------------------------------
function SelectDropdown({
  icon, placeholder, value, options, onChange,
}: {
  icon: 'map-pin' | 'briefcase';
  placeholder: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: Spacing.sm }}>
      <Pressable onPress={() => setOpen(!open)}>
        <View
          style={{
            height: 44,
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.sm,
            borderRadius: BorderRadius.input,
            borderWidth: 1,
            borderColor: open ? Colors.brandPrimary : Colors.borderLight,
            backgroundColor: Colors.white,
            paddingHorizontal: Spacing.md,
          }}
        >
          <Feather name={icon} size={16} color={Colors.textMuted} />
          <Text
            variant="caption"
            style={{ flex: 1, color: value ? Colors.textPrimary : Colors.textMuted }}
            numberOfLines={1}
          >
            {value || placeholder}
          </Text>
          <Feather name={open ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textMuted} />
        </View>
      </Pressable>
      {open && (
        <View
          style={{
            overflow: 'hidden',
            borderRadius: BorderRadius.input,
            borderWidth: 1,
            borderColor: Colors.borderLight,
            backgroundColor: Colors.white,
            maxHeight: 240,
          }}
        >
          <ScrollView>
            <Pressable
              style={{ borderBottomWidth: 1, borderBottomColor: Colors.bgSecondary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2 }}
              onPress={() => { onChange(''); setOpen(false); }}
            >
              <Text variant="caption" style={{ color: Colors.textMuted }}>Все</Text>
            </Pressable>
            {options.map((o) => (
              <Pressable
                key={o}
                style={{ borderBottomWidth: 1, borderBottomColor: Colors.bgSecondary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2 }}
                onPress={() => { onChange(o); setOpen(false); }}
              >
                <Text
                  variant="caption"
                  weight={value === o ? 'semibold' : undefined}
                  style={{ color: value === o ? Colors.brandPrimary : Colors.textPrimary }}
                >
                  {o}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Request Card
// ---------------------------------------------------------------------------
function RequestFeedCard({ title, description, city, fns, service, date, author, messageCount, onWrite }: {
  title: string; description: string; city: string; fns: string; service: string; date: string; author: string; messageCount: number;
  onWrite: () => void;
}) {
  return (
    <Card variant="elevated">
      <View style={{ gap: Spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text variant="body" weight="semibold" numberOfLines={1}>{title}</Text>
          </View>
          <Feather name="chevron-right" size={16} color={Colors.textMuted} />
        </View>
        <Text variant="caption" style={{ color: Colors.textSecondary, lineHeight: 20 }} numberOfLines={2}>{description}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, borderRadius: BorderRadius.full, backgroundColor: Colors.bgSecondary, paddingHorizontal: Spacing.sm, paddingVertical: 2 }}>
            <Feather name="map-pin" size={11} color={Colors.brandPrimary} />
            <Text variant="caption" weight="medium" style={{ color: Colors.brandPrimary }}>{city}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, borderRadius: BorderRadius.full, backgroundColor: Colors.bgSecondary, paddingHorizontal: Spacing.sm, paddingVertical: 2 }}>
            <Feather name="home" size={11} color={Colors.brandPrimary} />
            <Text variant="caption" weight="medium" style={{ color: Colors.brandPrimary }}>{fns}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, borderRadius: BorderRadius.full, backgroundColor: Colors.bgSecondary, paddingHorizontal: Spacing.sm, paddingVertical: 2 }}>
            <Feather name="briefcase" size={11} color={Colors.brandPrimary} />
            <Text variant="caption" weight="medium" style={{ color: Colors.brandPrimary }}>{service}</Text>
          </View>
        </View>
        {/* Author + date */}
        <View style={{ marginTop: Spacing.xxs, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: Spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <View style={{ width: 28, height: 28, borderRadius: BorderRadius.full, backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="user" size={14} color={Colors.textMuted} />
            </View>
            <Text variant="caption" weight="medium">{author}</Text>
          </View>
          <Text variant="caption">{date}</Text>
        </View>
        {/* Message count + Write CTA */}
        <View style={{ marginTop: Spacing.xxs, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
            <Feather name="message-circle" size={12} color={messageCount > 0 ? Colors.brandPrimary : Colors.textMuted} />
            <Text
              variant="caption"
              weight={messageCount > 0 ? 'semibold' : undefined}
              style={{ color: messageCount > 0 ? Colors.brandPrimary : Colors.textMuted }}
            >
              {pluralSpecialists(messageCount)}
            </Text>
          </View>
          <Button
            variant="primary"
            size="md"
            icon={<Feather name="send" size={13} color={Colors.white} />}
            onPress={onWrite}
          >
            Написать
          </Button>
        </View>
      </View>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Feed State
// ---------------------------------------------------------------------------
function FeedState() {
  const router = useRouter();
  const [filterCity, setFilterCity] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [writeTarget, setWriteTarget] = useState<WriteConfirmModalRequest | null>(null);
  const [feedData, setFeedData] = useState<FeedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

  // Load cities for filter
  useEffect(() => {
    ifns.getCities()
      .then((res) => {
        const data = (res as any).data ?? res;
        const list: string[] = Array.isArray(data) ? data.map((c: any) => c.name ?? c) : [];
        setCities(list);
      })
      .catch(() => { /* non-critical */ });
  }, []);

  // Load service categories
  useEffect(() => {
    categoriesApi.list()
      .then((res) => {
        const data = (res as any).data ?? res;
        const list: string[] = Array.isArray(data) ? data.map((c: any) => c.name ?? c) : [];
        setCategoryOptions(list);
      })
      .catch(() => { /* non-critical */ });
  }, []);

  // Load feed
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const params: Record<string, unknown> = {};
    if (filterCity) params.city = filterCity;
    if (filterCategory) params.category = filterCategory;
    requestsApi.getPublicFeed(params)
      .then((res) => {
        if (mounted) {
          const data = (res as any).data ?? res;
          setFeedData(Array.isArray(data) ? data : (data.items ?? data.requests ?? []));
          setError(null);
        }
      })
      .catch((e) => { if (mounted) setError(e.message ?? 'Ошибка'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [filterCity, filterCategory]);

  const hasFilters = !!(filterCity || filterCategory);

  return (
    <Screen bg={Colors.white}>
      <Header variant="auth" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: Spacing.lg }}>
        <Container>
          <View style={{ gap: Spacing.lg }}>
            {/* Page title */}
            <View>
              <Heading level={3}>Заявки</Heading>
              {!loading && <Text variant="caption" style={{ marginTop: 2 }}>{feedData.length} активных заявок</Text>}
            </View>

            {/* Filters */}
            <View
              style={{
                gap: Spacing.md,
                borderRadius: BorderRadius.card,
                borderWidth: 1,
                borderColor: Colors.borderLight,
                backgroundColor: Colors.bgSecondary,
                padding: Spacing.lg,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <Feather name="sliders" size={14} color={Colors.brandPrimary} />
                <Text variant="body" weight="semibold">Фильтры</Text>
                {hasFilters && (
                  <Pressable
                    onPress={() => { setFilterCity(''); setFilterCategory(''); }}
                    style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}
                  >
                    <Feather name="x" size={14} color={Colors.textMuted} />
                    <Text variant="caption">Сбросить</Text>
                  </Pressable>
                )}
              </View>

              <SelectDropdown
                icon="map-pin"
                placeholder="Город"
                value={filterCity}
                options={cities}
                onChange={setFilterCity}
              />
              <SelectDropdown
                icon="briefcase"
                placeholder="Услуга"
                value={filterCategory}
                options={categoryOptions}
                onChange={setFilterCategory}
              />
            </View>

            {/* Request cards */}
            {loading ? (
              <View style={{ alignItems: 'center', paddingVertical: Spacing['3xl'] }}>
                <ActivityIndicator color={Colors.brandPrimary} />
              </View>
            ) : error ? (
              <EmptyState
                icon={<Feather name="alert-circle" size={28} color={Colors.statusError} />}
                title="Ошибка"
                description={error}
              />
            ) : feedData.length === 0 ? (
              <EmptyState
                icon={<Feather name="inbox" size={32} color={Colors.textMuted} />}
                title="Нет заявок"
                description="Попробуйте изменить параметры фильтров"
              />
            ) : (
              <View style={{ gap: Spacing.md }}>
                {feedData.map((r) => {
                  const authorName = r.client
                    ? [r.client.firstName, r.client.lastName].filter(Boolean).join(' ') || '—'
                    : '—';
                  const serviceLabel = r.serviceType ?? r.category ?? '—';
                  return (
                    <RequestFeedCard
                      key={r.id}
                      title={r.title}
                      description={r.description ?? ''}
                      city={r.city ?? '—'}
                      fns={r.ifnsName ?? '—'}
                      service={serviceLabel}
                      date={r.createdAt ? new Date(r.createdAt).toLocaleDateString('ru-RU') : '—'}
                      author={authorName}
                      messageCount={r._count?.threads ?? 0}
                      onWrite={() => setWriteTarget({
                        id: String(r.id),
                        title: r.title,
                        description: r.description ?? '',
                        city: r.city ?? '',
                        service: serviceLabel !== '—' ? serviceLabel : '',
                      })}
                    />
                  );
                })}
              </View>
            )}
          </View>
        </Container>

        <WriteConfirmModal
          visible={writeTarget !== null}
          request={writeTarget}
          onClose={() => setWriteTarget(null)}
          onSuccess={(threadId) => {
            setWriteTarget(null);
            router.push(`/chat/${threadId}` as any);
          }}
        />
      </ScrollView>
    </Screen>
  );
}

export default function FeedScreen() {
  return <FeedState />;
}
