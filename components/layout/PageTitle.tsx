import { View, Text } from 'react-native';
import { colors } from '@/lib/theme';

interface PageTitleProps {
  title: string;
  subtitle?: string;
}

export default function PageTitle({ title, subtitle }: PageTitleProps) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>{title}</Text>
      {subtitle ? <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>{subtitle}</Text> : null}
    </View>
  );
}
