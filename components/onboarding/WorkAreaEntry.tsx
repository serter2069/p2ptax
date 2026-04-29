import { View, Text, Pressable } from "react-native";
import { X, Building2, MapPin } from "lucide-react-native";
import { colors } from "@/lib/theme";

export interface WorkAreaEntryData {
  fnsId: string;
  fnsName: string;
  fnsCode: string;
  cityId: string;
  cityName: string;
  serviceIds: string[]; // empty when isAnyService=true
  serviceNames: string[]; // parallel labels for display
  isAnyService: boolean;
}

interface Props {
  entry: WorkAreaEntryData;
  onRemove: () => void;
}

/**
 * WorkAreaEntry — one row in the onboarding work-area list.
 *
 * Renders: FNS name + code · city + service pills (or "Любая услуга") + ✕.
 * Used in `app/onboarding/work-area.tsx`.
 */
export default function WorkAreaEntry({ entry, onRemove }: Props) {
  const { fnsName, fnsCode, cityName, serviceNames, isAnyService } = entry;
  return (
    <View
      className="border border-border rounded-xl p-4 mb-3"
      style={{ backgroundColor: colors.surface2 }}
    >
      <View className="flex-row items-start" style={{ gap: 8 }}>
        <View style={{ flex: 1 }}>
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <Building2 size={14} color={colors.textMuted} />
            <Text className="text-sm font-semibold text-text-base">
              {fnsCode ? `${fnsCode} · ` : ""}
              {fnsName}
            </Text>
          </View>
          {cityName ? (
            <View
              className="flex-row items-center mt-1"
              style={{ gap: 6, marginLeft: 20 }}
            >
              <MapPin size={12} color={colors.textMuted} />
              <Text className="text-xs" style={{ color: colors.textMuted }}>
                {cityName}
              </Text>
            </View>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Удалить запись"
          onPress={onRemove}
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.surface }}
        >
          <X size={14} color={colors.textMuted} />
        </Pressable>
      </View>

      <View className="flex-row flex-wrap mt-3" style={{ gap: 6 }}>
        {isAnyService ? (
          <View
            className="px-3 h-7 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.accentSoft }}
          >
            <Text
              className="text-xs font-medium"
              style={{ color: colors.accentSoftInk }}
            >
              Любая услуга
            </Text>
          </View>
        ) : (
          serviceNames.map((name, idx) => (
            <View
              key={`${name}-${idx}`}
              className="px-3 h-7 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.accentSoft }}
            >
              <Text
                className="text-xs font-medium"
                style={{ color: colors.accentSoftInk }}
              >
                {name}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
