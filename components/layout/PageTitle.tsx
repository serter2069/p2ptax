import { View, Text } from 'react-native';
import { colors, spacing, textStyle } from '@/lib/theme';

interface PageTitleProps {
  title: string;
  subtitle?: string;
}

export default function PageTitle({ title, subtitle }: PageTitleProps) {
  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
      <Text style={{ ...textStyle.h4, color: colors.text }}>{title}</Text>
      {subtitle ? (
        <Text style={{ ...textStyle.small, color: colors.textMuted, marginTop: 2 }}>{subtitle}</Text>
      ) : null}
    </View>
  );
}
