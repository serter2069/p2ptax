import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../constants/Colors';

interface Props {
  currentStep: number; // 1-based, 1 to totalSteps
  totalSteps?: number; // default 5
}

export function OnboardingProgress({ currentStep, totalSteps = 5 }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: totalSteps }).map((_, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        return (
          <React.Fragment key={i}>
            {i > 0 && <View style={styles.line} />}
            <View
              style={[
                styles.dot,
                isDone && styles.dotDone,
                isActive && styles.dotActive,
              ]}
            />
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.border,
  },
  dotDone: {
    backgroundColor: Colors.brandSecondary,
  },
  dotActive: {
    backgroundColor: Colors.brandPrimary,
    width: 12,
    height: 12,
  },
  line: {
    width: 32,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.xs,
  },
});
