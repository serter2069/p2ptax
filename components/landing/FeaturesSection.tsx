import { View, Text } from "react-native";
import { FEATURES } from "./mockData";

interface FeaturesSectionProps {
  isDesktop: boolean;
}

export default function FeaturesSection({ isDesktop }: FeaturesSectionProps) {
  return (
    <View
      className="px-4"
      style={{
        backgroundColor: "#2256c2",
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
                  { backgroundColor: "rgba(255,255,255,0.1)" },
                  isDesktop
                    ? { flex: 1, minWidth: "45%" }
                    : {},
                ]}
              >
                <Text className="text-3xl mb-4">{f.icon}</Text>
                <Text className="text-white font-bold text-lg mb-2">
                  {f.title}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.7)" }}>
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
