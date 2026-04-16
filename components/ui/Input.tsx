import React, { useState } from 'react';
import {
  Platform,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { BorderRadius, Colors, Spacing, Typography } from '../../constants/Colors';
import { Text } from './Text';

export interface InputProps {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  editable?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  onBlur?: () => void;
  onFocus?: () => void;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  icon,
  rightIcon,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  multiline,
  numberOfLines,
  maxLength,
  editable = true,
  testID,
  style,
  onBlur,
  onFocus,
}: InputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? Colors.statusError
    : focused
    ? Colors.brandPrimary
    : Colors.borderLight;

  const fieldStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: multiline ? 'flex-start' : 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.input,
    paddingHorizontal: Spacing.md,
    paddingVertical: multiline ? Spacing.md : Spacing.sm + Spacing.xxs, // 11
    opacity: editable ? 1 : 0.6,
  };

  return (
    <View style={[{ gap: Spacing.xs + Spacing.xxs }, style]}>
      {label ? (
        <Text variant="label">{label}</Text>
      ) : null}
      <View style={fieldStyle}>
        {icon ? <View style={{ alignItems: 'center', justifyContent: 'center' }}>{icon}</View> : null}
        <TextInput
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          editable={editable}
          onFocus={() => { setFocused(true); onFocus?.(); }}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          style={[
            {
              flex: 1,
              fontSize: Typography.fontSize.base,
              fontFamily: Typography.fontFamily.regular,
              color: Colors.textPrimary,
              textAlignVertical: multiline ? 'top' : 'center',
              minHeight: multiline ? 96 : undefined,
            },
            Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null,
          ]}
        />
        {rightIcon ? (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>{rightIcon}</View>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" style={{ color: Colors.statusError }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
