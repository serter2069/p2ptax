import { View, Text, Pressable } from "react-native";
import { Plus } from "lucide-react-native";
import { FnsOpt } from "@/components/filters/SpecialistSearchBar";
import { colors } from "@/lib/theme";

interface ServiceItem {
  id: string;
  name: string;
}

interface Props {
  pendingFns: FnsOpt;
  services: ServiceItem[];
  pendingServiceIds: string[];
  pendingAnyService: boolean;
  canAddEntry: boolean;
  onPickAny: () => void;
  onToggleService: (id: string) => void;
  onAdd: () => void;
  onCancel: () => void;
}

export default function PendingFnsPicker({
  pendingFns,
  services,
  pendingServiceIds,
  pendingAnyService,
  canAddEntry,
  onPickAny,
  onToggleService,
  onAdd,
  onCancel,
}: Props) {
  return (
    <View
      className="mt-4 border border-border rounded-xl p-4"
      style={{ backgroundColor: colors.surface2 }}
    >
      <Text
        className="text-xs font-semibold uppercase tracking-wide mb-1"
        style={{ color: colors.textMuted }}
      >
        Услуги в этой инспекции
      </Text>
      <Text className="text-sm text-text-base mb-3">
        {pendingFns.code ? `${pendingFns.code} · ` : ""}
        {pendingFns.name}
      </Text>

      <View className="flex-row flex-wrap" style={{ gap: 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Не знаю — любая услуга"
          onPress={onPickAny}
          className={`px-3 h-9 items-center justify-center rounded-full border ${
            pendingAnyService
              ? "bg-accent border-accent"
              : "bg-white border-border"
          }`}
        >
          <Text
            className={`text-sm ${
              pendingAnyService
                ? "text-white font-medium"
                : "text-text-base"
            }`}
          >
            Не знаю
          </Text>
        </Pressable>
        {services.map((svc) => {
          const active = pendingServiceIds.includes(svc.id);
          return (
            <Pressable
              key={svc.id}
              accessibilityRole="button"
              accessibilityLabel={svc.name}
              onPress={() => onToggleService(svc.id)}
              className={`px-3 h-9 items-center justify-center rounded-full border ${
                active
                  ? "bg-accent border-accent"
                  : "bg-white border-border"
              }`}
            >
              <Text
                className={`text-sm ${
                  active
                    ? "text-white font-medium"
                    : "text-text-base"
                }`}
              >
                {svc.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-4 flex-row" style={{ gap: 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Добавить запись"
          onPress={onAdd}
          disabled={!canAddEntry}
          className={`flex-row items-center justify-center px-4 h-10 rounded-xl ${
            canAddEntry ? "bg-accent" : "bg-border"
          }`}
          style={{ gap: 6 }}
        >
          <Plus
            size={16}
            color={canAddEntry ? "#ffffff" : colors.textMuted}
          />
          <Text
            className="text-sm font-medium"
            style={{
              color: canAddEntry ? "#ffffff" : colors.textMuted,
            }}
          >
            Добавить
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Отменить выбор инспекции"
          onPress={onCancel}
          className="flex-row items-center justify-center px-4 h-10 rounded-xl border border-border bg-white"
        >
          <Text className="text-sm text-text-base">Отменить</Text>
        </Pressable>
      </View>
    </View>
  );
}
