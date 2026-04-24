import { View, Text } from "react-native";
import { colors, AVATAR_COLORS } from "@/lib/theme";
import DuotoneIcon from "./DuotoneIcon";

export interface CaseCardData {
  id: string;
  specialistName: string;
  category: string;
  ifnsLabel: string | null;
  city: string | null;
  days: number | null;
  savedAmount: number | null;
  amount: number | null;
}

interface CaseCardProps {
  data: CaseCardData;
  index: number;
}

export default function CaseCard({ data, index }: CaseCardProps) {
  const avatarBg = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const savedLabel = formatMoney(data.savedAmount ?? data.amount ?? 0);

  return (
    <View
      className="rounded-2xl"
      style={{
        flex: 1,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: colors.border,
        padding: 24,
        gap: 18,
        minWidth: 280,
      }}
    >
      {/* Top — specialist + verification badge. */}
      <View className="flex-row items-center" style={{ gap: 12 }}>
        <View
          className="rounded-full items-center justify-center"
          style={{ width: 40, height: 40, backgroundColor: avatarBg }}
        >
          <Text className="text-white font-extrabold" style={{ fontSize: 16 }}>
            {data.specialistName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text className="font-semibold" style={{ color: colors.text, fontSize: 14 }}>
            {data.specialistName}
          </Text>
          <View className="flex-row items-center" style={{ gap: 4, marginTop: 2 }}>
            <DuotoneIcon name="shield-check" size={14} color={colors.success} softColor="#d1fae5" />
            <Text style={{ color: colors.success, fontSize: 11, fontWeight: "600" }}>
              Проверен платформой
            </Text>
          </View>
        </View>
      </View>

      {/* Middle — category statement. */}
      <View>
        <Text
          style={{
            color: colors.text,
            fontSize: 16,
            fontWeight: "600",
            lineHeight: 22,
          }}
        >
          {formatCaseHeadline(data)}
        </Text>
      </View>

      {/* Bottom — metric row. */}
      <View className="flex-row flex-wrap" style={{ gap: 8 }}>
        {data.ifnsLabel ? <Chip label={data.ifnsLabel} /> : null}
        {data.city ? <Chip label={data.city} /> : null}
        {data.days ? <Chip label={`Закрыт за ${data.days} дней`} /> : null}
      </View>

      <View
        style={{
          marginTop: 4,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 }}>
          Оспорено
        </Text>
        <Text
          style={{
            color: colors.primary,
            fontSize: 24,
            fontWeight: "800",
            letterSpacing: -0.5,
            marginTop: 4,
          }}
        >
          {savedLabel}
        </Text>
      </View>
    </View>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View
      className="rounded-full"
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: colors.accentSoft,
      }}
    >
      <Text style={{ color: colors.accentSoftInk, fontSize: 11, fontWeight: "500" }}>
        {label}
      </Text>
    </View>
  );
}

function formatMoney(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "—";
  if (amount >= 1_000_000) {
    const mln = amount / 1_000_000;
    return `${mln.toFixed(mln >= 10 ? 0 : 1).replace(".", ",")} млн ₽`;
  }
  if (amount >= 1000) {
    return `${Math.round(amount / 1000)} тыс ₽`;
  }
  return `${amount} ₽`;
}

function formatCaseHeadline(d: CaseCardData): string {
  const category = d.category || "Проверка";
  return `${category} закрыта без доначислений`;
}
