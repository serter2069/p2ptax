import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import axios from 'axios';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Header } from '../../components/Header';
import { specialists as specialistsApi, threads as threadsApi } from '../../lib/api/endpoints';
import { BorderRadius, Colors, Spacing } from '../../constants/Colors';
import { useAuth } from '../../lib/auth/AuthContext';
import {
  Button,
  Card,
  Container,
  Heading,
  Input,
  Modal,
  Rating,
  Screen,
  Text,
} from '../../components/ui';

interface FnsService {
  fns: string;
  services: string[];
}

interface SpecialistActivity {
  responseCount?: number;
  avgRating?: number | null;
  reviewCount?: number | null;
}

interface SpecialistData {
  userId?: string | null;
  nick: string;
  displayName?: string | null;
  headline?: string | null;
  bio?: string | null;
  experience?: number | null;
  hourlyRate?: number | null;
  cities?: string[] | null;
  services?: string[] | null;
  fnsOffices?: string[] | null;
  fnsGroupedByCity?: Array<{ city: string; fns: string[] }> | null;
  memberSince?: number | null;
  createdAt?: string | null;
  activity?: SpecialistActivity | null;
  rating?: number | null;
  reviewCount?: number | null;
  reviews?: Array<{ author?: string; date?: string; rating: number; text?: string }> | null;
  avatarUrl?: string | null;
  [key: string]: unknown;
}

