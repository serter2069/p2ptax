import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/Colors';

interface AuthProgressProps {
  step: 1 | 2 | 3;
  total?: number;
}

const LABELS = ['Email', '\u041A\u043E\u0434', '\u041F\u0440\u043E\u0444\u0438\u043B\u044C'];

export function AuthProgress({ step, total = 3 }: AuthProgressProps) {
  return (
    <View style={s.container}>
      <View style={s.row}>
        {Array.from({ length: total }, (_, i) => {
          const idx = i + 1;
          const isActive = idx <= step;
          const isCurrent = idx === step;
          return (
            <React.Fragment key={idx}>
              {i > 0 && (
                <View style={[s.line, isActive && s.lineActive]} />
              )}
              <View style={[s.circle, isActive && s.circleActive, isCurrent && s.circleCurrent]}>
                <Text style={[s.circleText, isActive && s.circleTextActive]}>{idx}</Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
      <View style={s.labelsRow}>
        {LABELS.slice(0, total).map((label, i) => (
          <Text
            key={label}
            style={[s.label, i + 1 <= step && s.labelActive]}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.xs,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgPrimary,
  },
  circleActive: {
    borderColor: Colors.brandPrimary,
    backgroundColor: Colors.brandPrimary,
  },
  circleCurrent: {
    borderColor: Colors.brandPrimary,
    backgroundColor: Colors.brandPrimary,
  },
  circleText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textMuted,
  },
  circleTextActive: {
    color: Colors.white,
  },
  line: {
    width: 40,
    height: 2,
    backgroundColor: Colors.border,
  },
  lineActive: {
    backgroundColor: Colors.brandPrimary,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 32 * 3 + 40 * 2,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    width: 32,
  },
  labelActive: {
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
});
