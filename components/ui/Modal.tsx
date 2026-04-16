import React from 'react';
import {
  Modal as RNModal,
  Platform,
  Pressable,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BorderRadius, Colors, Spacing } from '../../constants/Colors';
import { Button } from './Button';
import { Heading } from './Heading';

export interface ModalAction {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  primaryAction?: ModalAction;
  secondaryAction?: ModalAction;
  /** Max width of the content panel (px). */
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
}

export function Modal({
  visible,
  onClose,
  title,
  children,
  primaryAction,
  secondaryAction,
  maxWidth = 480,
  style,
}: ModalProps) {
  const animationType = Platform.OS === 'web' ? 'fade' : 'slide';

  return (
    <RNModal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(12, 26, 46, 0.5)',
          justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
          alignItems: 'center',
          padding: Platform.OS === 'web' ? Spacing.lg : 0,
        }}
      >
        {/* Panel — stop propagation by wrapping in its own Pressable */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[
            {
              width: '100%',
              maxWidth: Platform.OS === 'web' ? maxWidth : undefined,
              maxHeight: '90%',
              backgroundColor: Colors.white,
              borderTopLeftRadius: BorderRadius.xl,
              borderTopRightRadius: BorderRadius.xl,
              borderBottomLeftRadius: Platform.OS === 'web' ? BorderRadius.xl : 0,
              borderBottomRightRadius: Platform.OS === 'web' ? BorderRadius.xl : 0,
              padding: Spacing.xl,
              gap: Spacing.lg,
            },
            style,
          ]}
        >
          {title ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Heading level={3}>{title}</Heading>
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={8}
                accessibilityLabel="Закрыть"
                accessibilityRole="button"
                style={{ padding: Spacing.xs }}
              >
                <Feather name="x" size={20} color={Colors.textMuted} />
              </Pressable>
            </View>
          ) : null}

          <ScrollView
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ gap: Spacing.md }}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>

          {(primaryAction || secondaryAction) && (
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              {secondaryAction ? (
                <View style={{ flex: 1 }}>
                  <Button
                    variant="secondary"
                    onPress={secondaryAction.onPress}
                    disabled={secondaryAction.disabled}
                    loading={secondaryAction.loading}
                    fullWidth
                  >
                    {secondaryAction.label}
                  </Button>
                </View>
              ) : null}
              {primaryAction ? (
                <View style={{ flex: 1 }}>
                  <Button
                    variant="primary"
                    onPress={primaryAction.onPress}
                    disabled={primaryAction.disabled}
                    loading={primaryAction.loading}
                    fullWidth
                  >
                    {primaryAction.label}
                  </Button>
                </View>
              ) : null}
            </View>
          )}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
