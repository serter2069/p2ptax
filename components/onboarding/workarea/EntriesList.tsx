import { View, Text } from "react-native";
import WorkAreaEntry, {
  WorkAreaEntryData,
} from "@/components/onboarding/WorkAreaEntry";
import { colors } from "@/lib/theme";

interface Props {
  entries: WorkAreaEntryData[];
  onRemove: (fnsId: string) => void;
}

export default function EntriesList({ entries, onRemove }: Props) {
  if (entries.length === 0) return null;
  return (
    <View className="mt-6">
      <Text
        className="text-xs font-semibold uppercase tracking-wide mb-3"
        style={{ color: colors.textMuted }}
      >
        Добавлено ({entries.length})
      </Text>
      {entries.map((e) => (
        <WorkAreaEntry
          key={e.fnsId}
          entry={e}
          onRemove={() => onRemove(e.fnsId)}
        />
      ))}
    </View>
  );
}
