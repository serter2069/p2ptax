import { View, Text, Pressable } from "react-native";
import { MOCK_SPECIALISTS } from "./mockData";
import { colors, fontSizeValue } from "@/lib/theme";

interface PlatformStats {
  specialistsCount: number;
  citiesCount: number;
  consultationsCount: number;
}

interface HeroSectionProps {
  isDesktop: boolean;
  onCreateRequest: () => void;
  onViewCatalog: () => void;
  stats?: PlatformStats | null;
}

export default function HeroSection({ isDesktop, onCreateRequest, onViewCatalog, stats }: HeroSectionProps) {
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
            {/* Online badge */}
            <View
              className="flex-row items-center self-start mb-6 rounded-full px-4"
              style={{ backgroundColor: colors.accentSoft, paddingVertical: 8 }}
            >
              <Text style={{ color: colors.primary, fontSize: fontSizeValue.xs, marginRight: 6 }}>●</Text>
              <Text className="text-sm font-medium" style={{ color: colors.primary }}>
                Сейчас на связи · {stats?.specialistsCount ?? 47} специалистов в {stats?.citiesCount ?? 12} городах
              </Text>
            </View>

            <Text
              className="font-extrabold"
              style={{
                color: colors.text,
                fontSize: isDesktop ? 48 : 36,
                lineHeight: isDesktop ? 56 : 42,
              }}
            >
              {"Специалисты по вашей ФНС.\nНе юристы из интернета."}
            </Text>
            <Text
              className="text-lg mt-6"
              style={{ color: colors.textSecondary, lineHeight: 28 }}
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
                accessibilityLabel="Создать заявку"
                onPress={onCreateRequest}
                className="rounded-xl h-12 items-center justify-center px-7"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-white font-semibold text-base">
                  Создать заявку →
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Смотреть каталог"
                onPress={onViewCatalog}
                className="rounded-xl h-12 items-center justify-center px-7"
                style={{ borderWidth: 2, borderColor: colors.primary }}
              >
                <Text
                  className="font-semibold text-base"
                  style={{ color: colors.primary }}
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
                    backgroundColor: colors.surface2,
                    borderWidth: 1,
                    borderColor: colors.border,
                    gap: 16,
                  }}
                >
                  {/* Avatar */}
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.accentSoft }}
                  >
                    <Text
                      className="font-extrabold text-base"
                      style={{ color: colors.primary }}
                    >
                      {s.name.charAt(0)}
                    </Text>
                  </View>
                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <View className="flex-row items-center" style={{ gap: 6 }}>
                      <Text
                        className="font-semibold"
                        style={{ color: colors.text }}
                      >
                        {s.name}
                      </Text>
                      <View
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: colors.success }}
                      />
                    </View>
                    <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                      {s.city} · {s.ifns}
                    </Text>
                  </View>
                  {/* Tag */}
                  <View
                    className="rounded-full px-3"
                    style={{
                      backgroundColor: colors.accentSoft,
                      paddingVertical: 6,
                    }}
                  >
                    <Text
                      className="text-xs font-medium"
                      style={{ color: colors.primary }}
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
