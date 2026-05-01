import { View, Text, Pressable, useWindowDimensions } from "react-native";
import {
  FileWarning,
  AlertTriangle,
  Shield,
  HelpCircle,
  type LucideIcon,
} from "lucide-react-native";
import { colors } from "@/lib/theme";
import type { DocumentType } from "./types";

interface Option {
  value: DocumentType;
  title: string;
  subtitle: string;
  Icon: LucideIcon;
}

const OPTIONS: Option[] = [
  {
    value: "TREBOVANIE",
    title: "Пришло требование от ФНС",
    subtitle: "О предоставлении документов или пояснений",
    Icon: FileWarning,
  },
  {
    value: "RESHENIE",
    title: "Получил решение / акт",
    subtitle: "О привлечении к ответственности или доначислениях",
    Icon: AlertTriangle,
  },
  {
    value: "VYEZDNAYA",
    title: "Назначена выездная проверка",
    subtitle: "ФНС придёт к нам",
    Icon: Shield,
  },
  {
    value: "OTHER",
    title: "Не уверен / другое",
    subtitle: "Опишу своими словами",
    Icon: HelpCircle,
  },
];

interface Step1Props {
  value: DocumentType | null;
  onChange: (v: DocumentType) => void;
}

/**
 * Step 1 — large tappable cards. Mobile = vertical stack, ≥640 = 2×2 grid.
 * Picking an option auto-selects but does NOT auto-advance — user confirms
 * via the sticky bottom "Далее" button (gives them a beat to second-guess).
 */
export default function Step1DocumentType({ value, onChange }: Step1Props) {
  const { width } = useWindowDimensions();
  const isGrid = width >= 640;

  return (
    <View>
      <Text className="text-2xl font-bold text-text-base mb-2">
        Что произошло?
      </Text>
      <Text className="text-sm text-text-mute mb-6 leading-5">
        Выберите тип ситуации — это определит подсказки и сроки на следующих
        шагах. Если ничего не подходит, нажмите &laquo;Не уверен&raquo;.
      </Text>

      <View
        style={{
          flexDirection: isGrid ? "row" : "column",
          flexWrap: isGrid ? "wrap" : "nowrap",
          gap: 12,
        }}
      >
        {OPTIONS.map((opt) => {
          const selected = value === opt.value;
          const Icon = opt.Icon;
          return (
            <Pressable
              key={opt.value}
              accessibilityRole="button"
              accessibilityLabel={opt.title}
              accessibilityState={{ selected }}
              onPress={() => onChange(opt.value)}
              className="rounded-2xl p-4"
              style={{
                // 2-up on >=640: each card is half the row minus half the gap.
                // Use percentages with marginRight pattern instead of `calc()`
                // (RN type system rejects calc strings in flex props).
                width: isGrid ? "48%" : "100%",
                minHeight: 120,
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.accentSoft : colors.surface,
              }}
            >
              <View
                className="rounded-xl items-center justify-center mb-3"
                style={{
                  width: 44,
                  height: 44,
                  backgroundColor: selected ? colors.primary : colors.accentSoft,
                }}
              >
                <Icon
                  size={22}
                  color={selected ? colors.white : colors.primary}
                />
              </View>
              <Text
                className="text-base font-semibold mb-1"
                style={{
                  color: selected ? colors.accentSoftInk : colors.text,
                }}
              >
                {opt.title}
              </Text>
              <Text
                className="text-sm leading-5"
                style={{
                  color: selected ? colors.accentSoftInk : colors.textMuted,
                }}
              >
                {opt.subtitle}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
