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

export default function TermsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface2">
      <HeaderBack title="Пользовательское соглашение" />

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
              Используя приложение P2PTax, вы соглашаетесь с настоящими Условиями
              использования. Если вы не согласны с ними, пожалуйста, не
              используйте наши услуги.
            </Paragraph>

            <SectionHeading>1. Общие положения</SectionHeading>
            <Paragraph>
              P2PTax — платформа для поиска налоговых специалистов и взаимодействия
              между клиентами и специалистами по налоговым вопросам. Платформа не
              оказывает налоговые услуги напрямую.
            </Paragraph>

            <SectionHeading>2. Регистрация</SectionHeading>
            <Paragraph>
              Для использования платформы необходимо зарегистрироваться, указав
              действующий адрес электронной почты. Вы несёте ответственность за
              конфиденциальность своего аккаунта и все действия, совершённые от
              вашего имени.
            </Paragraph>

            <SectionHeading>3. Специалисты</SectionHeading>
            <Paragraph>
              Специалисты, размещающие информацию о своих услугах на платформе,
              самостоятельно несут ответственность за достоверность предоставленных
              данных, квалификацию и качество оказываемых услуг.
            </Paragraph>

            <SectionHeading>4. Клиенты</SectionHeading>
            <Paragraph>
              Клиенты самостоятельно выбирают специалистов и несут ответственность
              за принятые решения. P2PTax не гарантирует результат консультаций и
              услуг, оказываемых специалистами.
            </Paragraph>

            <SectionHeading>5. Запрещённые действия</SectionHeading>
            <Paragraph>
              Запрещается: размещение ложной информации, мошенничество,
              оскорбления, спам, нарушение законодательства РФ, а также любые
              действия, направленные на нарушение работы платформы.
            </Paragraph>

            <SectionHeading>6. Ограничение ответственности</SectionHeading>
            <Paragraph>
              P2PTax предоставляется «как есть». Мы не несём ответственности за
              косвенные убытки, упущенную выгоду или ущерб, возникший в результате
              использования платформы или взаимодействия между пользователями.
            </Paragraph>

            <SectionHeading>7. Изменение условий</SectionHeading>
            <Paragraph>
              Мы можем обновлять настоящие Условия. Продолжение использования
              платформы после внесения изменений означает ваше согласие с новыми
              условиями.
            </Paragraph>

            <SectionHeading>8. Контакты</SectionHeading>
            <Paragraph>
              По вопросам, связанным с Условиями использования, обращайтесь по
              адресу: support@p2ptax.ru
            </Paragraph>

            <Text className="text-xs text-text-dim text-center mt-4 pb-2">
              P2PTax — безопасная платформа для налоговых вопросов
            </Text>
          </View>

          <View className="h-8" />
        </ScrollView>
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
