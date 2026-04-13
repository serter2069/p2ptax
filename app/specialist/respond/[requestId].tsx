import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { api, ApiError } from '../../../lib/api';
import { useAuth } from '../../../stores/authStore';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { Button } from '../../../components/Button';
import { Header } from '../../../components/Header';
import { EmptyState } from '../../../components/EmptyState';

interface RequestInfo {
  id: string;
  description: string;
  city: string;
  budget?: number | null;
  category?: string | null;
  status: string;
}

export default function SpecialistRespondScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [request, setRequest] = useState<RequestInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [comment, setComment] = useState('');
  const [price, setPrice] = useState('');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [alreadyResponded, setAlreadyResponded] = useState(false);

  // Redirect if not a specialist
  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/email' as any);
    } else if (user.role !== 'SPECIALIST') {
      router.replace('/(dashboard)' as any);
    }
  }, [user, router]);

  // Load request info
  useEffect(() => {
    if (!requestId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await api.get<RequestInfo>(`/requests/${requestId}`);
        if (!cancelled) setRequest(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load request');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [requestId]);

  const getTomorrowDate = useCallback(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const isFormValid = useCallback(() => {
    const trimmed = comment.trim();
    if (trimmed.length < 10 || trimmed.length > 500) return false;
    const parsedPrice = parseInt(price, 10);
    if (isNaN(parsedPrice) || parsedPrice < 0) return false;
    if (!deadline || deadline < getTomorrowDate()) return false;
    return true;
  }, [comment, price, deadline, getTomorrowDate]);

  const handleSubmit = useCallback(async () => {
    if (!requestId || !isFormValid()) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      await api.post(`/requests/${requestId}/respond`, {
        comment: comment.trim(),
        price: parseInt(price, 10),
        deadline,
      });

      if (Platform.OS === 'web') {
        alert('Your response has been sent');
      } else {
        Alert.alert('Success', 'Your response has been sent');
      }
      router.back();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setAlreadyResponded(true);
          setSubmitError('You have already responded to this request');
        } else {
          setSubmitError(err.message);
        }
      } else {
        setSubmitError('Failed to send response. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [requestId, comment, price, deadline, isFormValid, router]);

  if (!user || user.role !== 'SPECIALIST') {
    return null;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Respond to request" />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.brandPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !request) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Respond to request" />
        <EmptyState
          icon="alert-circle-outline"
          title={error || 'Request not found'}
          ctaLabel="Back to feed"
          onCtaPress={() => router.push('/requests')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: 'Respond to request' }} />
      <Header title="Respond to request" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {/* Request info card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Request details</Text>
            <Text style={styles.descriptionText} numberOfLines={6}>
              {request.description}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.cityChip}>
                <Text style={styles.cityText}>{request.city}</Text>
              </View>
              {request.category && (
                <View style={styles.categoryChip}>
                  <Text style={styles.categoryText}>{request.category}</Text>
                </View>
              )}
              {request.budget != null && (
                <Text style={styles.budgetText}>
                  {request.budget.toLocaleString('ru-RU')} rub.
                </Text>
              )}
            </View>
          </View>

          {/* Already responded notice */}
          {alreadyResponded && (
            <View style={styles.alreadyRespondedBox}>
              <Text style={styles.alreadyRespondedText}>
                You have already responded to this request
              </Text>
            </View>
          )}

          {/* Response form */}
          {!alreadyResponded && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Your response</Text>

              <Text style={styles.fieldLabel}>Предлагаемая цена, руб.</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={(text) => setPrice(text.replace(/[^0-9]/g, ''))}
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                editable={!submitting}
                testID="price-input"
              />

              <Text style={styles.fieldLabel}>Срок выполнения</Text>
              <TextInput
                style={styles.input}
                value={deadline}
                onChangeText={setDeadline}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textMuted}
                editable={!submitting}
                testID="deadline-input"
              />

              <Text style={styles.fieldLabel}>Комментарий</Text>
              <TextInput
                style={styles.textArea}
                value={comment}
                onChangeText={setComment}
                placeholder="Describe how you can help with this request..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={6}
                maxLength={500}
                textAlignVertical="top"
                editable={!submitting}
                testID="comment-input"
              />
              <Text style={styles.charCount}>
                {comment.length}/500
              </Text>

              {submitError && !alreadyResponded ? (
                <Text style={styles.errorText}>{submitError}</Text>
              ) : null}

              <Button
                onPress={handleSubmit}
                variant="primary"
                loading={submitting}
                disabled={!isFormValid() || submitting}
                style={styles.submitBtn}
              >
                Send response
              </Button>
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
    paddingBottom: 48,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 430,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  descriptionText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  cityChip: {
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cityText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  categoryChip: {
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  categoryText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  budgetText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.bgPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 120,
    backgroundColor: Colors.bgPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  charCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.statusError,
    marginTop: Spacing.sm,
  },
  submitBtn: {
    width: '100%',
    marginTop: Spacing.md,
  },
  alreadyRespondedBox: {
    backgroundColor: Colors.statusBg.warning,
    borderWidth: 1,
    borderColor: Colors.statusBg.warning,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  alreadyRespondedText: {
    fontSize: Typography.fontSize.base,
    color: Colors.statusWarning,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  },
});
