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
        backgroundColor: colors.white,
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
            В каждой инспекции своя практика — выберите специалиста под свою.
          </Text>
          <Text
            style={{
              marginTop: 16,
              color: colors.textSecondary,
              fontSize: 16,
              lineHeight: 24,
            }}
          >
            Камералки, выездные, оперативный контроль — формат и тон
            переписки в каждой ИФНС свой. Специалист, который работает
            именно с вашей, понимает контекст с первого письма.
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
            body="Инспекторы приходят к вам с проверкой деятельности: документы, контрагенты, сделки. Сопровождение — от первого визита до акта."
            statChip="Обычно 12 дней"
          />
          <ServiceCard
            icon="stamp"
            title="Камеральная проверка"
            body="Письмо из ФНС с вопросами по поданным декларациям. 10–30 дней на ответ. Помощь в составлении пояснений и сопровождении до закрытия."
            statChip="Обычно 20 дней"
          />
          <ServiceCard
            icon="phone-clock"
            title="Отдел оперативного контроля"
            body="Блокировка счёта, 115-ФЗ, требования по контрагентам. Реагирование в первые часы и сопровождение в переговорах с инспекцией."
            statChip="Часто 48 часов"
          />
        </View>
      </View>
    </View>
  );
}
