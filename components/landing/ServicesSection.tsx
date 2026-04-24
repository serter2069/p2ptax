import { View, Text } from "react-native";
import { colors } from "@/lib/theme";
import ServiceCard from "./ServiceCard";

interface ServicesSectionProps {
  isDesktop: boolean;
}

/**
 * The three canonical P2PTax services — matches seed data exactly.
 * Adding a 4th card is a SA violation; do not "extend" this list.
 */
export default function ServicesSection({ isDesktop }: ServicesSectionProps) {
  return (
    <View
      style={{
        paddingVertical: isDesktop ? 96 : 64,
        paddingHorizontal: isDesktop ? 32 : 20,
        backgroundColor: "#ffffff",
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 1152,
          marginHorizontal: "auto",
        }}
      >
        <View style={{ marginBottom: isDesktop ? 48 : 32, maxWidth: 700 }}>
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 12,
              fontWeight: "600",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            С чем приходят клиенты
          </Text>
          <Text
            style={{
              color: colors.text,
              fontSize: isDesktop ? 40 : 30,
              lineHeight: isDesktop ? 48 : 38,
              fontWeight: "800",
              letterSpacing: -0.8,
            }}
          >
            Три типа проверок — один и тот же холодный пот.
          </Text>
          <Text
            style={{
              marginTop: 16,
              color: colors.textSecondary,
              fontSize: 16,
              lineHeight: 24,
            }}
          >
            Специалисты знают как отвечать на каждом этапе. Ниже — что
            именно они решают.
          </Text>
        </View>

        <View
          style={{
            flexDirection: isDesktop ? "row" : "column",
            gap: 20,
            alignItems: "stretch",
          }}
        >
          <ServiceCard
            icon="document-search"
            title="Выездная проверка"
            body="Инспекторы приходят к вам. Документы, контрагенты, сделки. Практики знают что спросят и как отвечать."
            statChip="Обычно 12 дней"
          />
          <ServiceCard
            icon="stamp"
            title="Камеральная проверка"
            body="Письмо из ФНС с вопросами. 10–30 дней на ответ. Правильно составленные пояснения закрывают 80% требований без доначислений."
            statChip="Обычно 20 дней"
          />
          <ServiceCard
            icon="phone-clock"
            title="Отдел оперативного контроля"
            body="Блокировка счёта, 115-ФЗ, требования по контрагентам. Быстрое реагирование в первые 48 часов — разница между штрафом и нормальной работой."
            statChip="Часто 48 часов"
          />
        </View>
      </View>
    </View>
  );
}
