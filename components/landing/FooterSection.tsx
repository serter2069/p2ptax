import { View, Text, Pressable } from "react-native";
import { colors, overlay } from "@/lib/theme";

interface FooterSectionProps {
  isDesktop: boolean;
  onHome: () => void;
  onViewCatalog: () => void;
  onCreateRequest: () => void;
}

export default function FooterSection({ isDesktop, onHome, onViewCatalog, onCreateRequest }: FooterSectionProps) {
  return (
    <View
      className="px-4"
      style={{ backgroundColor: colors.text, paddingTop: 48, paddingBottom: 48 }}
    >
      <View style={{ width: "100%", alignItems: "center" }}>
        <View
          style={{
            width: "100%",
            maxWidth: 1152,
            paddingHorizontal: isDesktop ? 24 : 0,
          }}
        >
          <View
            style={{
              flexDirection: isDesktop ? "row" : "column",
              justifyContent: isDesktop ? "space-between" : "center",
              alignItems: "center",
              gap: isDesktop ? 0 : 24,
            }}
          >
            <Text className="text-white font-extrabold text-lg">
              P2PTax
            </Text>
            <View
              className="flex-row items-center"
              style={{ gap: 24 }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="О сервисе"
                onPress={onHome}
                className="min-h-[44px] justify-center"
              >
                <Text style={{ color: overlay.white70 }}>
                  О сервисе
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Специалисты"
                onPress={onViewCatalog}
                className="min-h-[44px] justify-center"
              >
                <Text style={{ color: overlay.white70 }}>
                  Специалисты
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Создать заявку"
                onPress={onCreateRequest}
                className="min-h-[44px] justify-center"
              >
                <Text style={{ color: overlay.white70 }}>
                  Создать заявку
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Divider */}
          <View
            className="mt-8"
            style={{
              borderTopWidth: 1,
              borderTopColor: overlay.white10,
              paddingTop: 24,
            }}
          >
            <Text
              className="text-sm text-center"
              style={{ color: overlay.white50 }}
            >
              © 2026 P2PTax
            </Text>
            <Text
              className="text-xs text-center mt-2"
              style={{ color: overlay.white30 }}
            >
              Сервис не оказывает юридических услуг.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
