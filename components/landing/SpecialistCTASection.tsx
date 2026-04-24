import { View, Text, Pressable } from "react-native";
import { colors, overlay } from "@/lib/theme";

interface SpecialistCTASectionProps {
  isDesktop: boolean;
  onBecomeSpecialist: () => void;
  specialistsCount: number;
}

const BULLETS = [
  "Прямой контакт с клиентами",
  "Ваше расписание и ваши цены",
  "Любое количество заявок",
];

export default function SpecialistCTASection({
  isDesktop,
  onBecomeSpecialist,
  specialistsCount,
}: SpecialistCTASectionProps) {
  return (
    <View
      style={{
        paddingHorizontal: isDesktop ? 32 : 20,
        paddingTop: isDesktop ? 32 : 24,
        paddingBottom: isDesktop ? 32 : 24,
      }}
    >
      <View
        className="rounded-3xl"
        style={{
          width: "100%",
          maxWidth: 1152,
          marginHorizontal: "auto",
          padding: isDesktop ? 56 : 32,
          backgroundColor: colors.text,
          flexDirection: isDesktop ? "row" : "column",
          gap: isDesktop ? 48 : 32,
          alignItems: isDesktop ? "center" : "flex-start",
        }}
      >
        <View style={{ flex: isDesktop ? 1.3 : undefined }}>
          <Text
            style={{
              color: overlay.white70,
              fontSize: 12,
              fontWeight: "600",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Для специалистов
          </Text>
          <Text
            style={{
              color: colors.white,
              fontSize: isDesktop ? 36 : 28,
              lineHeight: isDesktop ? 44 : 36,
              fontWeight: "800",
              letterSpacing: -0.7,
            }}
          >
            Ваша экспертиза — ваш рынок.
          </Text>
          <Text
            style={{
              marginTop: 16,
              color: overlay.white70,
              fontSize: 15,
              lineHeight: 24,
              maxWidth: 520,
            }}
          >
            Специалисты по ФНС находят клиентов через платформу. 0%
            комиссии. Регистрация за 5 минут.
          </Text>

          <View style={{ marginTop: 24, gap: 10 }}>
            {BULLETS.map((b, idx) => (
              <View key={idx} className="flex-row items-center" style={{ gap: 10 }}>
                <View
                  className="rounded-full items-center justify-center"
                  style={{
                    width: 22,
                    height: 22,
                    backgroundColor: overlay.white10,
                  }}
                >
                  <Text style={{ color: colors.white, fontSize: 12, fontWeight: "700" }}>✓</Text>
                </View>
                <Text style={{ color: colors.white, fontSize: 14, lineHeight: 20 }}>{b}</Text>
              </View>
            ))}
          </View>
        </View>

        <View
          className="rounded-2xl"
          style={{
            flex: isDesktop ? 1 : undefined,
            width: isDesktop ? undefined : "100%",
            padding: 28,
            backgroundColor: overlay.white10,
            gap: 16,
          }}
        >
          <Text style={{ color: colors.white, fontSize: 18, fontWeight: "700" }}>
            Станьте специалистом
          </Text>
          <Text style={{ color: overlay.white70, fontSize: 14, lineHeight: 20 }}>
            Заполните профиль: ФНС, услуги, опыт. Заявки начнут
            приходить в течение суток.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Стать специалистом"
            onPress={onBecomeSpecialist}
            className="rounded-xl items-center justify-center"
            style={{
              height: 52,
              backgroundColor: colors.white,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>
              Стать специалистом
            </Text>
          </Pressable>
          <Text style={{ color: overlay.white50, fontSize: 12, lineHeight: 18 }}>
            {specialistsCount > 0
              ? `${specialistsCount} специалистов уже с нами`
              : "Присоединяйтесь к растущему сообществу"}
          </Text>
        </View>
      </View>
    </View>
  );
}
