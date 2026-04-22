import { View, Text, Pressable } from "react-native";
import { MOCK_SPECIALISTS } from "./mockData";

interface HeroSectionProps {
  isDesktop: boolean;
  onCreateRequest: () => void;
  onViewCatalog: () => void;
}

export default function HeroSection({ isDesktop, onCreateRequest, onViewCatalog }: HeroSectionProps) {
  return (
    <View className="bg-white px-4" style={{ paddingTop: isDesktop ? 128 : 96, paddingBottom: isDesktop ? 96 : 64 }}>
      <View style={{ width: "100%", alignItems: "center" }}>
        <View
          style={{
            width: "100%",
            maxWidth: 1152,
            paddingHorizontal: isDesktop ? 24 : 0,
            flexDirection: isDesktop ? "row" : "column",
            alignItems: isDesktop ? "flex-start" : "stretch",
            gap: isDesktop ? 48 : 0,
          }}
        >
          {/* Text column */}
          <View style={isDesktop ? { flex: 1 } : undefined}>
            <Text
              className="font-extrabold"
              style={{
                color: "#1e3a8a",
                fontSize: isDesktop ? 48 : 36,
                lineHeight: isDesktop ? 56 : 42,
              }}
            >
              Специалисты по вашей ФНС — не юристы из интернета
            </Text>
            <Text
              className="text-lg mt-6"
              style={{ color: "#64748B", lineHeight: 28 }}
            >
              Практики с опытом в камеральных, выездных и ОКК. Выберите сами
              или получите предложения.
            </Text>

            {/* CTAs */}
            <View
              className="mt-8"
              style={{
                flexDirection: isDesktop ? "row" : "column",
                gap: 16,
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Создать заявку бесплатно"
                onPress={onCreateRequest}
                className="rounded-xl h-12 items-center justify-center px-7"
                style={{ backgroundColor: "#b45309" }}
              >
                <Text className="text-white font-semibold text-base">
                  Создать заявку бесплатно →
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Смотреть каталог"
                onPress={onViewCatalog}
                className="rounded-xl h-12 items-center justify-center px-7"
                style={{ borderWidth: 2, borderColor: "#1e3a8a" }}
              >
                <Text
                  className="font-semibold text-base"
                  style={{ color: "#1e3a8a" }}
                >
                  Смотреть каталог
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Mock specialist cards (desktop only) */}
          {isDesktop && (
            <View style={{ flex: 1, maxWidth: 400 }}>
              {MOCK_SPECIALISTS.map((s) => (
                <View
                  key={s.name}
                  className="flex-row items-center p-4 rounded-2xl mb-4"
                  style={{
                    backgroundColor: "#F8FAFC",
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    gap: 16,
                  }}
                >
                  {/* Avatar */}
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center"
                    style={{ backgroundColor: "rgba(30,58,138,0.1)" }}
                  >
                    <Text
                      className="font-extrabold text-base"
                      style={{ color: "#1e3a8a" }}
                    >
                      {s.name.charAt(0)}
                    </Text>
                  </View>
                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <Text
                      className="font-semibold"
                      style={{ color: "#0f172a" }}
                    >
                      {s.name}
                    </Text>
                    <View className="flex-row items-center mt-1" style={{ gap: 4 }}>
                      <Text style={{ color: "#d97706" }}>
                        {"\u2605"}
                      </Text>
                      <Text
                        className="text-sm"
                        style={{ color: "#64748B" }}
                      >
                        {s.rating}
                      </Text>
                    </View>
                  </View>
                  {/* Tag */}
                  <View
                    className="rounded-full px-3"
                    style={{
                      backgroundColor: "rgba(30,58,138,0.1)",
                      paddingVertical: 6,
                    }}
                  >
                    <Text
                      className="text-xs font-medium"
                      style={{ color: "#1e3a8a" }}
                    >
                      {s.tag}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
