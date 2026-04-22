import { View, Text } from "react-native";
import { FEATURES } from "./mockData";
import { colors, overlay } from "@/lib/theme";

interface FeaturesSectionProps {
  isDesktop: boolean;
}

export default function FeaturesSection({ isDesktop }: FeaturesSectionProps) {
  return (
    <View
      className="px-4"
      style={{
        backgroundColor: colors.primary,
        paddingTop: isDesktop ? 96 : 64,
        paddingBottom: isDesktop ? 96 : 64,
      }}
    >
      <View style={{ width: "100%", alignItems: "center" }}>
        <View
          style={{
            width: "100%",
            maxWidth: 1152,
            paddingHorizontal: isDesktop ? 24 : 0,
          }}
        >
          <Text className="text-white font-extrabold text-3xl text-center mb-12">
            Как это работает
          </Text>
          <View
            style={{
              flexDirection: isDesktop ? "row" : "column",
              flexWrap: "wrap",
              gap: isDesktop ? 24 : 16,
            }}
          >
            {FEATURES.map((f) => (
              <View
                key={f.title}
                className="rounded-2xl p-6"
                style={[
                  { backgroundColor: overlay.white10 },
                  isDesktop
                    ? { flex: 1, minWidth: "45%" }
                    : {},
                ]}
              >
                <Text className="text-3xl mb-4">{f.icon}</Text>
                <Text className="text-white font-bold text-lg mb-2">
                  {f.title}
                </Text>
                <Text style={{ color: overlay.white70 }}>
                  {f.text}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
