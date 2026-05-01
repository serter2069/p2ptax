import { View, Text } from 'react-native';

interface PageTitleProps {
  title: string;
  subtitle?: string;
}

/**
 * PageTitle — the single source of vertical rhythm at the top of every list
 * / catalog screen. The trailing pb-4 (16px) IS the canonical gap to whatever
 * comes next (search bar, filter row, action buttons). Consumers must NOT add
 * their own pt- on the next element — that double-paddings and breaks rhythm.
 *
 * Title:    text-xl font-bold (~28px line height on web, native uses ~24)
 * Subtitle: text-sm text-text-mute, 4px gap below title
 * Below:    16px gap before the next section (mb-4 inside this View)
 */
export default function PageTitle({ title, subtitle }: PageTitleProps) {
  return (
    <View className="px-4 pt-4 pb-4">
      <Text className="text-xl font-bold text-text-base">{title}</Text>
      {subtitle ? <Text className="text-sm text-text-mute mt-1">{subtitle}</Text> : null}
    </View>
  );
}
