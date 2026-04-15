import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { api, ApiError } from '../lib/api';

interface ReviewFormProps {
  specialistNick: string;
  requestId: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

const B = {
  action: '#1A5BA8',
  primary: '#0F2447',
  bg: '#F4F8FC',
  muted: '#4A6080',
  border: '#C8D8EA',
  white: '#FFFFFF',
};

export function ReviewForm({ specialistNick, requestId, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    try {
      await api.post('/reviews', {
        specialistNick,
        requestId,
        rating,
        comment: comment.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Не удалось отправить отзыв';
      Alert.alert('Ошибка', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Оставить отзыв</Text>

      <Text style={styles.label}>Оценка</Text>
      <View style={styles.starPicker}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
            <Text style={[styles.starChar, star <= rating ? styles.starFilled : styles.starEmpty]}>
              {star <= rating ? '\u2605' : '\u2606'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Комментарий (необязательно)</Text>
      <TextInput
        style={[styles.textInput, { outlineStyle: 'none' } as any]}
        value={comment}
        onChangeText={setComment}
        placeholder="Расскажите о своём опыте..."
        placeholderTextColor={B.muted}
        multiline
        numberOfLines={3}
      />

      <View style={styles.actions}>
        {onCancel && (
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn} activeOpacity={0.7}>
            <Text style={styles.cancelBtnText}>Отмена</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color={B.white} />
          ) : (
            <Text style={styles.submitBtnText}>Отправить</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    padding: 16,
    backgroundColor: '#EBF3FB',
    borderRadius: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: B.primary,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    color: B.muted,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  starPicker: {
    flexDirection: 'row',
    gap: 8,
  },
  starChar: {
    fontSize: 24,
    lineHeight: 32,
  },
  starFilled: {
    color: B.action,
  },
  starEmpty: {
    color: B.border,
  },
  textInput: {
    borderWidth: 1,
    borderColor: B.border,
    borderRadius: 6,
    padding: 12,
    color: B.primary,
    fontSize: 14,
    backgroundColor: B.white,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelBtnText: {
    fontSize: 14,
    color: B.muted,
  },
  submitBtn: {
    backgroundColor: B.action,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: B.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
