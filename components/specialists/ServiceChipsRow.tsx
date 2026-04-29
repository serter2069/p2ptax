import { View, Text, Pressable, ScrollView } from "react-native";

interface ServiceOption {
  id: string;
  name: string;
}

interface Props {
  services: ServiceOption[];
  selectedServiceIds: string[];
  onToggle: (id: string) => void;
  onClearAll: () => void;
}

export default function ServiceChipsRow({
  services,
  selectedServiceIds,
  onToggle,
  onClearAll,
}: Props) {
  if (services.length === 0) return null;
  const allActive = selectedServiceIds.length === 0;

  return (
    <View className="pt-2 pb-2" style={{ zIndex: 1 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 8,
          paddingHorizontal: 16,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Не знаю — все услуги"
          onPress={onClearAll}
          className={`px-3 h-8 items-center justify-center rounded-full border ${
            allActive
              ? "bg-accent border-accent"
              : "bg-white border-border"
          }`}
        >
          <Text
            className={`text-xs ${
              allActive ? "text-white font-medium" : "text-text-base"
            }`}
          >
            Не знаю
          </Text>
        </Pressable>
        {services.map((s) => {
          const active = selectedServiceIds.includes(s.id);
          return (
            <Pressable
              key={s.id}
              accessibilityRole="button"
              accessibilityLabel={s.name}
              onPress={() => onToggle(s.id)}
              className={`px-3 h-8 items-center justify-center rounded-full border ${
                active ? "bg-accent border-accent" : "bg-white border-border"
              }`}
            >
              <Text
                className={`text-xs ${
                  active ? "text-white font-medium" : "text-text-base"
                }`}
              >
                {s.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