function ReviewItem({ author, rating, text, date }: { author: string; rating: number; text: string; date: string }) {
  return (
    <View style={{
      gap: Spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: Colors.bgSecondary,
      paddingVertical: Spacing.md,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
          <Feather name="user" size={14} color={Colors.textMuted} />
          <Text weight="semibold">{author}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
          <Feather name="calendar" size={12} color={Colors.textMuted} />
          <Text variant="caption">{date}</Text>
        </View>
      </View>
      <Rating value={rating} size="sm" showNumeric={false} />
      <Text style={{ lineHeight: 24 }}>{text}</Text>
    </View>
  );
}

function FnsModal({ visible, onClose, fnsServices }: { visible: boolean; onClose: () => void; fnsServices: FnsService[] }) {
  return (
    <Modal visible={visible} onClose={onClose} title="ФНС и услуги" maxWidth={520}>
      {fnsServices.map((group, idx) => (
        <View
          key={group.fns}
          style={{
            gap: Spacing.sm,
            paddingVertical: Spacing.md,
            borderTopWidth: idx > 0 ? 1 : 0,
            borderTopColor: Colors.borderLight,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <Feather name="home" size={14} color={Colors.textMuted} />
            <Text weight="semibold">{group.fns}</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingLeft: Spacing['2xl'] }}>
            {group.services.map((svc) => (
              <View
                key={svc}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  borderRadius: BorderRadius.full,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: 6,
                  backgroundColor: Colors.statusBg.info,
                }}
              >
                <Feather name="check" size={12} color={Colors.brandPrimary} />
                <Text variant="caption" style={{ color: Colors.brandPrimary }}>{svc}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </Modal>
  );
}

function WriteSpecialistConfirm({
  visible,
  displayName,
  onClose,
  onConfirm,
  submitting,
  errorText,
}: {
  visible: boolean;
  displayName: string;
  onClose: () => void;
  onConfirm: () => void;
  submitting: boolean;
  errorText: string | null;
}) {
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Написать специалисту"
      maxWidth={420}
      primaryAction={{
        label: 'Написать',
        onPress: onConfirm,
        loading: submitting,
        disabled: submitting,
      }}
      secondaryAction={{
        label: 'Отмена',
        onPress: onClose,
        disabled: submitting,
      }}
    >
      <Text style={{ lineHeight: 21 }}>
        Открыть чат с <Text weight="semibold">{displayName}</Text>?
        Ваше первое сообщение будет отправлено, и специалист получит уведомление.
      </Text>
      {errorText ? (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.sm,
          padding: Spacing.md,
          borderRadius: BorderRadius.md,
          backgroundColor: Colors.statusBg.error,
        }}>
          <Feather name="alert-circle" size={14} color={Colors.statusError} />
          <Text variant="caption" style={{ flex: 1, color: Colors.statusError }}>{errorText}</Text>
        </View>
      ) : null}
    </Modal>
  );
}

function ProfileScreen({ spec }: { spec: SpecialistData }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [message, setMessage] = useState('');
  const [fnsModalVisible, setFnsModalVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  // Backend returns fnsGroupedByCity = Array<{ city; fns: string[] }>. Map to flat FnsService list
  // using the specialist's service names (same for all offices — no per-FNS mapping in current API).
  const allServices = spec.services ?? [];
  const fnsServices: FnsService[] = (spec.fnsOffices ?? []).map((fns) => ({ fns, services: allServices }));
  const displayName = spec.displayName || spec.nick || '—';
  const city = spec.cities?.[0] ?? null;
  const rating = spec.rating ?? spec.activity?.avgRating ?? null;
  const reviewCount = spec.reviewCount ?? spec.activity?.reviewCount ?? 0;
  const about = spec.bio ?? spec.headline ?? null;
  const memberYear = spec.memberSince
    ?? (spec.createdAt ? new Date(spec.createdAt).getFullYear() : null);

  const canSend = !!message.trim();

  const handleSendPress = () => {
    if (!canSend) return;
    if (!isAuthenticated) {
      router.push({ pathname: '/(auth)/email', params: { role: 'CLIENT' } } as any);
      return;
    }
    setErrorText(null);
    setConfirmVisible(true);
  };

  const handleConfirm = async () => {
    if (!spec.userId) {
      setErrorText('Не удалось определить специалиста. Попробуйте позже.');
      return;
    }
    setSubmitting(true);
    setErrorText(null);
    try {
      const res = await threadsApi.startDirect({ otherUserId: spec.userId });
      const data = (res as any).data ?? res;
      const threadId: string | undefined = data?.threadId ?? data?.thread_id;
      if (!threadId) throw new Error('Сервер не вернул идентификатор чата');
      const firstMessage = message.trim();
      if (firstMessage) {
        try {
          await threadsApi.sendMessage(threadId, { content: firstMessage });
        } catch {
          // fall through — navigate anyway, user can retry sending in chat
        }
      }
      setConfirmVisible(false);
      setMessage('');
      router.push(`/chat/${threadId}` as any);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 429) {
          setErrorText('Лимит обращений в день исчерпан, попробуйте завтра');
        } else if (status === 409) {
          setErrorText('Нельзя открыть чат с этим пользователем');
        } else {
          const raw = (err.response?.data as any)?.message;
          setErrorText(Array.isArray(raw) ? raw.join(', ') : (raw || 'Не удалось открыть чат'));
        }
      } else {
        setErrorText('Не удалось открыть чат');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.white }}>
      <Container>
        <View style={{ gap: Spacing.lg, paddingVertical: Spacing.lg }}>
          {/* Profile card */}
          <Card variant="outlined" padding="md">
            <View style={{ gap: Spacing.md }}>
              <View style={{ flexDirection: 'row', gap: Spacing.lg }}>
                <View style={{
                  width: 80,
                  height: 80,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 9999,
                  backgroundColor: Colors.bgSecondary,
                }}>
                  <Feather name="user" size={32} color={Colors.textMuted} />
                </View>
                <View style={{ flex: 1, gap: Spacing.xs }}>
                  <Heading level={3}>{displayName}</Heading>
                  {spec.headline ? (
                    <Text variant="caption">{spec.headline}</Text>
                  ) : null}
                  {city ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                      <Feather name="map-pin" size={14} color={Colors.textMuted} />
                      <Text variant="muted">{city}</Text>
                    </View>
                  ) : null}
                  {rating != null ? (
                    <Rating value={Number(rating)} reviewCount={reviewCount} size="md" />
                  ) : null}
                  {memberYear ? (
                    <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                      <Feather name="clock" size={13} color={Colors.textMuted} />
                      <Text variant="caption">На сайте с {memberYear} г.</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              {about ? <Text style={{ lineHeight: 24 }}>{about}</Text> : null}
            </View>
          </Card>

          {/* FNS preview (first 2 open) + "Подробнее" for rest */}
          {fnsServices.length > 0 ? (
            <Card variant="outlined" padding="md">
              <View style={{ gap: Spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <Feather name="briefcase" size={16} color={Colors.brandPrimary} />
                  <Heading level={4}>ФНС и услуги</Heading>
                </View>
                {fnsServices.slice(0, 2).map((group, idx) => (
                  <View
                    key={group.fns}
                    style={{
                      gap: Spacing.sm,
                      borderTopWidth: idx > 0 ? 1 : 0,
                      borderTopColor: Colors.borderLight,
                      paddingTop: idx > 0 ? Spacing.md : 0,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                      <Feather name="home" size={14} color={Colors.textMuted} />
                      <Text weight="medium">{group.fns}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingLeft: Spacing['2xl'] }}>
                      {group.services.map((svc) => (
                        <View
                          key={svc}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            borderRadius: BorderRadius.full,
                            paddingHorizontal: Spacing.md,
                            paddingVertical: 6,
                            backgroundColor: Colors.statusBg.info,
                          }}
                        >
                          <Feather name="check" size={12} color={Colors.brandPrimary} />
                          <Text variant="caption" style={{ color: Colors.brandPrimary }}>{svc}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
                {fnsServices.length > 2 ? (
                  <Button
                    variant="secondary"
                    fullWidth
                    onPress={() => setFnsModalVisible(true)}
                    icon={<Feather name="chevron-right" size={16} color={Colors.brandPrimary} />}
                  >
                    {`Все ФНС и услуги (${fnsServices.length})`}
                  </Button>
                ) : null}
              </View>
            </Card>
          ) : null}

          <FnsModal visible={fnsModalVisible} onClose={() => setFnsModalVisible(false)} fnsServices={fnsServices} />

          {/* Reviews */}
          {(spec.reviews ?? []).length > 0 ? (
            <View style={{ gap: Spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <Feather name="message-square" size={16} color={Colors.brandPrimary} />
                <Heading level={4}>Отзывы</Heading>
              </View>
              {(spec.reviews ?? []).map((r, i) => (
                <ReviewItem
                  key={i}
                  author={r.author ?? '—'}
                  rating={r.rating}
                  text={r.text ?? ''}
                  date={r.date ?? ''}
                />
              ))}
            </View>
          ) : null}

          {/* Message textarea */}
          <View style={{ gap: Spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <Feather name="edit-3" size={16} color={Colors.brandPrimary} />
              <Heading level={4}>Написать специалисту</Heading>
            </View>
            <Input
              value={message}
              onChangeText={setMessage}
              placeholder="Опишите вашу задачу или задайте вопрос..."
              multiline
              numberOfLines={4}
            />
            <Button
              fullWidth
              disabled={!canSend}
              onPress={handleSendPress}
              icon={<Feather name="send" size={18} color={Colors.white} />}
              accessibilityLabel="Написать специалисту"
            >
              Написать
            </Button>
          </View>
        </View>
      </Container>

      <WriteSpecialistConfirm
        visible={confirmVisible}
        displayName={displayName}
        onClose={() => { if (!submitting) { setConfirmVisible(false); setErrorText(null); } }}
        onConfirm={handleConfirm}
        submitting={submitting}
        errorText={errorText}
      />
    </ScrollView>
  );
}

export default function SpecialistProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ nick?: string | string[] }>();
  const rawNick = Array.isArray(params.nick) ? params.nick[0] : params.nick;
  const nick = rawNick ?? '';
  const [specData, setSpecData] = useState<SpecialistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nick) return;
    let mounted = true;
    specialistsApi.getSpecialist(nick)
      .then((res) => {
        if (mounted) setSpecData((res as any).data ?? res);
      })
      .catch((e) => { if (mounted) setError(e.message ?? 'Ошибка'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [nick]);

  return (
    <Screen bg={Colors.white}>
      <Header variant="back" backTitle="Специалист" onBack={() => router.back()} />
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.brandPrimary} />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['2xl'], gap: Spacing.md }}>
          <Feather name="alert-circle" size={28} color={Colors.statusError} />
          <Text align="center" style={{ color: Colors.statusError }}>{error}</Text>
        </View>
      ) : specData ? (
        <ProfileScreen spec={specData} />
      ) : null}
    </Screen>
  );
}
