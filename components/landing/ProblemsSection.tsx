import { View, Text } from "react-native";
import { PROBLEMS } from "./mockData";
import { colors } from "@/lib/theme";

interface ProblemsSectionProps {
  isDesktop: boolean;
}

export default function ProblemsSection({ isDesktop }: ProblemsSectionProps) {
  return (
    <View
      className="bg-surface2 px-4"
      style={{ paddingTop: isDesktop ? 96 : 64, paddingBottom: isDesktop ? 96 : 64 }}
    >
      <View style={{ width: "100%", alignItems: "center" }}>
        <View
          style={{
            width: "100%",
            maxWidth: 1152,
            paddingHorizontal: isDesktop ? 24 : 0,
          }}
        >
          <Text
            className="font-extrabold text-3xl text-center mb-12"
            style={{ color: colors.text }}
          >
            С чем приходят на P2PTax
          </Text>
          <View
            style={{
              flexDirection: isDesktop ? "row" : "column",
              gap: isDesktop ? 24 : 0,
            }}
          >
            {PROBLEMS.map((p) => (
              <View
                key={p.title}
                className="bg-white rounded-2xl p-6"
                style={[
                  {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  },
                  isDesktop ? { flex: 1 } : { marginBottom: 16 },
                ]}
              >
                <Text className="text-3xl mb-4">{p.icon}</Text>
                <Text
                  className="text-lg font-bold mb-2"
                  style={{ color: colors.text }}
                >
                  {p.title}
                </Text>
                <Text style={{ color: colors.textSecondary, lineHeight: 24 }}>
                  {p.text}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
