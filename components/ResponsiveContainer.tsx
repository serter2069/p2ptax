import { View, useWindowDimensions } from "react-native";

interface ResponsiveContainerProps {
  children: React.ReactNode;
}

export default function ResponsiveContainer({ children }: ResponsiveContainerProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;

  if (isDesktop) {
    return (
      <View className="flex-1" style={{ maxWidth: 520, width: "100%", alignSelf: "center" }}>
        {children}
      </View>
    );
  }

  return (
    <View className="flex-1 px-4">
      {children}
    </View>
  );
}
