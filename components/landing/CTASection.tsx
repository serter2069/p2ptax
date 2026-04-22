import { View, Text, Pressable } from "react-native";
import { colors, overlay } from "@/lib/theme";

interface CTASectionProps {
  isDesktop: boolean;
  onCreateRequest: () => void;
  onViewCatalog: () => void;
}

export default function CTASection({ isDesktop, onCreateRequest, onViewCatalog }: CTASectionProps) {
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
            maxWidth: 672,
            paddingHorizontal: isDesktop ? 24 : 0,
          }}
        >
          <Text className="text-white font-extrabold text-3xl text-center">
            Уже пришло уведомление?
          </Text>
          <Text
            className="text-lg text-center mt-4"
            style={{ color: overlay.white80, lineHeight: 28 }}
          >
            Создайте заявку — это займёт 3 минуты. Специалисты напишут сами.
          </Text>
          <View
            className="mt-8"
            style={{
              flexDirection: isDesktop ? "row" : "column",
              justifyContent: "center",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Создать заявку"
              onPress={onCreateRequest}
              className="bg-white rounded-xl h-12 items-center justify-center px-7"
            >
              <Text
                className="font-semibold text-base"
                style={{ color: colors.primary }}
              >
                Создать заявку →
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Смотреть специалистов"
              onPress={onViewCatalog}
              className="h-12 items-center justify-center"
            >
              <Text
                className="text-base font-semibold"
                style={{ color: overlay.white80 }}
              >
                Смотреть специалистов
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
