import { View, Text } from "react-native";
import { STEPS } from "./mockData";
import { colors } from "@/lib/theme";

interface HowItWorksSectionProps {
  isDesktop: boolean;
}

export default function HowItWorksSection({ isDesktop }: HowItWorksSectionProps) {
  return (
    <View
      className="bg-white px-4"
      style={{ paddingTop: isDesktop ? 96 : 64, paddingBottom: isDesktop ? 96 : 64 }}
    >
      <View style={{ width: "100%", alignItems: "center" }}>
        <View
          style={{
            width: "100%",
            maxWidth: 672,
            paddingHorizontal: isDesktop ? 24 : 0,
          }}
        >
          <Text
            className="text-sm font-semibold uppercase text-center mb-3"
            style={{ color: colors.primary, letterSpacing: 4 }}
          >
            Почему P2PTax
          </Text>
          <Text
            className="font-extrabold text-3xl text-center"
            style={{ color: colors.text }}
          >
            Большинство юристов дадут консультацию. Нужные люди — решат.
          </Text>
          <Text
            className="text-lg text-center mt-6"
            style={{ color: colors.textSecondary, lineHeight: 28 }}
          >
            P2PTax — маркетплейс специалистов по налоговым проверкам.
            Практики, которые работают с конкретными ФНС в вашем городе.
          </Text>

          {/* Steps */}
          <View
            className="mt-12"
            style={{
              flexDirection: isDesktop ? "row" : "column",
              alignItems: "center",
              justifyContent: "center",
              gap: isDesktop ? 48 : 32,
            }}
          >
            {STEPS.map((s) => (
              <View key={s.num} className="items-center">
                <View
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-white font-bold text-base">
                    {s.num}
                  </Text>
                </View>
                <Text
                  className="font-semibold mt-3 text-center"
                  style={{ color: colors.text }}
                >
                  {s.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
