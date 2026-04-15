import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ViewStyle,
} from 'react-native';
import { Colors } from '../constants/Colors';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  label?: string;
  error?: string;
  hint?: string;
  style?: ViewStyle;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoFocus?: boolean;
  editable?: boolean;
  maxLength?: number;
  onSubmitEditing?: () => void;
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  multiline?: boolean;
  numberOfLines?: number;
  showCharCount?: boolean;
  minHeight?: number;
  textAlignVertical?: 'auto' | 'top' | 'center' | 'bottom';
}

export function Input({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  label,
  error,
  hint,
  style,
  autoCapitalize = 'none',
  autoCorrect,
  keyboardType = 'default',
  autoFocus = false,
  editable = true,
  maxLength,
  onSubmitEditing,
  returnKeyType,
  multiline = false,
  numberOfLines,
  showCharCount = false,
  minHeight,
  textAlignVertical,
}: InputProps) {
  const [focused, setFocused] = useState(false);

  const resolvedMinHeight = multiline ? (minHeight ?? 80) : undefined;
  const resolvedTextAlignVertical = textAlignVertical ?? (multiline ? 'top' : undefined);

  const borderColor = error
    ? Colors.statusError
    : focused
      ? Colors.brandPrimary
      : Colors.border;

  return (
    <View className="gap-1" style={style}>
      {label ? <Text className="text-[13px] font-medium text-textSecondary mb-[2px]">{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        keyboardType={keyboardType}
        autoFocus={autoFocus}
        editable={editable}
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={resolvedTextAlignVertical}
        className={`bg-bgCard border rounded-md px-4 py-3 text-[15px] text-textPrimary ${!multiline ? 'h-12 py-0' : ''} ${!editable ? 'opacity-50' : ''}`}
        style={[
          { borderColor },
          multiline && resolvedMinHeight ? { minHeight: resolvedMinHeight } : null,
          { outlineStyle: 'none' as any },
        ]}
      />
      {showCharCount && maxLength != null ? (
        <Text className="text-[11px] text-textMuted text-right mt-[2px]">{value.length}/{maxLength}</Text>
      ) : null}
      {error ? <Text className="text-[11px] text-statusError mt-[2px]">{error}</Text> : null}
      {hint && !error ? <Text className="text-[11px] text-textMuted mt-[2px]">{hint}</Text> : null}
    </View>
  );
}
