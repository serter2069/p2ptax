import { View, Text } from "react-native";
import { MapPin, MessageCircle, Star } from "lucide-react-native";
import { colors } from "@/lib/theme";

interface TrustPillarsSectionProps {
  isDesktop: boolean;
}

interface Pillar {
  Icon: typeof MapPin;
  title: string;
  desc: string;
}

const PILLARS: Pillar[] = [
  {
    Icon: MapPin,
    title: "Привязка к вашей ИФНС",
    desc: "Каталог отбирает специалистов, которые работают именно с вашей инспекцией.",
  },
  {
    Icon: MessageCircle,
    title: "Прямой контакт",
    desc: "Переписка со специалистом внутри платформы — без посредников и звонков из колл-центра.",
  },
  {
    Icon: Star,
    title: "Профиль и отзывы",
    desc: "Опыт, услуги и отзывы клиентов в одном профиле — выбираете осознанно.",
  },
];

/**
 * Trust pillars row — three columns on desktop, vertical stack on mobile.
 * Anchors the value props on what the platform actually delivers
 * (FNS-binding, in-platform messaging, public profile + reviews) rather
 * than on outcome guarantees the platform can't make.
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
              padding: isDesktop ? 24 : 20,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.white,
              gap: 12,
            }}
          >
            <View
              className="items-center justify-center rounded-full"
              style={{
                width: 48,
                height: 48,
                backgroundColor: colors.successSoft,
              }}
            >
              <p.Icon size={22} color={colors.success} />
            </View>
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
