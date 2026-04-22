import { View, useWindowDimensions } from "react-native";

interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
}

export default function ResponsiveContainer({ children, maxWidth = 680 }: ResponsiveContainerProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;

  if (isDesktop) {
    return (
      <View style={{ width: "100%", alignItems: "center", flex: 1 }}>
        <View style={{ width: "100%", maxWidth, flex: 1, paddingHorizontal: 24 }}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 px-4">
      {children}
    </View>
  );
}
