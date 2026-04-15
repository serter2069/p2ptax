import React from 'react';
import { View } from 'react-native';
import { Colors } from '../constants/Colors';

interface Props {
  currentStep: number; // 1-based, 1 to totalSteps
  totalSteps?: number; // default 5
}

export function OnboardingProgress({ currentStep, totalSteps = 5 }: Props) {
  return (
    <View className="flex-row items-center justify-center mt-5">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        return (
          <React.Fragment key={i}>
            {i > 0 && <View className="w-8 h-[2px] bg-border mx-1" />}
            <View
              className="rounded-[3px]"
              style={{
                width: isActive ? 12 : 10,
                height: isActive ? 12 : 10,
                backgroundColor: isActive
                  ? Colors.brandPrimary
                  : isDone
                    ? Colors.brandSecondary
                    : Colors.border,
              }}
            />
          </React.Fragment>
        );
      })}
    </View>
  );
}
