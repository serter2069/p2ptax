import { View, Text } from "react-native";
import { colors, overlay } from "@/lib/theme";

interface TrustStripProps {
  isDesktop: boolean;
  specialistsCount: number;
  citiesCount: number;
  resolvedCases: number;
}

/**
 * Dark inverse strip under hero — three big numbers as immediate
 * credibility. Real values fed from /api/stats/landing-counts.
 */
export default function TrustStrip({
  isDesktop,
  specialistsCount,
  citiesCount,
  resolvedCases,
}: TrustStripProps) {
  const items = [
    {
      value: formatNumber(specialistsCount),
      label: "практикующих специалистов",
    },
    {
      value: formatNumber(citiesCount),
      label: "городов от Калининграда до Владивостока",
    },
    {
      value: formatNumber(resolvedCases || 0),
      label: "решённых кейсов за последнее время",
    },
  ];

  return (
    <View
      style={{
        backgroundColor: colors.text,
        paddingVertical: isDesktop ? 48 : 40,
        paddingHorizontal: isDesktop ? 32 : 20,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 1152,
          marginHorizontal: "auto",
          flexDirection: isDesktop ? "row" : "column",
          gap: isDesktop ? 48 : 28,
          justifyContent: "space-between",
        }}
      >
        {items.map((it, idx) => (
          <View
            key={idx}
            style={{
              flex: isDesktop ? 1 : undefined,
              borderLeftWidth: isDesktop && idx > 0 ? 1 : 0,
              borderLeftColor: overlay.white10,
              paddingLeft: isDesktop && idx > 0 ? 40 : 0,
            }}
          >
            <Text
              style={{
                color: colors.white,
                fontSize: isDesktop ? 56 : 44,
                lineHeight: isDesktop ? 60 : 48,
                fontWeight: "800",
                letterSpacing: -2,
              }}
            >
              {it.value}
            </Text>
            <Text
              style={{
                marginTop: 8,
                color: overlay.white70,
                fontSize: 13,
                lineHeight: 18,
              }}
            >
              {it.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1000) {
    return new Intl.NumberFormat("ru-RU").format(n);
  }
  return String(n);
}
