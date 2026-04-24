import { View, Text } from "react-native";
import { colors, gray } from "@/lib/theme";
import DuotoneIcon from "./DuotoneIcon";

interface FearTimelineProps {
  isDesktop: boolean;
}

const STEPS = [
  {
    day: "День 1",
    title: "Получено требование ФНС",
    body: "Начинается отсчёт 10 рабочих дней на ответ.",
    tone: "slate" as const,
  },
  {
    day: "День 10",
    title: "Срок ответа истекает",
    body: "Без пояснений ФНС считает, что ответить нечего.",
    tone: "amber" as const,
  },
  {
    day: "День 11",
    title: "Автоштраф 5 000 ₽",
    body: "Начисляется автоматически за каждое неответивше требование.",
    tone: "red" as const,
  },
  {
    day: "День 60",
    title: "Возможна блокировка счёта",
    body: "Доначисления становятся взысканием. Счёт замораживается.",
    tone: "red" as const,
  },
];

const TONE_COLORS = {
  slate: { bg: gray[100], text: gray[700] },
  amber: { bg: "#fef3c7", text: "#92400e" },
  red: { bg: "#fee2e2", text: "#b91c1c" },
} as const;

export default function FearTimeline({ isDesktop }: FearTimelineProps) {
  return (
    <View
      style={{
        paddingVertical: isDesktop ? 96 : 64,
        paddingHorizontal: isDesktop ? 32 : 20,
        backgroundColor: "#fffbf2",
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 900,
          marginHorizontal: "auto",
        }}
      >
        <View className="flex-row items-center" style={{ gap: 12, marginBottom: 16 }}>
          <DuotoneIcon name="clock" size={28} color={colors.warning} softColor="#fef3c7" />
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 12,
              fontWeight: "600",
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            Что будет, если ждать
          </Text>
        </View>
        <Text
          style={{
            color: colors.text,
            fontSize: isDesktop ? 36 : 28,
            lineHeight: isDesktop ? 44 : 36,
            fontWeight: "800",
            letterSpacing: -0.7,
            maxWidth: 680,
          }}
        >
          Каждый пропущенный день — шаг ближе к штрафам и блокировке.
        </Text>

        <View style={{ marginTop: 40, gap: 16 }}>
          {STEPS.map((s, idx) => {
            const tone = TONE_COLORS[s.tone];
            return (
              <View
                key={idx}
                className="rounded-2xl"
                style={{
                  padding: 20,
                  backgroundColor: "#ffffff",
                  borderWidth: 1,
                  borderColor: colors.border,
                  flexDirection: isDesktop ? "row" : "column",
                  alignItems: isDesktop ? "center" : "flex-start",
                  gap: 16,
                }}
              >
                <View
                  className="rounded-full"
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    backgroundColor: tone.bg,
                    minWidth: 96,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: tone.text, fontSize: 12, fontWeight: "700" }}>
                    {s.day}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    className="font-bold"
                    style={{ color: colors.text, fontSize: 16 }}
                  >
                    {s.title}
                  </Text>
                  <Text
                    style={{
                      marginTop: 4,
                      color: colors.textSecondary,
                      fontSize: 14,
                      lineHeight: 20,
                    }}
                  >
                    {s.body}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View
          className="rounded-2xl"
          style={{
            marginTop: 32,
            padding: 20,
            backgroundColor: colors.text,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "#ffffff",
              fontSize: 16,
              fontWeight: "600",
              textAlign: "center",
              lineHeight: 24,
              letterSpacing: -0.2,
            }}
          >
            Первые 3 дня — критичные. Время работает против вас.
          </Text>
        </View>
      </View>
    </View>
  );
}
