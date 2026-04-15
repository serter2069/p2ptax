import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

export interface DropdownPickerProps {
  label?: string;
  placeholder?: string;
  value: string;
  options: string[];
  onValueChange: (v: string) => void;
  icon?: string;
  /** Show an "all" / reset option at the top */
  allLabel?: string;
}

export function DropdownPicker({
  label,
  placeholder = 'Select...',
  value,
  options,
  onValueChange,
  icon,
  allLabel,
}: DropdownPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <View className="gap-1">
      {label && <Text className="text-sm font-medium text-textSecondary">{label}</Text>}

      <Pressable onPress={() => setOpen(!open)}>
        <View
          className={`min-h-[48px] flex-row items-center gap-2 rounded-xl border px-4 py-3 ${
            open ? 'border-brandPrimary' : 'border-borderLight'
          } bg-white`}
        >
          {icon && <Feather name={icon as any} size={16} color={Colors.textMuted} />}
          <Text
            className={`flex-1 text-base ${value ? 'text-textPrimary' : 'text-textMuted'}`}
            numberOfLines={1}
          >
            {value || placeholder}
          </Text>
          <Feather name={open ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
        </View>
      </Pressable>

      {open && (
        <View className="overflow-hidden rounded-xl border border-borderLight bg-white shadow-sm">
          <View className="max-h-48">
            {allLabel && (
              <Pressable
                className="border-b border-bgSecondary px-4 py-3"
                onPress={() => {
                  onValueChange('');
                  setOpen(false);
                }}
              >
                <Text className="text-base text-textMuted">{allLabel}</Text>
              </Pressable>
            )}
            {options.map((opt) => (
              <Pressable
                key={opt}
                className="border-b border-bgSecondary px-4 py-3"
                onPress={() => {
                  onValueChange(opt);
                  setOpen(false);
                }}
              >
                <Text
                  className={`text-base ${
                    value === opt ? 'font-semibold text-brandPrimary' : 'text-textPrimary'
                  }`}
                >
                  {opt}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
