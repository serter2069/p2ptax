import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { Colors } from '../../constants/Colors';

export interface ToggleProps {
  value: boolean;
  onValueChange: (v: boolean) => void;
  label?: string;
  sublabel?: string;
  disabled?: boolean;
}

export function Toggle({ value, onValueChange, label, sublabel, disabled }: ToggleProps) {
  const trackColor = value ? Colors.brandPrimary : '#D1D5DB';

  return (
    <Pressable
      className="flex-row items-center justify-between"
      onPress={() => !disabled && onValueChange(!value)}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      {(label || sublabel) ? (
        <View className="mr-3 flex-1">
          {label && <Text className="text-sm text-textSecondary">{label}</Text>}
          {sublabel && <Text className="text-xs text-textMuted">{sublabel}</Text>}
        </View>
      ) : null}
      <View
        className="h-7 w-12 justify-center rounded-full px-0.5"
        style={{ backgroundColor: trackColor }}
      >
        <View
          className="h-[22px] w-[22px] rounded-full bg-white"
          style={{
            alignSelf: value ? 'flex-end' : 'flex-start',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 2,
          }}
        />
      </View>
    </Pressable>
  );
}
