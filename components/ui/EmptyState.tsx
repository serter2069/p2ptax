import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Spacing } from '../../constants/Colors';
import { Heading } from './Heading';
import { Text } from './Text';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({ icon, title, description, action, style }: EmptyStateProps) {
  return (
    <View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          padding: Spacing['3xl'],
          gap: Spacing.md,
        },
        style,
      ]}
    >
      {icon ? <View style={{ marginBottom: Spacing.xs }}>{icon}</View> : null}
      <Heading level={3} align="center">
        {title}
      </Heading>
      {description ? (
        <Text variant="muted" align="center">
          {description}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: Spacing.md }}>{action}</View> : null}
    </View>
  );
}
