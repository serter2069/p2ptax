import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/Colors';

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

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
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
        style={[
          styles.input,
          !multiline && styles.inputSingleLine,
          multiline && resolvedMinHeight ? { minHeight: resolvedMinHeight } : null,
          focused && styles.inputFocused,
          error ? styles.inputError : null,
          !editable && styles.inputDisabled,
        ]}
      />
      {showCharCount && maxLength != null ? (
        <Text style={styles.charCount}>{value.length}/{maxLength}</Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  input: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  inputSingleLine: {
    height: 48,
    paddingVertical: 0,
  },
  charCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: 2,
  },
  inputFocused: {
    borderColor: Colors.brandPrimary,
  },
  inputError: {
    borderColor: Colors.statusError,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  error: {
    fontSize: Typography.fontSize.xs,
    color: Colors.statusError,
    marginTop: 2,
  },
  hint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
