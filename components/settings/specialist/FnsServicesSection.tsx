import { View, Text, Pressable } from "react-native";
import { Pencil } from "lucide-react-native";
import LoadingState from "@/components/ui/LoadingState";
import { colors } from "@/lib/theme";

interface FnsServiceItem {
  fns: { id: string; name: string; code: string };
  city: { id: string; name: string };
  services: { id: string; name: string }[];
}

interface FnsServicesSectionProps {
  specLoading: boolean;
  fnsServices: FnsServiceItem[] | undefined;
  onGoToWorkArea: () => void;
}

export default function FnsServicesSection({
  specLoading,
  fnsServices,
  onGoToWorkArea,
}: FnsServicesSectionProps) {
  return (
    <View className="bg-white border border-border rounded-2xl px-4 py-5 mb-4">
      <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
        ИФНС и услуги
      </Text>
      {specLoading ? (
        <LoadingState variant="skeleton" lines={3} />
      ) : fnsServices && fnsServices.length === 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Добавить рабочую зону"
          onPress={onGoToWorkArea}
          className="flex-row items-center justify-center py-3 border border-dashed border-border rounded-xl"
        >
          <Text className="text-sm text-accent font-medium">
            + Добавить ИФНС и услуги
          </Text>
        </Pressable>
      ) : (
        <>
          {fnsServices?.map((item) => (
            <View
              key={item.fns.id}
              className="bg-surface2 rounded-xl p-3 mb-2 border border-border"
            >
              <Text className="text-sm font-semibold text-text-base">
                {item.city.name} — {item.fns.name}
              </Text>
              <Text className="text-xs text-text-mute mb-1">
                {item.fns.code}
              </Text>
              <View className="flex-row flex-wrap gap-1 mt-1">
                {item.services.map((s) => (
                  <View
                    key={s.id}
                    className="bg-accent-soft px-2.5 py-0.5 rounded-full"
                  >
                    <Text className="text-xs font-medium text-accent">
                      {s.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Изменить рабочую зону"
            onPress={onGoToWorkArea}
            className="flex-row items-center justify-center py-2 mt-1"
          >
            <Pencil size={13} color={colors.accent} />
            <Text className="text-sm text-accent ml-1.5 font-medium">
              Изменить рабочую зону
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

export type { FnsServiceItem };
