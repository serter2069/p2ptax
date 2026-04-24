import { View, Text } from "react-native";
import { FileText, CheckCircle2, Clock } from "lucide-react-native";
import { colors } from "@/lib/theme";

export interface SpecialistCaseData {
  id: string;
  title: string;
  category: string;
  amount: number | null;
  resolvedAmount: number | null;
  days: number | null;
  status: string; // "resolved" | "in_progress"
  description: string;
  year: number | null;
}

export interface CaseCardProps {
  case: SpecialistCaseData;
}

function formatRub(value: number): string {
  if (value >= 1_000_000) {
    const mln = value / 1_000_000;
    return `${mln.toFixed(mln >= 10 ? 0 : 1).replace(/\.0$/, "")} млн ₽`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)} тыс ₽`;
  }
  return `${value} ₽`;
}

/**
 * Vertical case-history card displayed on the specialist profile.
 * Shows doначисления vs оспорено, days, status, short description.
 */
export default function CaseCard({ case: c }: CaseCardProps) {
  const isResolved = c.status === "resolved";
  const resolvedPct =
    c.amount && c.resolvedAmount && c.amount > 0
      ? Math.round((c.resolvedAmount / c.amount) * 100)
      : null;

  return (
    <View
      className="bg-white rounded-2xl border border-border p-4 mb-3"
      style={{
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
      }}
    >
      {/* Title row */}
      <View className="flex-row items-start mb-3" style={{ gap: 10 }}>
        <View
          className="items-center justify-center rounded-lg flex-shrink-0"
          style={{
            width: 36,
            height: 36,
            backgroundColor: colors.accentSoft,
          }}
        >
          <FileText size={18} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text
            className="font-semibold text-base leading-6"
            style={{ color: colors.text }}
          >
            {c.title}
          </Text>
          <Text
            className="text-xs mt-0.5"
            style={{ color: colors.textMuted, letterSpacing: 0.5 }}
          >
            {c.category}
          </Text>
        </View>
      </View>

      {/* Metrics row */}
      {(c.amount || c.resolvedAmount || c.days) && (
        <View
          className="flex-row flex-wrap py-3 border-y border-border mb-3"
          style={{ gap: 20 }}
        >
          {c.amount != null && (
            <View>
              <Text
                className="uppercase"
                style={{
                  fontSize: 10,
                  letterSpacing: 1.5,
                  color: colors.textMuted,
                  marginBottom: 2,
                }}
              >
                Доначислено
              </Text>
              <Text
                className="font-semibold text-base"
                style={{ color: colors.text }}
              >
                {formatRub(c.amount)}
              </Text>
            </View>
          )}
          {c.resolvedAmount != null && (
            <View>
              <Text
                className="uppercase"
                style={{
                  fontSize: 10,
                  letterSpacing: 1.5,
                  color: colors.textMuted,
                  marginBottom: 2,
                }}
              >
                Оспорено
              </Text>
              <View className="flex-row items-baseline" style={{ gap: 6 }}>
                <Text
                  className="font-semibold text-base"
                  style={{ color: colors.success }}
                >
                  {formatRub(c.resolvedAmount)}
                </Text>
                {resolvedPct != null && (
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: colors.success }}
                  >
                    {resolvedPct}%
                  </Text>
                )}
              </View>
            </View>
          )}
          {c.days != null && (
            <View>
              <Text
                className="uppercase"
                style={{
                  fontSize: 10,
                  letterSpacing: 1.5,
                  color: colors.textMuted,
                  marginBottom: 2,
                }}
              >
                Срок
              </Text>
              <Text
                className="font-semibold text-base"
                style={{ color: colors.text }}
              >
                {c.days} {c.days === 1 ? "день" : c.days < 5 ? "дня" : "дней"}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Status + year */}
      <View
        className="flex-row items-center mb-3"
        style={{ gap: 8 }}
      >
        <View
          className="flex-row items-center px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: isResolved ? colors.greenSoft : colors.yellowSoft,
            gap: 4,
          }}
        >
          {isResolved ? (
            <CheckCircle2 size={12} color={colors.success} />
          ) : (
            <Clock size={12} color={colors.warning} />
          )}
          <Text
            className="text-xs font-semibold"
            style={{
              color: isResolved ? colors.success : colors.warning,
            }}
          >
            {isResolved ? "Решено" : "В работе"}
            {c.year ? ` · ${c.year}` : ""}
          </Text>
        </View>
      </View>

      {/* Description */}
      <Text
        className="text-sm leading-6"
        style={{ color: colors.textSecondary }}
      >
        {c.description}
      </Text>
    </View>
  );
}
