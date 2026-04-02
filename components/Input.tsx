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
  style?: ViewStyle;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoFocus?: boolean;
  editable?: boolean;
  maxLength?: number;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  label,
  error,
  style,
  autoCapitalize = 'none',
  autoCorrect,
  keyboardType = 'default',
  autoFocus = false,
  editable = true,
  maxLength,
}: InputProps) {
  const [focused, setFocused] = useState(false);

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
        style={[
          styles.input,
          focused && styles.inputFocused,
          error ? styles.inputError : null,
          !editable && styles.inputDisabled,
        ]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
    height: 48,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
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
});
