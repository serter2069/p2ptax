import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Colors';
import { secureStorage } from '../stores/storage';
import { api } from '../lib/api';
import { IfnsSearch } from './IfnsSearch';

interface QuickRequestFormProps {
  style?: ViewStyle;
  containerStyle?: ViewStyle;
}

export function QuickRequestForm({ style, containerStyle }: QuickRequestFormProps) {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [selectedIfns, setSelectedIfns] = useState<any>(null);
  const [serviceType, setServiceType] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);

  useEffect(() => {
    fetch(`${process.env.EXPO_PUBLIC_API_URL || ''}/api/categories`)
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => console.warn('[QuickRequestForm]', err));
  }, []);

  // Restore saved form data after auth redirect
  useEffect(() => {
    secureStorage.getItem('p2ptax_pending_request').then((saved) => {
      if (saved) {
        try {
          const { description: d, serviceType: s } = JSON.parse(saved);
          if (d) setDescription(d);
          if (s) setServiceType(s);
        } catch {}
      }
    });
  }, []);

  const handleSubmit = async () => {
    if (!serviceType) {
      setError('Выберите тип услуги');
      return;
    }
    if (description.trim().length < 3) {
      setError('Описание слишком короткое');
      return;
    }
    setError('');
    const pending: Record<string, string> = {
      description: description.trim().slice(0, 500),
      serviceType,
      city: selectedIfns?.city?.name || '',
    };
    if (selectedIfns) {
      pending.ifnsId = selectedIfns.id;
      pending.ifnsName = selectedIfns.name;
    }
    // Save to localStorage as backup (for restore after auth redirect)
    await secureStorage.setItem('p2ptax_pending_request', JSON.stringify(pending));

    setSubmitting(true);
    try {
      await api.post('/requests/quick', pending);
      setSubmitted(true);
    } catch (e: any) {
      setError(e?.message || 'Не удалось отправить заявку. Попробуйте позже.');
    } finally {
      setSubmitting(false);
    }
  };

  function handleNewRequest() {
    setDescription('');
    setSelectedIfns(null);
    setServiceType('');
    setError('');
    setSubmitted(false);
  }

  const outerStyle = containerStyle || style;

  if (submitted) {
    return (
      <View style={outerStyle}>
        <View style={f.successWrap}>
          <Ionicons name="checkmark-circle" size={48} color={Colors.statusSuccess} />
          <Text style={f.successTitle}>Заявка отправлена</Text>
          <Text style={f.successText}>
            Специалисты свяжутся с вами в ближайшее время.
          </Text>
          <TouchableOpacity
            style={f.btn}
            onPress={() => router.push('/(auth)/email')}
            activeOpacity={0.85}
          >
            <Text style={f.btnText}>Войти и отслеживать</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNewRequest} activeOpacity={0.7}>
            <Text style={f.linkText}>Подать новую заявку</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={outerStyle}>
      <Text style={f.label}>ТИП УСЛУГИ</Text>
      <View style={f.chipsRow}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.slug}
            style={[f.chip, serviceType === cat.name && f.chipSelected]}
            onPress={() => setServiceType(cat.name)}
            activeOpacity={0.7}
          >
            <Text style={[f.chipText, serviceType === cat.name && f.chipTextSelected]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={f.label}>ОПИШИТЕ СИТУАЦИЮ</Text>
      <TextInput
        testID="quick-request-description"
        style={[f.textarea, { outlineStyle: 'none' } as any]}
        placeholder="Что произошло? С чем нужна помощь?"
        placeholderTextColor={Colors.textMuted}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        maxLength={500}
      />

      <Text style={f.label}>ИФНС (НЕОБЯЗАТЕЛЬНО)</Text>
      <IfnsSearch
        selected={selectedIfns}
        onSelect={setSelectedIfns}
        placeholder="Номер или название ИФНС..."
      />

      {error ? <Text style={f.error}>{error}</Text> : null}

      <TouchableOpacity
        testID="quick-request-submit"
        style={[f.btn, submitting && { opacity: 0.6 }]}
        onPress={handleSubmit}
        activeOpacity={0.85}
        disabled={submitting}
      >
        <Text style={f.btnText}>
          {submitting ? 'Отправка...' : 'Найти специалиста →'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const f = StyleSheet.create({
  label: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    letterSpacing: 1,
    color: Colors.textMuted,
    marginBottom: 8,
    marginTop: 24,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  chipSelected: {
    backgroundColor: Colors.brandPrimary,
    borderColor: Colors.brandPrimary,
  },
  chipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: Colors.white,
  },
  textarea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgCard,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: Typography.fontSize.md,
    lineHeight: 24,
  },
  error: {
    color: Colors.statusError,
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.xs,
  },
  btn: {
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    marginTop: 32,
  },
  btnText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: Typography.fontSize.md,
  },
  linkText: {
    color: Colors.brandPrimary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  successWrap: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 48,
  },
  successTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  successText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 360,
  },
});
