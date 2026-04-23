import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderBack from "@/components/HeaderBack";
import ResponsiveContainer from "@/components/ResponsiveContainer";

function SectionHeading({ children }: { children: string }) {
  return (
    <View className="mt-5 mb-2">
      <View className="border-t border-border mb-4" />
      <Text className="text-base font-semibold text-text-base">{children}</Text>
    </View>
  );
}

function Paragraph({ children }: { children: string }) {
  return (
    <Text className="text-base text-text-mute leading-7 mb-4">{children}</Text>
  );
}

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface2">
      <HeaderBack title="Политика конфиденциальности" />

      <ResponsiveContainer maxWidth={720}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 0, paddingBottom: 32 }}
        >
          <View className="bg-white border border-border rounded-2xl p-6 mx-4 mt-4">
            <Text className="text-xs text-text-dim text-center mb-4">
              Последнее обновление: апрель 2026
            </Text>

            <Paragraph>
              Настоящая Политика конфиденциальности описывает, как P2PTax собирает,
              использует и защищает ваши персональные данные при использовании нашей
              платформы.
            </Paragraph>

            <SectionHeading>1. Собираемые данные</SectionHeading>
            <Paragraph>
              Мы собираем данные, которые вы предоставляете при регистрации и
              использовании платформы: адрес электронной почты, имя, контактную
              информацию и данные о профессиональной деятельности.
            </Paragraph>

            <SectionHeading>2. Использование данных</SectionHeading>
            <Paragraph>
              Данные используются для предоставления и улучшения наших услуг,
              обработки запросов, отправки уведомлений и обеспечения безопасности
              платформы.
            </Paragraph>

            <SectionHeading>3. Передача данных</SectionHeading>
            <Paragraph>
              Мы не продаём ваши персональные данные третьим лицам. Данные могут
              передаваться только поставщикам услуг, обеспечивающим работу
              платформы, а также по требованию закона.
            </Paragraph>

            <SectionHeading>4. Безопасность</SectionHeading>
            <Paragraph>
              Мы принимаем разумные меры для защиты ваших данных. Все данные
              передаются по зашифрованным каналам (TLS/SSL).
            </Paragraph>

            <SectionHeading>5. Ваши права</SectionHeading>
            <Paragraph>
              Вы имеете право на доступ, исправление или удаление своих
              персональных данных. Для этого обратитесь к нам через приложение или
              по адресу: privacy@p2ptax.ru
            </Paragraph>

            <SectionHeading>6. Контакты</SectionHeading>
            <Paragraph>
              По вопросам, связанным с Политикой конфиденциальности, обращайтесь по
              адресу: privacy@p2ptax.ru
            </Paragraph>

            <Text className="text-xs text-text-dim text-center mt-4 pb-2">
              P2PTax — ваши данные под защитой
            </Text>
          </View>

          <View className="h-8" />
        </ScrollView>
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
