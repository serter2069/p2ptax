import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/Button';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';

const GEORGIAN_CITIES = [
  'Тбилиси',
  'Батуми',
  'Кутаиси',
  'Рустави',
  'Гори',
  'Зугдиди',
  'Поти',
  'Сухуми',
];

export default function CitiesScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  function toggleCity(city: string) {
    setSelected((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city],
    );
  }

  function handleContinue() {
    router.push({
      pathname: '/(onboarding)/services',
      params: { cities: JSON.stringify(selected) },
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Progress indicator */}
          <View style={styles.progressRow}>
            <View style={[styles.progressDot, styles.progressDotDone]} />
            <View style={styles.progressLine} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={styles.progressLine} />
            <View style={styles.progressDot} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.step}>Шаг 2 из 3</Text>
            <Text style={styles.title}>Выберите города</Text>
            <Text style={styles.subtitle}>
              В каких городах Грузии вы оказываете услуги?
            </Text>
          </View>

          {/* City chips */}
          <View style={styles.chipsGrid}>
            {GEORGIAN_CITIES.map((city) => {
              const isSelected = selected.includes(city);
              return (
                <TouchableOpacity
                  key={city}
                  onPress={() => toggleCity(city)}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {city}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selected.length > 0 && (
            <Text style={styles.selectedHint}>
              Выбрано: {selected.join(', ')}
            </Text>
          )}

          <Button
            onPress={handleContinue}
            disabled={selected.length === 0}
            style={styles.btn}
          >
            Продолжить
          </Button>
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
    justifyContent: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 430,
    paddingHorizontal: Spacing.xl,
    gap: Spacing['2xl'],
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    marginTop: Spacing.xl,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.border,
  },
  progressDotDone: {
    backgroundColor: Colors.brandSecondary,
  },
  progressDotActive: {
    backgroundColor: Colors.brandPrimary,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressLine: {
    width: 32,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.xs,
  },
  header: {
    gap: Spacing.xs,
  },
  step: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.medium,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  chipSelected: {
    borderColor: Colors.brandPrimary,
    backgroundColor: Colors.statusBg.accent,
  },
  chipText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  chipTextSelected: {
    color: Colors.textAccent,
    fontWeight: Typography.fontWeight.semibold,
  },
  selectedHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  btn: {
    width: '100%',
    marginTop: Spacing.sm,
  },
});
