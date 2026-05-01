import { View, Text } from "react-native";
import { Shield, Lock, CheckCircle2 } from "lucide-react-native";
import { colors } from "@/lib/theme";

interface TrustPillarsSectionProps {
  isDesktop: boolean;
}

interface Pillar {
  Icon: typeof Shield;
  title: string;
  desc: string;
}

const PILLARS: Pillar[] = [
  {
    Icon: Shield,
    title: "Ex-инспекторы ФНС",
    desc: "Знают как составляют требования и как их оспаривать",
  },
  {
    Icon: Lock,
    title: "NDA по умолчанию",
    desc: "Документы под защитой. Никто кроме выбранного специалиста их не увидит",
  },
  {
    Icon: CheckCircle2,
    title: "Без результата — не платите",
    desc: "Платёж списывается только после защиты",
  },
];

/**
 * Trust pillars row — three columns on desktop, vertical stack on mobile.
 * Each pillar = soft-tinted icon circle + title + 1-line description.
 *
 * Sits directly below the hero so the moat (ex-FNS inside knowledge,
 * confidentiality, success-based pricing) is visible above the fold on
 * a typical desktop landing impression.
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
