import { View, Text } from "react-native";
import { colors } from "@/lib/theme";

interface TrustPillarsSectionProps {
  isDesktop: boolean;
}

interface Pillar {
  /** Big number / metric. Single line, must read as a numeric claim. */
  metric: string;
  /** Short headline tying the metric to a benefit. */
  title: string;
  /** Supporting one-liner. */
  desc: string;
}

const PILLARS: Pillar[] = [
  {
    metric: "150+",
    title: "Инспекций в каталоге",
    desc: "Москва, Питер, Екб, Новосиб, Казань. Ваша точно есть.",
  },
  {
    metric: "3 минуты",
    title: "На запрос — и всё",
    desc: "Не форма из 12 полей и не «оставьте заявку, мы перезвоним».",
  },
  {
    metric: "0 ₽",
    title: "За платформу",
    desc: "Платите специалисту напрямую. Цены и условия — между вами.",
  },
];

/**
 * Trust pillars — three numeric data-points instead of generic
 * 'feature with icon' tiles. Numbers first because they're concrete
 * and instantly tell the user what to expect (vs the previous
 * 'привязка к ИФНС / прямой контакт / профиль и отзывы' which read
 * as generic landing copy).
 */
export default function TrustPillarsSection({ isDesktop }: TrustPillarsSectionProps) {
  return (
    <View
      className="w-full"
      style={{
        paddingHorizontal: isDesktop ? 32 : 20,
        paddingTop: isDesktop ? 56 : 40,
        paddingBottom: isDesktop ? 56 : 40,
        backgroundColor: colors.white,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 1280,
          marginHorizontal: "auto",
          flexDirection: isDesktop ? "row" : "column",
          gap: isDesktop ? 24 : 20,
        }}
      >
        {PILLARS.map((p) => (
          <View
            key={p.title}
            className="rounded-2xl"
            style={{
              flex: isDesktop ? 1 : undefined,
              padding: isDesktop ? 28 : 22,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.white,
              gap: 6,
            }}
          >
            <Text
              style={{
                color: colors.primary,
                fontSize: isDesktop ? 40 : 32,
                lineHeight: isDesktop ? 44 : 36,
                fontWeight: "800",
                letterSpacing: -1,
                marginBottom: 6,
              }}
            >
              {p.metric}
            </Text>
            <Text
              className="font-bold"
              style={{ color: colors.text, fontSize: 17, lineHeight: 22 }}
            >
              {p.title}
            </Text>
            <Text
              style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20 }}
            >
              {p.desc}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
