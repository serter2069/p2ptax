import { View, Text } from 'react-native';

interface PageTitleProps {
  title: string;
  subtitle?: string;
}

export default function PageTitle({ title, subtitle }: PageTitleProps) {
  return (
    <View className="px-4 pt-4 pb-2">
      <Text className="text-xl font-bold text-text-base">{title}</Text>
      {subtitle ? <Text className="text-sm text-text-mute mt-0.5">{subtitle}</Text> : null}
    </View>
  );
}
