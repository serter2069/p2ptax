import { View, Text } from "react-native";
import { ShieldCheck } from "lucide-react-native";
import Avatar from "@/components/ui/Avatar";
import { colors, textStyle, spacing } from "@/lib/theme";

interface SpecialistHeroProps {
  name: string;
  avatarUrl: string | null | undefined;
  isTablet: boolean;
  rolePrimary: string;
  cityLabel: string;
  isExFns: boolean;
  exFnsStartYear?: number | null;
  exFnsEndYear?: number | null;
}

/**
 * Hero block of the specialist public profile.
 * Pure presentational extraction from app/specialists/[id].tsx — no logic changes.
 */
export default function SpecialistHero({
  name,
  avatarUrl,
  isTablet,
  rolePrimary,
  cityLabel,
  isExFns,
  exFnsStartYear,
  exFnsEndYear,
}: SpecialistHeroProps) {
  return (
    <View
      className={`${isTablet ? "flex-row" : "flex-col"} items-start`}
      style={{ gap: isTablet ? spacing.lg : spacing.base }}
    >
      <Avatar
        name={name}
        imageUrl={avatarUrl ?? undefined}
        size={isTablet ? 160 : 96}
        tint={colors.accentSoft}
        inkColor={colors.accentSoftInk}
      />
      <View className="flex-1">
        <Text style={{ ...textStyle.h1, color: colors.text }}>{name}</Text>
        <Text
          style={{
            ...textStyle.body,
            color: colors.textSecondary,
            marginTop: 4,
          }}
        >
          {rolePrimary} · {cityLabel}
        </Text>

        {/* ИФНС chips удалены — дубль секции «Работает в ФНС» (SA). */}
        {/* Rating/cases counter удалены — MVP stub only (SA). */}

        {isExFns && (
          <View
            className="flex-row items-center self-start mt-3 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: colors.yellowSoft, gap: 6 }}
          >
            <ShieldCheck size={14} color={colors.warningInk} />
            <Text
              className="text-xs font-semibold"
              style={{ color: colors.warningInk }}
            >
              Ex-ФНС {exFnsStartYear}–{exFnsEndYear}
            </Text>
          </View>
        )}

        {/* Duplicate hero CTA удалён — используем sticky sidebar CTA (SA). */}
      </View>
    </View>
  );
}
