import { View, Text, Pressable } from "react-native";
import { colors, gray } from "@/lib/theme";

interface FinalCTAProps {
  isDesktop: boolean;
  onCreateRequest: () => void;
  onViewCatalog: () => void;
}

export default function FinalCTA({ isDesktop, onCreateRequest, onViewCatalog }: FinalCTAProps) {
  return (
    <View
      style={{
        paddingVertical: isDesktop ? 96 : 64,
        paddingHorizontal: isDesktop ? 32 : 20,
        backgroundColor: colors.white,
        alignItems: "center",
      }}
    >
      <View
        style={{
          maxWidth: 720,
          width: "100%",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: colors.text,
            fontSize: isDesktop ? 48 : 32,
            lineHeight: isDesktop ? 56 : 40,
            fontWeight: "800",
            letterSpacing: -1,
            textAlign: "center",
          }}
        >
          Уже получили уведомление ФНС?
        </Text>
        <Text
          style={{
            marginTop: 16,
            color: colors.textSecondary,
            fontSize: 18,
            lineHeight: 28,
            textAlign: "center",
          }}
        >
          Не откладывайте. Первые 3 дня — критичные. Специалисты напишут
          вам сами.
        </Text>

        <View
          style={{
            marginTop: 32,
            flexDirection: isDesktop ? "row" : "column",
            gap: 12,
            width: "100%",
            justifyContent: "center",
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Создать заявку"
            onPress={onCreateRequest}
            className="rounded-xl items-center justify-center"
            style={{
              height: 60,
              paddingHorizontal: 36,
              backgroundColor: colors.primary,
            }}
          >
            <Text className="text-white font-semibold" style={{ fontSize: 17 }}>
              Создать заявку
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Посмотреть специалистов"
            onPress={onViewCatalog}
            className="rounded-xl items-center justify-center"
            style={{
              height: 60,
              paddingHorizontal: 36,
              borderWidth: 2,
              borderColor: gray[300],
            }}
          >
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: "600" }}>
              Посмотреть специалистов
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
