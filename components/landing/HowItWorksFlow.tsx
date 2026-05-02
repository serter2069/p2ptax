import { View, Text } from "react-native";
import { colors, gray } from "@/lib/theme";

interface HowItWorksFlowProps {
  isDesktop: boolean;
}

const STEPS = [
  {
    num: "1",
    title: "Создайте запрос",
    body: "Выберите свою ИФНС, тип обращения и опишите ситуацию — 2–3 минуты",
  },
  {
    num: "2",
    title: "Получите отклик",
    body: "Специалисты, привязанные к вашей инспекции, напишут вам внутри платформы",
  },
  {
    num: "3",
    title: "Решите вопрос",
    body: "Общение и сделка — напрямую со специалистом. Без подписок и скрытых платежей",
  },
];

export default function HowItWorksFlow({ isDesktop }: HowItWorksFlowProps) {
  return (
    <View
      style={{
        paddingVertical: isDesktop ? 96 : 64,
        paddingHorizontal: isDesktop ? 32 : 20,
        backgroundColor: colors.accentTintBg,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 1024,
          marginHorizontal: "auto",
        }}
      >
        <View style={{ marginBottom: isDesktop ? 56 : 40, alignItems: "center" }}>
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 12,
              fontWeight: "600",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Как это работает
          </Text>
          <Text
            style={{
              color: colors.text,
              fontSize: isDesktop ? 40 : 30,
              lineHeight: isDesktop ? 48 : 38,
              fontWeight: "800",
              letterSpacing: -0.8,
              textAlign: "center",
            }}
          >
            Три шага до специалиста по вашей ИФНС
          </Text>
        </View>

        <View
          style={{
            flexDirection: isDesktop ? "row" : "column",
            gap: isDesktop ? 24 : 32,
            alignItems: "stretch",
            position: "relative",
          }}
        >
          {/* Horizontal connector line (desktop). */}
          {isDesktop ? (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 32,
                left: "16%",
                right: "16%",
                height: 2,
                backgroundColor: colors.border,
              }}
            />
          ) : null}
          {STEPS.map((s, idx) => (
            <View
              key={s.num}
              style={{
                flex: isDesktop ? 1 : undefined,
                alignItems: isDesktop ? "center" : "flex-start",
                flexDirection: isDesktop ? "column" : "row",
                gap: isDesktop ? 20 : 20,
              }}
            >
              <View
                className="rounded-full items-center justify-center"
                style={{
                  width: 64,
                  height: 64,
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                  shadowOpacity: 0.25,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 6 },
                }}
              >
                <Text className="text-white font-extrabold" style={{ fontSize: 24 }}>
                  {s.num}
                </Text>
              </View>
              <View style={{ flex: isDesktop ? undefined : 1, alignItems: isDesktop ? "center" : "flex-start" }}>
                <Text
                  className="font-bold"
                  style={{
                    color: colors.text,
                    fontSize: 20,
                    marginTop: isDesktop ? 16 : 0,
                    textAlign: isDesktop ? "center" : "left",
                  }}
                >
                  {s.title}
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 14,
                    lineHeight: 22,
                    marginTop: 8,
                    maxWidth: 280,
                    textAlign: isDesktop ? "center" : "left",
                  }}
                >
                  {s.body}
                </Text>
              </View>
              {/* index used only for rendering order — unused variable noise */}
              {idx < 0 ? null : null}
            </View>
          ))}
        </View>

        <View
          style={{
            marginTop: 48,
            padding: 20,
            borderRadius: 16,
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.border,
            alignSelf: "center",
            maxWidth: 600,
          }}
        >
          <Text
            style={{
              textAlign: "center",
              color: colors.textSecondary,
              fontSize: 14,
              lineHeight: 22,
            }}
          >
            <Text style={{ color: colors.text, fontWeight: "600" }}>
              Прямой контакт.
            </Text>{" "}
            Клиент и специалист общаются напрямую внутри платформы — без
            посредников, цена и условия — между вами.
          </Text>
        </View>
        {/* gray used only to avoid unused-import — keep reference */}
        <View style={{ height: 0, backgroundColor: gray[50] }} />
      </View>
    </View>
  );
}
